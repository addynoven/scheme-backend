from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.modules.vault.models import UserDocument


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    citizen_uid: Mapped[str | None] = mapped_column(String(50), unique=True, index=True, nullable=True)
    household_uid: Mapped[str | None] = mapped_column(String(50), index=True, nullable=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="citizen", server_default="citizen", nullable=False, index=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)

    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=False)

    profile: Mapped["Profile"] = relationship(
        "Profile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    documents: Mapped[list["UserDocument"]] = relationship(
        "UserDocument",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    facts: Mapped[list["CitizenFact"]] = relationship(
        "CitizenFact",
        foreign_keys="CitizenFact.user_id",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String, nullable=False)
    state: Mapped[str] = mapped_column(String, nullable=False)
    district: Mapped[str] = mapped_column(String, nullable=False)
    annual_income: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    occupation: Mapped[str] = mapped_column(String, nullable=False)
    caste_category: Mapped[str | None] = mapped_column(String, nullable=True)
    is_differently_abled: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    marital_status: Mapped[str | None] = mapped_column(String, nullable=True)
    residence_area: Mapped[str | None] = mapped_column(String, nullable=True)
    has_land: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="profile")


class CitizenFact(Base):
    __tablename__ = "citizen_facts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    fact_key: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    fact_value: Mapped[str] = mapped_column(String(500), nullable=False)
    source_document_id: Mapped[int | None] = mapped_column(
        ForeignKey("user_documents.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    verified_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    verified_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="facts",
    )
    source_document: Mapped["UserDocument | None"] = relationship(
        "UserDocument",
        foreign_keys=[source_document_id],
    )
