package config

import (
	"log/slog"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	App        AppConfig
	DB         DBConfig
	Redis      RedisConfig
	JWT        JWTConfig
	Cloudinary CloudinaryConfig
	Gemini     GeminiConfig
}

type AppConfig struct {
	Port string
	Env  string
	Host string
}

type DBConfig struct {
	URL             string
	MaxConns        int32
	MinConns        int32
	MaxConnLifetime time.Duration
	MaxConnIdleTime time.Duration
}

type RedisConfig struct {
	URL string
}

type JWTConfig struct {
	Secret                string
	AccessTokenDuration   time.Duration
	RefreshTokenDuration  time.Duration
}

type CloudinaryConfig struct {
	CloudName string
	APIKey    string
	APISecret string
	Folder    string
}

type GeminiConfig struct {
	APIKey string
}

func Load() (*Config, error) {
	// Try to load .env from current dir, ignore error if missing (e.g. in prod)
	_ = godotenv.Load()

	cfg := &Config{
		App: AppConfig{
			Port: getEnv("PORT", "8000"),
			Env:  getEnv("APP_ENV", "development"),
			Host: getEnv("HOST", "0.0.0.0"),
		},
		DB: DBConfig{
			URL:             getEnv("DATABASE_URL", ""),
			MaxConns:        int32(getEnvInt("DB_MAX_CONNS", 20)),
			MinConns:        int32(getEnvInt("DB_MIN_CONNS", 2)),
			MaxConnLifetime: time.Duration(getEnvInt("DB_MAX_CONN_LIFETIME_MINUTES", 60)) * time.Minute,
			MaxConnIdleTime: time.Duration(getEnvInt("DB_MAX_CONN_IDLE_MINUTES", 10)) * time.Minute,
		},
		Redis: RedisConfig{
			URL: getEnv("REDIS_URL", ""),
		},
		JWT: JWTConfig{
			Secret:               getEnv("JWT_SECRET", "super-secret-default-change-me"),
			AccessTokenDuration:  time.Duration(getEnvInt("JWT_ACCESS_MINUTES", 60)) * time.Minute,
			RefreshTokenDuration: time.Duration(getEnvInt("JWT_REFRESH_DAYS", 30)) * 24 * time.Hour,
		},
		Cloudinary: CloudinaryConfig{
			CloudName: getEnv("CLOUDINARY_CLOUD_NAME", ""),
			APIKey:    getEnv("CLOUDINARY_API_KEY", ""),
			APISecret: getEnv("CLOUDINARY_API_SECRET", ""),
			Folder:    getEnv("CLOUDINARY_FOLDER", "scheme_vault"),
		},
		Gemini: GeminiConfig{
			APIKey: getEnv("GEMINI_API_KEY", ""),
		},
	}

	slog.Info("Configuration loaded successfully", "env", cfg.App.Env, "port", cfg.App.Port)
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
