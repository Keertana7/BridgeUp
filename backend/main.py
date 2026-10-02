from fastapi import FastAPI

from routes.ai import router as ai_router
from routes.chat import router as chat_router


app = FastAPI(
    title="BridgeUp API",
    version="1.0.0"
)


app.include_router(ai_router)
app.include_router(chat_router)


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