import asyncio
import hashlib
import importlib
import io
import os
import sys
import types
import unittest
from unittest.mock import AsyncMock, Mock, patch

from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile


BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
for path in (BACKEND_DIR,):
    if path not in sys.path:
        sys.path.insert(0, path)


def _source_file_for(user_id):
    owner_fingerprint = hashlib.sha256(user_id.encode()).hexdigest()
    return f"sha256_{owner_fingerprint}_{'a' * 64}.pdf"


class PollWorkerTests(unittest.TestCase):
    def setUp(self):
        self.google_sheets = types.ModuleType("google_sheets")
        self.google_sheets.get_sheet_data = Mock()
        self.pipeline = types.ModuleType("pipeline")
        self.pipeline.process_form_response = Mock()
        modules_patcher = patch.dict(
            sys.modules,
            {
                "google_sheets": self.google_sheets,
                "pipeline": self.pipeline,
            },
        )
        modules_patcher.start()
        self.addCleanup(modules_patcher.stop)
        sys.modules.pop("ingestion_worker", None)
        self.worker = importlib.import_module("ingestion_worker")
        self.addCleanup(lambda: sys.modules.pop("ingestion_worker", None))

    def test_new_response_calls_shared_pipeline_with_timestamp_identity(self):
        row = {"Timestamp": "2026-10-16 10:00:00", "Name": "Alex"}
        self.google_sheets.get_sheet_data.return_value = [row]
        self.pipeline.process_form_response.return_value = {
            "status": "completed",
            "experience_id": "exp-1",
            "duplicate": False,
        }
        with patch.dict(os.environ, {"GOOGLE_SHEET_API_URL": "https://example.test"}):
            summary = self.worker.poll_google_sheets()

        self.assertEqual(summary["completed"], 1)
        self.pipeline.process_form_response.assert_called_once_with(
            {
                "Timestamp": "2026-10-16 10:00:00",
                "Name": "Alex",
                "submission_id": "google-form:2026-10-16 10:00:00",
            }
        )
        self.assertNotIn("submission_id", row)

    def test_already_processed_response_is_retried_via_same_stable_id(self):
        row = {"Timestamp": "2026-10-16 10:00:00", "Name": "Alex"}
        self.google_sheets.get_sheet_data.return_value = [row]
        self.pipeline.process_form_response.side_effect = [
            {"status": "failed", "failed_step": "extract", "error": "temporary"},
            {"status": "completed", "experience_id": "exp-1", "duplicate": True},
        ]
        with patch.dict(os.environ, {"GOOGLE_SHEET_API_URL": "https://example.test"}):
            first = self.worker.poll_google_sheets()
            second = self.worker.poll_google_sheets()

        self.assertEqual(first["failed"], 1)
        self.assertEqual(second["completed"], 1)
        self.assertEqual(
            self.pipeline.process_form_response.call_args_list[0],
            self.pipeline.process_form_response.call_args_list[1],
        )

    def test_missing_endpoint_and_unstable_response_are_reported(self):
        self.google_sheets.get_sheet_data.assert_not_called()
        with patch.dict(os.environ, {"GOOGLE_SHEET_API_URL": ""}):
            with self.assertRaisesRegex(RuntimeError, "GOOGLE_SHEET_API_URL"):
                self.worker.poll_google_sheets()

        self.google_sheets.get_sheet_data.return_value = [{"Name": "Alex"}]
        with patch.dict(os.environ, {"GOOGLE_SHEET_API_URL": "https://example.test"}):
            summary = self.worker.poll_google_sheets()
        self.assertEqual(summary["failed"], 1)
        self.pipeline.process_form_response.assert_not_called()

    def test_sheet_api_failure_propagates_to_worker(self):
        self.google_sheets.get_sheet_data.side_effect = RuntimeError("network failure")
        with patch.dict(os.environ, {"GOOGLE_SHEET_API_URL": "https://example.test"}):
            with self.assertRaisesRegex(RuntimeError, "network failure"):
                self.worker.poll_google_sheets()


