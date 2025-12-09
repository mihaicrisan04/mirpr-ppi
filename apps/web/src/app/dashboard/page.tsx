"use client";

import { api } from "@mirpr-ppi/backend/convex/_generated/api";
import { useAction, useQuery, useMutation } from "convex/react";
import { useState, useCallback, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  FileTextIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { MultiFileUpload } from "@/components/multi-file-upload";
import { MultiPdfUpload } from "@/components/multi-pdf-upload";
import { CombinedFileUpload } from "@/components/multi-file-combined-upload";
import { PdfsList } from "@/components/pdfs-list";

export default function DashboardPage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-6" suppressHydrationWarning>
      <div className="space-y-2">
        <h1 className="font-bold text-3xl tracking-tight">Knowledge Base</h1>
        <p className="text-muted-foreground">
          Manage the AI assistant's knowledge by adding text content or
          uploading .txt and .pdf files.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <AddTextContent />
        <CombinedUploadSection />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <DocumentsList />
        <FilesList />
      </div>

      <div className="grid gap-6">
        <div className="md:col-span-2">
          <PdfsList />
        </div>
      </div>
    </div>
  );
}

function AddTextContent() {
  const addDocument = useAction(api.rag.addDocument);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await addDocument({
        title: title.trim(),
        content: content.trim(),
      });
      setTitle("");
      setContent("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusIcon className="size-5" />
          Add Text Content
        </CardTitle>
        <CardDescription>
          Add text directly to the knowledge base
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Document title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Enter your text content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
              className="min-h-32"
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <PlusIcon className="mr-2 size-4" />
                Add to Knowledge Base
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CombinedUploadSection() {
  const uploadFiles = useAction(api.files.uploadFiles);
  const uploadPdfs = useAction(api.pdfs.uploadPdfs);
  const generateFileUploadUrl = useMutation(api.files.generateUploadUrl);
  const generatePdfUploadUrl = useMutation(api.pdfs.generateUploadUrl);
  const [isUploading, setIsUploading] = useState(false);

  const handleFilesReady = async (
    txtFiles: Array<{ fileName: string; fileSize: number; content: string; file: File }>,
    pdfFiles: Array<{
      fileName: string;
      fileSize: number;
      extractedText: string;
      rawText: string;
      pageCount?: number;
      mimeType: string;
      file: File;
    }>
  ) => {
    if (txtFiles.length === 0 && pdfFiles.length === 0) {
      console.warn("No files to upload");
      return;
    }
    
    setIsUploading(true);
    try {
      // Upload TXT files with file storage
      if (txtFiles.length > 0) {
        try {
          const txtFilesWithStorage = await Promise.all(
            txtFiles.map(async (txtFile) => {
              try {
                // Generate upload URL
                console.log(`[TXT] Generating upload URL for ${txtFile.fileName}...`);
                let uploadUrl;
                try {
                  uploadUrl = await generateFileUploadUrl();
                  console.log(`[TXT] ✓ Got upload URL: ${uploadUrl?.substring(0, 50)}...`);
                } catch (mutationError) {
                  console.error(`[TXT] ✗ MUTATION FAILED:`, mutationError);
                  throw new Error(`Failed to generate upload URL: ${mutationError}`);
                }
                
                if (!uploadUrl) {
                  throw new Error("Upload URL is empty/undefined");
                }
                
                // Upload the file
                console.log(`[TXT] Uploading file ${txtFile.fileName} (${txtFile.fileSize} bytes)...`);
                const response = await fetch(uploadUrl, {
                  method: "POST",
                  headers: { "Content-Type": "text/plain" },
                  body: txtFile.file,
                });
                
                if (!response.ok) {
                  const text = await response.text();
                  throw new Error(`Upload failed with status ${response.status}: ${text}`);
                }
                
                const responseData = await response.json();
                console.log(`[TXT] ✓ Upload response:`, responseData);
                
                const { storageId } = responseData;
                if (!storageId) {
                  throw new Error("No storageId in response");
                }
                
                return {
                  fileName: txtFile.fileName,
                  fileSize: txtFile.fileSize,
                  content: txtFile.content,
                  storageId,
                };
              } catch (error) {
                throw error;
              }
            })
          );
          console.log("[TXT] Calling uploadFiles action...");
          await uploadFiles({ files: txtFilesWithStorage });
          console.log("[TXT] ✓ TXT files processed successfully");
        } catch (error) {
          console.error("[TXT] Error in TXT upload block:", error);
          throw error;
        }
      }

      // Upload PDF files with file storage
      if (pdfFiles.length > 0) {
        try {
          const pdfFilesWithStorage = await Promise.all(
            pdfFiles.map(async (pdfFile) => {
              try {
                // Generate upload URL
                const uploadUrl = await generatePdfUploadUrl();
                
                if (!uploadUrl) {
                  throw new Error("Upload URL is empty/undefined");
                }
                
                // Upload the file
                const response = await fetch(uploadUrl, {
                  method: "POST",
                  headers: { "Content-Type": pdfFile.mimeType },
                  body: pdfFile.file,
                });
                
                if (!response.ok) {
                  const text = await response.text();
                  throw new Error(`Upload failed with status ${response.status}: ${text}`);
                }
                
                const responseData = await response.json();
                const { storageId } = responseData;
                if (!storageId) {
                  throw new Error("No storageId in response");
                }
                
                return {
                  fileName: pdfFile.fileName,
                  fileSize: pdfFile.fileSize,
                  extractedText: pdfFile.extractedText,
                  rawText: pdfFile.rawText,
                  pageCount: pdfFile.pageCount,
                  mimeType: pdfFile.mimeType,
                  storageId,
                };
              } catch (error) {
                throw error;
              }
            })
          );
          await uploadPdfs({ pdfs: pdfFilesWithStorage });
        } catch (error) {
          throw error;
        }
      }
    } catch (error) {
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadIcon className="size-5" />
          Upload Files
        </CardTitle>
        <CardDescription>
          Upload multiple .txt and .pdf files at once to the knowledge base
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CombinedFileUpload
          maxFiles={20}
          onFilesReady={handleFilesReady}
          isUploading={isUploading}
        />
      </CardContent>
    </Card>
  );
}

function UploadMultipleFiles() {
  const uploadFiles = useAction(api.files.uploadFiles);
  const [isUploading, setIsUploading] = useState(false);

  const handleFilesReady = async (
    files: Array<{ fileName: string; fileSize: number; content: string }>
  ) => {
    setIsUploading(true);
    try {
      await uploadFiles({
        files,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadIcon className="size-5" />
          Upload Text Files (.txt)
        </CardTitle>
        <CardDescription>
          Upload multiple .txt files at once to the knowledge base
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MultiFileUpload
          accept=".txt,text/plain"
          maxFiles={10}
          onFilesReady={handleFilesReady}
          isUploading={isUploading}
        />
      </CardContent>
    </Card>
  );
}

function FilesList() {
  const files = useQuery(api.files.listFiles, {});
  const deleteFile = useMutation(api.files.deleteFile);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (fileId: string) => {
    setDeletingId(fileId);
    try {
      // @ts-expect-error - fileId type mismatch
      await deleteFile({ fileId });
    } finally {
      setDeletingId(null);
    }
  };

  if (files === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileTextIcon className="size-5" />
          Uploaded Files ({files.length})
        </CardTitle>
        <CardDescription>All uploaded text files</CardDescription>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <FileTextIcon className="mx-auto mb-2 size-12 opacity-50" />
            <p>No files uploaded yet</p>
            <p className="text-sm">Upload files to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file._id}
                className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <FileTextIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium">{file.fileName}</h4>
                  <div className="mt-1 flex items-center gap-2 text-muted-foreground text-xs">
                    <span>{(file.fileSize / 1024).toFixed(1)} KB</span>
                    <span>•</span>
                    <span>
                      {new Date(file.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(file._id)}
                  disabled={deletingId === file._id}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  {deletingId === file._id ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <Trash2Icon className="size-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DocumentsList() {
  const documents = useQuery(api.rag.listDocuments, {});
  const deleteDocument = useAction(api.rag.deleteDocument);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (documentId: string) => {
    setDeletingId(documentId);
    try {
      // @ts-expect-error - documentId type mismatch with Id<"documents">
      await deleteDocument({ documentId });
    } finally {
      setDeletingId(null);
    }
  };

  if (documents === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileTextIcon className="size-5" />
          Documents ({documents.length})
        </CardTitle>
        <CardDescription>
          All documents in the knowledge base
        </CardDescription>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <FileTextIcon className="mx-auto mb-2 size-12 opacity-50" />
            <p>No documents yet</p>
            <p className="text-sm">
              Add text content or upload files to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc._id}
                className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <FileTextIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium">{doc.title}</h4>
                  <p className="line-clamp-2 text-muted-foreground text-sm">
                    {doc.contentPreview}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-muted-foreground text-xs">
                    <span>
                      {doc.contentLength.toLocaleString()} characters
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(doc._id)}
                  disabled={deletingId === doc._id}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  {deletingId === doc._id ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <Trash2Icon className="size-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UploadMultiplePdfs() {
  const uploadPdfs = useAction(api.pdfs.uploadPdfs);
  const [isUploading, setIsUploading] = useState(false);

  const handlePdfsReady = async (
    pdfs: Array<{
      fileName: string;
      fileSize: number;
      extractedText: string;
      rawText: string;
      pageCount?: number;
      mimeType: string;
    }>
  ) => {
    setIsUploading(true);
    try {
      await uploadPdfs({
        pdfs,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadIcon className="size-5" />
          Upload PDF Files (.pdf)
        </CardTitle>
        <CardDescription>
          Upload multiple .pdf files at once to the knowledge base
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MultiPdfUpload
          maxFiles={10}
          onPdfsReady={handlePdfsReady}
          isUploading={isUploading}
        />
      </CardContent>
    </Card>
  );
}
