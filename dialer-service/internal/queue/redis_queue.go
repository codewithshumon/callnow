package queue

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/voicelink/dialer-service/internal/domain"
)

type ContactQueue interface {
	Enqueue(ctx context.Context, campaignID string, contactIDs []string) error
	Dequeue(ctx context.Context, campaignID string, timeout time.Duration) (string, error)
	QueueLength(ctx context.Context, campaignID string) (int64, error)
	ClearQueue(ctx context.Context, campaignID string) error
	SetState(ctx context.Context, campaignID string, state string) error
	GetState(ctx context.Context, campaignID string) (string, error)
	SetProgress(ctx context.Context, campaignID string, progress domain.CampaignProgress) error
	GetProgress(ctx context.Context, campaignID string) (*domain.CampaignProgress, error)
}

type RedisQueue struct {
	client *redis.Client
}

func NewRedisQueue(client *redis.Client) *RedisQueue {
	return &RedisQueue{client: client}
}

func (q *RedisQueue) Enqueue(ctx context.Context, campaignID string, contactIDs []string) error {
	if len(contactIDs) == 0 {
		return nil
	}
	key := fmt.Sprintf("dialer:campaign:%s:queue", campaignID)
	// LPUSH in batches
	vals := make([]interface{}, len(contactIDs))
	for i, id := range contactIDs {
		vals[i] = id
	}
	return q.client.LPush(ctx, key, vals...).Err()
}

func (q *RedisQueue) Dequeue(ctx context.Context, campaignID string, timeout time.Duration) (string, error) {
	key := fmt.Sprintf("dialer:campaign:%s:queue", campaignID)
	result, err := q.client.BRPop(ctx, timeout, key).Result()
	if err == redis.Nil {
		return "", domain.ErrQueueEmpty
	}
	if err != nil {
		return "", err
	}
	if len(result) < 2 {
		return "", domain.ErrQueueEmpty
	}
	return result[1], nil
}

func (q *RedisQueue) QueueLength(ctx context.Context, campaignID string) (int64, error) {
	key := fmt.Sprintf("dialer:campaign:%s:queue", campaignID)
	return q.client.LLen(ctx, key).Result()
}

func (q *RedisQueue) ClearQueue(ctx context.Context, campaignID string) error {
	key := fmt.Sprintf("dialer:campaign:%s:queue", campaignID)
	return q.client.Del(ctx, key).Err()
}

func (q *RedisQueue) SetState(ctx context.Context, campaignID string, state string) error {
	key := fmt.Sprintf("dialer:campaign:%s:state", campaignID)
	return q.client.Set(ctx, key, state, 24*time.Hour).Err()
}

func (q *RedisQueue) GetState(ctx context.Context, campaignID string) (string, error) {
	key := fmt.Sprintf("dialer:campaign:%s:state", campaignID)
	val, err := q.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return "", nil
	}
	return val, err
}

func (q *RedisQueue) SetProgress(ctx context.Context, campaignID string, progress domain.CampaignProgress) error {
	key := fmt.Sprintf("dialer:campaign:%s:progress", campaignID)
	data := map[string]interface{}{
		"dialed":    progress.Dialed,
		"answered":  progress.Answered,
		"failed":    progress.Failed,
		"busy":      progress.Busy,
		"no_answer": progress.NoAnswer,
		"remaining": progress.Remaining,
	}
	pipe := q.client.Pipeline()
	pipe.HSet(ctx, key, data)
	pipe.Expire(ctx, key, 24*time.Hour)
	_, err := pipe.Exec(ctx)
	return err
}

func (q *RedisQueue) GetProgress(ctx context.Context, campaignID string) (*domain.CampaignProgress, error) {
	key := fmt.Sprintf("dialer:campaign:%s:progress", campaignID)
	vals, err := q.client.HGetAll(ctx, key).Result()
	if err != nil || len(vals) == 0 {
		return nil, err
	}

	toInt := func(s string) int {
		n, _ := strconv.Atoi(s)
		return n
	}

	return &domain.CampaignProgress{
		Dialed:    toInt(vals["dialed"]),
		Answered:  toInt(vals["answered"]),
		Failed:    toInt(vals["failed"]),
		Busy:      toInt(vals["busy"]),
		NoAnswer:  toInt(vals["no_answer"]),
		Remaining: toInt(vals["remaining"]),
	}, nil
}
