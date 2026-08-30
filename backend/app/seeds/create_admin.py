import argparse
from sqlalchemy import select

from app.core.security import hash_password
from app.database import SessionLocal
from app.modules.auth.models import User


def create_or_promote_admin(email: str, phone: str, password: str | None = None) -> User:
    db = SessionLocal()
    try:
        user = db.scalar(select(User).where(User.email == email))
        if user:
            user.role = "admin"
            if password:
                user.hashed_password = hash_password(password)
            db.commit()
            db.refresh(user)
            print(f"✅ User '{email}' was successfully promoted to ADMIN.")
            return user

        if not password:
            password = "AdminDefault123!"

        admin_user = User(
            email=email,
            phone=phone,
            hashed_password=hash_password(password),
            role="admin",
            is_verified=True,
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print(f"✅ New ADMIN user created: {email} (ID: {admin_user.id})")
        return admin_user
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Create or promote an Admin user")
    parser.add_argument("--email", required=True, help="Admin email address")
    parser.add_argument("--phone", default="+919999999999", help="Admin phone number")
    parser.add_argument("--password", default="AdminPass123!", help="Admin password")

    args = parser.parse_args()
    create_or_promote_admin(email=args.email, phone=args.phone, password=args.password)


if __name__ == "__main__":
    main()
