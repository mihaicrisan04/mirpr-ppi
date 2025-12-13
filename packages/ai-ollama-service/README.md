# AI Ollama Service

Local AI service providing OpenAI-compatible embeddings and chat APIs.

## Prerequisites

- Ollama running locally
- Required model downloaded in Ollama

## Setup

```sh
# Install dependencies
uv sync

# Copy and configure environment
cp .env.example .env

# Start the server
uv run python run.py
```

## Configuration

Edit `.env` to configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `OLLAMA_BASE_URL` | Ollama API endpoint | `http://127.0.0.1:11434` |
| `OLLAMA_MODEL` | Model for chat completions | `qwen3-vl:2b` |
| `EMBEDDINGS_MODEL_PATH` | Path to embeddings model | `./models/bi-enc-xquad-ro` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8001` |
