# BridgeUp

## Local setup

Prerequisites: Python 3.11 or newer, Node.js with npm, and a Supabase project.

From the repository root, create local environment files:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

Set the Supabase URL and public anon key in both files. In `backend\.env`,
set `SUPABASE_SERVICE_ROLE_KEY` and `NVIDIA_API_KEY`. Text generation prefers
NVIDIA by default and automatically falls back to Gemini (or NVIDIA when
Gemini is preferred). Set `AI_TEXT_PROVIDER=gemini` to prefer Gemini.
`GEMINI_API_KEY` is still needed for embedding-based RAG and ingestion features.
Keep server-only keys in the backend file; never put them in the frontend.

NVIDIA and Gemini provide text generation for Ask & Generate, chat, and the
RAG answer service. Gemini is still used to create query embeddings for RAG.

Install dependencies:

```powershell
python -m pip install -r backend\requirements.txt
npm --prefix frontend install
```

## Run locally

Open three terminals from the repository root:

```powershell
python -m uvicorn app.main:app --app-dir backend --reload --port 8001
```

```powershell
python -m uvicorn main:app --app-dir backend --reload --port 8000
```

```powershell
npm --prefix frontend run dev
```

The frontend uses port 8001 for the primary API and port 8000 for AI and chat.
The Vite development server runs at `http://localhost:5173` by default.
