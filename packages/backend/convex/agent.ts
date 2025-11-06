import { requireActionCtx } from "@convex-dev/better-auth/utils";
import { components, internal } from "./_generated/api";
import { Agent, createThread, listUIMessages, syncStreams } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { action, mutation, query, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { vTextArgs, vStreamArgs } from "@convex-dev/agent/validators";
import { threadId } from "node:worker_threads";
import { paginationOptsValidator } from "convex/server";


const agent = new Agent(components.agent, {
  name: "My Agent",
  languageModel: openai.chat("gpt-4o-mini"),
  instructions: "You are a weather forecaster. Give as much details about genera weather in the area the user asks about, make use of tables and other formatting as much as possible.",
  // tools: { getWeather, getGeocoding },
  maxSteps: 3,
});

export const helloWorld = action({
  args: { city: v.string() },
  handler: async (ctx, { city }) => {
    const threadId = await createThread(ctx, components.agent);
    const prompt = `What is the weather in ${city}?`;
    const result = await agent.generateText(ctx, { threadId }, { prompt });
    return result.text;
  },
});

export const helloWorldStreaming = action({
  args: { city: v.string() },
  handler: async (ctx, { city }) => {
    const threadId = await createThread(ctx, components.agent);
    const prompt = `What is the weather in ${city}?`;
    const result = await agent.generateText(ctx, { threadId }, { prompt });
    return result.text;
  }
});

const DEMO_USER = "mihai-123";

export const createAgentThread = mutation({
  args: {},
  handler: async (ctx) => {
    const threadId = await createThread(ctx, components.agent, { userId: DEMO_USER });
    return threadId;
  },
});

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

export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    // we can check here that the currently logged in user is the one who created the thread

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
