package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
	"github.com/voicelink/dialer-service/config"
	"github.com/voicelink/dialer-service/internal/api"
	"github.com/voicelink/dialer-service/internal/callback"
	"github.com/voicelink/dialer-service/internal/campaign"
	"github.com/voicelink/dialer-service/internal/dialer"
	"github.com/voicelink/dialer-service/internal/queue"
	"github.com/voicelink/dialer-service/internal/repository/postgres"
)

func main() {
	// 1. Logger
	logger, _ := zap.NewProduction()
	if os.Getenv("NODE_ENV") != "production" {
		logger, _ = zap.NewDevelopment()
	}
	defer logger.Sync()

	// 2. Config
	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("Failed to load configuration", zap.Error(err))
	}

	logger.Info("Starting VoiceLink Power Dialer Service",
		zap.String("port", cfg.Port),
		zap.String("telephonyProvider", cfg.TelephonyProvider),
	)

	// 3. PostgreSQL Connection Pool
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pgConfig, err := pgxpool.ParseConfig(cfg.DatabaseURL)
	if err != nil {
		logger.Fatal("Failed to parse database URL", zap.Error(err))
	}
	pgConfig.MaxConns = 20
	pgConfig.MinConns = 2

	pool, err := pgxpool.NewWithConfig(ctx, pgConfig)
	if err != nil {
		logger.Warn("Database connection failed (will retry on queries)", zap.Error(err))
	} else {
		if err := pool.Ping(ctx); err != nil {
			logger.Warn("Database ping failed", zap.Error(err))
		} else {
			logger.Info("Connected to PostgreSQL")
		}
	}

	// 4. Redis Client
	redisOpts, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		logger.Fatal("Failed to parse Redis URL", zap.Error(err))
	}
	redisClient := redis.NewClient(redisOpts)
	if err := redisClient.Ping(ctx).Err(); err != nil {
		logger.Warn("Redis ping failed", zap.Error(err))
	} else {
		logger.Info("Connected to Redis")
	}

	// 5. Telephony Provider
	var telephonyProvider dialer.TelephonyProvider
	switch cfg.TelephonyProvider {
	case "twilio":
		telephonyProvider = dialer.NewTwilioClient(cfg.TwilioAccountSid, cfg.TwilioAuthToken)
	default:
		telephonyProvider = dialer.NewStubProvider(cfg.TelephonyProvider)
	}

	// 6. Repositories & Queues
	campaignRepo := postgres.NewCampaignRepo(pool)
	contactRepo := postgres.NewContactRepo(pool)
	dncRepo := postgres.NewDNCRepo(pool)
	redisQueue := queue.NewRedisQueue(redisClient)

	// 7. Callback Client
	callbackClient := callback.NewCallbackClient(cfg.NestjsCallbackURL, cfg.InternalApiKey, logger)

	// 8. Campaign Service
	campaignService := campaign.NewService(
		campaignRepo,
		contactRepo,
		dncRepo,
		redisQueue,
		telephonyProvider,
		callbackClient,
		logger,
	)

	// 9. Echo Router
	router := api.NewRouter(cfg, campaignService, pool, redisClient, logger)

	// 10. Start Server
	server := &http.Server{
		Addr:    fmt.Sprintf(":%s", cfg.Port),
		Handler: router,
	}

	go func() {
		logger.Info("Dialer HTTP server listening", zap.String("addr", server.Addr))
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("HTTP server failed", zap.Error(err))
		}
	}()

	// 11. Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down dialer service...")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("HTTP server shutdown error", zap.Error(err))
	}

	if pool != nil {
		pool.Close()
	}
	_ = redisClient.Close()

	logger.Info("Dialer service stopped gracefully")
}
