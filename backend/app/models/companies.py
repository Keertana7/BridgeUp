from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class CompanyCreate(BaseModel):
    """Request body for creating a new company."""
    name: str = Field(..., min_length=1, max_length=255, description="Company name (must be unique)")


class CompanyUpdate(BaseModel):
    """Request body for updating a company. All fields are optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="New company name")


class CompanyResponse(BaseModel):
    """Shape of a company returned by the API."""
    id: uuid.UUID
    name: str
    created_at: datetime
