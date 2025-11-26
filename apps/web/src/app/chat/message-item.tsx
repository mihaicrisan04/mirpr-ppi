"use client";

import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ui/shadcn-io/ai/tool";
import { useSmoothText, type UIMessage } from "@convex-dev/agent/react";
import { BookOpenIcon, MessageSquareHeartIcon, SearchIcon } from "lucide-react";

interface MessageItemProps {
  message: UIMessage;
}

// Map tool names to user-friendly display names and icons
const TOOL_DISPLAY_INFO: Record<
  string,
  { name: string; icon: React.ReactNode; description: string }
> = {
  searchKnowledge: {
    name: "Knowledge Search",
    icon: <SearchIcon className="size-4" />,
    description: "Searching the knowledge base...",
  },
  collectFeedback: {
    name: "Submit Feedback",
    icon: <MessageSquareHeartIcon className="size-4" />,
    description: "Submitting your feedback...",
  },
};

// Format tool output for display
function formatToolOutput(toolName: string, output: unknown): string {
  if (typeof output === "string") {
    return output;
  }
  return JSON.stringify(output, null, 2);
}

// Get tool state based on whether we have output
function getToolState(
  hasOutput: boolean
): "input-streaming" | "input-available" | "output-available" | "output-error" {
  if (hasOutput) {
    return "output-available";
  }
  return "input-available";
}

export const MessageItem = ({ message }: MessageItemProps) => {
  const [visibleText] = useSmoothText(message.text, {
    startStreaming: message.status === "streaming",
  });

  const isUser = message.role === "user";
  const avatarName = isUser ? "User" : "AI";

  // Extract tool invocations from message parts if available
  const toolInvocations =
    message.parts?.filter(
      (part): part is Extract<typeof part, { type: "tool-invocation" }> =>
        part.type === "tool-invocation"
    ) ?? [];

  // Only show tools that make sense to display (searchKnowledge and collectFeedback)
  const displayableTools = toolInvocations.filter(
    (tool) => tool.toolName in TOOL_DISPLAY_INFO
  );

  return (
    <Message from={message.role}>
      <MessageAvatar src="" name={avatarName} />
      <MessageContent variant="flat">
        {/* Display tool invocations for assistant messages */}
        {!isUser && displayableTools.length > 0 && (
          <div className="mb-3 space-y-2">
            {displayableTools.map((tool) => {
              const toolInfo = TOOL_DISPLAY_INFO[tool.toolName];
              const hasOutput = "output" in tool && tool.output !== undefined;
              const toolState = getToolState(hasOutput);

              return (
                <Tool key={tool.toolCallId} defaultOpen={!hasOutput}>
                  <ToolHeader
                    type={toolInfo?.name ?? tool.toolName}
                    state={toolState}
                  />
                  <ToolContent>
                    <ToolInput input={tool.input} />
                    {hasOutput && (
                      <ToolOutput
                        output={
                          <pre className="whitespace-pre-wrap p-3 text-xs">
                            {formatToolOutput(tool.toolName, tool.output)}
                          </pre>
                        }
                        errorText={undefined}
                      />
                    )}
                  </ToolContent>
                </Tool>
              );
            })}
          </div>
        )}

        {/* Display the text response */}
        {visibleText && (
          <Response parseIncompleteMarkdown={true}>{visibleText}</Response>
        )}

        {/* Streaming indicator */}
        {message.status === "streaming" && (
          <span className="ml-1 inline-block animate-pulse">▊</span>
        )}

        {/* Error state */}
        {message.status === "failed" && (
          <div className="mt-2 text-destructive text-xs">
            Failed to send message
          </div>
        )}
      </MessageContent>
    </Message>
  );
};
