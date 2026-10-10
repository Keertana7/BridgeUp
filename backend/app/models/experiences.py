from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime, date
from enum import Enum
import uuid


class SourceType(str, Enum):
    """Allowed values for how the experience was submitted."""
    form = "form"
    pdf = "pdf"


class ExperienceCreate(BaseModel):
    """
    Request body for creating a new experience.
    company_id and source_type are required.
    All other fields are optional — the database default or NULL is used when not provided.
    """
    company_id: uuid.UUID
    source_type: SourceType
    submitted_by: Optional[uuid.UUID] = None
    role: Optional[str] = Field(None, max_length=255)
    batch: Optional[str] = Field(None, max_length=100)
    package: Optional[str] = Field(None, max_length=100)
    opportunity_type: Optional[str] = Field(None, max_length=100)
    selection_status: Optional[str] = Field(None, max_length=100)
    interview_date: Optional[date] = None
    difficulty: Optional[str] = Field(None, max_length=100)
    preparation_duration: Optional[str] = Field(None, max_length=100)
    content: Optional[dict] = Field(default_factory=dict)
    source_file: Optional[str] = Field(None, max_length=500)
    consent: Optional[bool] = False


class ExperienceUpdate(BaseModel):
    """
    Request body for partially updating an experience.
    Every field is optional — only provided fields are written to the database.
    """
    company_id: Optional[uuid.UUID] = None
    source_type: Optional[SourceType] = None
    submitted_by: Optional[uuid.UUID] = None
    role: Optional[str] = Field(None, max_length=255)
    batch: Optional[str] = Field(None, max_length=100)
    package: Optional[str] = Field(None, max_length=100)
    opportunity_type: Optional[str] = Field(None, max_length=100)
    selection_status: Optional[str] = Field(None, max_length=100)
    interview_date: Optional[date] = None
    difficulty: Optional[str] = Field(None, max_length=100)
    preparation_duration: Optional[str] = Field(None, max_length=100)
    content: Optional[dict] = None
    source_file: Optional[str] = Field(None, max_length=500)
    consent: Optional[bool] = None


class ExperienceResponse(BaseModel):
    """
    Shape of an experience returned by the API.
    All columns from the database are included.
    """
    id: uuid.UUID
    company_id: Optional[uuid.UUID] = None
    submitted_by: Optional[uuid.UUID] = None
    source_type: Optional[str] = None
    role: Optional[str] = None
    batch: Optional[str] = None
    package: Optional[str] = None
    opportunity_type: Optional[str] = None
    selection_status: Optional[str] = None
    interview_date: Optional[date] = None
    difficulty: Optional[str] = None
    preparation_duration: Optional[str] = None
    content: Optional[Any] = None
    source_file: Optional[str] = None
    consent: Optional[bool] = None
    created_at: datetime