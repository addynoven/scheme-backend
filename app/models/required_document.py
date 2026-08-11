from typing import TYPE_CHECKING

from sqlalchemy.orm import Mapped, relationship

from app.database import Base

from datetime import datetime
from sqlalchemy import ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

if TYPE_CHECKING:
    from app.models.scheme import Scheme

class RequiredDocument(Base):
    __tablename__ = "required_documents"

    id: Mapped[int] = mapped_column(primary_key=True)

    scheme_id: Mapped[int] = mapped_column(
        ForeignKey("schemes.id"),
        index=True
    )

    document_name: Mapped[str] = mapped_column(
        String(255)
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    is_mandatory: Mapped[bool] = mapped_column(
        default=True
    )

    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now()
    )

    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        onupdate=func.now()
    )

    # 1-to-many Relationship mapping to Scheme
    scheme: Mapped["Scheme"] = relationship(
        "Scheme",
        back_populates="required_documents"
    )