class PdfUploadTests(unittest.TestCase):
    def setUp(self):
        fake_auth = types.ModuleType("app.auth")
        fake_auth.get_current_user = Mock()
        fake_database = types.ModuleType("services.database")
        fake_database.supabase = Mock()
        with patch.dict(
            sys.modules,
            {
                "app.auth": fake_auth,
                "services.database": fake_database,
            },
        ):
            sys.modules.pop("routes.ingestion", None)
            self.route = importlib.import_module("routes.ingestion")
        self.database = fake_database.supabase
        self.addCleanup(lambda: sys.modules.pop("routes.ingestion", None))

    @staticmethod
    def make_upload(data=b"%PDF-test", filename="report.pdf"):
        return UploadFile(filename=filename, file=io.BytesIO(data))

    def test_upload_triggers_existing_pdf_adapter_with_stable_source_name(self):
        payload = b"%PDF-sample-contents"
        background = BackgroundTasks()
        page = Mock()
        page.get_text.return_value = "Interview report"
        document = Mock()
        document.__iter__ = Mock(side_effect=lambda: iter([page]))
        document.__enter__ = Mock(return_value=document)
        document.__exit__ = Mock(return_value=False)
        with patch.object(self.route.pymupdf, "open", return_value=document):
            result = asyncio.run(
                self.route.upload_pdf(
                    background,
                    self.make_upload(payload),
                    user={"sub": "user-1"},
                )
            )

        owner_fingerprint = hashlib.sha256(b"user-1").hexdigest()
        expected_source = (
            f"sha256_{owner_fingerprint}_{hashlib.sha256(payload).hexdigest()}.pdf"
        )
        self.assertEqual(result["status"], "accepted")
        self.assertEqual(result["source_file"], expected_source)
        self.assertEqual(len(background.tasks), 1)

        adapter = types.ModuleType("pdf_ingest")
        adapter.ingest_pdf = Mock(
            return_value={"status": "completed", "experience_id": "exp-1"}
        )
        task = background.tasks[0]
        with patch.dict(sys.modules, {"pdf_ingest": adapter}):
            task.func(*task.args, **task.kwargs)
        adapter.ingest_pdf.assert_called_once_with(task.args[0])
        self.assertFalse(os.path.exists(os.path.dirname(task.args[0])))
        self.database.table.assert_any_call("experiences")
        self.database.table.return_value.update.assert_called_once_with(
            {"submitted_by": "user-1"}
        )

    def test_invalid_or_textless_pdf_is_rejected(self):
        background = BackgroundTasks()
        with patch.object(self.route.pymupdf, "open", side_effect=RuntimeError("invalid")):
            with self.assertRaises(HTTPException) as invalid:
                asyncio.run(
                    self.route.upload_pdf(
                        background,
                        self.make_upload(b"not pdf"),
                        user={"sub": "user-1"},
                    )
                )
        self.assertEqual(invalid.exception.status_code, 422)
        self.assertEqual(background.tasks, [])

        page = Mock()
        page.get_text.return_value = "  "
        document = Mock()
        document.__iter__ = Mock(return_value=iter([page]))
        document.__enter__ = Mock(return_value=document)
        document.__exit__ = Mock(return_value=False)
        with patch.object(self.route.pymupdf, "open", return_value=document):
            with self.assertRaises(HTTPException) as textless:
                asyncio.run(
                    self.route.upload_pdf(
                        background,
                        self.make_upload(),
                        user={"sub": "user-1"},
                    )
                )
        self.assertEqual(textless.exception.status_code, 422)
        self.assertEqual(background.tasks, [])

    def test_non_pdf_and_oversized_uploads_are_rejected(self):
        background = BackgroundTasks()
        with self.assertRaises(HTTPException) as invalid_type:
            asyncio.run(
                self.route.upload_pdf(
                    background,
                    self.make_upload(filename="notes.txt"),
                    user={"sub": "user-1"},
                )
            )
        self.assertEqual(invalid_type.exception.status_code, 415)

        with patch.object(self.route, "MAX_UPLOAD_BYTES", 4):
            with self.assertRaises(HTTPException) as too_large:
                asyncio.run(
                    self.route.upload_pdf(
                        background,
                        self.make_upload(b"%PDF-bigger-than-limit"),
                        user={"sub": "user-1"},
                    )
                )
        self.assertEqual(too_large.exception.status_code, 413)
        self.assertEqual(background.tasks, [])

    def test_repeated_upload_retry_uses_same_pipeline_identity(self):
        payload = b"%PDF-same-file"
        page = Mock()
        page.get_text.return_value = "Interview report"
        document = Mock()
        document.__iter__ = Mock(side_effect=lambda: iter([page]))
        document.__enter__ = Mock(return_value=document)
        document.__exit__ = Mock(return_value=False)
        responses = []
        backgrounds = [BackgroundTasks(), BackgroundTasks()]
        with patch.object(self.route.pymupdf, "open", return_value=document):
            for background in backgrounds:
                responses.append(
                    asyncio.run(
                        self.route.upload_pdf(
                            background,
                            self.make_upload(payload),
                            user={"sub": "user-1"},
                        )
                    )
                )
        self.assertEqual(responses[0]["source_file"], responses[1]["source_file"])

        adapter = types.ModuleType("pdf_ingest")
        adapter.ingest_pdf = Mock(
            side_effect=[
                {"status": "failed", "failed_step": "extract", "error": "temporary"},
                {"status": "completed", "experience_id": "exp-1", "duplicate": True},
            ]
        )
        with patch.dict(sys.modules, {"pdf_ingest": adapter}):
            for background in backgrounds:
                task = background.tasks[0]
                task.func(*task.args, **task.kwargs)
        self.assertEqual(adapter.ingest_pdf.call_count, 2)
        self.assertEqual(
            os.path.basename(adapter.ingest_pdf.call_args_list[0].args[0]),
            os.path.basename(adapter.ingest_pdf.call_args_list[1].args[0]),
        )

        other_user = BackgroundTasks()
        with patch.object(self.route.pymupdf, "open", return_value=document):
            other_user_result = asyncio.run(
                self.route.upload_pdf(
                    other_user,
                    self.make_upload(payload),
                    user={"sub": "user-2"},
                )
            )
        self.assertNotEqual(responses[0]["source_file"], other_user_result["source_file"])

    def test_status_endpoint_reports_existing_pipeline_status(self):
        query = Mock()
        query.select.return_value = query
        query.eq.return_value = query
        query.limit.return_value = query
        query.execute.return_value.data = [
            {
                "id": "exp-1",
                "source_file": _source_file_for("user-1"),
                "extraction_status": "failed",
                "submitted_by": "user-1",
            }
        ]
        self.database.table.return_value = query
        status = self.route.get_pdf_status(
            source_file=_source_file_for("user-1"),
            user={"sub": "user-1"},
        )
        self.assertEqual(status["extraction_status"], "failed")
        query.eq.assert_any_call("source_file", status["source_file"])

    def test_status_endpoint_returns_404_for_unowned_or_missing_pdf(self):
        query = Mock()
        query.select.return_value = query
        query.eq.return_value = query
        query.limit.return_value = query
        query.execute.return_value.data = []
        self.database.table.return_value = query

        with self.assertRaises(HTTPException) as missing:
            self.route.get_pdf_status(
                source_file=_source_file_for("user-2"),
                user={"sub": "user-1"},
            )
        self.assertEqual(missing.exception.status_code, 404)
        self.database.table.assert_not_called()

    def test_status_endpoint_allows_owner_scoped_processing_record(self):
        source_file = _source_file_for("user-1")
        query = Mock()
        query.select.return_value = query
        query.eq.return_value = query
        query.limit.return_value = query
        query.execute.return_value.data = [
            {
                "id": "exp-1",
                "source_file": source_file,
                "extraction_status": "processing",
                "submitted_by": None,
            }
        ]
        self.database.table.return_value = query

        status = self.route.get_pdf_status(
            source_file=source_file,
            user={"sub": "user-1"},
        )
        self.assertEqual(status["extraction_status"], "processing")

    def test_status_endpoint_hides_record_associated_with_another_user(self):
        source_file = _source_file_for("user-1")
        query = Mock()
        query.select.return_value = query
        query.eq.return_value = query
        query.limit.return_value = query
        query.execute.return_value.data = [
            {
                "id": "exp-1",
                "source_file": source_file,
                "extraction_status": "completed",
                "submitted_by": "user-2",
            }
        ]
        self.database.table.return_value = query

        with self.assertRaises(HTTPException) as error:
            self.route.get_pdf_status(
                source_file=source_file,
                user={"sub": "user-1"},
            )
        self.assertEqual(error.exception.status_code, 404)

    def test_status_endpoint_maps_database_errors_to_503(self):
        query = Mock()
        query.select.return_value = query
        query.eq.return_value = query
        query.limit.return_value = query
        query.execute.side_effect = RuntimeError("database unavailable")
        self.database.table.return_value = query

        with self.assertRaises(HTTPException) as error:
            self.route.get_pdf_status(
                source_file=_source_file_for("user-1"),
                user={"sub": "user-1"},
            )
        self.assertEqual(error.exception.status_code, 503)

    def test_missing_authenticated_user_id_is_rejected(self):
        with self.assertRaises(HTTPException) as upload_error:
            asyncio.run(
                self.route.upload_pdf(
                    BackgroundTasks(),
                    self.make_upload(),
                    user={},
                )
            )
        self.assertEqual(upload_error.exception.status_code, 401)

        with self.assertRaises(HTTPException) as status_error:
            self.route.get_pdf_status(source_file="file.pdf", user={})
        self.assertEqual(status_error.exception.status_code, 401)

    def test_unexpected_upload_read_error_cleans_temp_file_and_returns_500(self):
        upload = self.make_upload()
        with (
            patch.object(upload, "read", new_callable=AsyncMock, side_effect=RuntimeError("read failed")),
            patch.object(self.route, "_cleanup_upload", wraps=self.route._cleanup_upload) as cleanup,
        ):
            with self.assertRaises(HTTPException) as error:
                asyncio.run(
                    self.route.upload_pdf(
                        BackgroundTasks(),
                        upload,
                        user={"sub": "user-1"},
                    )
                )

        self.assertEqual(error.exception.status_code, 500)
        self.assertEqual(error.exception.detail, "Could not process PDF upload")
        cleanup.assert_called_once()


