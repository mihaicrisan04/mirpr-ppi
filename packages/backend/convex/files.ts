import { v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { rag, saveDocumentMetadata } from "./rag";
import { internal } from "./_generated/api";

const RAG_NAMESPACE = "knowledge-base";

// Generate upload URL for file storage
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const url = await ctx.storage.generateUploadUrl();
    return url;
  },
});

// Internal mutation to save file metadata and content
export const saveFileAndContent = internalMutation({
  args: {
    fileName: v.string(),
    fileSize: v.number(),
    content: v.string(),
    userId: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")), // Convex storage ID
  },
  handler: async (ctx, args) => {
    // Insert file metadata with storage ID
    const fileId = await ctx.db.insert("files", {
      fileName: args.fileName,
      fileSize: args.fileSize,
      userId: args.userId,
      createdAt: Date.now(),
      storageId: args.storageId,
    });

    // Insert file content
    await ctx.db.insert("fileContent", {
      fileId,
      content: args.content,
    });

    return { fileId, contentLength: args.content.length };
  },
});

// Upload multiple TXT files with file storage
export const uploadFiles = action({
  args: {
    files: v.array(
      v.object({
        fileName: v.string(),
        fileSize: v.number(),
        content: v.string(),
        storageId: v.optional(v.id("_storage")), // Storage ID from client upload
      })
    ),
    userId: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args
  ): Promise<Array<{ success: boolean; fileName: string; fileId?: string; storageId?: string; error?: string }>> => {
    console.log("[FILES] uploadFiles action called");
    const results: Array<{ success: boolean; fileName: string; fileId?: string; storageId?: string; error?: string }> = [];

    for (const file of args.files) {
      try {
        const storageId = file.storageId;

        // Save file metadata and content to database
        const { fileId, contentLength } = await ctx.runMutation(
          internal.files.saveFileAndContent,
          {
            fileName: file.fileName,
            fileSize: file.fileSize,
            content: file.content,
            userId: args.userId,
            storageId,
          }
        );

        // Create content preview (first 200 chars)
        const contentPreview =
          file.content.length > 200
            ? `${file.content.slice(0, 200)}...`
            : file.content;

        // Save document metadata for RAG
        await ctx.runMutation(internal.rag.saveDocumentMetadata, {
          title: file.fileName.replace(".txt", ""),
          contentPreview,
          contentLength,
          userId: args.userId,
        });

        // Ingest content into RAG with embeddings
        const metadata: Record<string, string | number> = {
          title: file.fileName.replace(".txt", ""),
          userId: args.userId ?? "anonymous",
          fileId,
          fileSize: file.fileSize,
        };
        if (storageId) {
          metadata.storageId = storageId;
        }
        await rag.add(ctx, {
          namespace: RAG_NAMESPACE,
          text: file.content,
          metadata,
        });

        results.push({
          success: true,
          fileName: file.fileName,
          fileId,
          storageId,
        });
      } catch (error) {
        results.push({
          success: false,
          fileName: file.fileName,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  },
});

// Query to get a specific file by ID
export const getFile = query({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      return null;
    }

    return file;
  },
});

// Query to get file content by file ID
export const getFileContent = query({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    const contentRecord = await ctx.db
      .query("fileContent")
      .withIndex("by_fileId", (q) => q.eq("fileId", args.fileId))
      .first();

    if (!contentRecord) {
      return null;
    }

    return {
      fileId: args.fileId,
      content: contentRecord.content,
    };
  },
});

// Query to get both file metadata and content
export const getFileWithContent = query({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      return null;
    }

    const contentRecord = await ctx.db
      .query("fileContent")
      .withIndex("by_fileId", (q) => q.eq("fileId", args.fileId))
      .first();

    return {
      ...file,
      content: contentRecord?.content ?? null,
    };
  },
});

// Query to list all files (optionally filtered by userId)
export const listFiles = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.userId) {
      return await ctx.db
        .query("files")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect();
    }

    return await ctx.db.query("files").order("desc").collect();
  },
});

// Mutation to delete a file and its content
export const deleteFile = mutation({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    // Get file metadata to retrieve storageId
    const file = await ctx.db.get(args.fileId);
    
    if (file && file.storageId) {
      // Delete file from Convex file storage
      await ctx.storage.delete(file.storageId);
    }
    
    // Delete file content
    const contentRecord = await ctx.db
      .query("fileContent")
      .withIndex("by_fileId", (q) => q.eq("fileId", args.fileId))
      .first();

    if (contentRecord) {
      await ctx.db.delete(contentRecord._id);
    }

    // Delete file metadata
    await ctx.db.delete(args.fileId);

    return { success: true };
  },
});
