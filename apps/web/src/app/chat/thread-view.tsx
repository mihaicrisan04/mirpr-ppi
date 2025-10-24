"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@mirpr-ppi/backend/convex/_generated/api";

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
    sendMessageToAgent({
      threadId,
      prompt: message.trim(),
    })
      .then((res) => setResponse(res))
      .finally(() => {() => setIsLoading(false); });
  }

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label htmlFor="prompt">Message</label>
        <textarea
          id="prompt"
          value={message}
          onChange={(e) => setMessage(e.currentTarget.value)}
          placeholder="Type your message to the agent..."
          rows={4}
        />
        <div>
          <button type="submit" disabled={isLoading || !message.trim()}>
            {isLoading ? "Sending..." : "Send"}
          </button>
        </div>
      </form>

      {response ? (
        <div style={{ marginTop: 12 }}>
          <strong>Agent response:</strong>
          <pre style={{ whiteSpace: "pre-wrap" }}>{response}</pre>
        </div>
      ) : null}
    </div>
  );
}
