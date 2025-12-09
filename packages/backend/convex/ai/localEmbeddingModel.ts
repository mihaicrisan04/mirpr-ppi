// Custom AI SDK-compatible embedding model that wraps our local FastAPI service
// This allows us to use the local embedding service with the RAG component

import { AI_CONFIG } from "./config";

interface EmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * Custom embedding model that implements the AI SDK EmbeddingModelV2 interface
 * This wraps our local FastAPI service to make it compatible with the RAG component
 */
export function createLocalEmbeddingModel() {
  const modelId = AI_CONFIG.local.embeddingModel;

  return {
    specificationVersion: "v2" as const,
    modelId,
    provider: "local-fastapi",
    maxEmbeddingsPerCall: 100,
    supportsParallelCalls: false,

    async doEmbed({
      values,
    }: {
      values: string[];
    }): Promise<{
      embeddings: number[][];
      usage?: { tokens: number };
    }> {
      const response = await fetch(`${AI_CONFIG.local.baseUrl}/v1/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelId,
          input: values,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Local embedding service error: ${error}`);
      }

      const result: EmbeddingResponse = await response.json();

      // Sort by index to ensure correct order
      const sorted = result.data.sort((a, b) => a.index - b.index);
      const embeddings = sorted.map((d) => d.embedding);

      return {
        embeddings,
        usage: {
          tokens: result.usage.total_tokens,
        },
      };
    },
  };
}

// Type for the local embedding model
export type LocalEmbeddingModel = ReturnType<typeof createLocalEmbeddingModel>;
