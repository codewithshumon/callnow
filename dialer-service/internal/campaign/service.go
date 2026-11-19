package campaign

import (
	"bytes"
	"context"
	"encoding/csv"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"github.com/voicelink/dialer-service/internal/callback"
	"github.com/voicelink/dialer-service/internal/dialer"
	"github.com/voicelink/dialer-service/internal/domain"
	"github.com/voicelink/dialer-service/internal/queue"
	"github.com/voicelink/dialer-service/internal/repository"
)

type CreateCampaignInput struct {
	ID                   string          `json:"id"`
	UserID               string          `json:"userId"`
	Name                 string          `json:"name"`
	FromNumber           string          `json:"fromNumber"`
	Concurrency          int             `json:"concurrency"`
	DelaySeconds         int             `json:"delaySeconds"`
	RetryMax             int             `json:"retryMax"`
	VoicemailDropURL     *string         `json:"voicemailDropUrl,omitempty"`
	CallingHoursStart    *string         `json:"callingHoursStart,omitempty"`
	CallingHoursEnd      *string         `json:"callingHoursEnd,omitempty"`
	CallingHoursTimezone *string         `json:"callingHoursTimezone,omitempty"`
	ScheduledAt          *time.Time      `json:"scheduledAt,omitempty"`
	Contacts             []ContactCSVRow `json:"contacts"`
}

type Service struct {
	repo        repository.CampaignRepository
	contactRepo repository.ContactRepository
	dncRepo     repository.DNCRepository
	queue       queue.ContactQueue
	dialer      dialer.TelephonyProvider
	callback    callback.Client
	logger      *zap.Logger

	mu    sync.RWMutex
	pools map[string]*WorkerPool
}

func NewService(
	repo repository.CampaignRepository,
	contactRepo repository.ContactRepository,
	dncRepo repository.DNCRepository,
	q queue.ContactQueue,
	d dialer.TelephonyProvider,
	cb callback.Client,
	logger *zap.Logger,
) *Service {
	return &Service{
		repo:        repo,
		contactRepo: contactRepo,
		dncRepo:     dncRepo,
		queue:       q,
		dialer:      d,
		callback:    cb,
		logger:      logger,
		pools:       make(map[string]*WorkerPool),
	}
}

func (s *Service) CreateAndStart(ctx context.Context, input CreateCampaignInput) (*domain.Campaign, error) {
	campaignID := input.ID
	if campaignID == "" {
		campaignID = uuid.NewString()
	}

	campaign := &domain.Campaign{
		ID:                   campaignID,
		UserID:               input.UserID,
		Name:                 input.Name,
		Status:               domain.CampaignStatusRunning,
		FromNumber:           input.FromNumber,
		Concurrency:          input.Concurrency,
		DelaySeconds:         input.DelaySeconds,
		RetryMax:             input.RetryMax,
		VoicemailDropURL:     input.VoicemailDropURL,
		CallingHoursStart:    input.CallingHoursStart,
		CallingHoursEnd:      input.CallingHoursEnd,
		CallingHoursTimezone: input.CallingHoursTimezone,
		TotalContacts:        len(input.Contacts),
		ScheduledAt:          input.ScheduledAt,
		CreatedAt:            time.Now(),
	}

	// 1. Insert Campaign record (or update if already inserted by NestJS)
	existing, _ := s.repo.GetByID(ctx, campaignID)
	if existing == nil {
		if err := s.repo.Create(ctx, campaign); err != nil {
			return nil, fmt.Errorf("failed to create campaign in DB: %w", err)
		}
	} else {
		startedAt := time.Now()
		_ = s.repo.UpdateStatus(ctx, campaignID, domain.CampaignStatusRunning, &startedAt, nil, nil)
	}

	// 2. Insert Contacts & collect IDs
	contactIDs := make([]string, 0, len(input.Contacts))
	var contactsToInsert []domain.CampaignContact

	for _, c := range input.Contacts {
		cid := uuid.NewString()
		contactIDs = append(contactIDs, cid)

		name := c.Name
		notes := c.Notes
		contactsToInsert = append(contactsToInsert, domain.CampaignContact{
			ID:         cid,
			CampaignID: campaignID,
			Phone:      c.Phone,
			Name:       &name,
			Notes:      &notes,
			Status:     domain.ContactStatusPending,
			Attempts:   0,
			CreatedAt:  time.Now(),
		})
	}

	if len(contactsToInsert) > 0 {
		_ = s.contactRepo.BulkCreate(ctx, contactsToInsert)
	}

	// If already in DB from NestJS bulk upload, retrieve pending contacts
	if len(contactIDs) == 0 {
		dbContacts, err := s.contactRepo.GetByCampaignID(ctx, campaignID, domain.ContactStatusPending, 100000)
		if err == nil {
			for _, c := range dbContacts {
				contactIDs = append(contactIDs, c.ID)
			}
			campaign.TotalContacts = len(contactIDs)
		}
	}

	// 3. Enqueue to Redis
	if err := s.queue.Enqueue(ctx, campaignID, contactIDs); err != nil {
		return nil, fmt.Errorf("failed to enqueue contacts to Redis: %w", err)
	}

	// 4. Create and start worker pool
	pool := NewWorkerPool(
		campaign,
		s.queue,
		s.dialer,
		s.repo,
		s.contactRepo,
		s.dncRepo,
		s.callback,
		s.logger,
	)

	s.mu.Lock()
	s.pools[campaignID] = pool
	s.mu.Unlock()

	go pool.Start(context.Background())

	return campaign, nil
}

