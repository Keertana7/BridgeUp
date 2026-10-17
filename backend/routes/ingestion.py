import hashlib
import logging
import os
import shutil
import tempfile
from pathlib import Path

import pymupdf
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile

from app.auth import get_current_user
from shared_ingestion import load_shared_module
from services.database import supabase


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ingestion", tags=["Ingestion"])

BACKEND_DIR = Path(__file__).resolve().parents[1]
MAX_UPLOAD_BYTES = 25 * 1024 * 1024


def _cleanup_upload(temp_dir: str) -> None:
    try:
        shutil.rmtree(temp_dir)
    except FileNotFoundError:
        pass
    except OSError:
        logger.exception("Could not remove temporary PDF upload directory %s", temp_dir)


def _pdf_source_prefix(user_id: str) -> str:
    owner_fingerprint = hashlib.sha256(user_id.encode("utf-8")).hexdigest()
    return f"sha256_{owner_fingerprint}_"


def _attach_pdf_owner(source_file: str, user_id: str) -> None:
    response = (
        supabase.table("experiences")
        .update({"submitted_by": user_id})
        .eq("source_type", "pdf")
        .eq("source_file", source_file)
        .execute()
    )
    if not response.data:
        logger.error(
            "Could not associate PDF experience with uploader "
            "(source_file=%s, user_id=%s)",
            source_file,
            user_id,
        )


def _ingest_uploaded_pdf(
    pdf_path: str,
    source_file: str,
    user_id: str,
) -> None:
    temp_dir = str(Path(pdf_path).parent)
    try:
        pdf_ingest = load_shared_module("pdf_ingest")
        result = pdf_ingest.ingest_pdf(pdf_path)
        if not isinstance(result, dict) or result.get("status") != "completed":
            logger.error(
                "PDF ingestion failed (source_file=%s, experience_id=%s, step=%s): %s",
                source_file,
                result.get("experience_id") if isinstance(result, dict) else None,
                result.get("failed_step", "unknown") if isinstance(result, dict) else "unknown",
                result.get("error", "pipeline returned no details")
                if isinstance(result, dict)
                else "pipeline returned an invalid result",
            )
            return

        logger.info(
            "PDF ingestion completed (source_file=%s, experience_id=%s, duplicate=%s)",
            source_file,
            result.get("experience_id"),
            result.get("duplicate", False),
        )
    except Exception:
        logger.exception("PDF ingestion crashed (source_file=%s)", source_file)
    finally:
        try:
            _attach_pdf_owner(source_file, user_id)
        except Exception:
            logger.exception(
                "Could not persist PDF uploader association (source_file=%s)",
                source_file,
            )
        _cleanup_upload(temp_dir)


@router.post("/pdfs", status_code=202)
async def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    filename = (file.filename or "").replace("\\", "/").rsplit("/", 1)[-1]
    if not filename or Path(filename).suffix.lower() != ".pdf":
        raise HTTPException(status_code=415, detail="Only PDF uploads are supported")

    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Authenticated user ID is missing")

    temp_dir = tempfile.mkdtemp(prefix="bridgeup-pdf-")
    upload_path = Path(temp_dir) / "upload.pdf"
    digest = hashlib.sha256()
    bytes_written = 0

    try:
        with open(upload_path, "wb") as destination:
            while chunk := await file.read(1024 * 1024):
                bytes_written += len(chunk)
                if bytes_written > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail="PDF upload exceeds the 25 MB limit",
                    )
                digest.update(chunk)
                destination.write(chunk)

        if not bytes_written:
            raise HTTPException(status_code=422, detail="Uploaded PDF is empty")

        try:
            with pymupdf.open(upload_path) as document:
                text_available = any(page.get_text().strip() for page in document)
        except Exception as exc:
            raise HTTPException(
                status_code=422,
                detail="Uploaded file is not a readable PDF",
            ) from exc

        if not text_available:
            raise HTTPException(
                status_code=422,
                detail="Uploaded PDF has no extractable text",
            )

        # The shared adapter uses pdf_path.name as the PDF source_file identity.
        source_file = f"{_pdf_source_prefix(str(user_id))}{digest.hexdigest()}.pdf"
        stable_path = Path(temp_dir) / source_file
        upload_path.replace(stable_path)
        background_tasks.add_task(
            _ingest_uploaded_pdf,
            str(stable_path),
            source_file,
            str(user_id),
        )
        return {
            "status": "accepted",
            "source_file": source_file,
            "filename": filename,
        }
    except HTTPException:
        _cleanup_upload(temp_dir)
        raise
    except OSError as exc:
        _cleanup_upload(temp_dir)
        logger.exception("Could not stage PDF upload")
        raise HTTPException(
            status_code=500,
            detail="Could not stage PDF upload",
        ) from exc
    except Exception as exc:
        _cleanup_upload(temp_dir)
        logger.exception("Unexpected error while processing PDF upload")
        raise HTTPException(
            status_code=500,
            detail="Could not process PDF upload",
        ) from exc
    finally:
        await file.close()


@router.get("/pdf-status")
def get_pdf_status(
    source_file: str,
    user: dict = Depends(get_current_user),
):
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Authenticated user ID is missing")
    if not source_file.startswith(_pdf_source_prefix(str(user_id))):
        raise HTTPException(status_code=404, detail="PDF ingestion record was not found")

    try:
        response = (
            supabase.table("experiences")
            .select("id,source_file,extraction_status,submitted_by")
            .eq("source_type", "pdf")
            .eq("source_file", source_file)
            .limit(1)
            .execute()
        )
    except Exception as exc:
        logger.exception("Could not fetch PDF ingestion status")
        raise HTTPException(
            status_code=503,
            detail="Could not fetch PDF ingestion status",
        ) from exc

    if not response.data or response.data[0].get("submitted_by") not in (None, user_id):
        raise HTTPException(status_code=404, detail="PDF ingestion record was not found")
    return response.data[0]
