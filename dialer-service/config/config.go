package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port              string
	DatabaseURL       string
	RedisURL          string
	TelephonyProvider string
	TwilioAccountSid  string
	TwilioAuthToken   string
	TelnyxApiKey      string
	TelnyxConnectionId string
	NestjsCallbackURL string
	InternalApiKey    string
	LogLevel          string
	MaxConcurrency    int
}

func Load() (*Config, error) {
	// Load .env if present (ignore error if not present in production)
	_ = godotenv.Load()

	cfg := &Config{
		Port:              getEnv("PORT", "8080"),
		DatabaseURL:       getEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5434/voicelink"),
		RedisURL:          getEnv("REDIS_URL", "redis://localhost:6383"),
		TelephonyProvider: getEnv("TELEPHONY_PROVIDER", "twilio"),
		TwilioAccountSid:  os.Getenv("TWILIO_ACCOUNT_SID"),
		TwilioAuthToken:   os.Getenv("TWILIO_AUTH_TOKEN"),
		TelnyxApiKey:      os.Getenv("TELNYX_API_KEY"),
		TelnyxConnectionId: os.Getenv("TELNYX_CONNECTION_ID"),
		NestjsCallbackURL: getEnv("NESTJS_CALLBACK_URL", "http://localhost:4000"),
		InternalApiKey:    getEnv("INTERNAL_API_KEY", "change-me"),
		LogLevel:          getEnv("LOG_LEVEL", "info"),
		MaxConcurrency:    getEnvInt("MAX_CONCURRENCY", 10),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	return cfg, nil
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

func getEnvInt(key string, defaultVal int) int {
	valStr := os.Getenv(key)
	if valStr == "" {
		return defaultVal
	}
	val, err := strconv.Atoi(valStr)
	if err != nil {
		return defaultVal
	}
	return val
}
