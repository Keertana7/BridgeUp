from fastapi import APIRouter, HTTPException
from app.database import supabase
from app.models.questions import QuestionCreate, QuestionUpdate, QuestionResponse, Category
from typing import List, Optional
import uuid

router = APIRouter(
    prefix="/questions",
    tags=["Questions"]
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


@router.get("/", response_model=List[QuestionResponse])
def get_questions(
    experience_id: Optional[uuid.UUID] = None,
    category: Optional[Category] = None,
):
    """
    Returns all questions.

    Optional filters:
    - **experience_id**: filter by experience UUID
    - **category**: filter by category — one of DSA, Core, Aptitude, Programming, Project, HR, AI/ML, Other
    """
    try:
        query = supabase.table("questions").select("*")
        if experience_id is not None:
            query = query.eq("experience_id", str(experience_id))
        if category is not None:
            query = query.eq("category", category.value)
        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{question_id}", response_model=QuestionResponse)
def get_question(question_id: uuid.UUID):
    """
    Returns a single question by its UUID.
    Raises 404 if the question does not exist.
    """
    try:
        response = supabase.table("questions").select("*").eq("id", str(question_id)).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail=f"Question with id '{question_id}' not found."
        )

    return response.data[0]


@router.post("/", response_model=QuestionResponse, status_code=201)
def create_question(question: QuestionCreate):
    """
    Creates a new question.
    Raises 404 if the referenced experience does not exist.
    """
    # Verify the experience exists before inserting
    check_experience_exists(question.experience_id)

    # Build the insert payload, excluding fields that were not provided
    # mode="json" ensures enums are serialized to their string values (e.g. "DSA" not "Category.dsa")
    # and UUIDs are serialized to plain strings
    data = question.model_dump(mode="json", exclude_none=True)

    # Convert UUID objects to strings for Supabase
    if "experience_id" in data:
        data["experience_id"] = str(data["experience_id"])

    # Convert Category enum to its string value
    if "category" in data:
        data["category"] = str(data["category"])

    try:
        response = supabase.table("questions").insert(data).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not response.data:
        raise HTTPException(status_code=500, detail="Question creation failed. No data returned.")

    return response.data[0]


@router.patch("/{question_id}", response_model=QuestionResponse)
def update_question(question_id: uuid.UUID, question: QuestionUpdate):
    """
    Partially updates a question by its UUID.
    Only fields actually provided in the request body are updated.
    Raises 400 if no fields are provided.
    Raises 404 if the question does not exist.
    Raises 404 if the new experience_id does not exist.
    """
    # Strip out fields that were not sent in the request body
    # mode="json" ensures enums are serialized to their string values (e.g. "DSA" not "Category.dsa")
    # and UUIDs are serialized to plain strings
    update_data = question.model_dump(mode="json", exclude_none=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided to update.")

    # If experience_id is being changed, verify the new experience exists
    if "experience_id" in update_data:
        check_experience_exists(question.experience_id)
        update_data["experience_id"] = str(update_data["experience_id"])

    # Convert Category enum to its string value
    if "category" in update_data:
        update_data["category"] = str(update_data["category"])

    try:
        response = supabase.table("questions").update(update_data).eq("id", str(question_id)).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail=f"Question with id '{question_id}' not found."
        )

    return response.data[0]


@router.delete("/{question_id}", status_code=200)
def delete_question(question_id: uuid.UUID):
    """
    Deletes a question by its UUID.
    Raises 404 if the question does not exist.
    """
    try:
        response = supabase.table("questions").delete().eq("id", str(question_id)).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail=f"Question with id '{question_id}' not found."
        )

    return {"message": f"Question '{response.data[0]['id']}' deleted successfully."}
