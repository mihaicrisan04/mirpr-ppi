"use client";

import { useQuery } from "convex/react";
import { api } from "@mirpr-ppi/backend/convex/_generated/api";
import {
  FileIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  HourglassIcon,
  Loader2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PdfsListProps {
  userId?: string;
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

export function PdfsList({ userId }: PdfsListProps) {
  const pdfs = useQuery(api.pdfs.listPdfs, { userId });

  if (pdfs === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pdfs || pdfs.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed rounded-lg">
        <FileIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No PDFs uploaded yet. Upload some PDFs to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pdfs.map((pdf) => (
        <Card key={pdf._id} className="p-4">
          <div className="flex items-start gap-3">
            <FileIcon className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-600" />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-sm truncate">
                    {pdf.fileName}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(pdf.fileSize / 1024).toFixed(2)} KB •{" "}
                    {formatTimeAgo(pdf.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {pdf.status === "embedded" && (
                    <>
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-green-600">
                        Embedded
                      </span>
                    </>
                  )}
                  {pdf.status === "processing" && (
                    <>
                      <HourglassIcon className="h-4 w-4 text-blue-600 animate-spin" />
                      <span className="text-xs font-medium text-blue-600">
                        Processing
                      </span>
                    </>
                  )}
                  {pdf.status === "failed" && (
                    <>
                      <AlertCircleIcon className="h-4 w-4 text-red-600" />
                      <span className="text-xs font-medium text-red-600">
                        Failed
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
