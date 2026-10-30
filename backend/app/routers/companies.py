import logging
from fastapi import APIRouter, Depends, HTTPException
from app.database import supabase
from app.auth import get_current_user
from app.models.companies import CompanyCreate, CompanyUpdate, CompanyResponse
from services.database import supabase as service_supabase
from typing import List
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/companies",
    tags=["Companies"]
)


def _find_company_by_normalized_name(name: str):
    normalized_name = name.strip().lower()
    response = (
        service_supabase.table("companies")
        .select("id,name,created_at")
        .execute()
    )
    return next(
        (
            company
            for company in response.data or []
            if isinstance(company.get("name"), str)
            and company["name"].strip().lower() == normalized_name
        ),
        None,
    )


@router.get("/", response_model=List[CompanyResponse])
def get_companies():
    """Returns all companies."""
    try:
        response = supabase.table("companies").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/{company_id}",
    response_model=CompanyResponse,
    responses={404: {"description": "Company not found"}, 422: {"description": "Invalid UUID"}},
)
def get_company(company_id: uuid.UUID):
    """Returns a single company by its UUID. Raises 404 if not found."""
    try:
        response = supabase.table("companies").select("*").eq("id", str(company_id)).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not response.data:
        raise HTTPException(status_code=404, detail=f"Company with id '{company_id}' not found.")

    return response.data[0]


@router.post(
    "/resolve",
    response_model=CompanyResponse,
    responses={401: {"description": "Authentication required"}},
)
def resolve_company(
    company: CompanyCreate,
    _user: dict = Depends(get_current_user),
):
    """Return a normalized existing company or create it once."""
    name = company.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Company name cannot be blank.")

    try:
        existing = _find_company_by_normalized_name(name)
    except Exception as exc:
        logger.exception("Could not look up company name")
        raise HTTPException(
            status_code=500,
            detail="Company lookup failed.",
        ) from exc

    if existing:
        return existing

    try:
        response = (
            service_supabase.table("companies")
            .insert({"name": name})
            .execute()
        )
    except Exception as exc:
        if "23505" in str(exc):
            try:
                existing = _find_company_by_normalized_name(name)
            except Exception as lookup_exc:
                logger.exception("Could not resolve company after concurrent insert")
                raise HTTPException(
                    status_code=500,
                    detail="Company lookup failed.",
                ) from lookup_exc
            if existing:
                return existing

        logger.exception("Could not create company")
        raise HTTPException(
            status_code=500,
            detail="Company creation failed.",
        ) from exc

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Company creation failed. No data returned.",
        )

    return response.data[0]


@router.post(
    "/",
    response_model=CompanyResponse,
    status_code=201,
    responses={409: {"description": "Company name already exists"}},
)
def create_company(company: CompanyCreate):
    """Creates a new company. Raises 409 if the name is already taken."""
    try:
        response = supabase.table("companies").insert({"name": company.name}).execute()
    except Exception as e:
        error_message = str(e)
        if "23505" in error_message or "duplicate" in error_message.lower():
            raise HTTPException(
                status_code=409,
                detail=f"A company named '{company.name}' already exists."
            )
        raise HTTPException(status_code=500, detail=error_message)

    if not response.data:
        raise HTTPException(status_code=500, detail="Company creation failed. No data returned.")

    return response.data[0]


@router.patch(
    "/{company_id}",
    response_model=CompanyResponse,
    responses={
        400: {"description": "No fields provided to update"},
        404: {"description": "Company not found"},
        409: {"description": "Company name already exists"},
        422: {"description": "Invalid UUID"},
    },
)
def update_company(company_id: uuid.UUID, company: CompanyUpdate):
    """
    Partially updates a company. Only supplied fields are written.
    Raises 400 for empty body, 404 if not found, 409 if name is taken.
    """
    update_data = company.model_dump(exclude_none=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided to update.")

    try:
        response = supabase.table("companies").update(update_data).eq("id", str(company_id)).execute()
    except Exception as e:
        error_message = str(e)
        if "23505" in error_message or "duplicate" in error_message.lower():
            raise HTTPException(
                status_code=409,
                detail=f"A company named '{company.name}' already exists."
            )
        raise HTTPException(status_code=500, detail=error_message)

    if not response.data:
        raise HTTPException(status_code=404, detail=f"Company with id '{company_id}' not found.")

    return response.data[0]


@router.delete(
    "/{company_id}",
    status_code=200,
    responses={404: {"description": "Company not found"}, 422: {"description": "Invalid UUID"}},
)
def delete_company(company_id: uuid.UUID):
    """Deletes a company by UUID. Raises 404 if not found."""
    try:
        response = supabase.table("companies").delete().eq("id", str(company_id)).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not response.data:
        raise HTTPException(status_code=404, detail=f"Company with id '{company_id}' not found.")

    return {"message": f"Company '{response.data[0]['name']}' deleted successfully."}
