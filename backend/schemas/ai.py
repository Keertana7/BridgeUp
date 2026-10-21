from pydantic import BaseModel, Field


class GenerateQuestionsRequest(BaseModel):
    company: str
    category: str
    count: int = Field(default=5, ge=1, le=15)
    prompt: str | None = Field(default=None, max_length=3000)


class GenerateQuestionsResponse(BaseModel):
    questions: list[str]
    analysis: str = ""
    patterns: list[str] = Field(default_factory=list)
    historical_question_count: int = 0


class RAGRequest(BaseModel):
    question: str
    company: str | None = None
    experience_id: str | None = None


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


class ChatResponse(BaseModel):
    response: str