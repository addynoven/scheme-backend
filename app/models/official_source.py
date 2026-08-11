
from typing import TYPE_CHECKING

from sqlalchemy.orm import Mapped, relationship

from app.database import Base

from datetime import datetime
from sqlalchemy import ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

if TYPE_CHECKING:
    from app.models.scheme import Scheme

class OfficialSource(Base):
    __tablename__ = "official_sources"

    id: Mapped[int] = mapped_column(primary_key=True)

    scheme_id: Mapped[int] = mapped_column(
        ForeignKey("schemes.id"),
        index=True
    )

    title: Mapped[str] = mapped_column(
        String(255)
    )

    url: Mapped[str] = mapped_column(
        String(500)
    )

    source_type: Mapped[str] = mapped_column(
        String(50)
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
        back_populates="official_sources"
    )