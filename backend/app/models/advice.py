from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum
import uuid


class AdviceType(str, Enum):
    """
    Allowed values for advice type.
    Mirrors the CHECK constraint on the public.advice table exactly.
    Using str, Enum means FastAPI serializes these as plain strings in JSON.
    """
    advice      = "advice"
    mistake     = "mistake"
    remember    = "remember"
    preparation = "preparation"


class AdviceCreate(BaseModel):
    """
    Request body for creating a new advice record.
    experience_id, type, and content are all required.
    """
    experience_id: uuid.UUID
    type:          AdviceType
    content:       str = Field(..., min_length=1, description="Advice content — must not be empty")


class AdviceUpdate(BaseModel):
    """
    Request body for partially updating an advice record.
    Every field is optional — only fields actually provided are written to the database.
    """
    experience_id: Optional[uuid.UUID]    = None
    type:          Optional[AdviceType]   = None
    content:       Optional[str]          = Field(None, min_length=1)


class AdviceResponse(BaseModel):
    """
    Shape of an advice record returned by the API.
    All columns from the database are included.
    """
    id:            uuid.UUID
    experience_id: uuid.UUID
    type:          str
    content:       str
    created_at:    datetime
