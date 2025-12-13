import { AI_CONFIG } from "./config";

interface ResponsesResponse {
  id: string;
  object: string;
  created_at: number;
  model: string;
  output: Array<{
    type: string;
    role: string;
    content: Array<{
      type: string;
      text: string;
    }>;
  }>;
  output_text: string;
}

export interface LocalChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function fetchLocalResponse(args: {
  instructions?: string;
  messages: LocalChatMessage[];
}): Promise<string> {
  const { instructions, messages } = args;

  // Build input from messages
  const input = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const response = await fetch(`${AI_CONFIG.local.baseUrl}/v1/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AI_CONFIG.local.chatModel,
      instructions: instructions ?? "",
      input,
      store: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Local response service error: ${error}`);
  }

  const result: ResponsesResponse = await response.json();
  return result.output_text;
}
