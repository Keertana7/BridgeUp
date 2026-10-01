from pathlib import Path
import pymupdf

from llm_extract import extract_questions_and_advice


def extract_pdf_text(pdf_path):
    """
    Extract text from a PDF using PyMuPDF.
    """

    doc = pymupdf.open(pdf_path)

    text = ""

    for page in doc:
        text += page.get_text()

    doc.close()

    return text


def process_pdf(pdf_path):
    """
    Convert one PDF into structured interview data.
    """

    print(f"\nProcessing: {pdf_path.name}")

    text = extract_pdf_text(pdf_path)

    print(f"Characters extracted: {len(text)}")

    result = extract_questions_and_advice(text)

    return result