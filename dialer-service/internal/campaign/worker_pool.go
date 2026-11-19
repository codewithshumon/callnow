package campaign

import (
	"context"
	"sync"
	"sync/atomic"
	"time"

	"go.uber.org/zap"
	"github.com/voicelink/dialer-service/internal/callback"
	"github.com/voicelink/dialer-service/internal/dialer"
	"github.com/voicelink/dialer-service/internal/domain"
	"github.com/voicelink/dialer-service/internal/queue"
	"github.com/voicelink/dialer-service/internal/repository"
)

type WorkerPool struct {
	campaign    *domain.Campaign
	semaphore   chan struct{}
	queue       queue.ContactQueue
	dialer      dialer.TelephonyProvider
	repo        repository.CampaignRepository
	contactRepo repository.ContactRepository
	dncRepo     repository.DNCRepository
	callback    callback.Client
	logger      *zap.Logger

	mu          sync.RWMutex
	wg          sync.WaitGroup
	ctx         context.Context
	cancel      context.CancelFunc
	state       domain.CampaignStatus
	dialCount   int64

	progress    domain.CampaignProgress
	progMu      sync.RWMutex
}

func NewWorkerPool(
	c *domain.Campaign,
	q queue.ContactQueue,
	d dialer.TelephonyProvider,
	repo repository.CampaignRepository,
	contactRepo repository.ContactRepository,
	dncRepo repository.DNCRepository,
	cb callback.Client,
	logger *zap.Logger,
) *WorkerPool {
	concurrency := c.Concurrency
	if concurrency < 1 {
		concurrency = 1
	}
	if concurrency > 10 {
		concurrency = 10
	}

	return &WorkerPool{
		campaign:    c,
		semaphore:   make(chan struct{}, concurrency),
		queue:       q,
		dialer:      d,
		repo:        repo,
		contactRepo: contactRepo,
		dncRepo:     dncRepo,
		callback:    cb,
		logger:      logger,
		state:       domain.CampaignStatusRunning,
		progress: domain.CampaignProgress{
			Dialed:    c.Dialed,
			Answered:  c.Answered,
			Failed:    c.Failed,
			Busy:      c.Busy,
			NoAnswer:  c.NoAnswer,
			Remaining: c.TotalContacts - c.Dialed,
		},
	}
}

func (wp *WorkerPool) Start(ctx context.Context) {
	wp.mu.Lock()
	wp.ctx, wp.cancel = context.WithCancel(ctx)
	wp.state = domain.CampaignStatusRunning
	wp.mu.Unlock()

	wp.logger.Info("Campaign worker pool started",
		zap.String("campaignId", wp.campaign.ID),
		zap.Int("concurrency", wp.campaign.Concurrency),
	)

	_ = wp.queue.SetState(ctx, wp.campaign.ID, string(domain.CampaignStatusRunning))

	for {
		select {
		case <-wp.ctx.Done():
			wp.logger.Info("Worker pool received stop/cancel signal", zap.String("campaignId", wp.campaign.ID))
			return
		default:
		}

		wp.mu.RLock()
		currentState := wp.state
		wp.mu.RUnlock()

		if currentState == domain.CampaignStatusPaused {
			time.Sleep(1 * time.Second)
			continue
		}
		if currentState == domain.CampaignStatusStopped || currentState == domain.CampaignStatusCompleted {
			return
		}

		// Check calling hours
		if !IsWithinCallingHours(wp.campaign, time.Now()) {
			wp.logger.Debug("Outside calling hours, waiting...", zap.String("campaignId", wp.campaign.ID))
			time.Sleep(30 * time.Second)
			continue
		}

		// Dequeue next contact ID
		contactID, err := wp.queue.Dequeue(wp.ctx, wp.campaign.ID, 3*time.Second)
		if err == domain.ErrQueueEmpty {
			// Wait for in-flight dials to finish
			wp.wg.Wait()
			// All contacts processed!
			wp.finish(wp.ctx)
			return
		}
		if err != nil {
			if wp.ctx.Err() != nil {
				return
			}
			time.Sleep(500 * time.Millisecond)
			continue
		}

		// Acquire semaphore slot
		select {
		case wp.semaphore <- struct{}{}:
		case <-wp.ctx.Done():
			return
		}

		wp.wg.Add(1)
		go wp.dialOne(wp.ctx, contactID)

		if wp.campaign.DelaySeconds > 0 {
			time.Sleep(time.Duration(wp.campaign.DelaySeconds) * time.Second)
		}
	}
}

