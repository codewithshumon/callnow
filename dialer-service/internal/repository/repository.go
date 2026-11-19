package repository

import (
	"context"
	"time"

	"github.com/voicelink/dialer-service/internal/domain"
)

type CampaignRepository interface {
	GetByID(ctx context.Context, id string) (*domain.Campaign, error)
	GetByUserID(ctx context.Context, userID string) ([]domain.Campaign, error)
	Create(ctx context.Context, campaign *domain.Campaign) error
	UpdateStatus(ctx context.Context, id string, status domain.CampaignStatus, startedAt, pausedAt, completedAt *time.Time) error
	UpdateCounters(ctx context.Context, id string, dialed, answered, failed, busy, noAnswer int) error
	Delete(ctx context.Context, id string) error
}

type ContactRepository interface {
	GetByID(ctx context.Context, id string) (*domain.CampaignContact, error)
	GetByCampaignID(ctx context.Context, campaignID string, status domain.ContactStatus, limit int) ([]domain.CampaignContact, error)
	BulkCreate(ctx context.Context, contacts []domain.CampaignContact) error
	UpdateStatus(ctx context.Context, id string, status domain.ContactStatus, callDuration int, attempts int) error
	CountByStatus(ctx context.Context, campaignID string) (map[domain.ContactStatus]int, error)
	ListPaginated(ctx context.Context, campaignID string, page, limit int) ([]domain.CampaignContact, int, error)
}

type DNCRepository interface {
	IsBlocked(ctx context.Context, userID, phone string) (bool, error)
	Add(ctx context.Context, userID, phone, source string) error
	Remove(ctx context.Context, userID, phone string) error
}
