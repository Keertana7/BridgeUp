from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.ai import router as ai_router
from routes.chat import router as chat_router
from routes.ingestion import router as ingestion_router
from app.routers import advice, auth_router, companies, experiences, questions, resources


app = FastAPI(
    title="BridgeUp API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)
app.include_router(chat_router)
app.include_router(ingestion_router)
app.include_router(companies.router)
app.include_router(experiences.router)
app.include_router(questions.router)
app.include_router(advice.router)
app.include_router(resources.router)
app.include_router(auth_router.router)


@app.get("/")
def root():

    return {
        "message": "BridgeUp API is running"
    }


@app.get("/health")
def health():

    return {
        "status": "ok"
    }