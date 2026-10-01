import pymupdf

from pathlib import Path

from supabase_client import supabase
from privacy import sanitize_text
from llm_extract import extract_questions_and_advice
from save_extraction import save_extraction
# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

PDF_FOLDER = Path("data/pdfs")


# --------------------------------------------------
# PDF TEXT EXTRACTION
# --------------------------------------------------

def extract_text_from_pdf(pdf_path):
    """Extract text from a single PDF."""

    doc = pymupdf.open(pdf_path)

    text = ""

    for page in doc:
        text += page.get_text()

    doc.close()

    return text.strip()


# --------------------------------------------------
# COMPANY
# --------------------------------------------------

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


# --------------------------------------------------
# PDF INGESTION
# --------------------------------------------------

def ingest_pdf(pdf_path):

    filename = pdf_path.name

    print(f"\nProcessing: {filename}")

    # ----------------------------------------------
    # Check whether PDF was already imported
    # ----------------------------------------------

    existing = (
        supabase
        .table("experiences")
        .select("id")
        .eq("source_file", filename)
        .execute()
    )

    if existing.data:
        print(f"SKIPPED: already imported - {filename}")
        return


    # ----------------------------------------------
    # Extract text
    # ----------------------------------------------

    text = extract_text_from_pdf(pdf_path)

    print(f"Characters extracted: {len(text)}")


    if not text:
        print(f"WARNING: No text extracted from {filename}")
        return

    sanitized_text = sanitize_text(text)
    # ----------------------------------------------
    # For now, we don't know structured metadata
    # ----------------------------------------------

    experience = {
        "source_file": filename,
        "source_type": "pdf",

        # We don't know these yet.
        # Gemini will structure them later.
        "company_id": None,
        "role": None,
        "batch": None,
        "package": None,
        "opportunity_type": None,
        "selection_status": None,
        "interview_date": None,
        "difficulty": None,
        "preparation_duration": None,

        # Store complete extracted PDF text
        "content": sanitized_text,

        # PDF doesn't come from Google Form consent
        "consent": True
    }


    # ----------------------------------------------
    # Insert into Supabase
    # ----------------------------------------------

    result = (
        supabase
        .table("experiences")
        .insert(experience)
        .execute()
    )

    experience_id = result.data[0]["id"]

    print(
        f"SUCCESS: {filename} "
        f"→ experience_id = {experience_id}"
    )

    # ----------------------------------------------
    # Gemini extraction
    # ----------------------------------------------

    print("\nExtracting questions and advice using Gemini...")

    extraction_result = extract_questions_and_advice(text)

    # ----------------------------------------------
    # Save extracted data
    # ----------------------------------------------

    save_extraction(
        experience_id,
        extraction_result
    )

    print(
        f"COMPLETED: {filename}"
    )


# --------------------------------------------------
# MAIN
# --------------------------------------------------

def main():

    pdf_files = list(PDF_FOLDER.glob("*.pdf"))

    print(f"PDFs found: {len(pdf_files)}")

    for pdf_path in pdf_files:

        try:

            ingest_pdf(pdf_path)

        except Exception as e:

            print(
                f"ERROR processing {pdf_path.name}:"
            )

            print(e)


# --------------------------------------------------

if __name__ == "__main__":
    main()