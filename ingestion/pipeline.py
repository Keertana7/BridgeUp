import hashlib
import json

from supabase_client import supabase
from save_extraction import save_extraction
from chunk_experiences import create_chunks_for_experience
from embed_questions_batch import embed_questions_for_experience
from embed_advice_batch import embed_advice_for_experience
from embed_chunks import embed_chunks_for_experience


def get_or_create_company(company_name):
    """Return the company ID, creating the company when needed."""

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
        .insert({"name": company_name})
        .execute()
    )

    return result.data[0]["id"]


def _identity_for_experience(experience):
    source_type = experience.get("source_type")

    if source_type == "pdf":
        identity_field = "source_file"
    elif source_type == "form":
        identity_field = "submission_id"
    else:
        raise ValueError("source_type must be 'pdf' or 'form'")

    identity_value = experience.get(identity_field)

    if not identity_value:
        raise ValueError(f"{identity_field} is required for deduplication")

    return source_type, identity_field, identity_value


def get_form_submission_id(row):
    """Return an explicit ID or a deterministic fingerprint of Form answers."""

    submission_id = row.get("submission_id")
    if submission_id:
        return str(submission_id)

    stable_response = {
        key: value
        for key, value in row.items()
        if key.lower() not in {"timestamp", "submission_id"}
    }

    if not any(value not in (None, "") for value in stable_response.values()):
        raise ValueError("form response must contain a stable submission identifier or answers")

    serialized_response = json.dumps(
        stable_response,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=True,
        default=str,
    )
    digest = hashlib.sha256(serialized_response.encode("utf-8")).hexdigest()
    return f"form:{digest}"


def _find_existing_experience(source_type, identity_field, identity_value):
    response = (
        supabase
        .table("experiences")
        .select("id, extraction_status")
        .eq("source_type", source_type)
        .eq(identity_field, identity_value)
        .limit(1)
        .execute()
    )

    return (response.data or [None])[0]


def _update_form_submission_id(experience_id, submission_id):
    (
        supabase
        .table("experiences")
        .update({"submission_id": submission_id})
        .eq("id", experience_id)
        .execute()
    )


def _has_extraction_rows(table_name, experience_id):
    response = (
        supabase
        .table(table_name)
        .select("id")
        .eq("experience_id", experience_id)
        .limit(1)
        .execute()
    )

    return bool(response.data)


def _set_extraction_status(experience_id, status):
    (
        supabase
        .table("experiences")
        .update({"extraction_status": status})
        .eq("id", experience_id)
        .execute()
    )


def _failure(state, step, error, details=None):
    state["status"] = "failed"
    state["failed_step"] = step
    state["error"] = str(error)
    if details is not None:
        state["failure_details"] = details
    return state


class _EmbeddingResultError(ValueError):
    def __init__(self, message, details=None):
        super().__init__(message)
        self.details = details or []


def _embedding_summary(result, id_field):
    if not isinstance(result, dict):
        raise _EmbeddingResultError("embedding result must be a dictionary")

    required_fields = ("total", "success", "failed", "results")
    missing_fields = [field for field in required_fields if field not in result]
    if missing_fields:
        raise _EmbeddingResultError(
            f"embedding result is missing fields: {', '.join(missing_fields)}"
        )

    counts = {field: result[field] for field in ("total", "success", "failed")}
    for field, count in counts.items():
        if type(count) is not int or count < 0:
            raise _EmbeddingResultError(
                f"embedding result {field} must be a non-negative integer"
            )

    records = result["results"]
    if not isinstance(records, list):
        raise _EmbeddingResultError("embedding result results must be a list")

    failures = []
    success_records = 0
    failed_records = 0
    malformed_records = []

    for index, item in enumerate(records):
        if not isinstance(item, dict):
            malformed_records.append({"index": index, "error": "record must be a dictionary"})
            continue

        record_id = item.get(id_field)
        status = item.get("status")
        error = item.get("error")

        if record_id is None:
            malformed_records.append({"index": index, "error": f"missing {id_field}"})
        if status not in ("success", "failed"):
            malformed_records.append({"index": index, id_field: record_id, "error": "invalid status"})
            continue

        if "error" not in item or "embedding" not in item:
            malformed_records.append({
                "index": index,
                id_field: record_id,
                "error": "record must include error and embedding fields",
            })

        if status == "failed":
            failed_records += 1
            failures.append({id_field: record_id, "error": error})
            if not isinstance(error, str) or not error.strip():
                malformed_records.append({
                    "index": index,
                    id_field: record_id,
                    "error": "failed record must include a non-empty error message",
                })
            if item.get("embedding") is not None:
                malformed_records.append({
                    "index": index,
                    id_field: record_id,
                    "error": "failed record must not include an embedding",
                })
        else:
            success_records += 1
            if error is not None:
                malformed_records.append({
                    "index": index,
                    id_field: record_id,
                    "error": "successful record must have error=None",
                })
            if item.get("embedding") is None:
                malformed_records.append({
                    "index": index,
                    id_field: record_id,
                    "error": "successful record must include an embedding",
                })

    if malformed_records:
        raise _EmbeddingResultError(
            "embedding result contains malformed records",
            details=failures + malformed_records,
        )

    if counts["total"] != counts["success"] + counts["failed"]:
        raise _EmbeddingResultError(
            "embedding result total must equal success + failed",
            details=failures,
        )

    if len(records) != counts["total"]:
        raise _EmbeddingResultError(
            "embedding result total must match the number of per-record results",
            details=failures,
        )

    if success_records != counts["success"] or failed_records != counts["failed"]:
        raise _EmbeddingResultError(
            "embedding result counts do not match per-record statuses",
            details=failures,
        )

    return {
        **counts,
        "failures": failures,
    }


