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

// Namespace for RAG search
const RAG_NAMESPACE = "knowledge-base";

// Tool to search knowledge base using RAG
const searchKnowledge = createTool({
  description:
    "Search the knowledge base for relevant information. Use this tool when the user asks a question that might be answered by documents in the knowledge base.",
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
        const metadata = result.content[0]?.metadata as { title?: string } | undefined;
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
    } catch (error) {
      return "Sorry, there was an error submitting your feedback. Please try again later.";
    }
  },
});

// Agent instructions with feedback flow guidance
const AGENT_INSTRUCTIONS = `You are a helpful AI assistant with access to a knowledge base and the ability to collect user feedback.

## Knowledge Base
When users ask questions, use the searchKnowledge tool to find relevant information from the knowledge base. Always search before answering questions that might be covered by uploaded documents.

## Feedback Collection
You can help users leave feedback about the service. When a user wants to leave feedback:
1. First, ask them what feedback they'd like to share
2. If their feedback is unclear or too brief, ask for more details or clarification
3. Once you have clear feedback, ask for their name
4. Then ask for their email address
5. Finally, use the collectFeedback tool to submit their feedback

If a user says they want to leave feedback, start the feedback collection process. Be conversational and friendly throughout.

## General Guidelines
- Be helpful and conversational
- Use markdown formatting for better readability (tables, lists, code blocks when appropriate)
- If you don't know something and it's not in the knowledge base, be honest about it
- Occasionally (after a few helpful exchanges), you can ask if the user would like to leave feedback about their experience`;

// Create the agent with tools
const agent = new Agent(components.agent, {
  name: "AI Assistant",
  languageModel: openai.chat("gpt-4o-mini"),
  textEmbeddingModel: openai.embedding("text-embedding-3-small"),
  instructions: AGENT_INSTRUCTIONS,
  tools: {
    searchKnowledge,
    collectFeedback,
  },
  maxSteps: 10,
});

const DEMO_USER = "demo-user";

// Create a new agent thread
export const createAgentThread = mutation({
  args: {},
  handler: async (ctx) => {
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

// Internal action to send message to agent
export const sendMessageToAgentInternal = internalAction({
  args: {
    threadId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const { thread } = await agent.continueThread(ctx, {
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
  },
  handler: async (ctx, args) => {
    const { thread } = await agent.continueThread(ctx, {
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
    const threadId = await createThread(ctx, components.agent);
    const prompt = `What is the weather in ${city}?`;
    const result = await agent.generateText(ctx, { threadId }, { prompt });
    return result.text;
  },
});
