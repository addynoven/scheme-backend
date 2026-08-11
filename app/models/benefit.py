from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.scheme import Scheme


class Benefit(Base):
    __tablename__ = "benefits"

    id: Mapped[int] = mapped_column(primary_key=True)

    scheme_id: Mapped[int] = mapped_column(
        ForeignKey("schemes.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
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

    scheme: Mapped["Scheme"] = relationship(
        "Scheme",
        back_populates="benefits"
    )