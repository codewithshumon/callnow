package postgres

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/voicelink/dialer-service/internal/repository"
)

type DNCRepo struct {
	pool *pgxpool.Pool
}

func NewDNCRepo(pool *pgxpool.Pool) repository.DNCRepository {
	return &DNCRepo{pool: pool}
}

func (r *DNCRepo) IsBlocked(ctx context.Context, userID, phone string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM dnc_list WHERE user_id = $1 AND phone = $2)`
	var exists bool
	err := r.pool.QueryRow(ctx, query, userID, phone).Scan(&exists)
	return exists, err
}

func (r *DNCRepo) Add(ctx context.Context, userID, phone, source string) error {
	query := `
		INSERT INTO dnc_list (id, user_id, phone, source, created_at)
		VALUES (gen_random_uuid(), $1, $2, $3, NOW())
		ON CONFLICT (user_id, phone) DO NOTHING
	`
	_, err := r.pool.Exec(ctx, query, userID, phone, source)
	return err
}

func (r *DNCRepo) Remove(ctx context.Context, userID, phone string) error {
	query := `DELETE FROM dnc_list WHERE user_id = $1 AND phone = $2`
	_, err := r.pool.Exec(ctx, query, userID, phone)
	return err
}
