# BridgeUp frontend

React/Vite frontend for the BridgeUp placement-preparation platform.

## Run locally

1. From this directory, install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set the Supabase URL, public anon
   key, and FastAPI base URL.
3. Start the development server with `npm run dev`.

The preparation page uses the backend `/questions/`, `/advice/`, `/companies/`,
and `/ai/generate-questions` endpoints. The emotional-support chat uses
`POST /chat`. Both the preparation and `/talk` pages retain the app's existing
Supabase-authenticated route protection.
