# Ingestion triggers

The ingestion entry points used by this backend remain in the database team's
`../ingestion/` directory. The backend additions import and call those existing
helpers; they do not copy or replace the pipeline.

## Google Sheets polling

`ingestion_worker.py` performs one poll with the existing
`google_sheets.get_sheet_data()` adapter and passes each response to
`pipeline.process_form_response()`. A Google Forms `Timestamp` is turned into
a stable `submission_id` if the response does not already contain one. The
shared pipeline owns idempotency and retry/recovery behavior.

The adapter expects `GOOGLE_SHEET_API_URL` to return a JSON list of row
objects. Set `GOOGLE_SHEET_API_URL`, `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, and `GEMINI_API_KEY` in the backend process
environment or `backend/.env`. Optional model settings are
`GEMINI_MODEL` and `GEMINI_EMBEDDING_MODEL`. Keep the service-role and Gemini
keys server-side. `SUPABASE_KEY` remains the anon/public credential for the
existing CRUD API and is not a substitute for the ingestion service-role key.

From the repository root, run a single local poll with:

```powershell
python backend\ingestion_worker.py
```

The process exits nonzero on a poll error or any failed row. Inspect its log
for the row number and failed pipeline stage, correct the external failure, and
run another poll; the shared pipeline will recover by its stable source ID.

The repository contains no hosting-platform scheduler configuration. For
production, configure a scheduled job with the above environment values to run
`python backend/ingestion_worker.py` periodically, with only one concurrent
poller. No production schedule is active until that host configuration exists.

The current adapter accesses an HTTP JSON endpoint and does not implement
Google OAuth or service-account authentication. If the endpoint is a direct
Google Sheets API integration, grant its configured Google identity read-only
access to the response spreadsheet (Google Sheets read scope). Alternatively,
use a suitably restricted Apps Script or other JSON endpoint. The endpoint
URL and any endpoint credentials must be configured by the deployment owner;
no Google credential should be committed to this repository.

The existing HTTP adapter does not set a request timeout or perform in-request
network retries. A failed request makes this worker exit nonzero; rely on the
next scheduled run for recovery, or have the ingestion owner add timeout and
retry handling to the shared adapter. This backend-only change does not alter
that shared helper.

## PDF upload

The authenticated `POST /ingestion/pdfs` endpoint accepts a multipart `file`
field, validates a text-readable PDF up to 25 MB, stages it on the backend
host, and queues the existing `pdf_ingest.ingest_pdf()` adapter through
FastAPI `BackgroundTasks`. A SHA-256-derived PDF filename serves as the source
identity used by the existing adapter's filename deduplication. The source
identity includes the full SHA-256 fingerprint of the authenticated uploader,
so identical uploads by one user deduplicate, while separate users retain
their own status ownership. This also allows the status endpoint to authorize
an in-progress row before its `submitted_by` field is attached. Renaming the
same upload does not change its identity. The upload returns HTTP 202 and the
`source_file` needed to
query `GET /ingestion/pdf-status?source_file=...`.

The existing PDF adapter records `extraction_status` in the experience row.
Inspect backend logs for the source identity and failed pipeline step; retry
with the same file to resume processing. A failure before the adapter creates
an experience row is visible in logs but has no database status record.
The deployed `experiences` table must also expose `submitted_by`; this column
is used to associate the upload with its authenticated user and limit status
lookups. Confirm both database columns exist before enabling the endpoint.

Temporary files and FastAPI background tasks are not durable across a process
restart. This implementation intentionally does not introduce a storage
bucket, queue, or new database contract. The deployment must keep uploads
within one API instance for the duration of the background task. If durable
recovery across host restarts is required, the storage/queue design needs to be
agreed with the database and deployment owners.

Run the backend-only mocked integration tests from the repository root with:

```powershell
python -m unittest discover -s backend\tests -p "test_*.py"
```

Tests mock the external adapter, PDF processing, and Supabase; production
credentials are not required.
