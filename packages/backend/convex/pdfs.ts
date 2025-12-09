import { v, type Value } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { rag, saveDocumentMetadata } from "./rag";
import { internal } from "./_generated/api";

const RAG_NAMESPACE = "pdf-knowledge-base";

// Helper function to extract text from PDF (client-side extraction before sending)
// This assumes text extraction happens on the client using a library like pdfjs
function cleanPdfText(text: string): string {
  // Remove excessive whitespace and newlines
  return text
    .replace(/\n{3,}/g, "\n\n") // Replace 3+ newlines with 2
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim();
}

// Generate upload URL for PDF file storage
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const url = await ctx.storage.generateUploadUrl();
    return url;
  },
});

// Internal mutation to save PDF metadata and content
export const savePdfAndContent = internalMutation({
  args: {
    fileName: v.string(),
    fileSize: v.number(),
    extractedText: v.string(),
    rawText: v.string(),
    pageCount: v.optional(v.number()),
    userId: v.optional(v.string()),
    mimeType: v.string(),
    storageId: v.optional(v.id("_storage")), // Convex storage ID
  },
  handler: async (ctx, args) => {
    // Insert PDF metadata with storage ID
    const pdfId = await ctx.db.insert("pdfs", {
      fileName: args.fileName,
      fileSize: args.fileSize,
      userId: args.userId,
      createdAt: Date.now(),
      status: "processing",
      mimeType: args.mimeType,
      storageId: args.storageId,
    });

    // Insert PDF content
    await ctx.db.insert("pdfContent", {
      pdfId,
      content: args.extractedText,
      rawText: args.rawText,
      pageCount: args.pageCount,
      extractedAt: Date.now(),
    });

    return { pdfId, contentLength: args.extractedText.length };
  },
});

// Update PDF status after embedding
export const updatePdfStatus = internalMutation({
  args: {
    pdfId: v.id("pdfs"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.pdfId, { status: args.status });
  },
});

// Upload multiple PDF files with text extraction
export const uploadPdfs = action({
  args: {
    pdfs: v.array(
      v.object({
        fileName: v.string(),
        fileSize: v.number(),
        extractedText: v.string(),
        rawText: v.string(),
        pageCount: v.optional(v.number()),
        mimeType: v.string(),
        storageId: v.optional(v.id("_storage")), // Storage ID from client upload
      })
    ),
    userId: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args
  ): Promise<
    Array<{
      success: boolean;
      fileName: string;
      pdfId?: string;
      storageId?: string;
      status?: string;
      error?: string;
    }>
  > => {
    const results: Array<{
      success: boolean;
      fileName: string;
      pdfId?: string;
      storageId?: string;
      status?: string;
      error?: string;
    }> = [];

    for (const pdf of args.pdfs) {
      let pdfId: string | undefined;
      const storageId = pdf.storageId;
      
      try {
        // Clean extracted text
        const cleanedText = cleanPdfText(pdf.extractedText);

        // Save PDF metadata and content to database
        const saveResult = await ctx.runMutation(
          internal.pdfs.savePdfAndContent,
          {
            fileName: pdf.fileName,
            fileSize: pdf.fileSize,
            extractedText: cleanedText,
            rawText: pdf.rawText,
            pageCount: pdf.pageCount,
            userId: args.userId,
            mimeType: pdf.mimeType,
            storageId,
          }
        );
        pdfId = saveResult.pdfId;
        const contentLength = saveResult.contentLength;

        // Create content preview (first 300 chars)
        const contentPreview =
          cleanedText.length > 300
            ? `${cleanedText.slice(0, 300)}...`
            : cleanedText;

        // Save document metadata for RAG
        await ctx.runMutation(internal.rag.saveDocumentMetadata, {
          title: pdf.fileName.replace(".pdf", ""),
          contentPreview,
          contentLength,
          userId: args.userId,
        });

        // Ingest content into RAG with embeddings
        const metadata: Record<string, Value> = {
          title: pdf.fileName.replace(".pdf", ""),
          userId: args.userId ?? "anonymous",
          pdfId: pdfId ?? "",
          fileSize: pdf.fileSize,
          pageCount: pdf.pageCount ?? 0,
          source: "pdf",
        };
        if (storageId) {
          metadata.storageId = storageId;
        }
        await rag.add(ctx, {
          namespace: RAG_NAMESPACE,
          text: cleanedText,
          metadata,
        });

        // Update PDF status to embedded
        await ctx.runMutation(internal.pdfs.updatePdfStatus, {
          pdfId: pdfId as any,
          status: "embedded",
        });

        results.push({
          success: true,
          fileName: pdf.fileName,
          pdfId,
          storageId,
          status: "embedded",
        });
      } catch (error) {
        console.error(`Failed to process PDF ${pdf.fileName}:`, error);
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        
        // Update status to failed if we managed to create the PDF record
        if (pdfId) {
          try {
            await ctx.runMutation(internal.pdfs.updatePdfStatus, {
              pdfId: pdfId as any,
              status: "failed",
            });
          } catch (updateError) {
            console.error(`Failed to update PDF status to failed:`, updateError);
          }
        }
        
        results.push({
          success: false,
          fileName: pdf.fileName,
          pdfId,
          status: "failed",
          error: errorMsg,
        });
      }
    }

    return results;
  },
});

// Query to list all PDFs (optionally filtered by userId)
export const listPdfs = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.userId) {
      return await ctx.db
        .query("pdfs")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect();
    }

    return await ctx.db.query("pdfs").order("desc").collect();
  },
});

// Query to get a specific PDF by ID with its content
export const getPdf = query({
  args: {
    pdfId: v.id("pdfs"),
  },
  handler: async (ctx, args) => {
    const pdf = await ctx.db.get(args.pdfId);
    if (!pdf) {
      return null;
    }

    // Get the PDF content
    const contentDocs = await ctx.db
      .query("pdfContent")
      .withIndex("by_pdfId", (q) => q.eq("pdfId", args.pdfId))
      .collect();

    const content = contentDocs.length > 0 ? contentDocs[0] : null;

    return {
      pdf,
      content,
    };
  },
});

// Query to search PDFs by status
export const getPdfsByStatus = query({
  args: {
    status: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let results: Array<{
      _id: string;
      _creationTime: number;
      fileName: string;
      fileSize: number;
      userId?: string;
      createdAt: number;
      status: string;
      mimeType: string;
    }>;

    // Filter by userId if provided
    if (args.userId) {
      results = await ctx.db
        .query("pdfs")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .collect();
    } else {
      results = await ctx.db.query("pdfs").collect();
    }

    return results.filter((pdf) => pdf.status === args.status);
  },
});

// Mutation to delete a PDF and its content
export const deletePdf = mutation({
  args: {
    pdfId: v.id("pdfs"),
  },
  handler: async (ctx, args) => {
    // Get PDF metadata to retrieve storageId
    const pdf = await ctx.db.get(args.pdfId);
    
    if (pdf && pdf.storageId) {
      // Delete file from Convex file storage
      await ctx.storage.delete(pdf.storageId);
    }
    
    // Delete PDF content
    const contentRecords = await ctx.db
      .query("pdfContent")
      .withIndex("by_pdfId", (q) => q.eq("pdfId", args.pdfId))
      .collect();

    for (const record of contentRecords) {
      await ctx.db.delete(record._id);
    }

    // Delete PDF metadata
    await ctx.db.delete(args.pdfId);

    return { success: true };
  },
});
