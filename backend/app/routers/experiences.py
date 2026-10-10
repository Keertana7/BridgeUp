from fastapi import APIRouter, HTTPException
from app.database import supabase
from app.models.experiences import ExperienceCreate, ExperienceUpdate, ExperienceResponse
from typing import List, Optional
import uuid

router = APIRouter(
    prefix="/experiences",
    tags=["Experiences"]
)


def check_company_exists(company_id: uuid.UUID):
    """
    Helper: verify the company exists in the companies table.
    Raises 404 if not found.
    """
    try:
        response = supabase.table("companies").select("id").eq("id", str(company_id)).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail=f"Company with id '{company_id}' not found."
        )


@router.get("/", response_model=List[ExperienceResponse])
def get_experiences(company_id: Optional[uuid.UUID] = None):
    """
    Returns all experiences.

    Optional filters:
    - **company_id**: filter by company UUID
    """
    try:
        query = supabase.table("experiences").select("*")
        if company_id is not None:
            query = query.eq("company_id", str(company_id))
        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/{experience_id}",
    response_model=ExperienceResponse,
    responses={404: {"description": "Experience not found"}, 422: {"description": "Invalid UUID"}},
)
def get_experience(experience_id: uuid.UUID):
    """Returns a single experience by UUID. Raises 404 if not found."""
    try:
        response = supabase.table("experiences").select("*").eq("id", str(experience_id)).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail=f"Experience with id '{experience_id}' not found."
        )
    return response.data[0]


@router.post(
    "/",
    response_model=ExperienceResponse,
    status_code=201,
    responses={404: {"description": "Referenced company not found"}, 422: {"description": "Invalid UUID or source_type"}},
)
def create_experience(experience: ExperienceCreate):
    """Creates a new experience. Raises 404 if the referenced company does not exist."""
    check_company_exists(experience.company_id)

    data = experience.model_dump(exclude_none=True)

    if "company_id" in data:
        data["company_id"] = str(data["company_id"])
    if "submitted_by" in data:
        data["submitted_by"] = str(data["submitted_by"])
    if "source_type" in data:
        data["source_type"] = str(data["source_type"])
    if "interview_date" in data and data["interview_date"] is not None:
        data["interview_date"] = data["interview_date"].isoformat()

    try:
        response = supabase.table("experiences").insert(data).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not response.data:
        raise HTTPException(status_code=500, detail="Experience creation failed. No data returned.")

    return response.data[0]


@router.patch(
    "/{experience_id}",
    response_model=ExperienceResponse,
    responses={
        400: {"description": "No fields provided to update"},
        404: {"description": "Experience not found or referenced company not found"},
        422: {"description": "Invalid UUID or source_type"},
    },
)
def update_experience(experience_id: uuid.UUID, experience: ExperienceUpdate):
    """
    Partially updates an experience. Only supplied fields are written.
    Raises 400 for empty body, 404 if not found or new company_id doesn't exist.
    """
    update_data = experience.model_dump(exclude_none=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided to update.")

    if "company_id" in update_data:
        check_company_exists(experience.company_id)
        update_data["company_id"] = str(update_data["company_id"])
    if "submitted_by" in update_data:
        update_data["submitted_by"] = str(update_data["submitted_by"])
    if "source_type" in update_data:
        update_data["source_type"] = str(update_data["source_type"])
    if "interview_date" in update_data and update_data["interview_date"] is not None:
        update_data["interview_date"] = update_data["interview_date"].isoformat()

    try:
        response = supabase.table("experiences").update(update_data).eq("id", str(experience_id)).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail=f"Experience with id '{experience_id}' not found."
        )
    return response.data[0]


@router.delete(
    "/{experience_id}",
    status_code=200,
    responses={404: {"description": "Experience not found"}, 422: {"description": "Invalid UUID"}},
)
def delete_experience(experience_id: uuid.UUID):
    """Deletes an experience by UUID. Raises 404 if not found."""
    try:
        response = supabase.table("experiences").delete().eq("id", str(experience_id)).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail=f"Experience with id '{experience_id}' not found."
        )
    return {"message": f"Experience '{response.data[0]['id']}' deleted successfully."}
