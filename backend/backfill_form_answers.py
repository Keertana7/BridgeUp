"""Manually backfill form_answers on existing Google Form experiences."""

import argparse
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

from ingestion_worker import (
    _form_answer_pairs,
    _submission_id_for_row,
)
from shared_ingestion import load_shared_module


logger = logging.getLogger(__name__)
PAGE_SIZE = 500


def _has_meaningful_answer(value):
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (list, tuple)):
        return any(_has_meaningful_answer(item) for item in value)
    if isinstance(value, dict):
        return any(_has_meaningful_answer(item) for item in value.values())
    return True


def _empty_form_answers(value):
    return value is None or value == []


def _backfill_answer_pairs(source_row):
    pairs = _form_answer_pairs(source_row)
    return [
        pair for pair in pairs
        if " ".join(
            pair["question"].casefold().replace("_", " ").replace("-", " ").split()
        ) not in {"submission id", "legacy submission id"}
    ]


def _fetch_form_experiences(supabase):
    experiences = []
    offset = 0
    while True:
        response = (
            supabase.table("experiences")
            .select("id,source_type,submission_id,form_answers")
            .eq("source_type", "form")
            .range(offset, offset + PAGE_SIZE - 1)
            .execute()
        )
        page = response.data or []
        if not isinstance(page, list):
            raise TypeError("Supabase returned an invalid experiences page")
        experiences.extend(
            item for item in page
            if isinstance(item, dict) and _empty_form_answers(item.get("form_answers"))
        )
        if len(page) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    return experiences


def _index_source_rows(sheet_rows):
    if not isinstance(sheet_rows, list):
        raise TypeError("Google Sheets adapter must return a list of response objects")

    rows_by_submission_id = {}
    invalid_rows = 0
    for row_number, row in enumerate(sheet_rows, start=1):
        if not isinstance(row, dict):
            logger.warning("Skipping invalid Google Sheets row %d: not an object", row_number)
            invalid_rows += 1
            continue

        raw_submission_id = _submission_id_for_row(row)
        if not raw_submission_id:
            logger.warning("Skipping invalid Google Sheets row %d: missing submission ID", row_number)
            invalid_rows += 1
            continue

        submission_id = str(raw_submission_id)
        try:
            pairs = [
                pair for pair in _backfill_answer_pairs(row)
                if _has_meaningful_answer(pair["answer"])
            ]
            json.dumps(pairs, ensure_ascii=False, allow_nan=False)
        except (TypeError, ValueError):
            logger.warning("Skipping invalid Google Sheets row %d: invalid answer data", row_number)
            invalid_rows += 1
            rows_by_submission_id.setdefault(submission_id, []).append(None)
            continue
        rows_by_submission_id.setdefault(submission_id, []).append(pairs)
    return rows_by_submission_id, invalid_rows


def _plan_backfill(experiences, sheet_rows):
    rows_by_submission_id, invalid_source_rows = _index_source_rows(sheet_rows)
    plan = []
    for experience in experiences:
        experience_id = experience.get("id")
        submission_id = experience.get("submission_id")
        entry = {
            "experience_id": experience_id,
            "submission_id": submission_id,
            "match_status": "",
            "meaningful_pair_count": 0,
            "proposed_question_answer_pairs": [],
            "current_form_answers": experience.get("form_answers"),
            "_experience": experience,
        }

        if not isinstance(submission_id, str) or not submission_id:
            entry["match_status"] = "invalid_experience_submission_id"
        else:
            matches = rows_by_submission_id.get(submission_id, [])
            if not matches:
                entry["match_status"] = "missing_match"
            elif len(matches) != 1:
                entry["match_status"] = "multiple_matches"
            elif matches[0] is None:
                entry["match_status"] = "invalid_source_data"
            elif not matches[0]:
                entry["match_status"] = "no_meaningful_answers"
            else:
                entry["match_status"] = "matched"
                entry["meaningful_pair_count"] = len(matches[0])
                entry["proposed_question_answer_pairs"] = matches[0]
        plan.append(entry)
    return plan, invalid_source_rows


def _public_plan_entry(entry):
    return {
        key: value
        for key, value in entry.items()
        if not key.startswith("_")
    }


