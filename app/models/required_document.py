from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.scheme import Scheme


class RequiredDocument(Base):
    __tablename__ = "required_documents"

    id: Mapped[int] = mapped_column(primary_key=True)

    scheme_id: Mapped[int] = mapped_column(
        ForeignKey("schemes.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    document_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    is_mandatory: Mapped[bool] = mapped_column(
        default=True,
        server_default="true",
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
        back_populates="required_documents"
    )