from pydantic import BaseModel

# ============ Embeddings ============


class EmbeddingsRequest(BaseModel):
    model: str = "bi-enc-xquad-ro"
    input: str | list[str]


class EmbeddingData(BaseModel):
    object: str = "embedding"
    embedding: list[float]
    index: int


class EmbeddingsUsage(BaseModel):
    prompt_tokens: int = 0
    total_tokens: int = 0


class EmbeddingsResponse(BaseModel):
    object: str = "list"
    data: list[EmbeddingData]
    model: str
    usage: EmbeddingsUsage


# ============ Responses ============


class ResponsesRequest(BaseModel):
    model: str = "qwen3-vl:2b"
    instructions: str = ""
    input: str | list
    store: bool = False


class OutputTextContent(BaseModel):
    type: str = "output_text"
    text: str


class OutputMessage(BaseModel):
    type: str = "message"
    role: str = "assistant"
    content: list[OutputTextContent]


class ResponsesResponse(BaseModel):
    id: str
    object: str = "response"
    created_at: int
    model: str
    output: list[OutputMessage]
    output_text: str


# ============ Health ============


class HealthResponse(BaseModel):
    status: str = "healthy"
    ollama_status: str | None = None
    embeddings_model_loaded: bool = False
