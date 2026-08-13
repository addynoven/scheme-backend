from sqlalchemy import select, func

from app.database import SessionLocal
from app.modules.auth.models import User
from app.modules.ingestion.service import run_ingestion_pipeline
from app.modules.schemes.models import Scheme
from app.seeds.create_admin import create_or_promote_admin
from app.seeds.seed_national_schemes import seed_national_schemes


def main():
    db = SessionLocal()
    try:
        # 1. Seed default Administrator
        admin = db.scalar(select(User).where(User.role == "admin"))
        if not admin:
            create_or_promote_admin(email="admin@gov.in", phone="+919999999999", password="AdminPass123!")

        # 2. Seed Hand-Curated Flagship National & State Schemes
        count = seed_national_schemes(db)
        print(f"✅ Flagship National & State Schemes verified: {count} schemes.")

        # 3. Check Total Scheme Catalog Scale
        total_schemes = db.scalar(select(func.count(Scheme.id))) or 0
        if total_schemes < 1000:
            print(f"🚀 Detected fresh catalog ({total_schemes} schemes). Running mass automated government ingestion...")
            results = run_ingestion_pipeline(db, source_key="bulk_gov_welfare_catalog")
            for r in results:
                print(f"  • [{r.source_key}] Status={r.status} | Created={r.schemes_created} | Total={db.scalar(select(func.count(Scheme.id))):,}")
        else:
            print(f"✅ Complete Government Scheme Catalog is active: {total_schemes:,} schemes indexed.")
    finally:
        db.close()


if __name__ == "__main__":
    main()