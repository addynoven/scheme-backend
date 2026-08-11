
from typing import TYPE_CHECKING

from sqlalchemy.orm import Mapped, relationship

from app.database import Base

from datetime import datetime
from sqlalchemy import ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

if TYPE_CHECKING:
    from app.models.scheme import Scheme

class EligibilityRule(Base):
    __tablename__ = "eligibility_rules"

    id: Mapped[int] = mapped_column(primary_key=True)

    scheme_id: Mapped[int] = mapped_column(
        ForeignKey("schemes.id"),
        index=True
    )

    field_name: Mapped[str] = mapped_column(
        String(100)
    )

    operator: Mapped[str] = mapped_column(
        String(20)
    )

    rule_value: Mapped[str] = mapped_column(
        String(255)
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
        back_populates="eligibility_rules"
    )