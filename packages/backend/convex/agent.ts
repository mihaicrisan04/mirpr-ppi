import { components, internal } from "./_generated/api";
import {
  Agent,
  createThread,
  listUIMessages,
  syncStreams,
  createTool,
} from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import {
  action,
  mutation,
  query,
  internalAction,
} from "./_generated/server";
import { v } from "convex/values";
import { vStreamArgs } from "@convex-dev/agent/validators";
import { paginationOptsValidator } from "convex/server";
import { z } from "zod/v3";
import { rag } from "./rag";
import { AI_CONFIG, isLocalMode } from "./ai/config";
import { RAG_NAMESPACE, AGENT_INSTRUCTIONS } from "./ai/constants";
import { authComponent } from "./auth";

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
    "Search the knowledge base for relevant information. Use this tool when the user asks a question that might be answered by documents in the knowledge base. Always search before answering questions about specific topics.",
  args: z.object({
    query: z.string().describe("The search query to find relevant information"),
  }),
  handler: async (ctx, args): Promise<string> => {
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

// Create agent for CLOUD MODE
// Local mode is not supported for streaming - cloud mode required
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

// ============================================================================
// THREAD MANAGEMENT
// ============================================================================

// Create a new agent thread for a user
export const createAgentThread = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    if (isLocalMode()) {
      throw new Error(
        "Local mode is not supported. Please use cloud mode (OpenAI) for streaming."
      );
    }

    const threadId = await createThread(ctx, components.agent, {
      userId: args.userId,
    });
    return threadId;
  },
});

// List all threads for a user
export const listUserThreads = query({
  args: {
    userId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const threads = await ctx.runQuery(
      components.agent.threads.listThreadsByUserId,
      {
        userId: args.userId,
        paginationOpts: args.paginationOpts,
      }
    );
    return threads;
  },
});

// Get thread metadata
export const getThread = query({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.runQuery(components.agent.threads.getThread, {
      threadId: args.threadId,
    });
    return thread;
  },
});

// Update thread title
export const updateThreadTitle = mutation({
  args: {
    threadId: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    if (!cloudAgent) {
      throw new Error("Agent not initialized");
    }

    await cloudAgent.updateThreadMetadata(ctx, {
      threadId: args.threadId,
      patch: {
        title: args.title,
      },
    });
  },
});

// Delete a thread
export const deleteThread = mutation({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!cloudAgent) {
      throw new Error("Agent not initialized");
    }

    await cloudAgent.deleteThreadAsync(ctx, {
      threadId: args.threadId,
    });
  },
});

// ============================================================================
// MESSAGING
// ============================================================================

// Initiate streaming message to agent - this is the main entry point for chat
export const initiateStream = mutation({
  args: {
    threadId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    if (isLocalMode() || !cloudAgent) {
      throw new Error(
        "Streaming requires cloud mode. Please configure OpenAI."
      );
    }

    // Save the user message first - this is required for the streaming pattern
    const { messageId } = await cloudAgent.saveMessage(ctx, {
      threadId: args.threadId,
      prompt: args.prompt,
      skipEmbeddings: true, // Skip for faster response, embeddings not needed for user messages
    });

    // Schedule the streaming action to run immediately
    await ctx.scheduler.runAfter(0, internal.agent.streamResponseAsync, {
      threadId: args.threadId,
      promptMessageId: messageId,
    });

    return { messageId };
  },
});

// Internal action to stream the response - runs asynchronously
export const streamResponseAsync = internalAction({
  args: {
    threadId: v.string(),
    promptMessageId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!cloudAgent) {
      throw new Error("Agent not initialized - configuration error");
    }

    const { thread } = await cloudAgent.continueThread(ctx, {
      threadId: args.threadId,
    });

    // Stream text with delta saving for real-time updates
    const result = await thread.streamText(
      { promptMessageId: args.promptMessageId },
      {
        saveStreamDeltas: {
          chunking: "word", // Save word-by-word for smooth streaming
          throttleMs: 50, // Throttle writes to avoid too many DB operations
        },
      }
    );

    // Consume the stream to ensure it completes
    // This is required - without it, the stream won't be fully processed
    await result.consumeStream();

    return { success: true };
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
    // Fetch regular non-streaming messages with pagination
    const paginated = await listUIMessages(ctx, components.agent, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts,
    });

    // Sync streaming deltas for real-time updates
    const streams = await syncStreams(ctx, components.agent, {
      threadId: args.threadId,
      streamArgs: args.streamArgs,
    });

    return { ...paginated, streams };
  },
});

// ============================================================================
// LEGACY FUNCTIONS (kept for backward compatibility)
// ============================================================================

// Legacy action for non-streaming use cases
export const sendMessageToAgent = action({
  args: {
    threadId: v.string(),
    prompt: v.string(),
    useRAG: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (isLocalMode() || !cloudAgent) {
      throw new Error(
        "This action requires cloud mode. Please configure OpenAI."
      );
    }

    const { thread } = await cloudAgent.continueThread(ctx, {
      threadId: args.threadId,
    });

    const result = await thread.generateText({
      prompt: args.prompt,
    });

    return result.text;
  },
});

export const helloWorld = action({
  args: { city: v.string() },
  handler: async (ctx, { city }) => {
    if (isLocalMode() || !cloudAgent) {
      throw new Error("This action requires cloud mode.");
    }

    const prompt = `What is the weather in ${city}?`;
    const threadId = await createThread(ctx, components.agent);
    const result = await cloudAgent.generateText(ctx, { threadId }, { prompt });
    return result.text;
  },
});
