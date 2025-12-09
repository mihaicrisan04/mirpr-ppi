"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@mirpr-ppi/backend/convex/_generated/api";
import { useEffect, useState, useCallback } from "react";
import {
  Loader2Icon,
  SendIcon,
  MessageSquareHeartIcon,
  BookOpenIcon,
} from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
  PromptInputTools,
  PromptInputButton,
} from "@/components/ai-elements/prompt-input";
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: "streaming" | "complete" | "failed";
  usedRAG?: boolean;
}

export default function ChatPage() {
  const createThread = useMutation(api.agent.createAgentThread);
  const sendMessage = useAction(api.agent.sendMessageToAgent);
  const aiMode = useQuery(api.agent.getAIMode);

  const [threadId, setThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const [useRAG, setUseRAG] = useState(false); // Default to OFF for faster responses

  // Auto-create thread on page load
  useEffect(() => {
    const initThread = async () => {
      try {
        const id = await createThread();
        setThreadId(id);
      } catch (error) {
        console.error("Failed to create thread:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initThread();
  }, [createThread]);

  const handleSubmit = useCallback(
    async (message: { text?: string }) => {
      if (!message.text?.trim() || !threadId || isWaitingResponse) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message.text.trim(),
        status: "complete",
      };

      // Add user message immediately
      setMessages((prev) => [...prev, userMessage]);
      setIsWaitingResponse(true);

      // Add placeholder for assistant response
      const assistantId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          status: "streaming",
          usedRAG: useRAG,
        },
      ]);

      try {
        const response = await sendMessage({
          threadId,
          prompt: userMessage.content,
          useRAG, // Pass RAG preference to backend
        });

        // Update assistant message with response
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: response ?? "", status: "complete" }
              : msg
          )
        );
      } catch (error) {
        console.error("Failed to send message:", error);
        // Update assistant message with error state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: "Sorry, something went wrong. Please try again.",
                  status: "failed",
                }
              : msg
          )
        );
      } finally {
        setIsWaitingResponse(false);
      }
    },
    [threadId, sendMessage, isWaitingResponse, useRAG]
  );

  const handleFeedbackClick = useCallback(async () => {
    await handleSubmit({
      text: "I would like to leave some feedback about my experience.",
    });
  }, [handleSubmit]);

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
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
        {/* Header with mode indicator and RAG toggle */}
        <div className="mb-4 flex items-center justify-between">
          {aiMode && (
            <div className="text-muted-foreground text-xs">
              {aiMode.mode === "local"
                ? "🏠 Local (Ollama)"
                : "☁️ Cloud (OpenAI)"}
            </div>
          )}

          {/* RAG Toggle Button */}
          <Button
            variant={useRAG ? "default" : "outline"}
            size="sm"
            onClick={() => setUseRAG(!useRAG)}
            disabled={isWaitingResponse}
            className={cn(
              "gap-2 text-xs",
              useRAG && "bg-primary text-primary-foreground"
            )}
          >
            <BookOpenIcon className="size-3.5" />
            <span>Knowledge Base {useRAG ? "ON" : "OFF"}</span>
          </Button>
        </div>

        <div className="flex h-[calc(100vh-12rem)] flex-col gap-4">
          <Conversation className="flex-1">
            <ConversationContent>
              {messages.length === 0 ? (
                <ConversationEmptyState
                  title="Welcome to the AI Chat"
                  description={
                    useRAG
                      ? "Knowledge base search is ON. I'll search documents before answering (slower)."
                      : "Knowledge base search is OFF for faster responses. Toggle it on to search documents."
                  }
                />
              ) : (
                <div className="flex flex-col gap-2">
                  {messages.map((message) => (
                    <Message key={message.id} from={message.role}>
                      <MessageAvatar
                        src=""
                        name={message.role === "user" ? "User" : "AI"}
                      />
                      <MessageContent variant="flat">
                        {/* Show RAG indicator for assistant messages */}
                        {message.role === "assistant" &&
                          message.usedRAG &&
                          message.status === "complete" && (
                            <div className="mb-2 flex items-center gap-1 text-muted-foreground text-xs">
                              <BookOpenIcon className="size-3" />
                              <span>Used knowledge base</span>
                            </div>
                          )}

                        {message.content ? (
                          <Response parseIncompleteMarkdown={true}>
                            {message.content}
                          </Response>
                        ) : message.status === "streaming" ? (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Loader2Icon className="size-4 animate-spin" />
                            <span className="text-sm">
                              {message.usedRAG
                                ? "Searching & thinking..."
                                : "Thinking..."}
                            </span>
                          </span>
                        ) : null}

                        {message.status === "streaming" && message.content && (
                          <span className="ml-1 inline-block animate-pulse">
                            ▊
                          </span>
                        )}

                        {message.status === "failed" && (
                          <div className="mt-2 text-destructive text-xs">
                            Failed to get response
                          </div>
                        )}
                      </MessageContent>
                    </Message>
                  ))}
                </div>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="border-t bg-background pt-4">
            <PromptInput onSubmit={handleSubmit}>
              <PromptInputBody>
                <PromptInputTextarea
                  placeholder={
                    isWaitingResponse
                      ? "Waiting for response..."
                      : useRAG
                        ? "Ask a question (will search knowledge base)..."
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
    </div>
  );
}
