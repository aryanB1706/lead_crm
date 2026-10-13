"""Pydantic v2 schemas for LeadFlow."""
import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator

ALLOWED_STATUSES = ["New", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost"]


def to_utc_z(dt: Optional[datetime.datetime]) -> Optional[str]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=datetime.timezone.utc)
    else:
        dt = dt.astimezone(datetime.timezone.utc)
    return dt.isoformat().replace("+00:00", "Z")


def ensure_utc(v: Optional[datetime.datetime]) -> Optional[datetime.datetime]:
    if v is None:
        return None
    if v.tzinfo is None:
        return v.replace(tzinfo=datetime.timezone.utc)
    return v.astimezone(datetime.timezone.utc)


class LeadCreate(BaseModel):
    name: str = Field(min_length=1)
    company: Optional[str] = None
    phone: Optional[str] = None

    @field_validator("name")
    @classmethod
    def trim_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name must be non-empty")
        return v

    @field_validator("company", "phone")
    @classmethod
    def empty_to_none(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        return v or None


class LeadPatch(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    follow_up_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(validate_by_name=True)

    @field_validator("name")
    @classmethod
    def trim_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        if not v:
            raise ValueError("name must be non-empty")
        return v

    @field_validator("status")
    @classmethod
    def check_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if v not in ALLOWED_STATUSES:
            raise ValueError(f"invalid status: {v}")
        return v

    @field_validator("follow_up_at")
    @classmethod
    def utc_follow_up(cls, v: Optional[datetime.datetime]) -> Optional[datetime.datetime]:
        return ensure_utc(v)


class DiscussionCreate(BaseModel):
    note: str = Field(min_length=1)
    follow_up_at: Optional[datetime.datetime] = None

    @field_validator("note")
    @classmethod
    def trim_note(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("note must be non-empty")
        return v

    @field_validator("follow_up_at")
    @classmethod
    def utc_follow_up(cls, v: Optional[datetime.datetime]) -> Optional[datetime.datetime]:
        return ensure_utc(v)


class DiscussionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_id: int
    note: str
    created_at: datetime.datetime

    @field_serializer("created_at")
    def ser_created(self, v: datetime.datetime) -> str:
        return to_utc_z(v)


class LeadRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    company: Optional[str] = None
    phone: Optional[str] = None
    status: str
    follow_up_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    last_note: Optional[str] = None
    last_discussion_at: Optional[datetime.datetime] = None

    @field_serializer("follow_up_at", "created_at", "updated_at", "last_discussion_at")
    def ser_dt(self, v: Optional[datetime.datetime]) -> Optional[str]:
        return to_utc_z(v)
