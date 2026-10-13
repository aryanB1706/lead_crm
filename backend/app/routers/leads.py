"""Lead + Discussion endpoints for LeadFlow."""
import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Discussion, Lead, LeadStatus
from app.schemas import (
    ALLOWED_STATUSES,
    DiscussionCreate,
    DiscussionRead,
    LeadCreate,
    LeadPatch,
    LeadRead,
)

router = APIRouter(prefix="/api/leads", tags=["leads"])


def _escape_ilike(s: str) -> str:
    # Escape \, % and _ so user input can't act as wildcards.
    # Bound as a parameter via SQLAlchemy (no string-concatenated SQL).
    return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _status_str(v) -> str:
    return v.value if isinstance(v, LeadStatus) else str(v)


def _lead_to_read(lead: Lead, last_note=None, last_discussion_at=None) -> LeadRead:
    return LeadRead(
        id=lead.id,
        name=lead.name,
        company=lead.company,
        phone=lead.phone,
        status=_status_str(lead.status),
        follow_up_at=lead.follow_up_at,
        created_at=lead.created_at,
        updated_at=lead.updated_at,
        last_note=last_note,
        last_discussion_at=last_discussion_at,
    )


def _latest_subquery():
    # DISTINCT ON (lead_id) ordered by created_at DESC -> one row per lead.
    # Single query, no N+1.
    return (
        select(
            Discussion.lead_id.label("lead_id"),
            Discussion.note.label("last_note"),
            Discussion.created_at.label("last_discussion_at"),
        )
        .distinct(Discussion.lead_id)
        .order_by(
            Discussion.lead_id,
            Discussion.created_at.desc(),
            Discussion.id.desc(),
        )
        .subquery()
    )


def build_list_stmt(status_filter: Optional[str], search: Optional[str]):
    latest = _latest_subquery()
    stmt = select(Lead, latest.c.last_note, latest.c.last_discussion_at).outerjoin(
        latest, latest.c.lead_id == Lead.id
    )
    if status_filter is not None:
        if status_filter not in ALLOWED_STATUSES:
            raise HTTPException(status_code=422, detail=f"invalid status: {status_filter}")
        stmt = stmt.where(Lead.status == status_filter)
    if search is not None and search.strip() != "":
        escaped = _escape_ilike(search.strip())
        pattern = f"%{escaped}%"
        stmt = stmt.where(Lead.name.ilike(pattern, escape="\\"))
    # Most recently active first: latest discussion else lead creation.
    stmt = stmt.order_by(
        func.coalesce(latest.c.last_discussion_at, Lead.created_at).desc(),
        Lead.id.desc(),
    )
    return stmt


@router.get("", response_model=list[LeadRead])
def list_leads(
    status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    stmt = build_list_stmt(status, search)
    rows = db.execute(stmt).all()
    return [_lead_to_read(lead, last_note, last_at) for lead, last_note, last_at in rows]


@router.post("", response_model=LeadRead, status_code=status.HTTP_201_CREATED)
def create_lead(payload: LeadCreate, db: Session = Depends(get_db)):
    lead = Lead(
        name=payload.name,  # already trimmed + validated
        company=payload.company,
        phone=payload.phone,
        status=LeadStatus.NEW,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return _lead_to_read(lead, None, None)


def _get_lead_or_404(lead_id: int, db: Session) -> Lead:
    lead = db.get(Lead, lead_id)
    if lead is None:
        raise HTTPException(status_code=404, detail="lead not found")
    return lead


def _latest_for_lead(db: Session, lead_id: int):
    row = (
        db.execute(
            select(Discussion.note, Discussion.created_at)
            .where(Discussion.lead_id == lead_id)
            .order_by(Discussion.created_at.desc(), Discussion.id.desc())
            .limit(1)
        )
        .first()
    )
    if row is None:
        return None, None
    return row[0], row[1]


@router.get("/{lead_id}", response_model=LeadRead)
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = _get_lead_or_404(lead_id, db)
    last_note, last_at = _latest_for_lead(db, lead_id)
    return _lead_to_read(lead, last_note, last_at)


@router.patch("/{lead_id}", response_model=LeadRead)
def patch_lead(lead_id: int, payload: LeadPatch, db: Session = Depends(get_db)):
    lead = _get_lead_or_404(lead_id, db)
    provided = payload.model_fields_set

    if "name" in provided and payload.name is not None:
        lead.name = payload.name
    if "company" in provided:
        lead.company = payload.company
    if "phone" in provided:
        lead.phone = payload.phone
    if "status" in provided and payload.status is not None:
        # validated by schema, map string -> enum
        lead.status = LeadStatus(payload.status)
    if "follow_up_at" in provided:
        # explicit null clears the follow-up
        lead.follow_up_at = payload.follow_up_at

    lead.updated_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()
    db.refresh(lead)
    last_note, last_at = _latest_for_lead(db, lead_id)
    return _lead_to_read(lead, last_note, last_at)


@router.get("/{lead_id}/discussions", response_model=list[DiscussionRead])
def list_discussions(lead_id: int, db: Session = Depends(get_db)):
    _get_lead_or_404(lead_id, db)
    rows = (
        db.execute(
            select(Discussion)
            .where(Discussion.lead_id == lead_id)
            .order_by(Discussion.created_at.desc(), Discussion.id.desc())
        )
        .scalars()
        .all()
    )
    # Build via schema (never return ORM directly).
    return [
        DiscussionRead(id=d.id, lead_id=d.lead_id, note=d.note, created_at=d.created_at)
        for d in rows
    ]


@router.post(
    "/{lead_id}/discussions",
    response_model=DiscussionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_discussion(lead_id: int, payload: DiscussionCreate, db: Session = Depends(get_db)):
    lead = _get_lead_or_404(lead_id, db)
    disc = Discussion(lead_id=lead_id, note=payload.note)  # trimmed + validated
    db.add(disc)
    # Same transaction: optionally bump the lead's follow-up.
    if "follow_up_at" in payload.model_fields_set and payload.follow_up_at is not None:
        lead.follow_up_at = payload.follow_up_at
        lead.updated_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()
    db.refresh(disc)
    return DiscussionRead(
        id=disc.id, lead_id=disc.lead_id, note=disc.note, created_at=disc.created_at
    )
