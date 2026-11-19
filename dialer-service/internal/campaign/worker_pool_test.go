package campaign

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
	"github.com/voicelink/dialer-service/internal/dialer"
	"github.com/voicelink/dialer-service/internal/domain"
	"github.com/voicelink/dialer-service/internal/queue"
)

type mockRepo struct{}

func (m *mockRepo) GetByID(ctx context.Context, id string) (*domain.Campaign, error) {
	return nil, nil
}
func (m *mockRepo) GetByUserID(ctx context.Context, userID string) ([]domain.Campaign, error) {
	return nil, nil
}
func (m *mockRepo) Create(ctx context.Context, campaign *domain.Campaign) error { return nil }
func (m *mockRepo) UpdateStatus(ctx context.Context, id string, status domain.CampaignStatus, startedAt, pausedAt, completedAt *time.Time) error {
	return nil
}
func (m *mockRepo) UpdateCounters(ctx context.Context, id string, dialed, answered, failed, busy, noAnswer int) error {
	return nil
}
func (m *mockRepo) Delete(ctx context.Context, id string) error { return nil }

type mockContactRepo struct {
	contacts map[string]*domain.CampaignContact
}

func (m *mockContactRepo) GetByID(ctx context.Context, id string) (*domain.CampaignContact, error) {
	c, ok := m.contacts[id]
	if !ok {
		return nil, domain.ErrContactNotFound
	}
	return c, nil
}
func (m *mockContactRepo) GetByCampaignID(ctx context.Context, campaignID string, status domain.ContactStatus, limit int) ([]domain.CampaignContact, error) {
	var list []domain.CampaignContact
	for _, c := range m.contacts {
		if c.Status == status {
			list = append(list, *c)
		}
	}
	return list, nil
}
func (m *mockContactRepo) BulkCreate(ctx context.Context, contacts []domain.CampaignContact) error {
	for i := range contacts {
		m.contacts[contacts[i].ID] = &contacts[i]
	}
	return nil
}
func (m *mockContactRepo) UpdateStatus(ctx context.Context, id string, status domain.ContactStatus, callDuration int, attempts int) error {
	if c, ok := m.contacts[id]; ok {
		c.Status = status
		c.CallDuration = &callDuration
		c.Attempts = attempts
	}
	return nil
}
func (m *mockContactRepo) CountByStatus(ctx context.Context, campaignID string) (map[domain.ContactStatus]int, error) {
	return nil, nil
}
func (m *mockContactRepo) ListPaginated(ctx context.Context, campaignID string, page, limit int) ([]domain.CampaignContact, int, error) {
	return nil, 0, nil
}

type mockDNCRepo struct{}

func (m *mockDNCRepo) IsBlocked(ctx context.Context, userID, phone string) (bool, error) {
	return phone == "+19999999999", nil
}
func (m *mockDNCRepo) Add(ctx context.Context, userID, phone, source string) error { return nil }
func (m *mockDNCRepo) Remove(ctx context.Context, userID, phone string) error       { return nil }

type mockDialer struct{}

func (m *mockDialer) Name() string { return "mock" }
func (m *mockDialer) Call(ctx context.Context, to string, from string, opts dialer.CallOptions) (*domain.CallResult, error) {
	return &domain.CallResult{
		ProviderCallSid: "mock-sid",
		Status:          domain.ContactStatusAnswered,
		DurationSeconds: 10,
		Timestamp:       time.Now(),
	}, nil
}
func (m *mockDialer) ValidateWebhookSignature(payload []byte, signature string) bool { return true }

type mockCallback struct{}

func (m *mockCallback) SendProgress(ctx context.Context, campaignID string, progress domain.CampaignProgress) error {
	return nil
}
func (m *mockCallback) SendCompleted(ctx context.Context, campaignID string, progress domain.CampaignProgress) error {
	return nil
}

func TestWorkerPool_Execution(t *testing.T) {
	c := &domain.Campaign{
		ID:            "test-camp-1",
		UserID:        "user-1",
		Concurrency:   2,
		FromNumber:    "+14155551234",
		TotalContacts: 2,
	}

	memQ := queue.NewMemoryQueue()
	_ = memQ.Enqueue(context.Background(), c.ID, []string{"c1", "c2"})

	contactRepo := &mockContactRepo{
		contacts: map[string]*domain.CampaignContact{
			"c1": {ID: "c1", Phone: "+14155550001", Status: domain.ContactStatusPending},
			"c2": {ID: "c2", Phone: "+19999999999", Status: domain.ContactStatusPending}, // DNC blocked
		},
	}

	logger := zap.NewNop()
	wp := NewWorkerPool(
		c,
		memQ,
		&mockDialer{},
		&mockRepo{},
		contactRepo,
		&mockDNCRepo{},
		&mockCallback{},
		logger,
	)

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	done := make(chan struct{})
	go func() {
		wp.Start(ctx)
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(3 * time.Second):
		t.Fatal("Worker pool did not complete within timeout")
	}

	assert.Equal(t, domain.ContactStatusAnswered, contactRepo.contacts["c1"].Status)
	assert.Equal(t, domain.ContactStatusDNC, contactRepo.contacts["c2"].Status)
}
