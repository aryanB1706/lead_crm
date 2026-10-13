"""Pydantic v2 schemas for LeadFlow."""
import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class LeadCreate(BaseModel):
    name: str = Field(min_length=1)
    company: Optional[str] = None
    phone: Optional[str] = None


class LeadStatusUpdate(BaseModel):
    status: str


class DiscussionCreate(BaseModel):
    note: str = Field(min_length=1)
    follow_up_at: Optional[datetime.datetime] = None


class DiscussionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_id: int
    note: str
    created_at: datetime.datetime


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
    # enriched fields for list view
    last_note: Optional[str] = None
    last_discussion_at: Optional[datetime.datetime] = None
