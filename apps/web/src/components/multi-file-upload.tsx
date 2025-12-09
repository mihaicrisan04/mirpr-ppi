import type * as React from "react";
import { useState, useRef, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileTextIcon,
  Loader2Icon,
  UploadIcon,
  Trash2Icon,
  CheckCircleIcon,
  AlertCircleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedFile {
  file: File;
  content?: string;
  error?: string;
  isLoading?: boolean;
  isLoaded?: boolean;
}

interface MultiFileUploadProps {
  accept?: string;
  maxFiles?: number;
  onFilesReady: (files: Array<{ fileName: string; fileSize: number; content: string }>) => Promise<void>;
  isUploading?: boolean;
}

export function MultiFileUpload({
  accept = ".txt,text/plain",
  maxFiles = 10,
  onFilesReady,
  isUploading = false,
}: MultiFileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      return file.type === "text/plain" || file.name.endsWith(".txt");
    });

    if (validFiles.length === 0) {
      return;
    }

    // Add new files, respecting maxFiles limit
    const newFiles: UploadedFile[] = validFiles
      .slice(0, Math.max(0, maxFiles - selectedFiles.length))
      .map((file) => ({
        file,
        isLoading: true,
      }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);

    // Read file contents
    for (const uploadedFile of newFiles) {
      try {
        const content = await uploadedFile.file.text();
        setSelectedFiles((prev) =>
          prev.map((f) =>
            f.file === uploadedFile.file
              ? {
                  ...f,
                  content,
                  isLoading: false,
                  isLoaded: true,
                }
              : f
          )
        );
      } catch (error) {
        setSelectedFiles((prev) =>
          prev.map((f) =>
            f.file === uploadedFile.file
              ? {
                  ...f,
                  error:
                    error instanceof Error ? error.message : "Failed to read file",
                  isLoading: false,
                }
              : f
          )
        );
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = (fileToRemove: File) => {
    setSelectedFiles((prev) => prev.filter((f) => f.file !== fileToRemove));
  };

  const handleUpload = async () => {
    const filesToUpload = selectedFiles
      .filter((f) => f.content && !f.error)
      .map((f) => ({
        fileName: f.file.name,
        fileSize: f.file.size,
        content: f.content!,
      }));

    if (filesToUpload.length === 0) {
      return;
    }

    setIsProcessing(true);
    try {
      await onFilesReady(filesToUpload);
      setSelectedFiles([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const loadedCount = selectedFiles.filter((f) => f.isLoaded).length;
  const hasErrors = selectedFiles.some((f) => f.error);
  const canUpload = loadedCount > 0 && !hasErrors && !isProcessing && !isUploading;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="multi-file-upload">Select Files</Label>
        <Input
          ref={fileInputRef}
          id="multi-file-upload"
          type="file"
          accept={accept}
          multiple
          onChange={handleFileChange}
          disabled={isProcessing || isUploading || selectedFiles.length >= maxFiles}
          className="cursor-pointer"
        />
        <p className="text-muted-foreground text-xs">
          Select up to {maxFiles} .txt files
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">
              Files ({selectedFiles.length})
            </span>
            {loadedCount > 0 && (
              <span className="text-muted-foreground text-xs">
                {loadedCount} ready
              </span>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {selectedFiles.map((uploadedFile) => (
              <div
                key={uploadedFile.file.name}
                className={cn(
                  "flex items-center gap-3 rounded-md border p-3 transition-colors",
                  uploadedFile.error && "border-destructive bg-destructive/5"
                )}
              >
                {uploadedFile.isLoading && (
                  <Loader2Icon className="size-5 animate-spin text-muted-foreground shrink-0" />
                )}
                {uploadedFile.isLoaded && (
                  <CheckCircleIcon className="size-5 text-green-600 shrink-0" />
                )}
                {uploadedFile.error && (
                  <AlertCircleIcon className="size-5 text-destructive shrink-0" />
                )}
                {!uploadedFile.isLoading &&
                  !uploadedFile.isLoaded &&
                  !uploadedFile.error && (
                    <FileTextIcon className="size-5 text-muted-foreground shrink-0" />
                  )}

                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">
                    {uploadedFile.file.name}
                  </p>
                  {uploadedFile.error ? (
                    <p className="text-destructive text-xs">{uploadedFile.error}</p>
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      {(uploadedFile.file.size / 1024).toFixed(1)} KB
                      {uploadedFile.content &&
                        ` • ${uploadedFile.content.length} chars`}
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(uploadedFile.file)}
                  disabled={isProcessing || isUploading}
                  className="shrink-0"
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        type="button"
        onClick={handleUpload}
        disabled={!canUpload}
        className="w-full"
      >
        {isProcessing || isUploading ? (
          <>
            <Loader2Icon className="mr-2 size-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <UploadIcon className="mr-2 size-4" />
            Upload {loadedCount > 0 ? `${loadedCount} File${loadedCount > 1 ? "s" : ""}` : "Files"}
          </>
        )}
      </Button>
    </div>
  );
}
