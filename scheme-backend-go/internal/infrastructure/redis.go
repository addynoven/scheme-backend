package infrastructure

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
	"scheme-backend-go/internal/config"
)

func NewRedisClient(ctx context.Context, cfg *config.Config) (*redis.Client, error) {
	if cfg.Redis.URL == "" {
		slog.Warn("REDIS_URL is empty, running without Redis caching")
		return nil, nil
	}

	opt, err := redis.ParseURL(cfg.Redis.URL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse REDIS_URL: %w", err)
	}

	client := redis.NewClient(opt)

	ctxTimeout, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := client.Ping(ctxTimeout).Err(); err != nil {
		slog.Warn("Failed to ping Redis, proceeding without cache", "error", err)
		return nil, nil
	}

	slog.Info("Connected to Redis/Valkey successfully")
	return client, nil
}
