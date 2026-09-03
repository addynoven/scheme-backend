from datetime import datetime
from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class EligibilityDecision(Base):
    __tablename__ = "eligibility_decisions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    scheme_id: Mapped[int | None] = mapped_column(
        ForeignKey("schemes.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    scheme_slug: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    profile_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    decision: Mapped[str] = mapped_column(String(50), nullable=False)  # 'eligible', 'nearly_eligible', 'ineligible'
    match_percentage: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    matched_rules_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    failed_rules_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
