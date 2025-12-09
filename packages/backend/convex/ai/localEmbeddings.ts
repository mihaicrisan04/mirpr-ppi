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

export async function fetchLocalEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const response = await fetch(`${AI_CONFIG.local.baseUrl}/v1/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AI_CONFIG.local.embeddingModel,
      input: texts,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Local embedding service error: ${error}`);
  }

  const result: EmbeddingResponse = await response.json();

  const sorted = result.data.sort((a, b) => a.index - b.index);
  return sorted.map((d) => d.embedding);
}

export async function fetchLocalEmbedding(text: string): Promise<number[]> {
  const embeddings = await fetchLocalEmbeddings([text]);
  return embeddings[0];
}
