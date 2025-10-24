"use client";

import { useMutation } from "convex/react";
import { api } from "@mirpr-ppi/backend/convex/_generated/api";
import { useState } from "react";
import { ThreadView } from "./thread-view";
import { Button } from "@/components/ui/button";

export default function ChatPage() {
  const createThread = useMutation(api.agent.createAgentThread);
  const [threadId, setThreadId] = useState<string | null>(null);


  return  (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-3xl shadow-md rounded-lg p-6">
        {threadId ? (
          <ThreadView threadId={threadId} />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800">Start a new thread</h2>
            <Button
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              onClick={() => createThread().then((id) => setThreadId(id))}
            >
              Create Thread
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
