import importlib
import sys
from pathlib import Path
from types import ModuleType


INGESTION_DIR = Path(__file__).resolve().parent.parent / "ingestion"
_SHARED_MODULES = {
    "batch_llm_extract",
    "chunk_experiences",
    "embed_advice_batch",
    "embed_chunks",
    "embed_questions_batch",
    "google_sheets",
    "llm_extract",
    "pdf_ingest",
    "pipeline",
    "privacy",
    "save_extraction",
    "supabase_client",
}


def load_shared_module(module_name: str) -> ModuleType:
    """Load a root ingestion module and reject a conflicting generic module."""

    if module_name not in _SHARED_MODULES:
        raise ValueError(f"Unsupported shared ingestion module: {module_name}")

    for shared_name in _SHARED_MODULES:
        existing = sys.modules.get(shared_name)
        existing_file = getattr(existing, "__file__", None)
        if existing_file and Path(existing_file).resolve().parent != INGESTION_DIR.resolve():
            raise ImportError(
                f"Cannot import shared module {shared_name!r}: "
                f"{existing_file} is already loaded"
            )

    ingestion_path = str(INGESTION_DIR)
    if not INGESTION_DIR.is_dir():
        raise RuntimeError(f"Shared ingestion package not found: {INGESTION_DIR}")
    if ingestion_path not in sys.path:
        sys.path.insert(0, ingestion_path)

    return importlib.import_module(module_name)
