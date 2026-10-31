import json
import os
import sys
import tempfile
import unittest
from pathlib import Path


BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from backfill_form_answers import run_backfill
from ingestion_worker import _submission_id_for_row

_UNSET = object()


class FakeResponse:
    def __init__(self, data):
        self.data = data


class FakeQuery:
    def __init__(self, database):
        self.database = database
        self.filters = []
        self.page_range = None
        self.update_values = None

    def select(self, _columns):
        return self

    def eq(self, column, value):
        self.filters.append((column, "eq", value))
        return self

    def is_(self, column, value):
        self.filters.append((column, "is", value))
        return self

    def range(self, start, end):
        self.page_range = (start, end)
        return self

    def update(self, values):
        self.update_values = values
        return self

    def execute(self):
        records = self.database.records
        if self.update_values is None:
            selected = [
                record for record in records
                if self._matches(record)
            ]
            start, end = self.page_range
            return FakeResponse(selected[start:end + 1])

        updated = []
        if self.database.before_update:
            self.database.before_update()
        for record in records:
            if self._matches(record):
                record.update(self.update_values)
                updated.append({"id": record["id"]})
        self.database.update_count += len(updated)
        return FakeResponse(updated)

    def _matches(self, record):
        for column, operator, value in self.filters:
            current = record.get(column)
            if operator == "eq":
                if column == "form_answers" and value == "[]":
                    if current != []:
                        return False
                elif current != value:
                    return False
            elif operator == "is" and not (value == "null" and current is None):
                return False
        return True


class FakeSupabase:
    def __init__(self, records):
        self.records = [dict(record) for record in records]
        self.update_count = 0
        self.before_update = None

    def table(self, _name):
        return FakeQuery(self)


def _experience(submission_id, *, form_answers=_UNSET, source_type="form", **extra):
    if form_answers is _UNSET:
        form_answers = []
    return {
        "id": extra.pop("id", "experience-1"),
        "source_type": source_type,
        "submission_id": submission_id,
        "form_answers": form_answers,
        "content": "Existing content stays",
        "questions": [{"question": "Existing question"}],
        "advice": [{"advice": "Existing advice"}],
        **extra,
    }


