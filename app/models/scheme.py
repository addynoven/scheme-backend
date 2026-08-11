from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.benefit import Benefit
    from app.models.eligibility_rule import EligibilityRule
    from app.models.official_source import OfficialSource
    from app.models.required_document import RequiredDocument


class Scheme(Base):
    __tablename__ = "schemes"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    name: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
    )

    slug: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
    )

    category: Mapped[str] = mapped_column(
        String(100),
        default="General",
        server_default="General",
        nullable=False,
        index=True,
    )

    tags: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    ministry: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    application_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    official_website: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    launch_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    benefits: Mapped[list["Benefit"]] = relationship(
        "Benefit",
        back_populates="scheme",
        cascade="all, delete-orphan",
    )
    eligibility_rules: Mapped[list["EligibilityRule"]] = relationship(
        "EligibilityRule",
        back_populates="scheme",
        cascade="all, delete-orphan",
    )
    required_documents: Mapped[list["RequiredDocument"]] = relationship(
        "RequiredDocument",
        back_populates="scheme",
        cascade="all, delete-orphan",
    )
    official_sources: Mapped[list["OfficialSource"]] = relationship(
        "OfficialSource",
        back_populates="scheme",
        cascade="all, delete-orphan",
    )
