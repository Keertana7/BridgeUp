from app.database import supabase
from app.models.experiences import ExperienceCreate, ExperienceUpdate, ExperienceResponse
from typing import List, Optional
import uuid
from fastapi import APIRouter, HTTPException, Depends
from app.auth import get_current_user
from services.database import supabase as service_supabase
import logging
logger = logging.getLogger(__name__)
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
def update_experience(
    experience_id: uuid.UUID,
    experience: ExperienceUpdate,
    user: dict = Depends(get_current_user)
):
    """
    Updates experience metadata only if the authenticated user owns it.
    """

    # 1. Get authenticated user's ID
    raw_user_id = user.get("sub")

    try:
        if not isinstance(raw_user_id, str):
            raise ValueError("Missing user ID")

        user_id = str(uuid.UUID(raw_user_id))

    except ValueError as exc:
        raise HTTPException(
            status_code=401,
            detail="Invalid authenticated user ID."
        ) from exc


    # 3. Prepare update data
    update_data = experience.model_dump(exclude_none=True)

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No fields provided to update."
        )

    try:
        # 4. Fetch existing experience
        existing = (
            service_supabase.table("experiences")
            .select("id, submitted_by")
            .eq("id", str(experience_id))
            .limit(1)
            .execute()
        )

        # 5. Verify ownership
        if (
            not existing.data
            or existing.data[0].get("submitted_by") != user_id
        ):
            raise HTTPException(
                status_code=404,
                detail="Experience not found."
            )

        # 6. Validate company if supplied
        if "company_id" in update_data:
            company = (
                service_supabase.table("companies")
                .select("id")
                .eq("id", str(update_data["company_id"]))
                .limit(1)
                .execute()
            )

            if not company.data:
                raise HTTPException(
                    status_code=404,
                    detail="Company not found."
                )

            update_data["company_id"] = str(update_data["company_id"])

        # 8. Update only the authenticated owner's experience
        response = (
            service_supabase.table("experiences")
            .update(update_data)
            .eq("id", str(experience_id))
            .eq("submitted_by", user_id)
            .select("*")
            .execute()
        )

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception("Experience update failed")
        raise HTTPException(
            status_code=500,
            detail="Experience update failed."
        ) from exc

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Experience not found."
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
