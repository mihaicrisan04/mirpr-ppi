from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import lifespan, router

app = FastAPI(
    title="AI Ollama Service",
    description="Local AI service mimicking OpenAI Embeddings and Responses APIs",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
