package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/voicelink/dialer-service/internal/domain"
	"github.com/voicelink/dialer-service/internal/repository"
)

type CampaignRepo struct {
	pool *pgxpool.Pool
}

func NewCampaignRepo(pool *pgxpool.Pool) repository.CampaignRepository {
	return &CampaignRepo{pool: pool}
}

func (r *CampaignRepo) GetByID(ctx context.Context, id string) (*domain.Campaign, error) {
	query := `
		SELECT id, user_id, name, status, from_number, concurrency, delay_seconds, retry_max,
		       voicemail_drop_url, calling_hours_start::text, calling_hours_end::text, calling_hours_timezone,
		       total_contacts, dialed, answered, failed, busy, no_answer,
		       scheduled_at, started_at, paused_at, completed_at, created_at
		FROM campaigns
		WHERE id = $1
	`
	c := &domain.Campaign{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&c.ID, &c.UserID, &c.Name, &c.Status, &c.FromNumber, &c.Concurrency, &c.DelaySeconds, &c.RetryMax,
		&c.VoicemailDropURL, &c.CallingHoursStart, &c.CallingHoursEnd, &c.CallingHoursTimezone,
		&c.TotalContacts, &c.Dialed, &c.Answered, &c.Failed, &c.Busy, &c.NoAnswer,
		&c.ScheduledAt, &c.StartedAt, &c.PausedAt, &c.CompletedAt, &c.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrCampaignNotFound
	}
	if err != nil {
		return nil, err
	}
	return c, nil
}

func (r *CampaignRepo) GetByUserID(ctx context.Context, userID string) ([]domain.Campaign, error) {
	query := `
		SELECT id, user_id, name, status, from_number, concurrency, delay_seconds, retry_max,
		       voicemail_drop_url, calling_hours_start::text, calling_hours_end::text, calling_hours_timezone,
		       total_contacts, dialed, answered, failed, busy, no_answer,
		       scheduled_at, started_at, paused_at, completed_at, created_at
		FROM campaigns
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var campaigns []domain.Campaign
	for rows.Next() {
		c := domain.Campaign{}
		err := rows.Scan(
			&c.ID, &c.UserID, &c.Name, &c.Status, &c.FromNumber, &c.Concurrency, &c.DelaySeconds, &c.RetryMax,
			&c.VoicemailDropURL, &c.CallingHoursStart, &c.CallingHoursEnd, &c.CallingHoursTimezone,
			&c.TotalContacts, &c.Dialed, &c.Answered, &c.Failed, &c.Busy, &c.NoAnswer,
			&c.ScheduledAt, &c.StartedAt, &c.PausedAt, &c.CompletedAt, &c.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		campaigns = append(campaigns, c)
	}
	return campaigns, rows.Err()
}

func (r *CampaignRepo) Create(ctx context.Context, c *domain.Campaign) error {
	query := `
		INSERT INTO campaigns (
			id, user_id, name, status, from_number, concurrency, delay_seconds, retry_max,
			voicemail_drop_url, calling_hours_timezone, total_contacts, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
		)
	`
	if c.CreatedAt.IsZero() {
		c.CreatedAt = time.Now()
	}
	_, err := r.pool.Exec(ctx, query,
		c.ID, c.UserID, c.Name, c.Status, c.FromNumber, c.Concurrency, c.DelaySeconds, c.RetryMax,
		c.VoicemailDropURL, c.CallingHoursTimezone, c.TotalContacts, c.CreatedAt,
	)
	return err
}

func (r *CampaignRepo) UpdateStatus(ctx context.Context, id string, status domain.CampaignStatus, startedAt, pausedAt, completedAt *time.Time) error {
	query := `
		UPDATE campaigns
		SET status = $2,
		    started_at = COALESCE($3, started_at),
		    paused_at = $4,
		    completed_at = COALESCE($5, completed_at)
		WHERE id = $1
	`
	_, err := r.pool.Exec(ctx, query, id, status, startedAt, pausedAt, completedAt)
	return err
}

func (r *CampaignRepo) UpdateCounters(ctx context.Context, id string, dialed, answered, failed, busy, noAnswer int) error {
	query := `
		UPDATE campaigns
		SET dialed = dialed + $2,
		    answered = answered + $3,
		    failed = failed + $4,
		    busy = busy + $5,
		    no_answer = no_answer + $6
		WHERE id = $1
	`
	_, err := r.pool.Exec(ctx, query, id, dialed, answered, failed, busy, noAnswer)
	return err
}

func (r *CampaignRepo) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM campaigns WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	return err
}
