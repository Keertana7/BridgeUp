from fastapi import FastAPI
from app.routers import companies, experiences, questions, advice, resources, auth_router
from routes.ingestion import router as ingestion_router

app = FastAPI(
    title="BridgeUp API",
    description="Backend API for the BridgeUp placement preparation platform.",
    version="0.1.0"
)


# Health check endpoint
@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "message": "BridgeUp backend is running"
    }
    


# Register routers
# prefix and tags are defined inside each router file
app.include_router(companies.router)
app.include_router(experiences.router)
app.include_router(questions.router)
app.include_router(advice.router)
app.include_router(resources.router)
app.include_router(auth_router.router)
app.include_router(ingestion_router)