func (s *Service) GetCampaign(ctx context.Context, id string) (*domain.Campaign, error) {
	c, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Enrich with live progress from Redis
	prog, err := s.queue.GetProgress(ctx, id)
	if err == nil && prog != nil {
		c.Dialed = prog.Dialed
		c.Answered = prog.Answered
		c.Failed = prog.Failed
		c.Busy = prog.Busy
		c.NoAnswer = prog.NoAnswer
	}

	return c, nil
}

func (s *Service) PauseCampaign(ctx context.Context, id string) error {
	s.mu.RLock()
	pool, ok := s.pools[id]
	s.mu.RUnlock()

	if ok {
		return pool.Pause()
	}

	// If worker pool reference not in memory, update DB & Redis directly
	pausedAt := time.Now()
	_ = s.queue.SetState(ctx, id, string(domain.CampaignStatusPaused))
	return s.repo.UpdateStatus(ctx, id, domain.CampaignStatusPaused, nil, &pausedAt, nil)
}

func (s *Service) ResumeCampaign(ctx context.Context, id string) error {
	s.mu.RLock()
	pool, ok := s.pools[id]
	s.mu.RUnlock()

	if ok {
		return pool.Resume()
	}

	c, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	newPool := NewWorkerPool(c, s.queue, s.dialer, s.repo, s.contactRepo, s.dncRepo, s.callback, s.logger)
	s.mu.Lock()
	s.pools[id] = newPool
	s.mu.Unlock()

	go newPool.Start(context.Background())
	return nil
}

func (s *Service) StopCampaign(ctx context.Context, id string) error {
	s.mu.RLock()
	pool, ok := s.pools[id]
	s.mu.RUnlock()

	if ok {
		return pool.Stop()
	}

	completedAt := time.Now()
	_ = s.queue.ClearQueue(ctx, id)
	_ = s.queue.SetState(ctx, id, string(domain.CampaignStatusStopped))
	return s.repo.UpdateStatus(ctx, id, domain.CampaignStatusStopped, nil, nil, &completedAt)
}

func (s *Service) GetResults(ctx context.Context, id string, page, limit int) ([]domain.CampaignContact, int, error) {
	return s.contactRepo.ListPaginated(ctx, id, page, limit)
}

func (s *Service) ExportCSV(ctx context.Context, id string) ([]byte, error) {
	contacts, _, err := s.contactRepo.ListPaginated(ctx, id, 1, 100000)
	if err != nil {
		return nil, err
	}

	buf := bytes.NewBuffer(nil)
	writer := csv.NewWriter(buf)

	_ = writer.Write([]string{"phone", "name", "notes", "status", "attempts", "call_duration", "last_attempted_at"})

	for _, c := range contacts {
		name := ""
		if c.Name != nil {
			name = *c.Name
		}
		notes := ""
		if c.Notes != nil {
			notes = *c.Notes
		}
		duration := ""
		if c.CallDuration != nil {
			duration = fmt.Sprintf("%d", *c.CallDuration)
		}
		attemptedAt := ""
		if c.LastAttemptedAt != nil {
			attemptedAt = c.LastAttemptedAt.Format(time.RFC3339)
		}

		_ = writer.Write([]string{
			c.Phone, name, notes, string(c.Status),
			fmt.Sprintf("%d", c.Attempts), duration, attemptedAt,
		})
	}

	writer.Flush()
	return buf.Bytes(), nil
}
