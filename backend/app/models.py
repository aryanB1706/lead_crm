"""SQLAlchemy 2.0 models for LeadFlow."""
import datetime
import enum
from typing import Optional

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Identity, Index, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class LeadStatus(str, enum.Enum):
    NEW = "New"
    CONTACTED = "Contacted"
    QUALIFIED = "Qualified"
    PROPOSAL_SENT = "Proposal Sent"
    WON = "Won"
    LOST = "Lost"


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Identity(), primary_key=True)
    name: Mapped[str] = mapped_column(nullable=False)
    company: Mapped[Optional[str]] = mapped_column(nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(nullable=True)
    status: Mapped[LeadStatus] = mapped_column(
        Enum(
            LeadStatus,
            native_enum=False,
            length=20,
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
        default=LeadStatus.NEW,
        server_default="New",
    )
    follow_up_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    discussions: Mapped[list["Discussion"]] = relationship(
        back_populates="lead",
        cascade="all, delete-orphan",
        order_by="desc(Discussion.created_at)",
        passive_deletes=True,
    )

    __table_args__ = (
        Index("ix_leads_status", "status"),
        Index("ix_leads_follow_up_at", "follow_up_at"),
        Index("ix_leads_name_lower", func.lower(name)),
        CheckConstraint(
            "status IN ('New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost')",
            name="ck_leads_status",
        ),
    )


class Discussion(Base):
    __tablename__ = "discussions"

    id: Mapped[int] = mapped_column(Identity(), primary_key=True)
    lead_id: Mapped[int] = mapped_column(
        ForeignKey("leads.id", ondelete="CASCADE"), nullable=False
    )
    note: Mapped[str] = mapped_column(nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    lead: Mapped["Lead"] = relationship(back_populates="discussions")

    __table_args__ = (
        Index("ix_discussions_lead_created", "lead_id", created_at.desc()),
    )
