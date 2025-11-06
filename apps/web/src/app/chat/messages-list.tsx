"use client";

import { api } from "@mirpr-ppi/backend/convex/_generated/api";
import { useUIMessages } from "@convex-dev/agent/react";
import { MessageItem } from "./message-item";
import { Button } from "@/components/ui/button";

interface Props {
  threadId: string;
}

export const MessagesList: React.FC<Props> = ({ threadId }) => {
  const { results, status, loadMore } = useUIMessages(
    api.agent.listThreadMessages,
    { threadId },
    { initialNumItems: 20, stream: true }
  );

  return (
    <div className="flex flex-col gap-2">
      {status === "CanLoadMore" && (
        <div className="flex justify-center py-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadMore(10)}
            type="button"
          >
            Load More
          </Button>
        </div>
      )}

      {results.map((message) => (
        <MessageItem key={message.key} message={message} />
      ))}
    </div>
  );
};
