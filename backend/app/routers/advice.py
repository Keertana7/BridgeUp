from fastapi import APIRouter, HTTPException
from app.database import supabase
from app.models.advice import AdviceCreate, AdviceUpdate, AdviceResponse, AdviceType
from typing import List, Optional
import uuid

router = APIRouter(
    prefix="/advice",
    tags=["Advice"]
)


def check_experience_exists(experience_id: uuid.UUID):
    """
    Helper: verify the experience exists in the experiences table.
    Raises 404 if not found.
    """
    try:
        response = supabase.table("experiences").select("id").eq("id", str(experience_id)).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail=f"Experience with id '{experience_id}' not found."
        )


@router.get("/", response_model=List[AdviceResponse])
def get_advice_list(
    experience_id: Optional[uuid.UUID] = None,
    type: Optional[AdviceType] = None,
):
    """
    Returns all advice records.

    Optional filters:
    - **experience_id**: filter by experience UUID
    - **type**: filter by type — one of advice, mistake, remember, preparation
    """
    try:
        query = supabase.table("advice").select("*")
        if experience_id is not None:
            query = query.eq("experience_id", str(experience_id))
        if type is not None:
            query = query.eq("type", type.value)
        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{advice_id}", response_model=AdviceResponse)
def get_advice(advice_id: uuid.UUID):
    """
    Returns a single advice record by its UUID.
    Raises 404 if the record does not exist.
    """
    try:
        response = supabase.table("advice").select("*").eq("id", str(advice_id)).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail=f"Advice record with id '{advice_id}' not found."
        )

    return response.data[0]


@router.post("/", response_model=AdviceResponse, status_code=201)
def create_advice(advice: AdviceCreate):
    """
    Creates a new advice record.
    Raises 404 if the referenced experience does not exist.
    """
    # Verify the experience exists before inserting
    check_experience_exists(advice.experience_id)

    # mode="json" serializes enums to their string values ("advice" not "AdviceType.advice")
    # and UUIDs to plain strings — safe to pass directly to Supabase
    data = advice.model_dump(mode="json", exclude_none=True)

    try:
        response = supabase.table("advice").insert(data).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not response.data:
        raise HTTPException(status_code=500, detail="Advice creation failed. No data returned.")

    return response.data[0]


@router.patch("/{advice_id}", response_model=AdviceResponse)
def update_advice(advice_id: uuid.UUID, advice: AdviceUpdate):
    """
    Partially updates an advice record by its UUID.
    Only fields actually provided in the request body are updated.
    Raises 400 if no fields are provided.
    Raises 404 if the advice record does not exist.
    Raises 404 if the new experience_id does not exist.
    """
    # mode="json" ensures enums and UUIDs are already plain strings in update_data
    update_data = advice.model_dump(mode="json", exclude_none=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided to update.")

    # If experience_id is being changed, verify the new experience exists
    if "experience_id" in update_data:
        check_experience_exists(advice.experience_id)

    try:
        response = supabase.table("advice").update(update_data).eq("id", str(advice_id)).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail=f"Advice record with id '{advice_id}' not found."
        )

    return response.data[0]


@router.delete("/{advice_id}", status_code=200)
def delete_advice(advice_id: uuid.UUID):
    """
    Deletes an advice record by its UUID.
    Raises 404 if the record does not exist.
    """
    try:
        response = supabase.table("advice").delete().eq("id", str(advice_id)).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail=f"Advice record with id '{advice_id}' not found."
        )

    return {"message": f"Advice record '{response.data[0]['id']}' deleted successfully."}
