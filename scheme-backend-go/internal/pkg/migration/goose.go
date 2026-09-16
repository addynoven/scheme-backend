package migration

import (
	"database/sql"
	"fmt"
	"log/slog"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
)

func RunGooseUp(dbURL, migrationsDir string) error {
	db, err := sql.Open("pgx", dbURL)
	if err != nil {
		return fmt.Errorf("failed to open db for migration: %w", err)
	}
	defer db.Close()

	if err := goose.SetDialect("postgres"); err != nil {
		return fmt.Errorf("failed to set goose dialect: %w", err)
	}

	slog.Info("Running goose migrations up", "dir", migrationsDir)
	if err := goose.Up(db, migrationsDir); err != nil {
		return fmt.Errorf("goose up failed: %w", err)
	}

	slog.Info("Goose migrations completed successfully")
	return nil
}
