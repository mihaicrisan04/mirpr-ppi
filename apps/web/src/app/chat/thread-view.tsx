"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@mirpr-ppi/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";

interface Props {
  threadId: string;
}

export const ThreadView: React.FC<Props> = ({ threadId }) => {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessageToAgent = useAction(api.agent.sendMessageToAgent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const messageToSend = message.trim();
    setMessage("");
    sendMessageToAgent({
      threadId,
      prompt: messageToSend,
    })
      .then((res) => {
        setResponse(res);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {response && (
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 rounded-lg border">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-700 mb-2">Agent Response:</div>
            <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{response}</div>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t pt-4">
        <label htmlFor="prompt" className="text-sm font-medium text-gray-700">
          Message
        </label>
        <textarea
          id="prompt"
          value={message}
          onChange={(e) => setMessage(e.currentTarget.value)}
          placeholder="Type your message to the agent..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent resize-none"
        />
        <div>
          <Button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="bg-[#003366] hover:bg-[#004488] text-white w-full sm:w-auto"
          >
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}
