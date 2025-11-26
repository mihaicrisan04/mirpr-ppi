import { RAG } from "@convex-dev/rag";
import { openai } from "@ai-sdk/openai";
import { components, internal } from "./_generated/api";
import { action, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

// Namespace for all documents
const RAG_NAMESPACE = "knowledge-base";

// Initialize RAG with OpenAI embeddings
// text-embedding-3-small has 1536 dimensions
export const rag = new RAG(components.rag, {
  textEmbeddingModel: openai.embedding("text-embedding-3-small"),
  embeddingDimension: 1536,
});

// Internal mutation to save document metadata
export const saveDocumentMetadata = internalMutation({
  args: {
    title: v.string(),
    contentPreview: v.string(),
    contentLength: v.number(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("documents", {
      title: args.title,
      contentPreview: args.contentPreview,
      contentLength: args.contentLength,
      userId: args.userId,
      createdAt: Date.now(),
    });
  },
});

// Add a document to the RAG system
export const addDocument = action({
  args: {
    title: v.string(),
    content: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string> => {
    const { title, content, userId } = args;

    // Create content preview (first 200 chars)
    const contentPreview =
      content.length > 200 ? `${content.slice(0, 200)}...` : content;

    // Insert document metadata into our table
    const documentId = await ctx.runMutation(internal.rag.saveDocumentMetadata, {
      title,
      contentPreview,
      contentLength: content.length,
      userId,
    });

    // Ingest the content into RAG with embeddings
    await rag.add(ctx, {
      namespace: RAG_NAMESPACE,
      text: content,
      metadata: {
        title,
        userId: userId ?? "anonymous",
        documentId,
      },
    });

    return documentId;
  },
});

// List all documents for a user
export const listDocuments = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.userId) {
      return await ctx.db
        .query("documents")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect();
    }
    // Return all documents if no userId specified
    return await ctx.db.query("documents").order("desc").collect();
  },
});

// Delete a document from our database (RAG entries are managed separately)
export const deleteDocument = action({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args): Promise<void> => {
    // Delete from our documents table
    // Note: RAG entries are not deleted here - they would need entryId which we don't store
    await ctx.runMutation(internal.rag.deleteDocumentInternal, {
      documentId: args.documentId,
    });
  },
});

// Internal mutation to delete document from database
export const deleteDocumentInternal = internalMutation({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.documentId);
  },
});

// Search RAG for relevant context - used by the agent
export const searchContext = action({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<string> => {
    const searchResult = await rag.search(ctx, {
      namespace: RAG_NAMESPACE,
      query: args.query,
      limit: args.limit ?? 5,
    });

    if (searchResult.results.length === 0) {
      return "No relevant context found in the knowledge base.";
    }

    // Format results for the agent
    const formattedResults = searchResult.results
      .map((result, index) => {
        const metadata = result.content[0]?.metadata as { title?: string } | undefined;
        const text = result.content.map((c) => c.text).join("\n");
        return `[${index + 1}] ${metadata?.title ?? "Untitled"}\n${text}`;
      })
      .join("\n\n---\n\n");

    return formattedResults;
  },
});
