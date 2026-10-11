import pymupdf

from pathlib import Path

from privacy import sanitize_text
from pipeline import get_or_create_company, process_experience
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
# PDF INGESTION
# --------------------------------------------------

def ingest_pdf(pdf_path):

    filename = pdf_path.name

    print(f"\nProcessing: {filename}")

    # ----------------------------------------------
    # Extract text
    # ----------------------------------------------

    try:
        text = extract_text_from_pdf(pdf_path)
    except Exception as exc:
        result = {
            "experience_id": None,
            "status": "failed",
            "duplicate": False,
            "completed_steps": [],
            "steps": {},
            "failed_step": "extract_pdf_text",
            "error": str(exc),
        }
        print(f"FAILED: {filename} at extract_pdf_text: {exc}")
        return result

    print(f"Characters extracted: {len(text)}")

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


    result = process_experience(
        experience,
        extraction_text=text,
    )

    if result["status"] == "failed":
        print(
            f"FAILED: {filename} at {result['failed_step']} "
            f"for experience {result['experience_id']}: {result['error']}"
        )
        return result

    print(
        f"COMPLETED: {filename} "
        f"(experience_id={result['experience_id']})"
    )
    return result


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