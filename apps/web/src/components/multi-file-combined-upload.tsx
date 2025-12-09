"use client";

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
  FileIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

type FileType = "txt" | "pdf";

interface UploadedFileItem {
  file: File;
  type: FileType;
  extractedText?: string;
  error?: string;
  isLoading?: boolean;
  isLoaded?: boolean;
  pageCount?: number;
  progress?: number;
}

interface CombinedUploadProps {
  maxFiles?: number;
  onFilesReady: (
    txtFiles: Array<{ fileName: string; fileSize: number; content: string }>,
    pdfFiles: Array<{
      fileName: string;
      fileSize: number;
      extractedText: string;
      rawText: string;
      pageCount?: number;
      mimeType: string;
    }>
  ) => Promise<void>;
  isUploading?: boolean;
}

export function CombinedFileUpload({
  maxFiles = 20,
  onFilesReady,
  isUploading = false,
}: CombinedUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<UploadedFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const newFiles = files.map((file) => {
      let fileType: FileType = "txt";
      if (
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
      ) {
        fileType = "pdf";
      }
      
      return {
        file,
        type: fileType,
        progress: 0,
        isLoading: false,
        isLoaded: false,
        error: undefined,
        extractedText: undefined,
        pageCount: undefined,
      };
    });

    if (newFiles.length === 0) {
      console.warn("No valid files detected in selection");
      return;
    }

    console.log(
      `Processing ${newFiles.length} files (${newFiles.filter((f) => f.type === "txt").length} TXT, ${newFiles.filter((f) => f.type === "pdf").length} PDF)`
    );

    setSelectedFiles((prev) => {
      const combined = [...prev, ...newFiles];
      if (combined.length > maxFiles) {
        combined.splice(maxFiles);
      }
      setTimeout(() => processSelectedFiles(combined), 0);
      return combined;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processSelectedFiles = async (filesToProcess: UploadedFileItem[]) => {
    setIsProcessing(true);
    console.log(`Starting to process ${filesToProcess.length} files`);

    for (let i = 0; i < filesToProcess.length; i++) {
      const fileItem = filesToProcess[i];

      if (fileItem.isLoaded || fileItem.isLoading || fileItem.error) {
        console.log(`Skipping ${fileItem.file.name} - already processed or has error`);
        continue;
      }

      try {
        console.log(`Processing ${fileItem.type.toUpperCase()}: ${fileItem.file.name}`);
        fileItem.isLoading = true;
        setSelectedFiles([...filesToProcess]);

        let extractedData: { text: string; pageCount?: number };

        if (fileItem.type === "txt") {
          extractedData = await extractTextFromTxt(fileItem.file);
        } else {
          extractedData = await extractTextFromPdf(fileItem.file);
        }

        console.log(
          `Successfully extracted text from ${fileItem.file.name}, ${extractedData.text.length} characters`
        );

        fileItem.extractedText = extractedData.text;
        if (extractedData.pageCount) {
          fileItem.pageCount = extractedData.pageCount;
        }
        fileItem.isLoaded = true;
        fileItem.isLoading = false;
      } catch (error) {
        console.error(`Error processing ${fileItem.file.name}:`, error);
        fileItem.error =
          error instanceof Error ? error.message : "Failed to extract text";
        fileItem.isLoading = false;
      }

      setSelectedFiles([...filesToProcess]);
    }

    setIsProcessing(false);
    console.log(`Finished processing files`);
  };

  const extractTextFromTxt = async (
    file: File
  ): Promise<{ text: string }> => {
    const text = await file.text();
    return { text: text.trim() };
  };

  const extractTextFromPdf = async (
    file: File
  ): Promise<{ text: string; pageCount: number }> => {
    try {
      console.log(`Starting PDF extraction for: ${file.name}`);

      const { getDocument } = await import("pdfjs-dist");
      console.log(`PDF.js library loaded`);

      const arrayBuffer = await file.arrayBuffer();
      console.log(`File loaded, size: ${arrayBuffer.byteLength} bytes`);

      const pdf = await getDocument({ data: arrayBuffer }).promise;
      console.log(`PDF loaded, pages: ${pdf.numPages}`);

      let text = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || "")
          .join(" ");
        text += pageText + "\n";
        console.log(`Extracted page ${i} of ${pdf.numPages}`);
      }

      const finalText = text.trim();
      console.log(`PDF extraction complete. Total length: ${finalText.length} characters`);

      return {
        text: finalText,
        pageCount: pdf.numPages,
      };
    } catch (error) {
      console.error("PDF extraction error details:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`PDF extraction failed: ${errorMsg}`);
    }
  };

  const handleUpload = async () => {
    const readyTxts = selectedFiles
      .filter((f) => f.type === "txt" && f.isLoaded && f.extractedText)
      .map((f) => ({
        fileName: f.file.name,
        fileSize: f.file.size,
        content: f.extractedText || "",
      }));

    const readyPdfs = selectedFiles
      .filter((f) => f.type === "pdf" && f.isLoaded && f.extractedText)
      .map((f) => ({
        fileName: f.file.name,
        fileSize: f.file.size,
        extractedText: f.extractedText || "",
        rawText: f.extractedText || "",
        pageCount: f.pageCount,
        mimeType: f.file.type || "application/pdf",
      }));

    console.log(`Ready to upload ${readyTxts.length} TXTs and ${readyPdfs.length} PDFs`);

    if (readyTxts.length === 0 && readyPdfs.length === 0) {
      console.warn("No files ready for upload");
      return;
    }

    try {
      await onFilesReady(readyTxts, readyPdfs);
      setSelectedFiles([]);
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const handleRemove = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const readyCount = selectedFiles.filter((f) => f.isLoaded).length;
  const txtCount = selectedFiles.filter((f) => f.type === "txt").length;
  const pdfCount = selectedFiles.filter((f) => f.type === "pdf").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Upload Files (.txt & .pdf)</Label>
        <span className="text-sm text-muted-foreground">
          {selectedFiles.length}/{maxFiles} files
        </span>
      </div>

      <div className="flex gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.pdf,text/plain,application/pdf"
          onChange={handleFileChange}
          disabled={isProcessing || isUploading || selectedFiles.length >= maxFiles}
          className="flex-1"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          disabled={isProcessing || isUploading || selectedFiles.length >= maxFiles}
        >
          <UploadIcon className="h-4 w-4 mr-2" />
          Browse
        </Button>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border",
                file.error
                  ? "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                  : file.isLoaded
                    ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                    : "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
              )}
            >
              <FileIcon className="h-4 w-4 flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{file.file.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-opacity-50 font-semibold">
                    {file.type.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {(file.file.size / 1024).toFixed(2)} KB
                  {file.pageCount && ` • ${file.pageCount} pages`}
                </p>

                {file.isLoading && (
                  <Progress value={file.progress || 50} className="mt-1 h-1" />
                )}
              </div>

              {file.isLoading && (
                <Loader2Icon className="h-4 w-4 flex-shrink-0 animate-spin text-blue-600" />
              )}
              {file.error && (
                <AlertCircleIcon className="h-4 w-4 flex-shrink-0 text-red-600" />
              )}
              {file.isLoaded && !file.error && (
                <CheckCircleIcon className="h-4 w-4 flex-shrink-0 text-green-600" />
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(index)}
                disabled={file.isLoading || isUploading}
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={readyCount === 0 || isProcessing || isUploading}
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <UploadIcon className="h-4 w-4 mr-2" />
                Upload {readyCount} File{readyCount !== 1 ? "s" : ""}
                {txtCount > 0 && ` (${txtCount} TXT${pdfCount > 0 ? "," : ""})`}
                {pdfCount > 0 && ` ${pdfCount} PDF`}
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => setSelectedFiles([])}
            disabled={isProcessing || isUploading}
          >
            Clear
          </Button>
        </div>
      )}

      {selectedFiles.length === 0 && !isProcessing && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <FileTextIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Select .txt and .pdf files or drag & drop them here
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supported: .txt (text files) and .pdf (text extraction via PDF.js)
          </p>
        </div>
      )}
    </div>
  );
}
