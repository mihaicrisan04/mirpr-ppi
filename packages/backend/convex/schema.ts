import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
  }),

  // RAG documents table - stores metadata for uploaded content
  documents: defineTable({
    title: v.string(),
    contentPreview: v.string(),
    contentLength: v.number(),
    userId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  // Feedback table - stores user feedback from chat
  feedback: defineTable({
    feedback: v.string(),
    details: v.optional(v.string()),
    name: v.string(),
    email: v.string(),
    threadId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),
});
