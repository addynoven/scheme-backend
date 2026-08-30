from datetime import date, datetime
from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship as sa_relationship

from app.database import Base


class HouseholdMember(Base):
    __tablename__ = "household_members"

    id: Mapped[int] = mapped_column(primary_key=True)
    primary_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Three-Tier Sovereign & Relational Identifiers
    citizen_uid: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    member_uid: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    household_uid: Mapped[str] = mapped_column(String(50), index=True, nullable=False)

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    relationship: Mapped[str] = mapped_column(String(50), nullable=False)  # 'daughter', 'son', 'spouse', 'mother', 'father'
    
    # Life Stage State Machine: 'MINOR' (<18), 'ADULT' (18-59), 'SENIOR' (>=60)
    life_stage: Mapped[str] = mapped_column(String(20), default="ADULT", server_default="ADULT", nullable=False, index=True)
    
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)  # 'female', 'male', 'other'
    
    occupation: Mapped[str | None] = mapped_column(String(100), default="unemployed")
    caste_category: Mapped[str | None] = mapped_column(String(50), default="General")
    annual_income: Mapped[float | None] = mapped_column(Float, default=0.0)
    
    is_student: Mapped[bool] = mapped_column(Boolean, default=False)
    is_disabled: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Verification State: 'UNVERIFIED', 'PENDING_DOCS', 'DOCUMENT_VERIFIED'
    verification_status: Mapped[str] = mapped_column(
        String(50),
        default="UNVERIFIED",
        server_default="UNVERIFIED",
        nullable=False,
        index=True,
    )
    aadhaar_last_four: Mapped[str | None] = mapped_column(String(4), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    primary_user: Mapped["User"] = sa_relationship("User")
    documents: Mapped[list["UserDocument"]] = sa_relationship(
        "UserDocument",
        back_populates="household_member",
        cascade="all, delete-orphan",
    )
