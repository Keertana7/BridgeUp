from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum
import uuid


class Category(str, Enum):
    """
    Allowed values for question category.
    Mirrors the CHECK constraint on the public.questions table exactly.
    Using str, Enum means FastAPI serializes these as plain strings in JSON.
    """
    dsa         = "DSA"
    core        = "Core"
    aptitude    = "Aptitude"
    programming = "Programming"
    project     = "Project"
    hr          = "HR"
    ai_ml       = "AI/ML"   # member name uses _ because / is not valid in Python identifiers
    other       = "Other"


class QuestionCreate(BaseModel):
    """
    Request body for creating a new question.
    experience_id, question, and category are required.
    subcategory, source_section, and difficulty are optional.
    """
    experience_id:  uuid.UUID
    question:       str       = Field(..., min_length=1, description="The question text")
    category:       Category
    subcategory:    Optional[str] = Field(None, max_length=255)
    source_section: Optional[str] = Field(None, max_length=255)
    difficulty:     Optional[str] = Field(None, max_length=100)


class QuestionUpdate(BaseModel):
    """
    Request body for partially updating a question.
    Every field is optional — only fields actually provided are written.
    """
    experience_id:  Optional[uuid.UUID] = None
    question:       Optional[str]       = Field(None, min_length=1)
    category:       Optional[Category]  = None
    subcategory:    Optional[str]       = Field(None, max_length=255)
    source_section: Optional[str]       = Field(None, max_length=255)
    difficulty:     Optional[str]       = Field(None, max_length=100)


class QuestionResponse(BaseModel):
    """
    Shape of a question returned by the API.
    All columns from the database are included.
    """
    id:             uuid.UUID
    experience_id:  uuid.UUID
    question:       str
    category:       str
    subcategory:    Optional[str] = None
    source_section: Optional[str] = None
    difficulty:     Optional[str] = None
    created_at:     datetime
