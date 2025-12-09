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

  // Files table - stores metadata for uploaded TXT files
  files: defineTable({
    fileName: v.string(),
    fileSize: v.number(),
    userId: v.optional(v.string()),
    createdAt: v.number(),
    storageId: v.optional(v.id("_storage")), // Convex file storage ID
  }).index("by_userId", ["userId"]),

  // FileContent table - stores the actual content of uploaded TXT files
  fileContent: defineTable({
    fileId: v.id("files"),
    content: v.string(),
  }).index("by_fileId", ["fileId"]),

  // PDFs table - stores metadata for uploaded PDF files
  pdfs: defineTable({
    fileName: v.string(),
    fileSize: v.number(),
    userId: v.optional(v.string()),
    createdAt: v.number(),
    status: v.string(), // "processing", "embedded", "failed"
    mimeType: v.string(), // "application/pdf"
    storageId: v.optional(v.id("_storage")), // Convex file storage ID
  }).index("by_userId", ["userId"]),

  // PDFContent table - stores the extracted text content from PDFs
  pdfContent: defineTable({
    pdfId: v.id("pdfs"),
    content: v.string(), // extracted text
    rawText: v.string(), // unprocessed extracted text for RAG
    pageCount: v.optional(v.number()),
    extractedAt: v.number(),
  }).index("by_pdfId", ["pdfId"]),
});
