from app.database import SessionLocal
from app.seeds.seed_national_schemes import seed_national_schemes


def main():
    db = SessionLocal()
    try:
        count = seed_national_schemes(db)
        print(f"National Schemes Seeder completed: {count} schemes added/updated.")
    finally:
        db.close()


if __name__ == "__main__":
    main()