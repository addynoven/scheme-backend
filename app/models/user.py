from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.profile import Profile
    from app.models.user_document import UserDocument


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
    )

    phone: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    role: Mapped[str] = mapped_column(
        String(50),
        default="citizen",
        server_default="citizen",
        nullable=False,
        index=True,
    )

    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # 1-to-1 Relationship mapping to Profile with cascade delete
    profile: Mapped["Profile"] = relationship(
        "Profile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    # 1-to-Many Relationship mapping to User Documents in Vault
    documents: Mapped[list["UserDocument"]] = relationship(
        "UserDocument",
        back_populates="user",
        cascade="all, delete-orphan",
    )