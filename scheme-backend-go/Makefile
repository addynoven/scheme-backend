.PHONY: dev build test migrate-up migrate-down migrate-status migrate-create generate clean

-include .env

DB_USER ?= postgres
DB_PASSWORD ?= postgres
DB_HOST ?= localhost
DB_PORT ?= 5432
DB_NAME ?= scheme_db
DB_SSL_MODE ?= disable

ifneq ($(DATABASE_URL),)
DB_URL := $(DATABASE_URL)
else
DB_URL := postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=$(DB_SSL_MODE)
endif

export GOOSE_DRIVER=postgres
export GOOSE_DBSTRING=$(DB_URL)
export GOOSE_MIGRATION_DIR=sql/migrations

dev:
	go run cmd/api/main.go

build:
	go build -o bin/scheme-backend cmd/api/main.go

test:
	go test -v ./...

migrate-up:
	goose up

migrate-down:
	goose down

migrate-status:
	goose status

migrate-create:
	goose -dir sql/migrations create $(name) sql

generate:
	sqlc generate

clean:
	rm -rf bin/ gen/
