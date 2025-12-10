"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@mirpr-ppi/backend/convex/_generated/api";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, SendIcon, SparklesIcon } from "lucide-react";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";

export default function NewChatPage() {
  const router = useRouter();
  const user = useQuery(api.auth.getCurrentUser);
  const createThread = useMutation(api.agent.createAgentThread);
  const initiateStream = useMutation(api.agent.initiateStream);

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (message: { text?: string }) => {
      if (!message.text?.trim() || !user?._id || isCreating) return;

      setIsCreating(true);
      setError(null);

      try {
        // Create new thread
        const threadId = await createThread({ userId: user._id });

        // Send the first message
        await initiateStream({
          threadId,
          prompt: message.text.trim(),
        });

        // Redirect to the thread page
        router.push(`/chat/${threadId}`);
      } catch (err) {
        console.error("Failed to start conversation:", err);
        setError(
          err instanceof Error ? err.message : "Failed to start conversation"
        );
        setIsCreating(false);
      }
    },
    [user?._id, createThread, initiateStream, router, isCreating]
  );

  // Loading state while checking auth (layout handles redirect if not logged in)
  if (user === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Welcome message */}
        <div className="text-center">
          <h1 className="mb-2 font-semibold text-2xl">How can I help you today?</h1>
          <p className="text-muted-foreground">
            Start a conversation by typing your message below.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive text-sm">
            {error}
            {error.includes("cloud mode") && (
              <p className="mt-1 text-muted-foreground text-xs">
                Please configure OpenAI API key in your environment variables.
              </p>
            )}
          </div>
        )}

        {/* Input */}
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea
              placeholder={
                isCreating ? "Starting conversation..." : "Type your message..."
              }
              className="min-h-20 resize-none pt-7"
              disabled={isCreating}
              autoFocus
            />
          </PromptInputBody>
          <div className="flex justify-end p-2">
            <PromptInputSubmit disabled={isCreating}>
              {isCreating ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <SendIcon className="size-4" />
              )}
            </PromptInputSubmit>
          </div>
        </PromptInput>
      </div>
    </div>
  );
}
