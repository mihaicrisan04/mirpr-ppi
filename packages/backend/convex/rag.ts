import { RAG } from "@convex-dev/rag";
import { openai } from "@ai-sdk/openai";
import { components, internal } from "./_generated/api";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { AI_CONFIG, isLocalMode, getEmbeddingDimension } from "./ai/config";
import { createLocalEmbeddingModel } from "./ai/localEmbeddingModel";
import { RAG_NAMESPACE } from "./ai/constants";

// Initialize RAG - dimension and model depend on provider
// IMPORTANT: when switching providers, you MUST clear the vector store
// because embedding dimensions are incompatible
function createRAGInstance() {
  if (isLocalMode()) {
    // LOCAL MODE: Use custom embedding model that wraps our FastAPI service
    // The custom model implements the AI SDK EmbeddingModelV2 interface
    return new RAG(components.rag, {
      textEmbeddingModel: createLocalEmbeddingModel() as unknown as ReturnType<
        typeof openai.embedding
      >,
      embeddingDimension: getEmbeddingDimension(),
    });
  }
  // CLOUD MODE: Use OpenAI
  return new RAG(components.rag, {
    textEmbeddingModel: openai.embedding(AI_CONFIG.openai.embeddingModel),
    embeddingDimension: getEmbeddingDimension(),
  });
}

export const rag = createRAGInstance();

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

    // Both modes use the same API - the RAG component will use whatever
    // textEmbeddingModel was configured (OpenAI or our custom local model)
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
    // Both modes use the same API - the RAG component will use whatever
    // textEmbeddingModel was configured (OpenAI or our custom local model)
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
        const metadata = result.content[0]?.metadata as
          | { title?: string }
          | undefined;
        const text = result.content.map((c) => c.text).join("\n");
        return `[${index + 1}] ${metadata?.title ?? "Untitled"}\n${text}`;
      })
      .join("\n\n---\n\n");

    return formattedResults;
  },
});

// ============================================================================
// NAMESPACE MANAGEMENT UTILITIES
// Use these to debug and reset the RAG vector store when changing embedding models
// ============================================================================

// List all RAG namespaces (for debugging)
export const listNamespaces = query({
  args: {
    status: v.optional(v.union(v.literal("ready"), v.literal("pending"), v.literal("replaced"))),
  },
  handler: async (ctx, args) => {
    // Query the RAG component's namespaces table directly
    const namespaces = await ctx.runQuery(components.rag.namespaces.list, {
      paginationOpts: { cursor: null, numItems: 100 },
      status: args.status ?? "ready",
    });
    return namespaces;
  },
});

// List ALL namespaces across all statuses (for debugging)
export const listAllNamespaces = action({
  args: {},
  handler: async (ctx) => {
    const ready = await ctx.runQuery(components.rag.namespaces.list, {
      paginationOpts: { cursor: null, numItems: 100 },
      status: "ready",
    });
    const pending = await ctx.runQuery(components.rag.namespaces.list, {
      paginationOpts: { cursor: null, numItems: 100 },
      status: "pending",
    });
    const replaced = await ctx.runQuery(components.rag.namespaces.list, {
      paginationOpts: { cursor: null, numItems: 100 },
      status: "replaced",
    });

    return {
      ready: ready.page,
      pending: pending.page,
      replaced: replaced.page,
      summary: {
        readyCount: ready.page.length,
        pendingCount: pending.page.length,
        replacedCount: replaced.page.length,
      },
    };
  },
});

// Get info about current namespace configuration
export const getNamespaceInfo = query({
  args: {},
  handler: async () => {
    const dimension = getEmbeddingDimension();
    const modelId = isLocalMode()
      ? AI_CONFIG.local.embeddingModel
      : AI_CONFIG.openai.embeddingModel;

    return {
      namespace: RAG_NAMESPACE,
      expectedDimension: dimension,
      expectedModelId: modelId,
      isLocalMode: isLocalMode(),
      provider: AI_CONFIG.provider,
    };
  },
});

// Clear a specific namespace by ID (use listNamespaces to find IDs)
export const clearNamespaceById = mutation({
  args: {
    namespaceId: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await ctx.runMutation(
      components.rag.namespaces.deleteNamespace,
      { namespaceId: args.namespaceId }
    );
    return result;
  },
});

// Clear the knowledge-base namespace - ACTION version that handles async deletion
// This clears ALL statuses (ready, pending, replaced) to fully reset
export const clearKnowledgeBase = action({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    message: string;
    deleted: string[];
    documentsCleared?: number;
  }> => {
    // Get namespaces from ALL statuses to fully clean up
    const ready = await ctx.runQuery(components.rag.namespaces.list, {
      paginationOpts: { cursor: null, numItems: 100 },
      status: "ready",
    });
    const pending = await ctx.runQuery(components.rag.namespaces.list, {
      paginationOpts: { cursor: null, numItems: 100 },
      status: "pending",
    });
    const replaced = await ctx.runQuery(components.rag.namespaces.list, {
      paginationOpts: { cursor: null, numItems: 100 },
      status: "replaced",
    });

    // Combine all namespaces and filter for knowledge-base
    const allNamespaces = [...ready.page, ...pending.page, ...replaced.page];
    const knowledgeBaseNamespaces = allNamespaces.filter(
      (ns) => ns.namespace === RAG_NAMESPACE
    );

    if (knowledgeBaseNamespaces.length === 0) {
      return {
        success: true,
        message: "No knowledge-base namespace found to delete",
        deleted: [],
      };
    }

    // Delete each matching namespace
    const deleted: string[] = [];
    for (const ns of knowledgeBaseNamespaces) {
      await ctx.runMutation(components.rag.namespaces.deleteNamespace, {
        namespaceId: ns.namespaceId,
      });
      deleted.push(ns.namespaceId);
    }

    // Also clear our documents table
    const allDocuments = await ctx.runQuery(internal.rag.listDocumentsInternal, {});
    for (const doc of allDocuments) {
      await ctx.runMutation(internal.rag.deleteDocumentInternal, {
        documentId: doc._id,
      });
    }

    return {
      success: true,
      message: `Deleted ${deleted.length} namespace(s) and ${allDocuments.length} document(s)`,
      deleted,
      documentsCleared: allDocuments.length,
    };
  },
});

// Internal query to list all documents (for clearing)
export const listDocumentsInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("documents").collect();
  },
});
