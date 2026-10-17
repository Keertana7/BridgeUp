import logging
import os
from copy import deepcopy
from pathlib import Path

from dotenv import load_dotenv

from shared_ingestion import load_shared_module


BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")

logger = logging.getLogger(__name__)


def poll_google_sheets():
    """Poll responses using the existing Sheets adapter and common pipeline."""

    if not os.getenv("GOOGLE_SHEET_API_URL", "").strip():
        raise RuntimeError("GOOGLE_SHEET_API_URL is missing")

    get_sheet_data = load_shared_module("google_sheets").get_sheet_data
    process_form_response = load_shared_module("pipeline").process_form_response

    rows = get_sheet_data()
    if not isinstance(rows, list):
        raise ValueError("Google Sheets adapter must return a list of response objects")

    results = []
    for row_number, source_row in enumerate(rows, start=1):
        if not isinstance(source_row, dict):
            result = {
                "status": "failed",
                "failed_step": "validate",
                "error": "Google Sheets response must be an object",
            }
            results.append(result)
            logger.error("Response row %d failed validation: %s", row_number, result["error"])
            continue

        row = deepcopy(source_row)
        submission_id = row.get("submission_id")
        timestamp = row.get("Timestamp")
        if not submission_id and timestamp:
            row["submission_id"] = f"google-form:{timestamp}"
        elif not submission_id:
            result = {
                "status": "failed",
                "failed_step": "validate_submission_id",
                "error": "Response needs a stable submission_id or Google Forms Timestamp",
            }
            results.append(result)
            logger.error("Response row %d failed validation: %s", row_number, result["error"])
            continue

        try:
            result = process_form_response(row)
            if not isinstance(result, dict):
                raise TypeError("shared pipeline returned a non-dictionary result")
        except Exception:
            logger.exception("Unexpected ingestion failure for Sheets row %d", row_number)
            result = {
                "status": "failed",
                "failed_step": "process_form_response",
                "error": "Unexpected exception; see worker log",
            }

        results.append(result)
        if result.get("status") == "completed":
            logger.info(
                "Sheets row %d completed (experience_id=%s, duplicate=%s)",
                row_number,
                result.get("experience_id"),
                result.get("duplicate", False),
            )
        else:
            logger.error(
                "Sheets row %d failed at %s: %s",
                row_number,
                result.get("failed_step", "unknown"),
                result.get("error", "no error detail returned"),
            )

    summary = {
        "total": len(results),
        "completed": sum(result.get("status") == "completed" for result in results),
        "failed": sum(result.get("status") != "completed" for result in results),
        "results": results,
    }
    logger.info(
        "Sheets poll finished: total=%d completed=%d failed=%d",
        summary["total"],
        summary["completed"],
        summary["failed"],
    )
    return summary


def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    if not os.getenv("GOOGLE_SHEET_API_URL", "").strip():
        logger.error("GOOGLE_SHEET_API_URL is missing")
        return 2

    try:
        summary = poll_google_sheets()
    except Exception:
        logger.exception("Google Sheets polling failed")
        return 1
    return 1 if summary["failed"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
