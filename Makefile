# Auto-detect available CPU cores (defaults to 16 on this machine, fallback to 4)
NUM_CORES ?= $(shell nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)

.PHONY: help dev start dev-backend dev-backend-multicore dev-frontend prod-backend benchmark-multicore benchmark test test-cov seed seed-admin migrate db-up db-down up down clean lint

help:
	@echo "🏛️ Scheme Navigator — Developer Commands"
	@echo "--------------------------------------------------"
	@echo "  make dev                 : 🚀 ONE-COMMAND ALL-IN-ONE: Starts DB + S3 + Migrations + Backend + Next.js Frontend"
	@echo "  make start               : Alias for make dev"
	@echo "  make dev-concurrent      : Run Backend (:8000) and Next.js Frontend (:3000) simultaneously with make -j2"
	@echo "  make dev-backend         : Run FastAPI backend in dev mode with reload (port 8000)"
	@echo "  make dev-backend-multicore: Run FastAPI with ALL $(NUM_CORES) CPU cores/workers for maximum throughput"
	@echo "  make prod-backend        : Production Uvicorn server with ALL $(NUM_CORES) CPU worker processes"
	@echo "  make benchmark-multicore : Benchmark in-memory bitmask engine across all $(NUM_CORES) CPU cores (100k queries)"
	@echo "  make dev-web             : Run Next.js frontend only (port 3000)"
	@echo "  make dev-frontend        : Alias for make dev-web"
	@echo "  make test                : Run all backend integration & unit tests"
	@echo "  make test-cov            : Run tests with code coverage summary"
	@echo "  make seed                : Seed Admin + 4,160 National & State schemes"
	@echo "  make seed-admin          : Create default administrator (admin@gov.in)"
	@echo "  make migrate             : Run Alembic database schema migrations"
	@echo "  make db-up               : Start PostgreSQL + MinIO services with Docker"
	@echo "  make db-down             : Stop Docker database & S3 services"
	@echo "  make up                  : Start entire stack inside Docker containers"
	@echo "  make down                : Stop all Docker stack services"
	@echo "  make lint                : Format & typecheck codebase"
	@echo "  make clean               : Clean temporary cache & pytest artifacts"

dev:
	python3 scripts/dev.py

start:
	python3 scripts/dev.py

dev-concurrent:
	@$(MAKE) -j2 dev-backend dev-web

dev-backend:
	cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-backend-multicore:
	cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers $(NUM_CORES)

prod-backend:
	cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers $(NUM_CORES)

benchmark-multicore:
	NUM_CORES=$(NUM_CORES) uv run python scripts/benchmark_multicore.py

benchmark:
	NUM_CORES=$(NUM_CORES) uv run python scripts/benchmark_multicore.py

dev-web:
	cd web && npm run dev

dev-frontend:
	cd web && npm run dev

test:
	cd backend && uv run pytest -v

test-feature:
	@if [ -z "$(FEAT)" ]; then echo "Error: Please specify feature, e.g. make test-feature FEAT=chat"; exit 1; fi
	cd backend && uv run pytest app/modules/$(FEAT)/ -v

test-e2e:
	cd backend && uv run pytest tests/e2e/ -v

test-cov:
	cd backend && uv run pytest -v --cov=app

seed:
	cd backend && uv run python -m app.seeds.seed_schemes

seed-admin:
	cd backend && uv run python -m app.seeds.create_admin --email admin@gov.in --password AdminPass123!

migrate:
	cd backend && uv run alembic upgrade head

db-up:
	docker compose up -d postgres minio minio-createbuckets

db-down:
	docker compose stop postgres minio minio-createbuckets

up:
	docker compose up -d

down:
	docker compose down

clean:
	rm -rf .pytest_cache .coverage htmlcov __pycache__ */__pycache__ */*/__pycache__ app/**/__pycache__
	rm -rf frontend/dist

lint:
	uv run ruff check .
	uv run ruff format .


