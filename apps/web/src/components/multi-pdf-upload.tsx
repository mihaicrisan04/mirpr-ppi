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

// Module-level state for PDF.js
const pdfjsState = {
  initialized: false,
  configPromise: null as Promise<any> | null,
  module: null as any,
};

// Initialize PDF.js and configure worker
const getPdfJs = async () => {
  if (pdfjsState.initialized && pdfjsState.module) {
    return pdfjsState.module;
  }

  if (pdfjsState.configPromise) {
    return pdfjsState.configPromise;
  }

  if (typeof window === "undefined") {
    throw new Error("PDF.js can only be used on the client");
  }

  pdfjsState.configPromise = (async () => {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    pdfjsState.module = pdfjsLib;
    pdfjsState.initialized = true;
    console.log(`PDF.js v${pdfjsLib.version} initialized with CDN worker`);
    return pdfjsLib;
  })();

  return pdfjsState.configPromise;
};

interface UploadedPdf {
  file: File;
  extractedText?: string;
  error?: string;
  isLoading?: boolean;
  isLoaded?: boolean;
  pageCount?: number;
  progress?: number;
}

interface MultiPdfUploadProps {
  maxFiles?: number;
  onPdfsReady: (
    pdfs: Array<{
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

export function MultiPdfUpload({
  maxFiles = 10,
  onPdfsReady,
  isUploading = false,
}: MultiPdfUploadProps) {
  const [selectedPdfs, setSelectedPdfs] = useState<UploadedPdf[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      // Accept files that are PDFs by extension OR by MIME type
      const isPdfByName = file.name.toLowerCase().endsWith(".pdf");
      const isPdfByType = file.type === "application/pdf" || file.type === "";
      return isPdfByName || isPdfByType;
    });

    if (validFiles.length === 0) {
      console.warn("No PDF files detected in selection");
      return;
    }

    console.log(`Processing ${validFiles.length} PDF files`);

    const newPdfs = validFiles.map((file) => ({
      file,
      progress: 0,
      isLoading: false,
      isLoaded: false,
      error: undefined,
      extractedText: undefined,
      pageCount: undefined,
    }));

    setSelectedPdfs((prev) => {
      const combined = [...prev, ...newPdfs];
      if (combined.length > maxFiles) {
        combined.splice(maxFiles);
      }
      // Start processing immediately after state update
      setTimeout(() => processSelectedPdfs(combined), 0);
      return combined;
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processSelectedPdfs = async (pdfsToProcess: UploadedPdf[]) => {
    setIsProcessing(true);
    console.log(`Starting to process ${pdfsToProcess.length} PDFs`);

    for (let i = 0; i < pdfsToProcess.length; i++) {
      const pdfItem = pdfsToProcess[i];
      
      if (pdfItem.isLoaded || pdfItem.isLoading || pdfItem.error) {
        console.log(`Skipping ${pdfItem.file.name} - already processed or has error`);
        continue;
      }

      try {
        console.log(`Processing PDF: ${pdfItem.file.name}`);
        pdfItem.isLoading = true;
        setSelectedPdfs([...pdfsToProcess]);

        // Extract text from PDF using pdf-parse (if available) or pdfjs
        const extractedData = await extractTextFromPdf(pdfItem.file);
        console.log(`Successfully extracted text from ${pdfItem.file.name}, ${extractedData.text.length} characters`);

        pdfItem.extractedText = extractedData.text;
        pdfItem.pageCount = extractedData.pageCount;
        pdfItem.isLoaded = true;
        pdfItem.isLoading = false;
      } catch (error) {
        console.error(`Error processing ${pdfItem.file.name}:`, error);
        pdfItem.error =
          error instanceof Error
            ? error.message
            : "Failed to extract text from PDF";
        pdfItem.isLoading = false;
      }

      setSelectedPdfs([...pdfsToProcess]);
    }

    setIsProcessing(false);
    console.log(`Finished processing PDFs`);
  };

  const extractTextFromPdf = async (
    file: File
  ): Promise<{ text: string; pageCount: number }> => {
    try {
      console.log(`Starting PDF extraction for: ${file.name}`);
      
      const pdfjsLib = await getPdfJs();
      const { getDocument } = pdfjsLib;

      const arrayBuffer = await file.arrayBuffer();
      console.log(`File loaded, size: ${arrayBuffer.byteLength} bytes`);
      
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      console.log(`PDF loaded, pages: ${pdf.numPages}`);

      let text = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str || "")
            .join(" ");
          text += pageText + "\n";
          console.log(`Extracted page ${i} of ${pdf.numPages}`);
        } catch (pageError) {
          console.warn(`Failed to extract page ${i}:`, pageError);
        }
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
    const readyPdfs = selectedPdfs
      .filter((p) => p.isLoaded && p.extractedText)
      .map((p) => ({
        fileName: p.file.name,
        fileSize: p.file.size,
        extractedText: p.extractedText || "",
        rawText: p.extractedText || "",
        pageCount: p.pageCount,
        mimeType: p.file.type || "application/pdf",
      }));

    if (readyPdfs.length === 0) {
      console.warn("No PDFs ready for upload. Selected PDFs:", selectedPdfs);
      return;
    }

    try {
      await onPdfsReady(readyPdfs);
      setSelectedPdfs([]);
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const handleRemove = (index: number) => {
    setSelectedPdfs((prev) => prev.filter((_, i) => i !== index));
  };

  const readyCount = selectedPdfs.filter((p) => p.isLoaded).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Upload PDF Files</Label>
        <span className="text-sm text-muted-foreground">
          {selectedPdfs.length}/{maxFiles} files
        </span>
      </div>

      <div className="flex gap-2">
        <Input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          disabled={isProcessing || isUploading || selectedPdfs.length >= maxFiles}
          className="flex-1"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          disabled={isProcessing || isUploading || selectedPdfs.length >= maxFiles}
        >
          <UploadIcon className="h-4 w-4 mr-2" />
          Browse
        </Button>
      </div>

      {selectedPdfs.length > 0 && (
        <div className="space-y-2">
          {selectedPdfs.map((pdf, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border",
                pdf.error
                  ? "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                  : pdf.isLoaded
                    ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                    : "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
              )}
            >
              <FileIcon className="h-4 w-4 flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{pdf.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(pdf.file.size / 1024).toFixed(2)} KB
                  {pdf.pageCount && ` • ${pdf.pageCount} pages`}
                </p>

                {pdf.isLoading && (
                  <Progress
                    value={pdf.progress || 50}
                    className="mt-1 h-1"
                  />
                )}
              </div>

              {pdf.isLoading && (
                <Loader2Icon className="h-4 w-4 flex-shrink-0 animate-spin text-blue-600" />
              )}
              {pdf.error && (
                <AlertCircleIcon className="h-4 w-4 flex-shrink-0 text-red-600" />
              )}
              {pdf.isLoaded && !pdf.error && (
                <CheckCircleIcon className="h-4 w-4 flex-shrink-0 text-green-600" />
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(index)}
                disabled={pdf.isLoading || isUploading}
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {selectedPdfs.length > 0 && (
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={
              readyCount === 0 ||
              isProcessing ||
              isUploading
            }
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
                Upload {readyCount} PDF{readyCount !== 1 ? "s" : ""}
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => setSelectedPdfs([])}
            disabled={isProcessing || isUploading}
          >
            Clear
          </Button>
        </div>
      )}

      {selectedPdfs.length === 0 && !isProcessing && (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <FileTextIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Select PDF files or drag & drop them here
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supported: .pdf files (text extraction powered by PDF.js)
          </p>
        </div>
      )}
    </div>
  );
}
