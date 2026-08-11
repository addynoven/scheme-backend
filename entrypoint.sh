#!/bin/sh
set -e

echo "🚀 Starting Government Welfare Scheme Backend..."

# Run database migrations
echo "📦 Running Alembic database migrations..."
uv run alembic upgrade head

# Seed initial national government schemes
echo "🇮🇳 Verifying national government schemes dataset..."
uv run python -m app.seeds.seed_schemes

echo "✨ System ready! Starting server..."
exec "$@"
