"use client";

import { Message, MessageAvatar, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { useSmoothText, type UIMessage } from "@convex-dev/agent/react";

interface MessageItemProps {
  message: UIMessage;
}

export const MessageItem = ({ message }: MessageItemProps) => {
  const [visibleText] = useSmoothText(message.text, {
    startStreaming: message.status === "streaming",
  });

  const isUser = message.role === "user";
  const avatarName = isUser ? "User" : "AI";

  return (
    <Message from={message.role}>
      <MessageAvatar src="" name={avatarName} />
      <MessageContent variant="flat">
        <Response parseIncompleteMarkdown={true}>
          {visibleText}
        </Response>
        {message.status === "streaming" && (
          <span className="ml-1 inline-block animate-pulse">▊</span>
        )}
        {message.status === "failed" && (
          <div className="mt-2 text-destructive text-xs">
            Failed to send message
          </div>
        )}
      </MessageContent>
    </Message>
  );
};
