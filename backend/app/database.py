import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from the .env file in the backend/ folder
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError(
        "Missing Supabase credentials. "
        "Please set SUPABASE_URL and SUPABASE_KEY in your backend/.env file."
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
