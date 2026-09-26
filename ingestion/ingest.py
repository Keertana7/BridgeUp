import os
from dotenv import load_dotenv
from supabase import create_client

from google_sheets import get_sheet_data
from transform import (
    transform_experience,
    transform_questions,
    transform_advice,
    transform_resources
)

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
)


def get_or_create_company(company_name):
    """Get existing company ID or create a new company."""

    if not company_name:
        return None

    result = (
        supabase
        .table("companies")
        .select("id")
        .eq("name", company_name)
        .execute()
    )

    if result.data:
        return result.data[0]["id"]

    result = (
        supabase
        .table("companies")
        .insert({
            "name": company_name
        })
        .execute()
    )

    return result.data[0]["id"]


def insert_experience(row):
    """Insert one experience and return its ID."""

    data = transform_experience(row)
    submission_id = row.get("Timestamp")
    existing = (
        supabase
        .table("experiences")
        .select("id")
        .eq("submission_id", submission_id)
        .execute()
    )

    if existing.data:
        print(f"SKIPPED: already imported - {submission_id}")
        return None
    company_id = get_or_create_company(data["company"])

    # Combine the important experience information
    # into the content column.
    content_parts = [
        data["rounds"],
        data["online_assessment"],
        data["interview_experience"],
        data["technical_interview"],
        data["programming_languages"],
        data["unexpected"],
        data["preparation_strategy"],
        data["useful_topics"],
        data["mistakes"],
        data["advice"],
        data["wish_known"]
    ]

    content = "\n\n".join(
        part for part in content_parts if part
    )

    experience = {
        "submission_id": submission_id,
        "company_id": company_id,
        "role": data["role"],
        "batch": row.get("Graduation/Batch year"),
        "package": data["package"],
        "opportunity_type": data["opportunity_type"],
        "selection_status": data["selection_status"],
        "interview_date": data["interview_date"],
        "difficulty": data["difficulty"],
        "preparation_duration": data["preparation_duration"],
        "content": content,
        "source_type": "form",
        "consent": data["consent"] == "I Agree"
    }

    result = (
        supabase
        .table("experiences")
        .insert(experience)
        .execute()
    )

    experience_id = result.data[0]["id"]

    return experience_id


def insert_questions(row, experience_id):
    """Insert question information for an experience."""

    data = transform_questions(row)

    questions = [
        {
            "experience_id": experience_id,
            "question": data["oa_aptitude"],
            "category": "Aptitude",
            "source_section": "Online Assessment"
        },
        {
            "experience_id": experience_id,
            "question": data["oa_coding"],
            "category": "Programming",
            "source_section": "Online Assessment"
        },
        {
            "experience_id": experience_id,
            "question": data["technical_questions"],
            "category": "Other",
            "source_section": "Technical Interview"
        },
        {
            "experience_id": experience_id,
            "question": data["project_questions"],
            "category": "Project",
            "source_section": "Technical Interview"
        },
        {
            "experience_id": experience_id,
            "question": data["internship_questions"],
            "category": "Other",
            "source_section": "Technical Interview"
        },
        {
            "experience_id": experience_id,
            "question": data["technical_aptitude"],
            "category": "Aptitude",
            "source_section": "Technical Interview"
        },
        {
            "experience_id": experience_id,
            "question": data["hr_questions"],
            "category": "HR",
            "source_section": "HR Interview"
        }
    ]

    # Only insert actual answers
    questions = [
        q for q in questions
        if q["question"]
    ]

    if questions:
        supabase.table("questions").insert(questions).execute()


def insert_advice(row, experience_id):
    """Insert preparation/advice information."""

    data = transform_advice(row)

    advice_items = [
    {
        "experience_id": experience_id,
        "type": "preparation",
        "content": data["preparation_strategy"]
    },
    {
        "experience_id": experience_id,
        "type": "remember",
        "content": data["useful_topics"]
    },
    {
        "experience_id": experience_id,
        "type": "mistake",
        "content": data["mistakes"]
    },
    {
        "experience_id": experience_id,
        "type": "advice",
        "content": data["advice"]
    },
    {
        "experience_id": experience_id,
        "type": "remember",
        "content": data["wish_known"]
    }
]

    advice_items = [
        item for item in advice_items
        if item["content"]
    ]

    if advice_items:
        supabase.table("advice").insert(advice_items).execute()


def insert_resources(row, experience_id):
    """Insert resources shared by the senior."""

    data = transform_resources(row)

    resources = []

    if data["links"]:
        resources.append({
            "title": "Shared Links",
            "description": data["links"],
            "category": "Learning",
            "resource_type": "link",
            "url": data["links"],
            "file_path": None
        })

    if data["study_material"]:
        resources.append({
            "title": "Study Material",
            "description": data["study_material"],
            "category": "Learning",
            "resource_type": "file",
            "url": None,
            "file_path": None
        })

    if resources:
        supabase.table("resources").insert(resources).execute()


def main():

    rows = get_sheet_data()

    print(f"Rows fetched: {len(rows)}")

    for index, row in enumerate(rows, start=1):

        try:

            print(f"\nProcessing row {index}...")

            experience_id = insert_experience(row)

            if experience_id is None:
                continue


            insert_questions(row, experience_id)
            insert_advice(row, experience_id)
            insert_resources(row, experience_id)

            print(
                f"SUCCESS: {row.get('Name')} - "
                f"{row.get('Company ')}"
            )

        except Exception as e:

            print(
                f"ERROR processing row {index} "
                f"({row.get('Name')}):"
            )

            print(e)


if __name__ == "__main__":
    main()