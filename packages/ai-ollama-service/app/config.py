import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen3-vl:2b")
    EMBEDDINGS_MODEL_PATH: str = os.getenv("EMBEDDINGS_MODEL_PATH", "./models/bi-enc-xquad-ro")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8001"))


settings = Settings()