def _chunk_embedding_count(result):
    """Validate the chunk helper's documented integer success-count result."""

    if type(result) is not int or result < 0:
        raise ValueError("chunk embedding result must be a non-negative integer count")
    return result


def process_experience(
    experience_data,
    *,
    extraction_text=None,
    extraction_result=None,
    reprocess=False,
    extractor=None,
):
    """Run the reusable ingestion stages for one normalized experience.

    ``experience_data`` must contain ``source_type``, its stable source key
    (``source_file`` for PDFs or ``submission_id`` for forms), and ``content``.
    Form adapters can pass a structured ``extraction_result``; PDFs can pass
    source ``extraction_text``. Repeated calls reuse the existing experience,
    preserve saved extraction rows, skip existing chunks, and embed only rows
    whose embeddings are NULL.

    Returns a dictionary containing ``experience_id``, ``status``, ``duplicate``,
    completed ``steps``, and, on failure, ``failed_step`` and ``error``. Set
    ``reprocess=True`` only to deliberately replace saved questions and advice.
    """

    state = {
        "experience_id": None,
        "status": "processing",
        "duplicate": False,
        "completed_steps": [],
        "steps": {},
    }

    if not isinstance(experience_data, dict):
        return _failure(state, "validate", "experience_data must be a dictionary")

    experience = dict(experience_data)

    try:
        source_type, identity_field, identity_value = _identity_for_experience(experience)
        legacy_submission_id = experience.pop("legacy_submission_id", None)
        content = experience.get("content")
        if not isinstance(content, str) or not content.strip():
            raise ValueError("content is required")
    except Exception as exc:
        return _failure(state, "validate", exc)

    state["completed_steps"].append("validate")

    try:
        existing = _find_existing_experience(
            source_type,
            identity_field,
            identity_value,
        )
        matched_legacy_id = False
        if existing is None and source_type == "form" and legacy_submission_id:
            existing = _find_existing_experience(
                source_type,
                identity_field,
                legacy_submission_id,
            )
            matched_legacy_id = existing is not None
    except Exception as exc:
        return _failure(state, "deduplicate", exc)

    if existing:
        state["experience_id"] = existing["id"]
        state["duplicate"] = True
        extraction_status = existing.get("extraction_status")
        if matched_legacy_id:
            try:
                _update_form_submission_id(state["experience_id"], identity_value)
                state["steps"]["migrate_submission_id"] = {"status": "completed"}
                state["completed_steps"].append("migrate_submission_id")
            except Exception as exc:
                return _failure(state, "migrate_submission_id", exc)
    else:
        company_name = experience.pop("company_name", None)
        if company_name:
            try:
                experience["company_id"] = get_or_create_company(company_name)
            except Exception as exc:
                return _failure(state, "resolve_company", exc)
            state["completed_steps"].append("resolve_company")

        try:
            response = (
                supabase
                .table("experiences")
                .insert(experience)
                .execute()
            )
            state["experience_id"] = response.data[0]["id"]
            extraction_status = None
        except Exception as exc:
            return _failure(state, "save_experience", exc)

    state["completed_steps"].append("deduplicate")
    if "save_experience" not in state["completed_steps"] and not state["duplicate"]:
        state["completed_steps"].append("save_experience")
    elif state["duplicate"]:
        state["steps"]["save_experience"] = {"status": "skipped_existing"}

    should_extract = reprocess or extraction_status != "completed"

    if extraction_status == "completed" and not reprocess:
        if extraction_result is not None:
            should_extract = True
        elif extraction_text is not None or extractor is not None:
            try:
                has_questions = _has_extraction_rows("questions", state["experience_id"])
                has_advice = _has_extraction_rows("advice", state["experience_id"])
                should_extract = not (has_questions and has_advice)
            except Exception as exc:
                return _failure(state, "check_extraction", exc)

    if not should_extract:
        state["steps"].setdefault("extract", {"status": "skipped_completed"})
        state["steps"].setdefault("save_extraction", {"status": "skipped_completed"})
        state["completed_steps"].extend(("extract", "save_extraction"))
    else:
        try:
            _set_extraction_status(state["experience_id"], "processing")
        except Exception as exc:
            return _failure(state, "mark_extraction_processing", exc)

        if extraction_result is None:
            try:
                if extractor is None:
                    from llm_extract import extract_questions_and_advice
                    extractor = extract_questions_and_advice
                result = extractor(extraction_text if extraction_text is not None else content)
                state["steps"]["extract"] = {"status": "completed"}
            except Exception as exc:
                try:
                    _set_extraction_status(state["experience_id"], "failed")
                except Exception:
                    pass
                return _failure(state, "extract", exc)
        else:
            result = extraction_result
            state["steps"]["extract"] = {"status": "provided"}

        state["completed_steps"].append("extract")

        try:
            save_extraction(
                state["experience_id"],
                result,
                reprocess=reprocess,
            )
            state["steps"]["save_extraction"] = {"status": "completed"}
            state["completed_steps"].append("save_extraction")
        except Exception as exc:
            try:
                _set_extraction_status(state["experience_id"], "failed")
            except Exception:
                pass
            return _failure(state, "save_extraction", exc)

        try:
            _set_extraction_status(state["experience_id"], "completed")
        except Exception as exc:
            try:
                _set_extraction_status(state["experience_id"], "failed")
            except Exception:
                pass
            return _failure(state, "mark_extraction_completed", exc)

    try:
        chunks_created = create_chunks_for_experience(state["experience_id"])
        state["steps"]["create_chunks"] = {"created": chunks_created}
        state["completed_steps"].append("create_chunks")
    except Exception as exc:
        return _failure(state, "create_chunks", exc)

    for step, embed, id_field in (
        ("embed_questions", embed_questions_for_experience, "question_id"),
        ("embed_advice", embed_advice_for_experience, "advice_id"),
    ):
        try:
            embedding_result = embed(state["experience_id"])
            summary = _embedding_summary(embedding_result, id_field)
            state["steps"][step] = summary
            if summary["failed"]:
                return _failure(
                    state,
                    step,
                    f"{summary['failed']} record(s) failed to embed",
                    details=summary["failures"],
                )
            state["completed_steps"].append(step)
        except Exception as exc:
            return _failure(
                state,
                step,
                exc,
                details=getattr(exc, "details", None),
            )

    try:
        chunks_embedded = _chunk_embedding_count(
            embed_chunks_for_experience(state["experience_id"])
        )
        state["steps"]["embed_chunks"] = {"success": chunks_embedded}
        state["completed_steps"].append("embed_chunks")
    except Exception as exc:
        return _failure(state, "embed_chunks", exc)

    state["status"] = "completed"
    return state


