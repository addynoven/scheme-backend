package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"scheme-backend-go/internal/app"
	"scheme-backend-go/internal/pkg/migration"
)

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	slog.Info("Starting Sovereign Citizen Welfare Backend (Go)")

	fiberApp, cfg, cleanup, err := app.Bootstrap(ctx)
	if err != nil {
		slog.Error("Failed to bootstrap application", "error", err)
		os.Exit(1)
	}
	defer cleanup()

	// Optional automatic migration run
	if os.Getenv("RUN_MIGRATIONS_ON_STARTUP") == "true" {
		migrationsDir := "sql/migrations"
		if err := migration.RunGooseUp(cfg.DB.URL, migrationsDir); err != nil {
			slog.Warn("Goose migration check encountered notice", "error", err)
		}
	}

	addr := fmt.Sprintf("%s:%s", cfg.App.Host, cfg.App.Port)

	// Channel to catch OS signals
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	go func() {
		slog.Info("Server listening", "addr", addr, "env", cfg.App.Env)
		if err := fiberApp.Listen(addr); err != nil {
			slog.Info("Server stopped listening", "notice", err)
		}
	}()

	<-quit
	slog.Info("Shutdown signal received, shutting down gracefully...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := fiberApp.ShutdownWithContext(shutdownCtx); err != nil {
		slog.Error("Fiber shutdown error", "error", err)
	}

	slog.Info("Server exited cleanly")
}
