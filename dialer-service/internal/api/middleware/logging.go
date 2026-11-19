package middleware

import (
	"time"

	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

func LoggingMiddleware(logger *zap.Logger) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			start := time.Now()
			err := next(c)
			duration := time.Since(start)

			req := c.Request()
			res := c.Response()

			fields := []zap.Field{
				zap.String("method", req.Method),
				zap.String("path", req.URL.Path),
				zap.Int("status", res.Status),
				zap.Duration("duration", duration),
				zap.String("requestId", res.Header().Get(echo.HeaderXRequestID)),
			}

			if err != nil {
				fields = append(fields, zap.Error(err))
				logger.Error("HTTP request failed", fields...)
			} else {
				logger.Info("HTTP request", fields...)
			}

			return err
		}
	}
}
