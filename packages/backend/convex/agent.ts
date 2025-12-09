import { components, internal } from "./_generated/api";
import {
  Agent,
  createThread,
  listUIMessages,
  syncStreams,
  createTool,
} from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { action, mutation, query, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { vStreamArgs } from "@convex-dev/agent/validators";
import { paginationOptsValidator } from "convex/server";
import { z } from "zod/v3";
import { rag } from "./rag";
import { AI_CONFIG, isLocalMode } from "./ai/config";
import { fetchLocalResponse } from "./ai/localResponse";
import { RAG_NAMESPACE, AGENT_INSTRUCTIONS, DEMO_USER } from "./ai/constants";

// Keywords that suggest the user wants to search the knowledge base
const RAG_TRIGGER_KEYWORDS = [
  "search",
  "find",
  "look up",
  "knowledge",
  "document",
  "info about",
  "tell me about",
  "what is",
  "what are",
  "how to",
  "explain",
  "describe",
];

// Check if the prompt likely needs RAG context
function shouldUseRAG(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase();
  return RAG_TRIGGER_KEYWORDS.some((keyword) => lowerPrompt.includes(keyword));
}

// Query to expose AI mode to frontend
export const getAIMode = query({
  args: {},
  handler: async () => {
    return {
      mode: isLocalMode() ? "local" : "cloud",
      isLocalMode: isLocalMode(),
    } as const;
  },
});

// Tool to search knowledge base using RAG
const searchKnowledge = createTool({
  description:
    "Search the knowledge base for relevant information. Use this tool when the user asks a question that might be answered by documents in the knowledge base.",
  args: z.object({
    query: z.string().describe("The search query to find relevant information"),
  }),
  handler: async (ctx, args): Promise<string> => {
    // Both modes use the same API - the RAG component handles embeddings
    // based on the configured textEmbeddingModel
    const searchResult = await rag.search(ctx, {
      namespace: RAG_NAMESPACE,
      query: args.query,
      limit: 5,
    });

    if (searchResult.results.length === 0) {
      return "No relevant information found in the knowledge base.";
    }

    const formattedResults = searchResult.results
      .map((result, index) => {
        const metadata = result.content[0]?.metadata as
          | { title?: string }
          | undefined;
        const text = result.content.map((c) => c.text).join("\n");
        return `[${index + 1}] ${metadata?.title ?? "Document"}\n${text}`;
      })
      .join("\n\n---\n\n");

    return `Found relevant information:\n\n${formattedResults}`;
  },
});

// Tool to collect and submit feedback
const collectFeedback = createTool({
  description:
    "Submit user feedback after collecting their name, email, and feedback content. Only call this tool when you have gathered all the required information from the user.",
  args: z.object({
    feedback: z.string().describe("The main feedback content from the user"),
    details: z
      .string()
      .optional()
      .describe("Additional details or clarifications about the feedback"),
    name: z.string().describe("The user's name"),
    email: z.string().email().describe("The user's email address"),
    threadId: z
      .string()
      .optional()
      .describe("The current thread ID for reference"),
  }),
  handler: async (ctx, args): Promise<string> => {
    try {
      const result = await ctx.runAction(internal.feedback.submitFeedback, {
        feedback: args.feedback,
        details: args.details,
        name: args.name,
        email: args.email,
        threadId: args.threadId,
      });

      if (result.success) {
        return `Thank you ${args.name}! Your feedback has been submitted successfully. A confirmation email has been sent to ${args.email}.`;
      }
      return `There was an issue submitting your feedback: ${result.error}. Please try again.`;
    } catch {
      return "Sorry, there was an error submitting your feedback. Please try again later.";
    }
  },
});

// Create agent for CLOUD MODE ONLY
// For local mode, we bypass the agent component and use direct HTTP calls
const cloudAgent = isLocalMode()
  ? null
  : new Agent(components.agent, {
      name: "AI Assistant",
      languageModel: openai.chat(AI_CONFIG.openai.chatModel),
      textEmbeddingModel: openai.embedding(AI_CONFIG.openai.embeddingModel),
      instructions: AGENT_INSTRUCTIONS,
      tools: {
        searchKnowledge,
        collectFeedback,
      },
      maxSteps: 10,
    });

// Create a new agent thread
export const createAgentThread = mutation({
  args: {},
  handler: async (ctx) => {
    if (isLocalMode()) {
      // For local mode, create a simple thread ID
      // Note: Local mode doesn't persist conversation history in the agent component
      return `local-thread-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }

    const threadId = await createThread(ctx, components.agent, {
      userId: DEMO_USER,
    });
    return threadId;
  },
});

// Initiate streaming message to agent
export const initiateStream = mutation({
  args: {
    threadId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    // This mutation is for optimistic updates and triggering the action
    // The actual streaming happens in the background via scheduler
    await ctx.scheduler.runAfter(0, internal.agent.sendMessageToAgentInternal, {
      threadId: args.threadId,
      prompt: args.prompt,
    });
  },
});

// Internal action to send message to agent - handles both modes
export const sendMessageToAgentInternal = internalAction({
  args: {
    threadId: v.string(),
    prompt: v.string(),
    useRAG: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (isLocalMode()) {
      // LOCAL MODE: Direct HTTP call to local service
      // Only search RAG if the prompt suggests it's needed (saves ~1-2s per query)
      const needsRAG = args.useRAG ?? shouldUseRAG(args.prompt);

      let context = "";
      if (needsRAG) {
        const searchResult = await rag.search(ctx, {
          namespace: RAG_NAMESPACE,
          query: args.prompt,
          limit: 3,
        });

        if (searchResult.results.length > 0) {
          context = searchResult.results
            .map((r) => r.content.map((c) => c.text).join("\n"))
            .join("\n\n---\n\n");
        }
      }

      // Build messages with context
      const userContent = context
        ? `Context from knowledge base:\n${context}\n\n---\n\nUser question: ${args.prompt}`
        : args.prompt;

      const response = await fetchLocalResponse({
        instructions: AGENT_INSTRUCTIONS,
        messages: [
          {
            role: "user",
            content: userContent,
          },
        ],
      });

      return response;
    }

    // CLOUD MODE: Use agent component
    if (!cloudAgent) {
      throw new Error("Agent not initialized - configuration error");
    }

    const { thread } = await cloudAgent.continueThread(ctx, {
      threadId: args.threadId,
    });
    const result = await thread.streamText(
      { prompt: args.prompt },
      { saveStreamDeltas: true }
    );
    return result.text;
  },
});

// Direct action to send message to agent (non-streaming)
export const sendMessageToAgent = action({
  args: {
    threadId: v.string(),
    prompt: v.string(),
    useRAG: v.optional(v.boolean()), // Optional: force RAG on/off
  },
  handler: async (ctx, args) => {
    if (isLocalMode()) {
      // LOCAL MODE: Direct HTTP call to local service
      // Only search RAG if the prompt suggests it's needed (saves ~1-2s per query)
      const needsRAG = args.useRAG ?? shouldUseRAG(args.prompt);

      let context = "";
      if (needsRAG) {
        const searchResult = await rag.search(ctx, {
          namespace: RAG_NAMESPACE,
          query: args.prompt,
          limit: 3,
        });

        if (searchResult.results.length > 0) {
          context = searchResult.results
            .map((r) => r.content.map((c) => c.text).join("\n"))
            .join("\n\n---\n\n");
        }
      }

      const userContent = context
        ? `Context from knowledge base:\n${context}\n\n---\n\nUser question: ${args.prompt}`
        : args.prompt;

      const response = await fetchLocalResponse({
        instructions: AGENT_INSTRUCTIONS,
        messages: [
          {
            role: "user",
            content: userContent,
          },
        ],
      });

      return response;
    }

    // CLOUD MODE: Use agent component
    if (!cloudAgent) {
      throw new Error("Agent not initialized - configuration error");
    }

    const { thread } = await cloudAgent.continueThread(ctx, {
      threadId: args.threadId,
    });
    const result = await thread.streamText(
      { prompt: args.prompt },
      { saveStreamDeltas: true }
    );
    return result.text;
  },
});

// Query to list thread messages with streaming support
export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    if (isLocalMode()) {
      // LOCAL MODE: Return empty results since we don't persist messages
      // You could implement a custom messages table for local mode if needed
      return {
        page: [],
        isDone: true,
        continueCursor: "",
        streams: {},
      };
    }

    const paginated = await listUIMessages(ctx, components.agent, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts,
    });

    const streams = await syncStreams(ctx, components.agent, {
      threadId: args.threadId,
      streamArgs: args.streamArgs,
    });

    return { ...paginated, streams };
  },
});

// Legacy exports for backward compatibility
export const helloWorld = action({
  args: { city: v.string() },
  handler: async (ctx, { city }) => {
    const prompt = `What is the weather in ${city}?`;

    if (isLocalMode()) {
      const response = await fetchLocalResponse({
        instructions: "You are a helpful weather assistant.",
        messages: [{ role: "user", content: prompt }],
      });
      return response;
    }

    if (!cloudAgent) {
      throw new Error("Agent not initialized - configuration error");
    }

    const threadId = await createThread(ctx, components.agent);
    const result = await cloudAgent.generateText(ctx, { threadId }, { prompt });
    return result.text;
  },
});
