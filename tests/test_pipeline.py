import importlib
import os
import sys
import types
import unittest
from unittest.mock import Mock, patch

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INGESTION_DIR = os.path.join(PROJECT_ROOT, "ingestion")
if INGESTION_DIR not in sys.path:
    sys.path.insert(0, INGESTION_DIR)


EXPERIENCE = {
    "source_file": "sample.pdf",
    "source_type": "pdf",
    "content": "A candidate described the interview process.",
    "company_name": "BridgeUp Labs",
}
EXTRACTION = {"questions": [], "advice": []}
EMBEDDING_SUCCESS = {"total": 0, "success": 0, "failed": 0, "results": []}


class PipelineTests(unittest.TestCase):
    def setUp(self):
        fake_google = types.ModuleType("google")
        fake_google_genai = types.ModuleType("google.genai")
        fake_google_genai.Client = Mock()
        fake_google.genai = fake_google_genai
        self.genai_client_constructor = fake_google_genai.Client

        fake_supabase_client = types.ModuleType("supabase_client")
        fake_supabase_client.supabase = Mock()

        sys.modules["google"] = fake_google
        sys.modules["google.genai"] = fake_google_genai
        sys.modules["supabase_client"] = fake_supabase_client
        for module_name in (
            "pipeline",
            "save_extraction",
            "chunk_experiences",
            "embed_questions_batch",
            "embed_advice_batch",
            "embed_chunks",
            "llm_extract",
        ):
            sys.modules.pop(module_name, None)

        self.pipeline = importlib.import_module("pipeline")
        self.database = fake_supabase_client.supabase
        table = Mock()
        table.insert.return_value.execute.return_value.data = [{"id": "exp-1"}]
        self.database.table.return_value = table

    def test_pipeline_and_embedding_helpers_import_without_external_calls(self):
        self.database.table.assert_not_called()
        self.genai_client_constructor.assert_not_called()

    def test_structured_extraction_result_does_not_import_gemini_extractor(self):
        self.configure_pipeline()
        sys.modules.pop("llm_extract", None)

        result = self.pipeline.process_experience(
            EXPERIENCE,
            extraction_result=EXTRACTION,
        )

        self.assertEqual(result["status"], "completed")
        self.assertNotIn("llm_extract", sys.modules)

    def test_pdf_adapter_passes_raw_text_and_stores_sanitized_text(self):
        fake_pymupdf = types.ModuleType("pymupdf")
        fake_pymupdf.open = Mock()
        fake_privacy = types.ModuleType("privacy")
        fake_privacy.sanitize_text = Mock(return_value="sanitized PDF text")

        with patch.dict(
            sys.modules,
            {"pymupdf": fake_pymupdf, "privacy": fake_privacy},
        ):
            sys.modules.pop("pdf_ingest", None)
            pdf_ingest = importlib.import_module("pdf_ingest")
            self.addCleanup(lambda: sys.modules.pop("pdf_ingest", None))
            fake_pymupdf.open.assert_not_called()
            self.database.table.assert_not_called()
            self.genai_client_constructor.assert_not_called()

            with patch.object(pdf_ingest, "extract_text_from_pdf", return_value="raw PDF text"):
                with patch.object(
                    pdf_ingest,
                    "process_experience",
                    return_value={"status": "completed", "experience_id": "exp-1"},
                ) as process:
                    result = pdf_ingest.ingest_pdf(types.SimpleNamespace(name="sample.pdf"))

        self.assertEqual(result["status"], "completed")
        fake_privacy.sanitize_text.assert_called_once_with("raw PDF text")
        experience = process.call_args.args[0]
        self.assertEqual(experience["content"], "sanitized PDF text")
        self.assertEqual(process.call_args.kwargs["extraction_text"], "raw PDF text")

    def test_form_ingest_import_does_not_fetch_or_write(self):
        fake_dotenv = types.ModuleType("dotenv")
        fake_dotenv.load_dotenv = Mock()
        fake_supabase = types.ModuleType("supabase")
        fake_database = Mock()
        fake_supabase.create_client = Mock(return_value=fake_database)
        fake_sheets = types.ModuleType("google_sheets")
        fake_sheets.get_sheet_data = Mock()

        with patch.dict(
            sys.modules,
            {
                "dotenv": fake_dotenv,
                "supabase": fake_supabase,
                "google_sheets": fake_sheets,
            },
        ):
            sys.modules.pop("ingest", None)
            importlib.import_module("ingest")
            self.addCleanup(lambda: sys.modules.pop("ingest", None))

        fake_sheets.get_sheet_data.assert_not_called()
        fake_database.table.assert_not_called()
        self.genai_client_constructor.assert_not_called()

    def test_form_resource_insert_retries_without_duplicate_resources(self):
        class ResourceQuery:
            def __init__(self, database):
                self.database = database
                self.operation = "select"
                self.fields = []
                self.filters = {}
                self.rows = []

            def select(self, fields):
                self.operation = "select"
                self.fields = fields.split(",")
                return self

            def eq(self, field, value):
                self.filters[field] = value
                return self

            def insert(self, rows):
                self.operation = "insert"
                self.rows = rows
                return self

            def execute(self):
                if self.operation == "insert":
                    self.database.insert_attempts += 1
                    if self.database.fail_next_insert:
                        self.database.fail_next_insert = False
                        raise RuntimeError("temporary resource insert failure")
                    self.database.resources.extend(self.rows)
                    return types.SimpleNamespace(data=self.rows)

                data = [
                    {
                        field: resource.get(field)
                        for field in self.fields
                    }
                    for resource in self.database.resources
                    if all(
                        resource.get(field) == value
                        for field, value in self.filters.items()
                    )
                ]
                return types.SimpleNamespace(data=data)

        class ResourceDatabase:
            def __init__(self):
                self.resources = []
                self.fail_next_insert = True
                self.insert_attempts = 0

            def table(self, _name):
                return ResourceQuery(self)

        fake_dotenv = types.ModuleType("dotenv")
        fake_dotenv.load_dotenv = Mock()
        fake_supabase = types.ModuleType("supabase")
        fake_database = ResourceDatabase()
        fake_supabase.create_client = Mock(return_value=fake_database)
        fake_sheets = types.ModuleType("google_sheets")
        form_row = {
            "Timestamp": "2026-10-11 09:00",
            "Name": "Alex",
            "Company ": "Acme",
        }
        fake_sheets.get_sheet_data = Mock(return_value=[form_row, form_row, form_row])
        fake_transform = types.ModuleType("transform")
        fake_transform.transform_experience = Mock()
        fake_transform.transform_questions = Mock()
        fake_transform.transform_advice = Mock()
        fake_transform.transform_resources = Mock(return_value={
            "links": "https://example.test/prep",
            "study_material": None,
        })

        result = {"status": "completed", "experience_id": "exp-1", "duplicate": False}
        duplicate_result = {"status": "completed", "experience_id": "exp-1", "duplicate": True}

        with patch.dict(
            sys.modules,
            {
                "dotenv": fake_dotenv,
                "supabase": fake_supabase,
                "google_sheets": fake_sheets,
                "transform": fake_transform,
            },
        ):
            sys.modules.pop("ingest", None)
            ingest = importlib.import_module("ingest")
            self.addCleanup(lambda: sys.modules.pop("ingest", None))
            with patch.object(
                ingest,
                "process_form_response",
                side_effect=[result, duplicate_result, duplicate_result],
            ):
                ingest.main()

        self.assertEqual(fake_sheets.get_sheet_data.call_count, 1)
        self.assertEqual(fake_database.insert_attempts, 2)
        self.assertEqual(len(fake_database.resources), 1)
        self.assertEqual(fake_database.resources[0]["title"], "Shared Links")
        self.assertEqual(fake_database.resources[0]["url"], "https://example.test/prep")

    def test_pdf_deduplication_uses_source_file(self):
        query = Mock()
        query.select.return_value = query
        query.eq.return_value = query
        query.limit.return_value = query
        query.execute.return_value.data = [{"id": "exp-existing"}]
        self.pipeline.supabase.table.return_value = query

        existing = self.pipeline._find_existing_experience(
            "pdf",
            "source_file",
            "sample.pdf",
        )

        self.assertEqual(existing["id"], "exp-existing")
        query.eq.assert_any_call("source_type", "pdf")
        query.eq.assert_any_call("source_file", "sample.pdf")

    def configure_pipeline(self, existing=None):
        mocks = {}

        def mocked(name, **kwargs):
            function_patch = patch.object(self.pipeline, name, **kwargs)
            mocks[name] = function_patch.start()
            self.addCleanup(function_patch.stop)
            return mocks[name]

        mocked("_find_existing_experience", return_value=existing)
        mocked("_has_extraction_rows", return_value=False)
        mocked("_set_extraction_status")
        mocked("get_or_create_company", return_value="company-1")
        mocked("save_extraction")
        mocked("create_chunks_for_experience", return_value=2)
        mocked("embed_questions_for_experience", return_value=EMBEDDING_SUCCESS)
        mocked("embed_advice_for_experience", return_value=EMBEDDING_SUCCESS)
        mocked("embed_chunks_for_experience", return_value=2)
        return mocks

    def test_success_runs_pipeline_in_order(self):
        mocks = self.configure_pipeline()
        events = []
        mocks["get_or_create_company"].side_effect = lambda _name: events.append("company") or "company-1"
        self.database.table.return_value.insert.return_value.execute.side_effect = (
            lambda: events.append("experience")
            or types.SimpleNamespace(data=[{"id": "exp-1"}])
        )
        mocks["_set_extraction_status"].side_effect = (
            lambda _experience_id, status: events.append(f"status:{status}")
        )
        extractor = Mock(side_effect=lambda _text: events.append("extract") or EXTRACTION)
        mocks["save_extraction"].side_effect = lambda *_args, **_kwargs: events.append("save_extraction")
        mocks["create_chunks_for_experience"].side_effect = lambda *_args: events.append("create_chunks") or 2
        mocks["embed_questions_for_experience"].side_effect = lambda *_args: events.append("embed_questions") or EMBEDDING_SUCCESS
        mocks["embed_advice_for_experience"].side_effect = lambda *_args: events.append("embed_advice") or EMBEDDING_SUCCESS
        mocks["embed_chunks_for_experience"].side_effect = lambda *_args: events.append("embed_chunks") or 2

        result = self.pipeline.process_experience(
            EXPERIENCE,
            extraction_text="Original PDF text",
            extractor=extractor,
        )

        self.assertEqual(result["status"], "completed")
        self.assertEqual(result["experience_id"], "exp-1")
        self.assertFalse(result["duplicate"])
        self.assertEqual(
            events,
            [
                "company",
                "experience",
                "status:processing",
                "extract",
                "save_extraction",
                "status:completed",
                "create_chunks",
                "embed_questions",
                "embed_advice",
                "embed_chunks",
            ],
        )
        extractor.assert_called_once_with("Original PDF text")
        mocks["save_extraction"].assert_called_once_with(
            "exp-1",
            EXTRACTION,
            reprocess=False,
        )

    def test_duplicate_input_resumes_without_recreating_experience_or_extraction(self):
        mocks = self.configure_pipeline(
            existing={"id": "exp-existing", "extraction_status": "completed"}
        )
        mocks["_has_extraction_rows"].return_value = True

        result = self.pipeline.process_experience(
            EXPERIENCE,
            extractor=Mock(),
        )

        self.assertEqual(result["status"], "completed")
        self.assertTrue(result["duplicate"])
        self.assertEqual(result["experience_id"], "exp-existing")
        self.database.table.return_value.insert.assert_not_called()
        mocks["get_or_create_company"].assert_not_called()
        mocks["save_extraction"].assert_not_called()
        mocks["embed_questions_for_experience"].assert_called_once_with("exp-existing")

    def test_completed_duplicate_backfills_using_supplied_form_extraction(self):
        mocks = self.configure_pipeline(
            existing={"id": "exp-existing", "extraction_status": "completed"}
        )

        result = self.pipeline.process_experience(
            EXPERIENCE,
            extraction_result=EXTRACTION,
            extractor=Mock(side_effect=AssertionError("Form retries must not call Gemini")),
        )

        self.assertEqual(result["status"], "completed")
        self.assertTrue(result["duplicate"])
        self.assertEqual(result["experience_id"], "exp-existing")
        self.database.table.return_value.insert.assert_not_called()
        mocks["save_extraction"].assert_called_once_with(
            "exp-existing",
            EXTRACTION,
            reprocess=False,
        )

    def test_explicit_reprocess_forwards_destructive_flag_to_saver(self):
        mocks = self.configure_pipeline(
            existing={"id": "exp-existing", "extraction_status": "completed"}
        )

        result = self.pipeline.process_experience(
            EXPERIENCE,
            extraction_result=EXTRACTION,
            reprocess=True,
        )

        self.assertEqual(result["status"], "completed")
        mocks["save_extraction"].assert_called_once_with(
            "exp-existing",
            EXTRACTION,
            reprocess=True,
        )

    def test_deduplication_uses_form_submission_id(self):
        query = Mock()
        query.select.return_value = query
        query.eq.return_value = query
        query.limit.return_value = query
        query.execute.return_value.data = [{"id": "exp-existing"}]
        self.pipeline.supabase.table.return_value = query

        existing = self.pipeline._find_existing_experience(
            "form",
            "submission_id",
            "2026-10-10",
        )

        self.assertEqual(existing["id"], "exp-existing")
        query.eq.assert_any_call("source_type", "form")
        query.eq.assert_any_call("submission_id", "2026-10-10")

    def test_form_submission_id_is_stable_when_timestamp_changes(self):
        response = {"Timestamp": "2026-10-10 10:00", "Name": "Alex", "Company ": "Acme"}
        retried_response = {**response, "Timestamp": "2026-10-10 10:05"}

        submission_id = self.pipeline.get_form_submission_id(response)

        self.assertEqual(
            submission_id,
            self.pipeline.get_form_submission_id(retried_response),
        )
        self.assertTrue(submission_id.startswith("form:"))
        self.assertEqual(
            self.pipeline.get_form_submission_id({"submission_id": "stable-123"}),
            "stable-123",
        )

    def test_legacy_timestamp_form_record_is_reused_and_promoted(self):
        mocks = self.configure_pipeline()
        existing = {"id": "legacy-exp", "extraction_status": "completed"}
        mocks["_find_existing_experience"].side_effect = [None, existing]
        experience = {
            "submission_id": "form:stable-fingerprint",
            "legacy_submission_id": "2026-10-10 10:00",
            "source_type": "form",
            "content": "A response.",
        }

        result = self.pipeline.process_experience(
            experience,
            extraction_result=EXTRACTION,
        )

        self.assertEqual(result["status"], "completed")
        self.assertEqual(result["experience_id"], "legacy-exp")
        self.assertTrue(result["duplicate"])
        self.assertEqual(
            mocks["_find_existing_experience"].call_args_list,
            [
                unittest.mock.call("form", "submission_id", "form:stable-fingerprint"),
                unittest.mock.call("form", "submission_id", "2026-10-10 10:00"),
            ],
        )
        self.database.table.return_value.update.assert_called_once_with(
            {"submission_id": "form:stable-fingerprint"}
        )
        self.database.table.return_value.insert.assert_not_called()

    def test_duplicate_lookup_failure_reports_stage(self):
        mocks = self.configure_pipeline()
        mocks["_find_existing_experience"].side_effect = RuntimeError("lookup failed")

        result = self.pipeline.process_experience(EXPERIENCE)

        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["failed_step"], "deduplicate")
        self.assertIsNone(result["experience_id"])
        self.database.table.return_value.insert.assert_not_called()

    def test_form_response_passes_structured_content_to_shared_pipeline(self):
        transform = types.ModuleType("transform")
        transform.transform_experience = Mock(return_value={
            "company": "Acme",
            "role": "Engineer",
            "package": None,
            "opportunity_type": None,
            "selection_status": None,
            "interview_date": None,
            "difficulty": None,
            "preparation_duration": None,
            "rounds": None,
            "online_assessment": None,
            "interview_experience": None,
            "technical_interview": None,
            "programming_languages": None,
            "unexpected": None,
            "preparation_strategy": None,
            "useful_topics": None,
            "mistakes": None,
            "advice": None,
            "wish_known": None,
            "consent": "I Agree",
        })
        transform.transform_questions = Mock(return_value={
            "oa_aptitude": None,
            "oa_coding": None,
            "technical_questions": "Explain a hash map.",
            "project_questions": None,
            "internship_questions": None,
            "technical_aptitude": None,
            "hr_questions": None,
        })
        transform.transform_advice = Mock(return_value={
            "preparation_strategy": None,
            "useful_topics": None,
            "mistakes": None,
            "advice": "Practice explaining tradeoffs.",
            "wish_known": None,
        })
        expected_result = {"status": "completed"}
        row = {"Timestamp": "2026-10-10", "Name": "Alex", "Company ": "Acme"}

        with patch.dict(sys.modules, {"transform": transform}):
            with patch.object(self.pipeline, "process_experience", return_value=expected_result) as process:
                result = self.pipeline.process_form_response(row)

        self.assertEqual(result, expected_result)
        experience = process.call_args.args[0]
        self.assertEqual(
            experience["submission_id"],
            self.pipeline.get_form_submission_id(row),
        )
        self.assertEqual(experience["source_type"], "form")
        self.assertEqual(experience["company_name"], "Acme")
        self.assertEqual(
            experience["content"],
            "Explain a hash map.\n\nPractice explaining tradeoffs.",
        )
        self.assertEqual(
            process.call_args.kwargs["extraction_result"]["questions"][0]["question"],
            "Explain a hash map.",
        )
        self.assertEqual(
            process.call_args.kwargs["extraction_result"]["advice"][0]["type"],
            "advice",
        )

    def test_invalid_form_response_reports_validation_failure(self):
        result = self.pipeline.process_form_response(None)

        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["failed_step"], "validate")
        self.assertEqual(result["error"], "form response must be a dictionary")
        self.assertIsNone(result["experience_id"])

    def test_form_transformation_failure_stops_pipeline(self):
        transform = types.ModuleType("transform")
        transform.transform_experience = Mock(return_value={
            "company": "Acme",
            "role": "Engineer",
            "package": None,
            "opportunity_type": None,
            "selection_status": None,
            "interview_date": None,
            "difficulty": None,
            "preparation_duration": None,
            "rounds": "Round one",
            "online_assessment": None,
            "interview_experience": None,
            "technical_interview": None,
            "programming_languages": None,
            "unexpected": None,
            "preparation_strategy": None,
            "useful_topics": None,
            "mistakes": None,
            "advice": None,
            "wish_known": None,
            "consent": "I Agree",
        })
        transform.transform_questions = Mock(side_effect=ValueError("questions are malformed"))
        transform.transform_advice = Mock()

        with patch.dict(sys.modules, {"transform": transform}):
            with patch.object(self.pipeline, "process_experience") as process:
                result = self.pipeline.process_form_response({
                    "Timestamp": "2026-10-10",
                    "Name": "Alex",
                    "Company ": "Acme",
                })

        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["failed_step"], "transform_form")
        self.assertIsNone(result["experience_id"])
        self.assertIn("questions are malformed", result["error"])
        transform.transform_experience.assert_called_once()
        transform.transform_questions.assert_called_once()
        transform.transform_advice.assert_not_called()
        process.assert_not_called()
        self.database.table.assert_not_called()

    def test_invalid_input_reports_validation_step(self):
        result = self.pipeline.process_experience({"source_type": "pdf", "content": "text"})

        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["failed_step"], "validate")
        self.assertIsNone(result["experience_id"])

    def test_company_resolution_failure_reports_step(self):
        mocks = self.configure_pipeline()
        mocks["get_or_create_company"].side_effect = RuntimeError("company lookup failed")

        result = self.pipeline.process_experience(EXPERIENCE)

        self.assertEqual(result["failed_step"], "resolve_company")
        self.assertEqual(result["experience_id"], None)

    def test_experience_insert_failure_reports_step(self):
        mocks = self.configure_pipeline()
        self.database.table.return_value.insert.return_value.execute.side_effect = RuntimeError(
            "insert failed"
        )

        result = self.pipeline.process_experience(EXPERIENCE)

        self.assertEqual(result["failed_step"], "save_experience")
        self.assertEqual(result["experience_id"], None)
        mocks["save_extraction"].assert_not_called()

    def test_extraction_failure_reports_experience_and_stops_later_stages(self):
        mocks = self.configure_pipeline()

        def fail_extraction(_text):
            raise RuntimeError("extract failed")

        result = self.pipeline.process_experience(EXPERIENCE, extractor=fail_extraction)

        self.assertEqual(result["failed_step"], "extract")
        self.assertEqual(result["experience_id"], "exp-1")
        self.assertEqual(result["error"], "extract failed")
        mocks["save_extraction"].assert_not_called()
        mocks["create_chunks_for_experience"].assert_not_called()
        self.assertEqual(mocks["_set_extraction_status"].call_args_list[-1].args[1], "failed")

    def test_extraction_failure_can_retry_without_duplicate_experience_or_rows(self):
        mocks = self.configure_pipeline()
        existing = {"id": "exp-1", "extraction_status": "failed"}
        mocks["_find_existing_experience"].side_effect = [None, existing]
        extraction_calls = []
        saved_questions = []
        saved_advice = []

        def extractor(_text):
            extraction_calls.append(True)
            if len(extraction_calls) == 1:
                raise RuntimeError("temporary extraction failure")
            return {
                "questions": [{"question": "Explain a heap."}],
                "advice": [{"type": "preparation", "content": "Practice heaps."}],
            }

        def save_extraction(_experience_id, result, reprocess=False):
            self.assertFalse(reprocess)
            for question in result["questions"]:
                if question not in saved_questions:
                    saved_questions.append(question)
            for advice in result["advice"]:
                if advice not in saved_advice:
                    saved_advice.append(advice)

        mocks["save_extraction"].side_effect = save_extraction
        first_result = self.pipeline.process_experience(EXPERIENCE, extractor=extractor)
        retry_result = self.pipeline.process_experience(EXPERIENCE, extractor=extractor)

        self.assertEqual(first_result["status"], "failed")
        self.assertEqual(first_result["failed_step"], "extract")
        self.assertEqual(first_result["experience_id"], "exp-1")
        self.assertEqual(retry_result["status"], "completed")
        self.assertEqual(retry_result["experience_id"], "exp-1")
        self.assertTrue(retry_result["duplicate"])
        self.assertEqual(len(extraction_calls), 2)
        self.assertEqual(len(saved_questions), 1)
        self.assertEqual(len(saved_advice), 1)
        self.database.table.return_value.insert.assert_called_once()

    def test_extraction_save_failure_reports_persistence_step(self):
        mocks = self.configure_pipeline()
        mocks["save_extraction"].side_effect = RuntimeError("save extraction failed")

        result = self.pipeline.process_experience(EXPERIENCE, extractor=Mock(return_value=EXTRACTION))

        self.assertEqual(result["failed_step"], "save_extraction")
        self.assertEqual(result["experience_id"], "exp-1")
        self.assertEqual(result["error"], "save extraction failed")
        mocks["create_chunks_for_experience"].assert_not_called()

    def test_chunk_creation_failure_reports_step(self):
        mocks = self.configure_pipeline()
        mocks["create_chunks_for_experience"].side_effect = RuntimeError("chunk creation failed")

        result = self.pipeline.process_experience(EXPERIENCE, extraction_result=EXTRACTION)

        self.assertEqual(result["failed_step"], "create_chunks")
        self.assertEqual(result["experience_id"], "exp-1")
        mocks["embed_questions_for_experience"].assert_not_called()

    def test_question_embedding_failures_include_record_details(self):
        mocks = self.configure_pipeline()
        mocks["embed_questions_for_experience"].return_value = {
            "total": 1,
            "success": 0,
            "failed": 1,
            "results": [
                {
                    "question_id": "q-1",
                    "status": "failed",
                    "error": "Gemini failed",
                    "embedding": None,
                }
            ],
        }

        result = self.pipeline.process_experience(EXPERIENCE, extraction_result=EXTRACTION)

        self.assertEqual(result["failed_step"], "embed_questions")
        self.assertEqual(result["failure_details"], [{"question_id": "q-1", "error": "Gemini failed"}])
        mocks["embed_advice_for_experience"].assert_not_called()

    def test_embedding_summary_accepts_valid_all_success_result(self):
        result = {
            "total": 2,
            "success": 2,
            "failed": 0,
            "results": [
                {"question_id": "q-1", "status": "success", "error": None, "embedding": [0.1]},
                {"question_id": "q-2", "status": "success", "error": None, "embedding": [0.2]},
            ],
        }

        summary = self.pipeline._embedding_summary(result, "question_id")

        self.assertEqual(summary, {
            "total": 2,
            "success": 2,
            "failed": 0,
            "failures": [],
        })

    def test_embedding_summary_preserves_aggregate_failures(self):
        result = {
            "total": 1,
            "success": 0,
            "failed": 1,
            "results": [
                {"advice_id": "a-1", "status": "failed", "error": "API unavailable", "embedding": None}
            ],
        }

        summary = self.pipeline._embedding_summary(result, "advice_id")

        self.assertEqual(summary["failed"], 1)
        self.assertEqual(summary["failures"], [{"advice_id": "a-1", "error": "API unavailable"}])

    def test_failed_record_is_rejected_even_when_aggregate_failed_is_zero(self):
        mocks = self.configure_pipeline()
        mocks["embed_questions_for_experience"].return_value = {
            "total": 1,
            "success": 1,
            "failed": 0,
            "results": [
                {"question_id": "q-1", "status": "failed", "error": "API unavailable", "embedding": None}
            ],
        }

        result = self.pipeline.process_experience(EXPERIENCE, extraction_result=EXTRACTION)

        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["failed_step"], "embed_questions")
        self.assertEqual(result["experience_id"], "exp-1")
        self.assertIn("per-record statuses", result["error"])
        self.assertEqual(result["failure_details"][0]["question_id"], "q-1")
        mocks["embed_advice_for_experience"].assert_not_called()

    def test_malformed_embedding_results_are_rejected(self):
        valid_record = {
            "question_id": "q-1",
            "status": "success",
            "error": None,
            "embedding": [0.1],
        }
        invalid_results = [
            (None, "dictionary"),
            ({"success": 0, "failed": 0, "results": []}, "missing fields"),
            ({"total": "1", "success": 1, "failed": 0, "results": [valid_record]}, "non-negative integer"),
            ({"total": True, "success": 1, "failed": 0, "results": [valid_record]}, "non-negative integer"),
            ({"total": -1, "success": 0, "failed": 0, "results": []}, "non-negative integer"),
            ({"total": 1, "success": 0, "failed": 0, "results": [valid_record]}, "total must equal"),
            ({"total": 1, "success": 1, "failed": 0, "results": None}, "must be a list"),
            ({"total": 1, "success": 1, "failed": 0, "results": [None]}, "malformed records"),
            ({"total": 1, "success": 1, "failed": 0, "results": [{**valid_record, "status": "pending"}]}, "malformed records"),
            ({"total": 1, "success": 1, "failed": 0, "results": [{"status": "success", "error": None, "embedding": [0.1]}]}, "malformed records"),
            ({"total": 1, "success": 1, "failed": 0, "results": [{"question_id": "q-1", "status": "success", "error": None}]}, "malformed records"),
            ({"total": 1, "success": 1, "failed": 0, "results": [valid_record, valid_record]}, "number of per-record"),
        ]

        for result, message in invalid_results:
            with self.subTest(result=result):
                with self.assertRaisesRegex(ValueError, message):
                    self.pipeline._embedding_summary(result, "question_id")

        valid_result = {
            "total": 1,
            "success": 1,
            "failed": 0,
            "results": [valid_record],
        }
        for field in ("total", "success", "failed"):
            for invalid_count in (-1, True, "1"):
                with self.subTest(field=field, invalid_count=invalid_count):
                    result = {**valid_result, field: invalid_count}
                    with self.assertRaisesRegex(ValueError, "non-negative integer"):
                        self.pipeline._embedding_summary(result, "question_id")

    def test_invalid_structured_embedding_result_cannot_complete_pipeline(self):
        mocks = self.configure_pipeline()
        mocks["embed_questions_for_experience"].return_value = {
            "total": 1,
            "success": 1,
            "failed": 0,
            "results": [],
        }

        result = self.pipeline.process_experience(EXPERIENCE, extraction_result=EXTRACTION)

        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["failed_step"], "embed_questions")
        self.assertEqual(result["experience_id"], "exp-1")
        self.assertIn("per-record results", result["error"])
        mocks["embed_chunks_for_experience"].assert_not_called()

    def test_chunk_embedding_keeps_integer_count_contract(self):
        mocks = self.configure_pipeline()
        mocks["embed_chunks_for_experience"].return_value = "1"

        result = self.pipeline.process_experience(EXPERIENCE, extraction_result=EXTRACTION)

        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["failed_step"], "embed_chunks")
        self.assertEqual(result["experience_id"], "exp-1")
        self.assertIn("integer count", result["error"])

    def test_advice_embedding_failure_reports_step(self):
        mocks = self.configure_pipeline()
        mocks["embed_advice_for_experience"].return_value = {
            "total": 1,
            "success": 0,
            "failed": 1,
            "results": [
                {
                    "advice_id": "a-1",
                    "status": "failed",
                    "error": "update failed",
                    "embedding": None,
                }
            ],
        }

        result = self.pipeline.process_experience(EXPERIENCE, extraction_result=EXTRACTION)

        self.assertEqual(result["failed_step"], "embed_advice")
        self.assertEqual(result["failure_details"][0]["advice_id"], "a-1")
        mocks["embed_chunks_for_experience"].assert_not_called()

    def test_chunk_embedding_exception_reports_step(self):
        mocks = self.configure_pipeline()
        mocks["embed_chunks_for_experience"].side_effect = RuntimeError("chunk embedding failed")

        result = self.pipeline.process_experience(EXPERIENCE, extraction_result=EXTRACTION)

        self.assertEqual(result["failed_step"], "embed_chunks")
        self.assertEqual(result["experience_id"], "exp-1")
        self.assertEqual(result["error"], "chunk embedding failed")

    def test_retry_after_advice_failure_does_not_duplicate_or_reembed_saved_rows(self):
        mocks = self.configure_pipeline()
        records = {
            "experience": {
                "id": "exp-existing",
                "extraction_status": "completed",
            },
            "questions": [
                {"id": "q-embedded", "embedding": [0.1]},
                {"id": "q-pending", "embedding": None},
            ],
            "advice": [
                {"id": "a-embedded", "embedding": [0.2]},
                {"id": "a-pending", "embedding": None},
            ],
            "chunks": [
                {"id": "chunk-embedded", "embedding": [0.3]},
                {"id": "chunk-pending", "embedding": None},
            ],
        }
        question_attempts = []
        advice_attempts = []
        chunk_attempts = []
        advice_calls = 0

        mocks["_find_existing_experience"].side_effect = lambda *_args: records["experience"]
        mocks["create_chunks_for_experience"].return_value = 0

        def embed_questions(experience_id):
            self.assertEqual(experience_id, "exp-existing")
            pending = [row for row in records["questions"] if row["embedding"] is None]
            for row in pending:
                question_attempts.append(row["id"])
                row["embedding"] = [0.4]
            return {
                "total": len(pending),
                "success": len(pending),
                "failed": 0,
                "results": [
                    {
                        "question_id": row["id"],
                        "status": "success",
                        "error": None,
                        "embedding": [0.4],
                    }
                    for row in pending
                ],
            }

        def embed_advice(experience_id):
            nonlocal advice_calls
            self.assertEqual(experience_id, "exp-existing")
            advice_calls += 1
            pending = [row for row in records["advice"] if row["embedding"] is None]
            results = []
            for row in pending:
                advice_attempts.append(row["id"])
                if advice_calls == 1:
                    results.append({
                        "advice_id": row["id"],
                        "status": "failed",
                        "error": "temporary embedding failure",
                        "embedding": None,
                    })
                else:
                    row["embedding"] = [0.5]
                    results.append({
                        "advice_id": row["id"],
                        "status": "success",
                        "error": None,
                        "embedding": [0.5],
                    })
            failed = sum(item["status"] == "failed" for item in results)
            return {
                "total": len(pending),
                "success": len(pending) - failed,
                "failed": failed,
                "results": results,
            }

        def embed_chunks(experience_id):
            self.assertEqual(experience_id, "exp-existing")
            pending = [row for row in records["chunks"] if row["embedding"] is None]
            for row in pending:
                chunk_attempts.append(row["id"])
                row["embedding"] = [0.6]
            return len(pending)

        mocks["embed_questions_for_experience"].side_effect = embed_questions
        mocks["embed_advice_for_experience"].side_effect = embed_advice
        mocks["embed_chunks_for_experience"].side_effect = embed_chunks

        first_result = self.pipeline.process_experience(EXPERIENCE)
        counts_after_first = {
            key: len(records[key])
            for key in ("questions", "advice", "chunks")
        }
        retry_result = self.pipeline.process_experience(EXPERIENCE)

        self.assertEqual(first_result["status"], "failed")
        self.assertEqual(first_result["failed_step"], "embed_advice")
        self.assertEqual(first_result["experience_id"], "exp-existing")
        self.assertEqual(retry_result["status"], "completed")
        self.assertTrue(retry_result["duplicate"])
        self.assertEqual(retry_result["experience_id"], "exp-existing")
        self.assertEqual(records["experience"]["id"], "exp-existing")
        self.assertEqual(
            {key: len(records[key]) for key in counts_after_first},
            counts_after_first,
        )
        self.assertEqual(question_attempts, ["q-pending"])
        self.assertEqual(advice_attempts, ["a-pending", "a-pending"])
        self.assertEqual(chunk_attempts, ["chunk-pending"])
        mocks["save_extraction"].assert_not_called()
        self.database.table.return_value.insert.assert_not_called()

    def test_form_retry_after_partial_save_reuses_submission_and_backfills(self):
        transform = types.ModuleType("transform")
        transform.transform_experience = Mock(return_value={
            "company": "Acme",
            "role": "Engineer",
            "package": None,
            "opportunity_type": None,
            "selection_status": None,
            "interview_date": None,
            "difficulty": None,
            "preparation_duration": None,
            "rounds": "Round one was technical.",
            "online_assessment": None,
            "interview_experience": None,
            "technical_interview": None,
            "programming_languages": None,
            "unexpected": None,
            "preparation_strategy": None,
            "useful_topics": None,
            "mistakes": None,
            "advice": None,
            "wish_known": None,
            "consent": "I Agree",
        })
        transform.transform_questions = Mock(return_value={
            "oa_aptitude": None,
            "oa_coding": None,
            "technical_questions": "Explain a hash map.",
            "project_questions": None,
            "internship_questions": None,
            "technical_aptitude": None,
            "hr_questions": None,
        })
        transform.transform_advice = Mock(return_value={
            "preparation_strategy": "Practice daily.",
            "useful_topics": None,
            "mistakes": None,
            "advice": None,
            "wish_known": None,
        })
        mocks = self.configure_pipeline()
        state = {
            "experience": None,
            "questions": [],
            "advice": [],
            "chunks": [],
        }
        question_attempts = []
        advice_attempts = []
        chunk_attempts = []
        save_calls = 0
        source_ids = []

        def find_experience(source_type, identity_field, identity_value):
            self.assertEqual(source_type, "form")
            self.assertEqual(identity_field, "submission_id")
            source_ids.append(identity_value)
            return state["experience"]

        def insert_experience():
            state["experience"] = {
                "id": "form-exp-1",
                "extraction_status": None,
            }
            return types.SimpleNamespace(data=[{"id": "form-exp-1"}])

        def set_extraction_status(_experience_id, status):
            state["experience"]["extraction_status"] = status

        def save_extraction(experience_id, extraction, reprocess=False):
            nonlocal save_calls
            self.assertEqual(experience_id, "form-exp-1")
            self.assertFalse(reprocess)
            save_calls += 1
            for row in extraction["questions"]:
                if not any(
                    existing["question"] == row["question"]
                    and existing.get("category") == row.get("category")
                    and existing.get("source_section") == row.get("source_section")
                    for existing in state["questions"]
                ):
                    state["questions"].append({**row, "id": "q-1", "embedding": None})
            if save_calls == 1:
                raise RuntimeError("advice insert failed after question insert")
            for row in extraction["advice"]:
                if row not in [
                    {key: value for key, value in existing.items() if key != "id" and key != "embedding"}
                    for existing in state["advice"]
                ]:
                    state["advice"].append({**row, "id": f"a-{len(state['advice']) + 1}", "embedding": None})

        def embed_questions(experience_id):
            self.assertEqual(experience_id, "form-exp-1")
            pending = [row for row in state["questions"] if row["embedding"] is None]
            for row in pending:
                question_attempts.append(row["id"])
                row["embedding"] = [0.1]
            return {
                "total": len(pending),
                "success": len(pending),
                "failed": 0,
                "results": [
                    {
                        "question_id": row["id"],
                        "status": "success",
                        "error": None,
                        "embedding": [0.1],
                    }
                    for row in pending
                ],
            }

        def embed_advice(experience_id):
            self.assertEqual(experience_id, "form-exp-1")
            pending = [row for row in state["advice"] if row["embedding"] is None]
            results = []
            for row in pending:
                advice_attempts.append(row["id"])
                row["embedding"] = [0.2]
                results.append({
                    "advice_id": row["id"],
                    "status": "success",
                    "error": None,
                    "embedding": [0.2],
                })
            return {
                "total": len(pending),
                "success": len(pending),
                "failed": 0,
                "results": results,
            }

        def create_chunks(experience_id):
            self.assertEqual(experience_id, "form-exp-1")
            if not state["chunks"]:
                state["chunks"].append({"id": "chunk-1", "embedding": None})
                return 1
            return 0

        def embed_chunks(experience_id):
            self.assertEqual(experience_id, "form-exp-1")
            pending = [row for row in state["chunks"] if row["embedding"] is None]
            for row in pending:
                chunk_attempts.append(row["id"])
                row["embedding"] = [0.3]
            return len(pending)

        mocks["_find_existing_experience"].side_effect = find_experience
        mocks["_set_extraction_status"].side_effect = set_extraction_status
        mocks["_has_extraction_rows"].side_effect = lambda table, _id: bool(state[table])
        mocks["save_extraction"].side_effect = save_extraction
        mocks["create_chunks_for_experience"].side_effect = create_chunks
        mocks["embed_questions_for_experience"].side_effect = embed_questions
        mocks["embed_advice_for_experience"].side_effect = embed_advice
        mocks["embed_chunks_for_experience"].side_effect = embed_chunks
        self.database.table.return_value.insert.return_value.execute.side_effect = insert_experience

        first_row = {
            "Timestamp": "2026-10-10 10:00",
            "Name": "Alex",
            "Company ": "Acme",
        }
        retry_row = {**first_row, "Timestamp": "2026-10-10 10:05"}

        with patch.dict(sys.modules, {"transform": transform}):
            first_result = self.pipeline.process_form_response(first_row)
            question_row = state["questions"][0]
            saved_counts = {
                table: len(state[table])
                for table in ("questions", "advice", "chunks")
            }
            retry_result = self.pipeline.process_form_response(retry_row)

        self.assertEqual(first_result["status"], "failed")
        self.assertEqual(first_result["failed_step"], "save_extraction")
        self.assertEqual(first_result["experience_id"], "form-exp-1")
        self.assertEqual(retry_result["status"], "completed")
        self.assertTrue(retry_result["duplicate"])
        self.assertEqual(retry_result["experience_id"], "form-exp-1")
        self.assertEqual(len(source_ids), 3)
        self.assertEqual(source_ids[0], source_ids[2])
        self.assertEqual(source_ids[1], "2026-10-10 10:00")
        self.assertEqual(
            saved_counts,
            {"questions": 1, "advice": 0, "chunks": 0},
        )
        self.assertEqual(
            {table: len(state[table]) for table in saved_counts},
            {"questions": 1, "advice": 1, "chunks": 1},
        )
        self.assertEqual(len(state["questions"]), 1)
        self.assertEqual(len(state["advice"]), 1)
        self.assertEqual(state["questions"][0]["question"], "Explain a hash map.")
        self.assertEqual(state["advice"][0]["content"], "Practice daily.")
        self.assertIs(state["questions"][0], question_row)
        self.assertEqual(question_attempts, ["q-1"])
        self.assertEqual(advice_attempts, ["a-1"])
        self.assertEqual(chunk_attempts, ["chunk-1"])
        self.assertEqual(mocks["save_extraction"].call_count, 2)
        self.database.table.return_value.insert.assert_called_once()
        inserted_experience = self.database.table.return_value.insert.call_args.args[0]
        self.assertEqual(inserted_experience["submission_id"], source_ids[0])
        self.assertNotIn("legacy_submission_id", inserted_experience)

    def test_incomplete_legacy_extraction_retries_and_saves_missing_rows(self):
        mocks = self.configure_pipeline(
            existing={"id": "exp-existing", "extraction_status": None}
        )
        extractor = Mock(return_value=EXTRACTION)

        result = self.pipeline.process_experience(EXPERIENCE, extractor=extractor)

        self.assertEqual(result["status"], "completed")
        self.assertEqual(result["completed_steps"].count("extract"), 1)
        self.assertEqual(result["completed_steps"].count("save_extraction"), 1)
        extractor.assert_called_once()
        mocks["save_extraction"].assert_called_once_with(
            "exp-existing",
            EXTRACTION,
            reprocess=False,
        )


if __name__ == "__main__":
    unittest.main()