class ApplicationImportTests(unittest.TestCase):
    def test_both_fastapi_entry_points_register_the_ingestion_router(self):
        fake_auth = types.ModuleType("app.auth")
        fake_auth.get_current_user = Mock()
        fake_database = types.ModuleType("services.database")
        fake_database.supabase = Mock()
        fake_ai = types.ModuleType("routes.ai")
        fake_ai.router = APIRouter()
        fake_chat = types.ModuleType("routes.chat")
        fake_chat.router = APIRouter()
        fake_routers = types.ModuleType("app.routers")
        for name in ("companies", "experiences", "questions", "advice", "resources", "auth_router"):
            setattr(fake_routers, name, types.SimpleNamespace(router=APIRouter()))

        module_names = ("main", "app.main", "routes.ingestion")
        with patch.dict(
            sys.modules,
            {
                "app.auth": fake_auth,
                "services.database": fake_database,
                "routes.ai": fake_ai,
                "routes.chat": fake_chat,
                "app.routers": fake_routers,
            },
        ):
            for module_name in module_names:
                sys.modules.pop(module_name, None)
            main_app = importlib.import_module("main").app
            legacy_app = importlib.import_module("app.main").app

            self.assertIn(
                "/ingestion/pdfs",
                main_app.openapi()["paths"],
            )
            self.assertIn(
                "/ingestion/pdf-status",
                main_app.openapi()["paths"],
            )
            self.assertIn(
                "/ingestion/pdfs",
                legacy_app.openapi()["paths"],
            )
            self.assertIn(
                "/ingestion/pdf-status",
                legacy_app.openapi()["paths"],
            )

        for module_name in module_names:
            sys.modules.pop(module_name, None)

    def test_shared_import_helper_rejects_conflicting_generic_module(self):
        from shared_ingestion import load_shared_module

        conflict = types.ModuleType("pdf_ingest")
        conflict.__file__ = os.path.join(BACKEND_DIR, "pdf_ingest.py")
        with patch.dict(sys.modules, {"pdf_ingest": conflict}):
            with self.assertRaisesRegex(ImportError, "already loaded"):
                load_shared_module("pdf_ingest")


if __name__ == "__main__":
    unittest.main()
