package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"github.com/redis/go-redis/v9"
)

type HealthHandler struct {
	pool        *pgxpool.Pool
	redisClient *redis.Client
	provider    string
}

func NewHealthHandler(pool *pgxpool.Pool, redisClient *redis.Client, provider string) *HealthHandler {
	return &HealthHandler{
		pool:        pool,
		redisClient: redisClient,
		provider:    provider,
	}
}

func (h *HealthHandler) Health(c echo.Context) error {
	ctx, cancel := context.WithTimeout(c.Request().Context(), 3*time.Second)
	defer cancel()

	dbStatus := "connected"
	if h.pool != nil {
		if err := h.pool.Ping(ctx); err != nil {
			dbStatus = "disconnected"
		}
	} else {
		dbStatus = "disconnected"
	}

	redisStatus := "connected"
	if h.redisClient != nil {
		if err := h.redisClient.Ping(ctx).Err(); err != nil {
			redisStatus = "disconnected"
		}
	} else {
		redisStatus = "disconnected"
	}

	status := "ok"
	statusCode := http.StatusOK
	if dbStatus != "connected" || redisStatus != "connected" {
		status = "degraded"
		statusCode = http.StatusServiceUnavailable
	}

	return c.JSON(statusCode, map[string]interface{}{
		"status":   status,
		"db":       dbStatus,
		"redis":    redisStatus,
		"provider": h.provider,
	})
}
