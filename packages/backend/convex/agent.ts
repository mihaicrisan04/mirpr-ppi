import { requireActionCtx } from "@convex-dev/better-auth/utils";
import { components } from "./_generated/api";
import { Agent, createThread } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { action, mutation } from "./_generated/server";
import { v } from "convex/values";


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
})

const DEMO_USER = "mihai-123";

export const createAgentThread = mutation({
  args: {},
  handler: async (ctx) => {
    const threadId = await createThread(ctx, components.agent, { userId: DEMO_USER });
    return threadId;
  },
})

export const sendMessageToAgent = action({
  args: {
    threadId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const { thread } = await agent.continueThread(ctx, {
      threadId: args.threadId,
    });
    const result = await thread.generateText({ prompt: args.prompt });
    return result.text;
  },
})
