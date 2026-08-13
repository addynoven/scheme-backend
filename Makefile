.PHONY: help dev test test-cov seed seed-admin migrate db-up db-down clean lint

help:
	@echo "🏛️ Scheme Navigator Backend — Developer Commands"
	@echo "--------------------------------------------------"
	@echo "  make dev         : Run FastAPI backend with auto-reload"
	@echo "  make test        : Run all 49 integration & unit tests"
	@echo "  make test-cov    : Run tests with code coverage summary"
	@echo "  make seed        : Seed Admin + 4,160 National & State schemes"
	@echo "  make seed-admin  : Create default administrator (admin@gov.in)"
	@echo "  make migrate     : Run Alembic database schema migrations"
	@echo "  make db-up       : Start PostgreSQL + MinIO services with Docker"
	@echo "  make db-down     : Stop Docker background services"
	@echo "  make lint        : Format & typecheck codebase"
	@echo "  make clean       : Clean temporary cache & pytest artifacts"

dev:
	uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

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
	docker compose up -d db minio minio-setup

db-down:
	docker compose down

lint:
	uv run ruff check .
	uv run ruff format .

clean:
	rm -rf .pytest_cache .coverage htmlcov __pycache__ app/**/__pycache__