func (wp *WorkerPool) dialOne(ctx context.Context, contactID string) {
	defer wp.wg.Done()
	defer func() { <-wp.semaphore }()

	contact, err := wp.contactRepo.GetByID(ctx, contactID)
	if err != nil {
		wp.logger.Warn("Failed to find contact for dialing", zap.String("contactId", contactID), zap.Error(err))
		return
	}

	// 1. DNC Check
	isBlocked, err := wp.dncRepo.IsBlocked(ctx, wp.campaign.UserID, contact.Phone)
	if err == nil && isBlocked {
		wp.logger.Info("Skipping contact on DNC list", zap.String("phone", contact.Phone))
		_ = wp.contactRepo.UpdateStatus(ctx, contact.ID, domain.ContactStatusDNC, 0, contact.Attempts)
		wp.updateProgress(domain.ContactStatusDNC, 0)
		return
	}

	// 2. Mark Dialing
	_ = wp.contactRepo.UpdateStatus(ctx, contact.ID, domain.ContactStatusDialing, 0, contact.Attempts+1)

	// 3. Initiate Call
	opts := dialer.CallOptions{
		Timeout: 30 * time.Second,
	}
	if wp.campaign.VoicemailDropURL != nil {
		opts.VoicemailDropURL = *wp.campaign.VoicemailDropURL
	}

	result, err := wp.dialer.Call(ctx, contact.Phone, wp.campaign.FromNumber, opts)
	status := domain.ContactStatusFailed
	duration := 0
	if err == nil && result != nil {
		status = result.Status
		duration = result.DurationSeconds
	}

	// 4. Update Database
	_ = wp.contactRepo.UpdateStatus(ctx, contact.ID, status, duration, contact.Attempts+1)

	// 5. Update Progress Counters
	wp.updateProgress(status, duration)

	// 6. Retry check
	contact.Status = status
	contact.Attempts++
	if ShouldRetry(contact, wp.campaign) {
		wp.logger.Info("Re-enqueueing contact for retry",
			zap.String("contactId", contact.ID),
			zap.String("phone", contact.Phone),
		)
		_ = wp.queue.Enqueue(ctx, wp.campaign.ID, []string{contact.ID})
	}
}

func (wp *WorkerPool) updateProgress(status domain.ContactStatus, duration int) {
	wp.progMu.Lock()
	wp.progress.Dialed++
	if wp.progress.Remaining > 0 {
		wp.progress.Remaining--
	}

	answeredAdd, failedAdd, busyAdd, noAnswerAdd := 0, 0, 0, 0
	switch status {
	case domain.ContactStatusAnswered:
		wp.progress.Answered++
		answeredAdd = 1
	case domain.ContactStatusFailed, domain.ContactStatusDNC:
		wp.progress.Failed++
		failedAdd = 1
	case domain.ContactStatusBusy:
		wp.progress.Busy++
		busyAdd = 1
	case domain.ContactStatusNoAnswer:
		wp.progress.NoAnswer++
		noAnswerAdd = 1
	}
	currProgress := wp.progress
	wp.progMu.Unlock()

	// Update DB counters
	_ = wp.repo.UpdateCounters(context.Background(), wp.campaign.ID, 1, answeredAdd, failedAdd, busyAdd, noAnswerAdd)

	// Update Redis cache
	_ = wp.queue.SetProgress(context.Background(), wp.campaign.ID, currProgress)

	count := atomic.AddInt64(&wp.dialCount, 1)
	if count%5 == 0 || currProgress.Remaining == 0 {
		_ = wp.callback.SendProgress(context.Background(), wp.campaign.ID, currProgress)
	}
}

func (wp *WorkerPool) finish(ctx context.Context) {
	wp.mu.Lock()
	wp.state = domain.CampaignStatusCompleted
	wp.mu.Unlock()

	completedAt := time.Now()
	_ = wp.repo.UpdateStatus(ctx, wp.campaign.ID, domain.CampaignStatusCompleted, nil, nil, &completedAt)
	_ = wp.queue.SetState(ctx, wp.campaign.ID, string(domain.CampaignStatusCompleted))

	wp.progMu.RLock()
	finalProgress := wp.progress
	wp.progMu.RUnlock()

	_ = wp.callback.SendCompleted(ctx, wp.campaign.ID, finalProgress)
	wp.logger.Info("Campaign completed", zap.String("campaignId", wp.campaign.ID))
}

func (wp *WorkerPool) Pause() error {
	wp.mu.Lock()
	defer wp.mu.Unlock()
	if err := ValidateTransition(wp.state, domain.CampaignStatusPaused); err != nil {
		return err
	}
	wp.state = domain.CampaignStatusPaused
	pausedAt := time.Now()
	_ = wp.repo.UpdateStatus(context.Background(), wp.campaign.ID, domain.CampaignStatusPaused, nil, &pausedAt, nil)
	_ = wp.queue.SetState(context.Background(), wp.campaign.ID, string(domain.CampaignStatusPaused))
	return nil
}

func (wp *WorkerPool) Resume() error {
	wp.mu.Lock()
	defer wp.mu.Unlock()
	if err := ValidateTransition(wp.state, domain.CampaignStatusRunning); err != nil {
		return err
	}
	wp.state = domain.CampaignStatusRunning
	_ = wp.repo.UpdateStatus(context.Background(), wp.campaign.ID, domain.CampaignStatusRunning, nil, nil, nil)
	_ = wp.queue.SetState(context.Background(), wp.campaign.ID, string(domain.CampaignStatusRunning))
	return nil
}

func (wp *WorkerPool) Stop() error {
	wp.mu.Lock()
	defer wp.mu.Unlock()
	if err := ValidateTransition(wp.state, domain.CampaignStatusStopped); err != nil {
		return err
	}
	wp.state = domain.CampaignStatusStopped
	if wp.cancel != nil {
		wp.cancel()
	}
	completedAt := time.Now()
	_ = wp.repo.UpdateStatus(context.Background(), wp.campaign.ID, domain.CampaignStatusStopped, nil, nil, &completedAt)
	_ = wp.queue.ClearQueue(context.Background(), wp.campaign.ID)
	_ = wp.queue.SetState(context.Background(), wp.campaign.ID, string(domain.CampaignStatusStopped))
	return nil
}

func (wp *WorkerPool) Progress() domain.CampaignProgress {
	wp.progMu.RLock()
	defer wp.progMu.RUnlock()
	return wp.progress
}
