from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.scheme import Scheme


class EligibilityRule(Base):
    __tablename__ = "eligibility_rules"

    id: Mapped[int] = mapped_column(primary_key=True)

    scheme_id: Mapped[int] = mapped_column(
        ForeignKey("schemes.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    field_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    operator: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    rule_value: Mapped[str] = mapped_column(
        String(255),
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
        back_populates="eligibility_rules"
    )