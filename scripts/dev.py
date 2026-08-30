#!/usr/bin/env python3
"""
All-in-One Local Development Launcher for Scheme Navigator.
1. Starts PostgreSQL and MinIO S3 via Docker Compose.
2. Waits for PostgreSQL to be ready.
3. Automatically runs database schema migrations (Alembic).
4. Auto-seeds default admin and schemes if database is empty.
5. Spawns FastAPI Backend (port 8000) and React Frontend (port 5173) concurrently.
6. Cleanly terminates all child processes on Ctrl+C.
"""

import os
import signal
import subprocess
import sys
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = ROOT_DIR / "frontend"


def print_banner(msg: str, emoji: str = "⚡"):
    print(f"\n\033[1;36m{emoji} {msg}\033[0m")


def run_cmd(cmd: list[str], check: bool = True, cwd: Path = ROOT_DIR):
    return subprocess.run(cmd, cwd=str(cwd), check=check)


def ensure_docker_services():
    print_banner("1/4: Starting PostgreSQL & MinIO S3 containers...", "🐳")
    try:
        run_cmd(["docker", "compose", "up", "-d", "postgres", "minio", "minio-createbuckets"])
    except Exception as e:
        print(f"\033[1;31mFailed to start Docker services: {e}\033[0m")
        print("Please ensure Docker daemon is running.")
        sys.exit(1)


def wait_for_db(max_retries: int = 30):
    print_banner("2/4: Waiting for PostgreSQL to be ready...", "⏳")
    check_script = (
        "import psycopg, sys\n"
        "try:\n"
        "    psycopg.connect('postgresql://scheme_user:scheme_password@localhost:5432/scheme_db', connect_timeout=2)\n"
        "    sys.exit(0)\n"
        "except Exception:\n"
        "    sys.exit(1)\n"
    )
    for attempt in range(1, max_retries + 1):
        proc = subprocess.run(
            ["uv", "run", "python", "-c", check_script],
            cwd=str(ROOT_DIR),
            capture_output=True,
        )
        if proc.returncode == 0:
            print("\033[1;32m✓ PostgreSQL is ready and accepting connections!\033[0m")
            return
        time.sleep(1)
    print("\033[1;31mTimed out waiting for PostgreSQL.\033[0m")
    sys.exit(1)


def run_migrations_and_seed():
    print_banner("3/4: Applying Database Migrations (Alembic)...", "🔄")
    run_cmd(["uv", "run", "alembic", "upgrade", "head"])

    # Check if database has schemes
    check_db_script = (
        "from app.core.database import SessionLocal\n"
        "from app.modules.schemes.models import Scheme\n"
        "from app.modules.auth.models import User\n"
        "with SessionLocal() as db:\n"
        "    scheme_count = db.query(Scheme).count()\n"
        "    admin_exists = db.query(User).filter(User.role == 'admin').first() is not None\n"
        "    print(f'{scheme_count}:{admin_exists}')\n"
    )
    proc = subprocess.run(
        ["uv", "run", "python", "-c", check_db_script],
        cwd=str(ROOT_DIR),
        capture_output=True,
        text=True,
    )
    if proc.returncode == 0 and proc.stdout.strip():
        parts = proc.stdout.strip().split(":")
        count = int(parts[0]) if len(parts) > 0 and parts[0].isdigit() else 0
        admin_ok = parts[1] == "True" if len(parts) > 1 else False

        if not admin_ok:
            print("Creating default admin account (admin@gov.in)...")
            run_cmd(["uv", "run", "python", "-m", "app.seeds.create_admin", "--email", "admin@gov.in", "--password", "AdminPass123!"])

        if count == 0:
            print_banner("Empty database detected: Seeding initial welfare schemes...", "🌱")
            run_cmd(["uv", "run", "python", "-m", "app.seeds.seed_schemes"])
        else:
            print(f"\033[1;32m✓ Database ready with {count} schemes loaded.\033[0m")


def main():
    ensure_docker_services()
    wait_for_db()
    run_migrations_and_seed()

    print_banner("4/4: Launching Full-Stack Development Servers...", "🚀")
    print("\n" + "=" * 60)
    print("  🏛️  SCHEME NAVIGATOR ALL-IN-ONE DEV ENVIRONMENT")
    print("=" * 60)
    print("  🌐 Frontend App:     \033[1;34mhttp://localhost:3000\033[0m")
    print("  ⚡ Backend API:      \033[1;32mhttp://localhost:8000\033[0m")
    print("  📖 Swagger Docs:     \033[1;33mhttp://localhost:8000/docs\033[0m")
    print("  🗄️ MinIO S3 Console: \033[1;35mhttp://localhost:9001\033[0m (minioadmin/minioadmin)")
    print("=" * 60)
    print("  Press \033[1;31mCtrl+C\033[0m anytime to stop all servers cleanly.\n")

    # Start Backend
    backend_proc = subprocess.Popen(
        ["uv", "run", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
        cwd=str(ROOT_DIR),
    )

    # Start Frontend
    frontend_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=str(FRONTEND_DIR),
    )

    def shutdown(signum, frame):
        print("\n\033[1;33mShutting down development servers...\033[0m")
        backend_proc.terminate()
        frontend_proc.terminate()
        try:
            backend_proc.wait(timeout=3)
            frontend_proc.wait(timeout=3)
        except Exception:
            backend_proc.kill()
            frontend_proc.kill()
        print("\033[1;32mAll dev processes stopped cleanly.\033[0m")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    try:
        while True:
            time.sleep(0.5)
            # If any process exited unexpectedly, stop
            if backend_proc.poll() is not None or frontend_proc.poll() is not None:
                shutdown(None, None)
    except KeyboardInterrupt:
        shutdown(None, None)


if __name__ == "__main__":
    main()
