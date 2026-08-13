from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.ingestion_source import IngestionSource


class IngestionTriageItem(Base):
    __tablename__ = "ingestion_triage_items"

    id: Mapped[int] = mapped_column(primary_key=True)

    source_id: Mapped[int] = mapped_column(
        ForeignKey("ingestion_sources.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    scheme_slug: Mapped[str] = mapped_column(
        String(255),
        index=True,
        nullable=False,
    )

    scheme_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    change_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    impact_level: Mapped[str] = mapped_column(
        String(50),
        default="breaking",
        server_default="breaking",
        nullable=False,
    )

    diff_summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    diff_payload: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="pending_review",
        server_default="pending_review",
        nullable=False,
        index=True,
    )

    reviewed_by: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
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
    source: Mapped["IngestionSource"] = relationship(
        "IngestionSource",
        back_populates="triage_items",
    )
