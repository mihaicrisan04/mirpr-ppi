import time
import uuid
from contextlib import asynccontextmanager

import numpy as np
import ollama
from fastapi import APIRouter, FastAPI, HTTPException
from sentence_transformers import SentenceTransformer

from app.config import settings
from app.models import (
    EmbeddingData,
    EmbeddingsRequest,
    EmbeddingsResponse,
    EmbeddingsUsage,
    HealthResponse,
    OutputMessage,
    OutputTextContent,
    ResponsesRequest,
    ResponsesResponse,
)

# Global model reference
embeddings_model: SentenceTransformer | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the embeddings model at startup."""
    global embeddings_model
    print(f"Loading embeddings model from {settings.EMBEDDINGS_MODEL_PATH}...")
    embeddings_model = SentenceTransformer(settings.EMBEDDINGS_MODEL_PATH)
    print("Embeddings model loaded successfully!")
    yield
    # Cleanup
    embeddings_model = None


router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    ollama_status = "unknown"
    try:
        ollama_client = ollama.Client(host=settings.OLLAMA_BASE_URL)
        ollama_client.list()
        ollama_status = "connected"
    except Exception as e:
        ollama_status = f"error: {e}"

    return HealthResponse(
        status="healthy",
        ollama_status=ollama_status,
        embeddings_model_loaded=embeddings_model is not None,
    )


@router.post("/v1/embeddings", response_model=EmbeddingsResponse)
async def create_embeddings(request: EmbeddingsRequest):
    """Generate embeddings using the local SentenceTransformer model."""
    if embeddings_model is None:
        raise HTTPException(status_code=503, detail="Embeddings model not loaded")

    # Normalize input to list
    inputs = request.input if isinstance(request.input, list) else [request.input]

    try:
        embeddings = embeddings_model.encode(inputs, convert_to_numpy=True)

        # Pad embeddings from 384 to 512 dimensions for Convex RAG compatibility
        # Convex RAG only supports: 128, 256, 512, 768, 1024, 1408, 1536, 2048, 3072, 4096
        target_dim = 512
        current_dim = embeddings.shape[1]
        if current_dim < target_dim:
            padding = np.zeros((embeddings.shape[0], target_dim - current_dim))
            embeddings = np.hstack([embeddings, padding])

        data = [
            EmbeddingData(
                embedding=embedding.tolist(),
                index=i,
            )
            for i, embedding in enumerate(embeddings)
        ]

        return EmbeddingsResponse(
            data=data,
            model=request.model,
            usage=EmbeddingsUsage(
                prompt_tokens=sum(len(text.split()) for text in inputs),
                total_tokens=sum(len(text.split()) for text in inputs),
            ),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {e}")


@router.post("/v1/responses", response_model=ResponsesResponse)
async def create_response(request: ResponsesRequest):
    """Generate a response using Ollama."""
    try:
        ollama_client = ollama.Client(host=settings.OLLAMA_BASE_URL)

        messages = []

        if request.instructions:
            messages.append({"role": "system", "content": request.instructions})

        if isinstance(request.input, str):
            messages.append({"role": "user", "content": request.input})
        elif isinstance(request.input, list):
            for item in request.input:
                if isinstance(item, str):
                    messages.append({"role": "user", "content": item})
                elif isinstance(item, dict):
                    messages.append(item)

        response = ollama_client.chat(
            model=settings.OLLAMA_MODEL,
            messages=messages,
        )

        assistant_text = response["message"]["content"]

        return ResponsesResponse(
            id=f"resp_{uuid.uuid4().hex[:24]}",
            created_at=int(time.time()),
            model=settings.OLLAMA_MODEL,
            output=[
                OutputMessage(
                    content=[OutputTextContent(text=assistant_text)],
                )
            ],
            output_text=assistant_text,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Response generation failed: {e}")
