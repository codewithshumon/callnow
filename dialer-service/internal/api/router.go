package api

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	echomw "github.com/labstack/echo/v4/middleware"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
	"github.com/voicelink/dialer-service/config"
	"github.com/voicelink/dialer-service/internal/api/handler"
	"github.com/voicelink/dialer-service/internal/api/middleware"
	"github.com/voicelink/dialer-service/internal/campaign"
)

func NewRouter(
	cfg *config.Config,
	service *campaign.Service,
	pool *pgxpool.Pool,
	redisClient *redis.Client,
	logger *zap.Logger,
) *echo.Echo {
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true

	// Global Middleware
	e.Use(echomw.Recover())
	e.Use(echomw.RequestID())
	e.Use(middleware.LoggingMiddleware(logger))
	e.Use(echomw.CORS())

	// Handlers
	campaignHandler := handler.NewCampaignHandler(service)
	healthHandler := handler.NewHealthHandler(pool, redisClient, cfg.TelephonyProvider)

	// Public routes
	e.GET("/health", healthHandler.Health)

	// Internal authenticated routes
	campaigns := e.Group("/campaigns", middleware.AuthMiddleware(cfg.InternalApiKey))
	campaigns.POST("", campaignHandler.CreateAndStart)
	campaigns.GET("/:id", campaignHandler.GetByID)
	campaigns.POST("/:id/pause", campaignHandler.Pause)
	campaigns.POST("/:id/resume", campaignHandler.Resume)
	campaigns.POST("/:id/stop", campaignHandler.Stop)
	campaigns.GET("/:id/results", campaignHandler.GetResults)
	campaigns.GET("/:id/export", campaignHandler.ExportCSV)

	return e
}
