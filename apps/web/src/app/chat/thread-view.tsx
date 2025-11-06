"use client";

import { useMutation } from "convex/react";
import { api } from "@mirpr-ppi/backend/convex/_generated/api";
import { MessagesList } from "./messages-list";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { optimisticallySendMessage } from "@convex-dev/agent/react";
import { SendIcon } from "lucide-react";

interface Props {
  threadId: string;
}

export const ThreadView: React.FC<Props> = ({ threadId }) => {
  const sendMessage = useMutation(
    api.agent.initiateStream
  ).withOptimisticUpdate(
    optimisticallySendMessage(api.agent.listThreadMessages)
  );

  const handleSubmit = async (message: { text?: string }) => {
    if (!message.text?.trim()) return;

    await sendMessage({
      threadId,
      prompt: message.text.trim(),
    });
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <Conversation className="flex-1">
        <ConversationContent>
          <MessagesList threadId={threadId} />
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t bg-background pt-4">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea
              placeholder="Type your message..."
              className="min-h-[60px] resize-none"
            />
            <PromptInputSubmit>
              <SendIcon className="size-4" />
            </PromptInputSubmit>
          </PromptInputBody>
        </PromptInput>
      </div>
    </div>
  );
};
