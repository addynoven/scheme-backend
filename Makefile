.PHONY: help dev start dev-backend dev-frontend test test-cov seed seed-admin migrate db-up db-down up down clean lint

help:
	@echo "🏛️ Scheme Navigator — Developer Commands"
	@echo "--------------------------------------------------"
	@echo "  make dev         : 🚀 ONE-COMMAND ALL-IN-ONE: Starts DB + S3 + Migrations + Backend + Frontend"
	@echo "  make start       : Alias for make dev"
	@echo "  make dev-backend : Run FastAPI backend only (port 8000)"
	@echo "  make dev-frontend: Run React frontend only (port 5173)"
	@echo "  make test        : Run all backend integration & unit tests"
	@echo "  make test-cov    : Run tests with code coverage summary"
	@echo "  make seed        : Seed Admin + 4,160 National & State schemes"
	@echo "  make seed-admin  : Create default administrator (admin@gov.in)"
	@echo "  make migrate     : Run Alembic database schema migrations"
	@echo "  make db-up       : Start PostgreSQL + MinIO services with Docker"
	@echo "  make db-down     : Stop Docker database & S3 services"
	@echo "  make up          : Start entire stack inside Docker containers"
	@echo "  make down        : Stop all Docker stack services"
	@echo "  make lint        : Format & typecheck codebase"
	@echo "  make clean       : Clean temporary cache & pytest artifacts"

dev:
	uv run python scripts/dev.py

start:
	uv run python scripts/dev.py

dev-backend:
	uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm run dev

test:
	uv run pytest -v

test-cov:
	uv run pytest -v --cov=app

seed:
	uv run python -m app.seeds.seed_schemes

seed-admin:
	uv run python -m app.seeds.create_admin --email admin@gov.in --password AdminPass123!

migrate:
	uv run alembic upgrade head

db-up:
	docker compose up -d postgres minio minio-createbuckets

db-down:
	docker compose stop postgres minio minio-createbuckets

up:
	docker compose up -d

down:
	docker compose down

lint:
	uv run ruff check .
	uv run ruff format .

clean:
	rm -rf .pytest_cache .coverage htmlcov __pycache__ app/**/__pycache__

