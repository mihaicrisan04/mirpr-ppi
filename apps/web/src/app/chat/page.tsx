"use client";

import { useMutation } from "convex/react";
import { api } from "@mirpr-ppi/backend/convex/_generated/api";
import { useEffect, useState } from "react";
import { ThreadView } from "./thread-view";
import { Loader2Icon } from "lucide-react";

export default function ChatPage() {
  const createThread = useMutation(api.agent.createAgentThread);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-create thread on page load
  useEffect(() => {
    const initThread = async () => {
      try {
        const id = await createThread();
        setThreadId(id);
      } catch (error) {
        // Error creating thread - will show error state
      } finally {
        setIsLoading(false);
      }
    };

    initThread();
  }, [createThread]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            Starting conversation...
          </p>
        </div>
      </div>
    );
  }

  if (!threadId) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-destructive">
            Failed to start conversation. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mx-auto w-full max-w-4xl flex-1">
        <ThreadView threadId={threadId} />
      </div>
    </div>
  );
}