def process_form_response(row):
    """Transform one Google Form response and send it through the pipeline."""

    if not isinstance(row, dict):
        state = {
            "experience_id": None,
            "status": "processing",
            "duplicate": False,
            "completed_steps": [],
            "steps": {},
        }
        return _failure(state, "validate", "form response must be a dictionary")

    try:
        submission_id = get_form_submission_id(row)
    except Exception as exc:
        state = {
            "experience_id": None,
            "status": "processing",
            "duplicate": False,
            "completed_steps": [],
            "steps": {},
        }
        return _failure(state, "validate", exc)

    try:
        from transform import transform_advice, transform_experience, transform_questions

        data = transform_experience(row)
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
            data["wish_known"],
        ]
        content = "\n\n".join(part for part in content_parts if part)

        experience = {
            "submission_id": submission_id,
            "legacy_submission_id": row.get("Timestamp"),
            "source_type": "form",
            "company_name": data["company"],
            "role": data["role"],
            "batch": row.get("Graduation/Batch year"),
            "package": data["package"],
            "opportunity_type": data["opportunity_type"],
            "selection_status": data["selection_status"],
            "interview_date": data["interview_date"],
            "difficulty": data["difficulty"],
            "preparation_duration": data["preparation_duration"],
            "content": content,
            "consent": data["consent"] == "I Agree",
        }

        question_data = transform_questions(row)
        question_sources = (
            ("oa_aptitude", "Aptitude", "Online Assessment"),
            ("oa_coding", "Programming", "Online Assessment"),
            ("technical_questions", "Other", "Technical Interview"),
            ("project_questions", "Project", "Technical Interview"),
            ("internship_questions", "Other", "Technical Interview"),
            ("technical_aptitude", "Aptitude", "Technical Interview"),
            ("hr_questions", "HR", "HR Interview"),
        )
        questions = [
            {
                "question": question_data[key],
                "category": category,
                "source_section": source_section,
                "difficulty": "Unknown",
            }
            for key, category, source_section in question_sources
            if question_data[key]
        ]

        advice_data = transform_advice(row)
        advice_sources = (
            ("preparation_strategy", "preparation"),
            ("useful_topics", "remember"),
            ("mistakes", "mistake"),
            ("advice", "advice"),
            ("wish_known", "remember"),
        )
        advice = [
            {"type": advice_type, "content": advice_data[key]}
            for key, advice_type in advice_sources
            if advice_data[key]
        ]

        if not content.strip():
            content = "\n\n".join(
                [question["question"] for question in questions]
                + [item["content"] for item in advice]
            )
            experience["content"] = content
    except Exception as exc:
        state = {
            "experience_id": None,
            "status": "processing",
            "duplicate": False,
            "completed_steps": [],
            "steps": {},
        }
        return _failure(state, "transform_form", exc)

    return process_experience(
        experience,
        extraction_result={"questions": questions, "advice": advice},
    )
