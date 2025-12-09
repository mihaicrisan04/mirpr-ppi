// AI provider configuration
// Controls whether to use OpenAI cloud or local Ollama service

export type AIProvider = "openai" | "local";

export const AI_CONFIG = {
  provider: (process.env.AI_PROVIDER ?? "openai") as AIProvider,
  local: {
    // FastAPI service URL (not Ollama directly)
    baseUrl: process.env.LOCAL_AI_BASE_URL ?? "http://host.docker.internal:8001",
    // bi-enc-xquad-ro outputs 384 dims, padded to 512 for Convex RAG compatibility
    // Convex RAG only supports: 128, 256, 512, 768, 1024, 1408, 1536, 2048, 3072, 4096
    embeddingDimension: Number(process.env.LOCAL_AI_EMBEDDING_DIMENSION ?? 512),
    embeddingModel: "bi-enc-xquad-ro",
    chatModel: "qwen3-vl:2b",
  },
  openai: {
    embeddingDimension: Number(process.env.OPENAI_EMBEDDING_DIMENSION ?? 1536),
    embeddingModel: "text-embedding-3-small",
    chatModel: "gpt-4o-mini",
  },
} as const;

export function isLocalMode(): boolean {
  return AI_CONFIG.provider === "local";
}

export function getEmbeddingDimension(): number {
  return isLocalMode()
    ? AI_CONFIG.local.embeddingDimension
    : AI_CONFIG.openai.embeddingDimension;
}
