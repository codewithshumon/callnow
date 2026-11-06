package middleware

import (
	"crypto/subtle"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/voicelink/dialer-service/internal/api/dto"
)

func AuthMiddleware(internalAPIKey string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				status, resp := dto.Error(http.StatusUnauthorized, "UNAUTHORIZED", "Missing authorization header")
				return c.JSON(status, resp)
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				status, resp := dto.Error(http.StatusUnauthorized, "UNAUTHORIZED", "Invalid authorization format")
				return c.JSON(status, resp)
			}

			token := parts[1]
			// Constant-time compare to prevent timing attack side-channels
			if internalAPIKey == "" || subtle.ConstantTimeCompare([]byte(token), []byte(internalAPIKey)) != 1 {
				status, resp := dto.Error(http.StatusUnauthorized, "UNAUTHORIZED", "Invalid API key")
				return c.JSON(status, resp)
			}

			return next(c)
		}
	}
}