class FormAnswersBackfillTests(unittest.TestCase):
    def _run(self, records, rows, *, apply=False):
        temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(temp_dir.cleanup)
        report_path = Path(temp_dir.name) / "preview.json"
        backup_path = Path(temp_dir.name) / "backup.json"
        database = FakeSupabase(records)
        report = run_backfill(
            database,
            rows,
            apply=apply,
            report_path=report_path,
            backup_path=backup_path,
        )
        return database, report, report_path, backup_path

    def test_exact_timestamp_generated_submission_id_matches(self):
        timestamp = "2026-09-15T16:14:12.000Z"
        submission_id = f"google-form:{timestamp}"
        self.assertEqual(
            _submission_id_for_row({"Timestamp": timestamp}),
            submission_id,
        )
        database, report, _, _ = self._run(
            [_experience(submission_id)],
            [{"Timestamp": timestamp, "What happened?": "No"}],
        )
        self.assertEqual(report["records"][0]["match_status"], "matched")
        self.assertEqual(database.update_count, 0)

    def test_nearby_or_missing_submission_id_does_not_match(self):
        database, report, _, _ = self._run(
            [_experience("google-form:2026-09-15T16:14:12.000Z")],
            [{"Timestamp": "2026-09-15T16:14:13.000Z", "Answer": "No"}],
        )
        self.assertEqual(report["records"][0]["match_status"], "missing_match")
        self.assertEqual(database.update_count, 0)

        _, report, _, _ = self._run(
            [_experience("submission-1")],
            [{"Timestamp": "2026-09-15T16:14:12.000Z", "Answer": "No"}],
        )
        self.assertEqual(report["records"][0]["match_status"], "missing_match")

    def test_duplicate_source_matches_are_skipped(self):
        row = {"submission_id": "submission-1", "Question": "Answer"}
        database, report, _, _ = self._run(
            [_experience("submission-1")],
            [row, dict(row)],
        )
        self.assertEqual(report["records"][0]["match_status"], "multiple_matches")
        self.assertEqual(report["summary"]["skipped"], 1)
        self.assertEqual(database.update_count, 0)

    def test_missing_source_match_is_reported_without_update(self):
        database, report, _, _ = self._run(
            [_experience("submission-1")],
            [{"submission_id": "other-submission", "Question": "Answer"}],
        )
        self.assertEqual(report["records"][0]["match_status"], "missing_match")
        self.assertEqual(database.update_count, 0)

    def test_empty_excluded_and_meaningful_short_answers(self):
        row = {
            "submission_id": "submission-1",
            "legacy_submission_id": "legacy-1",
            "Name": "Private",
            "Email": "private@example.test",
            "Branch": "Engineering",
            "Department": "Engineering",
            "Branch/Department": "Engineering",
            "Company": "Acme",
            "Consent": "I agree",
            "Row ID": "internal",
            "Whitespace": " \n ",
            "Null answer": None,
            "No": "No",
            "Don't remember": "Don't remember",
            "Not Applicable": "Not Applicable",
            "Zero": 0,
            "False": False,
        }
        _, report, report_path, _ = self._run(
            [_experience("submission-1")],
            [row],
        )
        record = report["records"][0]
        self.assertEqual(record["match_status"], "matched")
        self.assertEqual(record["meaningful_pair_count"], 5)
        self.assertEqual(
            [pair["question"] for pair in record["proposed_question_answer_pairs"]],
            ["No", "Don't remember", "Not Applicable", "Zero", "False"],
        )
        self.assertEqual(record["current_form_answers"], [])
        saved_report = json.loads(report_path.read_text())
        self.assertEqual(saved_report["summary"]["would_update"], 1)
        self.assertNotIn("Private", report_path.read_text())
        self.assertNotIn("private@example.test", report_path.read_text())

    def test_all_empty_answers_are_not_proposed(self):
        _, report, _, _ = self._run(
            [_experience("submission-1")],
            [
                {
                    "submission_id": "submission-1",
                    "Blank": " \n ",
                    "Null": None,
                    "Consent": "private",
                }
            ],
        )
        self.assertEqual(report["records"][0]["match_status"], "no_meaningful_answers")
        self.assertEqual(report["records"][0]["proposed_question_answer_pairs"], [])
        self.assertEqual(report["summary"]["skipped"], 1)

    def test_invalid_source_data_is_skipped(self):
        _, report, _, _ = self._run(
            [_experience("submission-1")],
            [{"submission_id": "submission-1", "Question": float("nan")}],
        )
        self.assertEqual(report["records"][0]["match_status"], "invalid_source_data")
        self.assertEqual(report["summary"]["skipped"], 1)

    def test_apply_backs_up_before_update_and_rerun_skips_populated_record(self):
        temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(temp_dir.cleanup)
        report_path = Path(temp_dir.name) / "preview.json"
        backup_path = Path(temp_dir.name) / "backup.json"
        database = FakeSupabase([
            _experience("submission-1", id="form-target"),
            _experience(
                "pdf-source",
                id="pdf-record",
                source_type="pdf",
                form_answers=[],
            ),
            _experience(
                "already-populated",
                id="populated-record",
                form_answers=[{"question": "Existing", "answer": "Answer"}],
            ),
        ])
        database.before_update = lambda: self.assertTrue(backup_path.exists())
        report = run_backfill(
            database,
            [{"submission_id": "submission-1", "Question": "Answer"}],
            apply=True,
            report_path=report_path,
            backup_path=backup_path,
        )
        self.assertEqual(report["summary"]["updated"], 1)
        self.assertEqual(report["summary"]["would_update"], 1)
        self.assertTrue(backup_path.exists())
        backup = json.loads(backup_path.read_text())
        self.assertEqual(backup["records"][0]["form_answers"], [])
        self.assertEqual(database.records[0]["form_answers"], [
            {"question": "Question", "answer": "Answer"},
        ])
        self.assertEqual(database.records[0]["content"], "Existing content stays")
        self.assertEqual(database.records[0]["questions"], [{"question": "Existing question"}])
        self.assertEqual(database.records[0]["advice"], [{"advice": "Existing advice"}])
        self.assertEqual(database.records[1]["form_answers"], [])
        self.assertEqual(
            database.records[2]["form_answers"],
            [{"question": "Existing", "answer": "Answer"}],
        )

        rerun_report = run_backfill(
            database,
            [{"submission_id": "submission-1", "Question": "Answer"}],
            apply=True,
            report_path=report_path.with_name("rerun.json"),
            backup_path=backup_path.with_name("rerun_backup.json"),
        )
        self.assertEqual(rerun_report["records"], [])
        self.assertEqual(database.update_count, 1)


if __name__ == "__main__":
    unittest.main()