def _counts(plan, invalid_source_rows=0):
    statuses = [entry["match_status"] for entry in plan]
    return {
        "would_update": statuses.count("matched") + statuses.count("updated"),
        "updated": statuses.count("updated"),
        "skipped": sum(
            status not in {"matched", "updated", "failed"}
            for status in statuses
        ),
        "failed": statuses.count("failed"),
        "invalid_source_rows": invalid_source_rows,
    }


def _write_json_new(path, payload):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("x", encoding="utf-8") as output:
        json.dump(payload, output, ensure_ascii=False, indent=2, allow_nan=False)
        output.write("\n")


def _update_form_answers(supabase, entry):
    experience = entry["_experience"]
    query = (
        supabase.table("experiences")
        .update({"form_answers": entry["proposed_question_answer_pairs"]})
        .eq("id", entry["experience_id"])
        .eq("source_type", "form")
        .eq("submission_id", entry["submission_id"])
    )
    if experience.get("form_answers") is None:
        query = query.is_("form_answers", "null")
    else:
        query = query.eq("form_answers", "[]")
    response = query.select("id").execute()
    updated = response.data or []
    if not isinstance(updated, list):
        raise TypeError("Supabase returned an invalid update response")
    return len(updated)


def run_backfill(
    supabase,
    sheet_rows,
    *,
    apply=False,
    report_path,
    backup_path=None,
):
    experiences = _fetch_form_experiences(supabase)
    plan, invalid_source_rows = _plan_backfill(experiences, sheet_rows)
    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "mode": "apply" if apply else "dry-run",
        "summary": _counts(plan, invalid_source_rows),
        "records": [_public_plan_entry(entry) for entry in plan],
    }
    for entry in plan:
        logger.info(
            "Backfill plan experience_id=%s status=%s pairs=%d",
            entry["experience_id"],
            entry["match_status"],
            entry["meaningful_pair_count"],
        )

    if not apply:
        _write_json_new(report_path, report)
        return report

    updates = [entry for entry in plan if entry["match_status"] == "matched"]
    backup_path = Path(backup_path) if backup_path else Path(report_path).with_name(
        f"{Path(report_path).stem}_backup.json"
    )
    if updates:
        report["backup_file"] = str(backup_path)
        backup = {
            "generated_at": report["generated_at"],
            "records": [
                {
                    "experience_id": entry["experience_id"],
                    "submission_id": entry["submission_id"],
                    "form_answers": entry["current_form_answers"],
                }
                for entry in updates
            ],
        }
        _write_json_new(backup_path, backup)

    _write_json_new(report_path, report)
    for entry in updates:
        try:
            if _update_form_answers(supabase, entry) == 1:
                entry["match_status"] = "updated"
            else:
                entry["match_status"] = "skipped_changed_since_preview"
        except Exception as exc:
            entry["match_status"] = "failed"
            logger.error(
                "Backfill update failed for experience_id=%s (%s)",
                entry["experience_id"],
                type(exc).__name__,
            )

    report["summary"] = _counts(plan, invalid_source_rows)
    report["records"] = [_public_plan_entry(entry) for entry in plan]
    with Path(report_path).open("w", encoding="utf-8") as output:
        json.dump(report, output, ensure_ascii=False, indent=2, allow_nan=False)
        output.write("\n")
    return report


def _default_report_path():
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    return Path.cwd() / f"form_answers_backfill_report_{timestamp}.json"


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--dry-run", action="store_true", help="Preview only (the default)")
    mode.add_argument("--apply", action="store_true", help="Update matched form experiences")
    parser.add_argument("--report", type=Path, default=_default_report_path())
    parser.add_argument("--backup", type=Path)
    args = parser.parse_args(argv)

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    try:
        get_sheet_data = load_shared_module("google_sheets").get_sheet_data
        supabase = load_shared_module("supabase_client").supabase
        report = run_backfill(
            supabase,
            get_sheet_data(),
            apply=args.apply,
            report_path=args.report,
            backup_path=args.backup,
        )
    except Exception as exc:
        logger.error("Form-answer backfill stopped (%s)", type(exc).__name__)
        return 1

    logger.info(
        "Backfill finished mode=%s would_update=%d updated=%d skipped=%d failed=%d report=%s",
        report["mode"],
        report["summary"]["would_update"],
        report["summary"]["updated"],
        report["summary"]["skipped"],
        report["summary"]["failed"],
        args.report,
    )
    if args.apply and report["summary"]["would_update"]:
        logger.info("Pre-update backup: %s", report.get("backup_file"))
    return 1 if report["summary"]["failed"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
