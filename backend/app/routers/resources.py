from fastapi import APIRouter, HTTPException, Depends
from app.database import supabase
from app.models.resources import ResourceCreate, ResourceUpdate, ResourceResponse
from app.auth import get_current_user
from typing import List
import uuid

router = APIRouter(
    prefix="/resources",
    tags=["Resources"]
)


@router.get("/", response_model=List[ResourceResponse])
def get_resources():
    """Returns all resources."""
    try:
        response = supabase.table("resources").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/{resource_id}",
    response_model=ResourceResponse,
    responses={404: {"description": "Resource not found"}, 422: {"description": "Invalid UUID"}},
)
def get_resource(resource_id: uuid.UUID):
    """Returns a single resource by UUID. Raises 404 if not found."""
    try:
        response = supabase.table("resources").select("*").eq("id", str(resource_id)).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail=f"Resource with id '{resource_id}' not found."
        )

    return response.data[0]


@router.post(
    "/",
    response_model=ResourceResponse,
    status_code=201,
    responses={422: {"description": "title is empty or whitespace"}},
)
def create_resource(resource: ResourceCreate):
    """
    Creates a new resource.
    title is required and must not be empty or whitespace-only.
    """
    # mode="json" serializes UUIDs to plain strings — safe to pass directly to Supabase
    data = resource.model_dump(mode="json", exclude_none=True)

    try:
        response = supabase.table("resources").insert(data).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not response.data:
        raise HTTPException(status_code=500, detail="Resource creation failed. No data returned.")

    return response.data[0]


@router.patch(
    "/{resource_id}",
    response_model=ResourceResponse,
    responses={
        400: {"description": "No fields provided to update"},
        401: {"description": "Missing or invalid Bearer token"},
        404: {"description": "Resource not found"},
        422: {"description": "Invalid UUID or empty title"},
    },
)
def update_resource(
    resource_id: uuid.UUID,
    resource: ResourceUpdate,
    user: dict = Depends(get_current_user),
):
    """
    Partially updates a resource by UUID. **Requires authentication.**

    Only fields actually provided in the request body are updated.
    Raises 400 if no fields are provided.
    Raises 401 if no valid Bearer token is supplied.
    Raises 404 if the resource does not exist.
    """
    # mode="json" serializes UUIDs to plain strings; exclude_none=True drops absent fields
    update_data = resource.model_dump(mode="json", exclude_none=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided to update.")

    try:
        response = supabase.table("resources").update(update_data).eq("id", str(resource_id)).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail=f"Resource with id '{resource_id}' not found."
        )

    return response.data[0]


@router.delete(
    "/{resource_id}",
    status_code=200,
    responses={
        401: {"description": "Missing or invalid Bearer token"},
        404: {"description": "Resource not found"},
        422: {"description": "Invalid UUID"},
    },
)
def delete_resource(
    resource_id: uuid.UUID,
    user: dict = Depends(get_current_user),
):
    """
    Deletes a resource by UUID. **Requires authentication.**

    Raises 401 if no valid Bearer token is supplied.
    Raises 404 if the resource does not exist.
    """
    try:
        response = supabase.table("resources").delete().eq("id", str(resource_id)).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail=f"Resource with id '{resource_id}' not found."
        )

    return {"message": f"Resource '{response.data[0]['id']}' deleted successfully."}
