package queue

import (
	"context"
	"sync"
	"time"

	"github.com/voicelink/dialer-service/internal/domain"
)

type MemoryQueue struct {
	mu       sync.Mutex
	queues   map[string][]string
	states   map[string]string
	progress map[string]domain.CampaignProgress
}

func NewMemoryQueue() *MemoryQueue {
	return &MemoryQueue{
		queues:   make(map[string][]string),
		states:   make(map[string]string),
		progress: make(map[string]domain.CampaignProgress),
	}
}

func (q *MemoryQueue) Enqueue(ctx context.Context, campaignID string, contactIDs []string) error {
	q.mu.Lock()
	defer q.mu.Unlock()
	q.queues[campaignID] = append(q.queues[campaignID], contactIDs...)
	return nil
}

func (q *MemoryQueue) Dequeue(ctx context.Context, campaignID string, timeout time.Duration) (string, error) {
	q.mu.Lock()
	defer q.mu.Unlock()
	items := q.queues[campaignID]
	if len(items) == 0 {
		return "", domain.ErrQueueEmpty
	}
	first := items[0]
	q.queues[campaignID] = items[1:]
	return first, nil
}

func (q *MemoryQueue) QueueLength(ctx context.Context, campaignID string) (int64, error) {
	q.mu.Lock()
	defer q.mu.Unlock()
	return int64(len(q.queues[campaignID])), nil
}

func (q *MemoryQueue) ClearQueue(ctx context.Context, campaignID string) error {
	q.mu.Lock()
	defer q.mu.Unlock()
	delete(q.queues, campaignID)
	return nil
}

func (q *MemoryQueue) SetState(ctx context.Context, campaignID string, state string) error {
	q.mu.Lock()
	defer q.mu.Unlock()
	q.states[campaignID] = state
	return nil
}

func (q *MemoryQueue) GetState(ctx context.Context, campaignID string) (string, error) {
	q.mu.Lock()
	defer q.mu.Unlock()
	return q.states[campaignID], nil
}

func (q *MemoryQueue) SetProgress(ctx context.Context, campaignID string, progress domain.CampaignProgress) error {
	q.mu.Lock()
	defer q.mu.Unlock()
	q.progress[campaignID] = progress
	return nil
}

func (q *MemoryQueue) GetProgress(ctx context.Context, campaignID string) (*domain.CampaignProgress, error) {
	q.mu.Lock()
	defer q.mu.Unlock()
	p, ok := q.progress[campaignID]
	if !ok {
		return nil, nil
	}
	return &p, nil
}
