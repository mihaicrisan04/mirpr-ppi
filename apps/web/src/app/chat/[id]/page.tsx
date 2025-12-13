"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@mirpr-ppi/backend/convex/_generated/api";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2Icon,
  SendIcon,
  MessageSquareHeartIcon,
  BookOpenIcon,
} from "lucide-react";
import {
  useUIMessages,
  useSmoothText,
  optimisticallySendMessage,
  type UIMessage,
} from "@convex-dev/agent/react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ui/shadcn-io/ai/conversation";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
  PromptInputTools,
  PromptInputButton,
} from "@/components/ai-elements/prompt-input";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";

// Message component with smooth text streaming
function StreamingMessage({ message }: { message: UIMessage }) {
  const isStreaming = message.status === "streaming";
  const [visibleText] = useSmoothText(message.text ?? "", {
    startStreaming: isStreaming,
  });

  return (
    <Message from={message.role as "user" | "assistant"}>
      <MessageContent variant="flat">
        {/* Show tool usage indicator */}
        {message.role === "assistant" &&
          message.parts?.some((p) => p.type === "tool-invocation") && (
            <div className="mb-2 flex items-center gap-1 text-muted-foreground text-xs">
              <BookOpenIcon className="size-3" />
              <span>Searching knowledge base...</span>
            </div>
          )}

        {visibleText ? (
          <Response parseIncompleteMarkdown={isStreaming}>
            {visibleText}
          </Response>
        ) : isStreaming ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </span>
        ) : null}

        {message.status === "failed" && (
          <div className="mt-2 text-destructive text-xs">
            Failed to get response
          </div>
        )}
      </MessageContent>
    </Message>
  );
}

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.id as string;

  const user = useQuery(api.auth.getCurrentUser);
  const thread = useQuery(
    api.agent.getThread,
    threadId ? { threadId } : "skip"
  );
  const updateThreadTitle = useMutation(api.agent.updateThreadTitle);
  const initiateStream = useMutation(
    api.agent.initiateStream
  ).withOptimisticUpdate(
    optimisticallySendMessage(api.agent.listThreadMessages)
  );

  const [error, setError] = useState<string | null>(null);
  const [hasSetTitle, setHasSetTitle] = useState(false);

  // Use the agent's streaming messages hook
  const {
    results: messages,
    status: messagesStatus,
    loadMore,
  } = useUIMessages(
    api.agent.listThreadMessages,
    threadId ? { threadId } : "skip",
    {
      initialNumItems: 50,
      stream: true,
    }
  );

  // Check if we're waiting for a response
  const isWaitingResponse =
    messages.length > 0 &&
    (messages.at(-1)?.role === "user" ||
      messages.at(-1)?.status === "streaming");

  // Auto-set thread title from first user message
  useEffect(() => {
    if (
      !hasSetTitle &&
      thread &&
      !thread.title &&
      messages.length > 0
    ) {
      const firstUserMessage = messages.find((m) => m.role === "user");
      if (firstUserMessage?.text) {
        const title =
          firstUserMessage.text.length > 50
            ? `${firstUserMessage.text.slice(0, 50)}...`
            : firstUserMessage.text;

        updateThreadTitle({ threadId, title }).catch(console.error);
        setHasSetTitle(true);
      }
    }
  }, [thread, messages, threadId, updateThreadTitle, hasSetTitle]);

  // Verify thread belongs to user
  useEffect(() => {
    if (thread !== undefined && user !== undefined) {
      if (thread === null) {
        // Thread doesn't exist
        router.push("/chat");
      } else if (user && thread.userId !== user._id) {
        // Thread belongs to different user
        router.push("/chat");
      }
    }
  }, [thread, user, router]);

  const handleSubmit = useCallback(
    async (message: { text?: string }) => {
      if (!message.text?.trim() || !threadId || isWaitingResponse) return;

      try {
        await initiateStream({
          threadId,
          prompt: message.text.trim(),
        });
      } catch (err) {
        console.error("Failed to send message:", err);
        setError(
          err instanceof Error ? err.message : "Failed to send message"
        );
      }
    },
    [threadId, initiateStream, isWaitingResponse]
  );

  const handleFeedbackClick = useCallback(async () => {
    await handleSubmit({
      text: "I would like to leave some feedback about my experience.",
    });
  }, [handleSubmit]);

  // Loading state
  if (thread === undefined || user === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-destructive">{error}</p>
          {error.includes("cloud mode") && (
            <p className="text-muted-foreground text-sm">
              Please configure OpenAI API key in your environment variables.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mx-auto flex w-full min-h-0 max-w-4xl flex-1 flex-col px-4">
        <Conversation className="min-h-0 flex-1">
          <ConversationContent>
            <div className="flex flex-col gap-2">
              {/* Load more button */}
              {messagesStatus === "CanLoadMore" && (
                <button
                  type="button"
                  onClick={() => loadMore(20)}
                  className="mx-auto text-muted-foreground text-xs hover:text-foreground"
                >
                  Load earlier messages
                </button>
              )}

              {messages.map((message) => (
                <StreamingMessage key={message.key} message={message} />
              ))}
            </div>
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="sticky bottom-0 bg-background pb-4">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputBody>
              <PromptInputTextarea
                placeholder={
                  isWaitingResponse
                    ? "Waiting for response..."
                    : "Type your message..."
                }
                className="min-h-[60px] resize-none"
                disabled={isWaitingResponse}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputButton
                  onClick={handleFeedbackClick}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                  disabled={isWaitingResponse}
                >
                  <MessageSquareHeartIcon className="size-4" />
                  <span className="text-xs">Leave Feedback</span>
                </PromptInputButton>
              </PromptInputTools>
              <PromptInputSubmit disabled={isWaitingResponse}>
                <SendIcon className="size-4" />
              </PromptInputSubmit>
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
