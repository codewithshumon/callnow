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

type ContactRepo struct {
	pool *pgxpool.Pool
}

func NewContactRepo(pool *pgxpool.Pool) repository.ContactRepository {
	return &ContactRepo{pool: pool}
}

func (r *ContactRepo) GetByID(ctx context.Context, id string) (*domain.CampaignContact, error) {
	query := `
		SELECT id, campaign_id, phone, name, notes, status, attempts, call_duration, last_attempted_at, created_at
		FROM campaign_contacts
		WHERE id = $1
	`
	c := &domain.CampaignContact{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&c.ID, &c.CampaignID, &c.Phone, &c.Name, &c.Notes, &c.Status,
		&c.Attempts, &c.CallDuration, &c.LastAttemptedAt, &c.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrContactNotFound
	}
	if err != nil {
		return nil, err
	}
	return c, nil
}

func (r *ContactRepo) GetByCampaignID(ctx context.Context, campaignID string, status domain.ContactStatus, limit int) ([]domain.CampaignContact, error) {
	query := `
		SELECT id, campaign_id, phone, name, notes, status, attempts, call_duration, last_attempted_at, created_at
		FROM campaign_contacts
		WHERE campaign_id = $1 AND status = $2
		LIMIT $3
		FOR UPDATE SKIP LOCKED
	`
	rows, err := r.pool.Query(ctx, query, campaignID, status, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var contacts []domain.CampaignContact
	for rows.Next() {
		c := domain.CampaignContact{}
		err := rows.Scan(
			&c.ID, &c.CampaignID, &c.Phone, &c.Name, &c.Notes, &c.Status,
			&c.Attempts, &c.CallDuration, &c.LastAttemptedAt, &c.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		contacts = append(contacts, c)
	}
	return contacts, rows.Err()
}

func (r *ContactRepo) BulkCreate(ctx context.Context, contacts []domain.CampaignContact) error {
	rows := make([][]interface{}, len(contacts))
	for i, c := range contacts {
		createdAt := c.CreatedAt
		if createdAt.IsZero() {
			createdAt = time.Now()
		}
		rows[i] = []interface{}{
			c.ID, c.CampaignID, c.Phone, c.Name, c.Notes, c.Status, c.Attempts, createdAt,
		}
	}

	_, err := r.pool.CopyFrom(
		ctx,
		pgx.Identifier{"campaign_contacts"},
		[]string{"id", "campaign_id", "phone", "name", "notes", "status", "attempts", "created_at"},
		pgx.CopyFromRows(rows),
	)
	return err
}

func (r *ContactRepo) UpdateStatus(ctx context.Context, id string, status domain.ContactStatus, callDuration int, attempts int) error {
	query := `
		UPDATE campaign_contacts
		SET status = $2,
		    attempts = $3,
		    call_duration = $4,
		    last_attempted_at = NOW()
		WHERE id = $1
	`
	_, err := r.pool.Exec(ctx, query, id, status, attempts, callDuration)
	return err
}

func (r *ContactRepo) CountByStatus(ctx context.Context, campaignID string) (map[domain.ContactStatus]int, error) {
	query := `
		SELECT status, COUNT(*)
		FROM campaign_contacts
		WHERE campaign_id = $1
		GROUP BY status
	`
	rows, err := r.pool.Query(ctx, query, campaignID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	counts := make(map[domain.ContactStatus]int)
	for rows.Next() {
		var status domain.ContactStatus
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return nil, err
		}
		counts[status] = count
	}
	return counts, rows.Err()
}

func (r *ContactRepo) ListPaginated(ctx context.Context, campaignID string, page, limit int) ([]domain.CampaignContact, int, error) {
	offset := (page - 1) * limit
	countQuery := `SELECT COUNT(*) FROM campaign_contacts WHERE campaign_id = $1`
	var total int
	if err := r.pool.QueryRow(ctx, countQuery, campaignID).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := `
		SELECT id, campaign_id, phone, name, notes, status, attempts, call_duration, last_attempted_at, created_at
		FROM campaign_contacts
		WHERE campaign_id = $1
		ORDER BY created_at ASC
		LIMIT $2 OFFSET $3
	`
	rows, err := r.pool.Query(ctx, query, campaignID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var contacts []domain.CampaignContact
	for rows.Next() {
		c := domain.CampaignContact{}
		err := rows.Scan(
			&c.ID, &c.CampaignID, &c.Phone, &c.Name, &c.Notes, &c.Status,
			&c.Attempts, &c.CallDuration, &c.LastAttemptedAt, &c.CreatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		contacts = append(contacts, c)
	}
	return contacts, total, rows.Err()
}
