from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
import uuid


class ResourceCreate(BaseModel):
    """
    Request body for creating a new resource.
    title is required and must not be empty or whitespace-only.
    All other fields are optional.
    """
    title:         str            = Field(..., min_length=1, description="Resource title — must not be empty")
    description:   Optional[str] = None
    category:      Optional[str] = None
    resource_type: Optional[str] = None
    url:           Optional[str] = None
    file_path:     Optional[str] = None
    uploaded_by:   Optional[uuid.UUID] = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_whitespace(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("title must contain at least one non-whitespace character")
        return v


class ResourceUpdate(BaseModel):
    """
    Request body for partially updating a resource.
    Every field is optional — only fields actually provided are written to the database.
    title, if provided, must not be empty or whitespace-only.
    """
    title:         Optional[str]       = Field(None, min_length=1)
    description:   Optional[str]       = None
    category:      Optional[str]       = None
    resource_type: Optional[str]       = None
    url:           Optional[str]       = None
    file_path:     Optional[str]       = None
    uploaded_by:   Optional[uuid.UUID] = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_whitespace(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("title must contain at least one non-whitespace character")
        return v


class ResourceResponse(BaseModel):
    """
    Shape of a resource returned by the API.
    All columns from the database are included.
    """
    id:            uuid.UUID
    title:         str
    description:   Optional[str]       = None
    category:      Optional[str]       = None
    resource_type: Optional[str]       = None
    url:           Optional[str]       = None
    file_path:     Optional[str]       = None
    uploaded_by:   Optional[uuid.UUID] = None
    created_at:    datetime
