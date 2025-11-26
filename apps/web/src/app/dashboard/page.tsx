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

export default function DashboardPage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-6">
      <div className="space-y-2">
        <h1 className="font-bold text-3xl tracking-tight">Knowledge Base</h1>
        <p className="text-muted-foreground">
          Manage the AI assistant's knowledge by adding text content or
          uploading files.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <AddTextContent />
        <UploadFile />
      </div>

      <DocumentsList />
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

function UploadFile() {
  const addDocument = useAction(api.rag.addDocument);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "text/plain") {
      setSelectedFile(file);
    }
  };

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const content = await selectedFile.text();
      await addDocument({
        title: selectedFile.name.replace(".txt", ""),
        content,
      });
      setSelectedFile(null);
      // Reset the file input
      const fileInput = document.getElementById(
        "file-upload"
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, addDocument]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadIcon className="size-5" />
          Upload Text File
        </CardTitle>
        <CardDescription>
          Upload a .txt file to add to the knowledge base
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">Select File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".txt,text/plain"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>

          {selectedFile && (
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
              <FileTextIcon className="size-5 text-muted-foreground" />
              <div className="flex-1 truncate">
                <p className="font-medium text-sm">{selectedFile.name}</p>
                <p className="text-muted-foreground text-xs">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          )}

          <Button
            type="button"
            onClick={handleUpload}
            disabled={isUploading || !selectedFile}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <UploadIcon className="mr-2 size-4" />
                Upload File
              </>
            )}
          </Button>
        </div>
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
