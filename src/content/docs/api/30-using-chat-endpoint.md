---
title: Using the Chat endpoint
description: How to use the Chat endpoint along with your Vercel AI SDK app
---
Below is a **step-by-step** tutorial on how to use the **Chat endpoint** in Open Agents Builder and integrate it with a **React** application using the [Vercel AI SDK](https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot). We’ll cover:

- What the Chat endpoint is and why it’s useful
- Endpoint details and request/response format
- How to integrate the Chat endpoint into a React app
- Example code snippets (with a minimal context provider and chat component usage)

---

## 1. **Why Use the Chat Endpoint?**

A **Chat**-type flow in Open Agents Builder (OAB) is 100% compliant with the [Vercel AI SDK’s Chat interface](https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot). This allows you to:

- Use OAB as a **backend** for your chat flows and business rules.
- Empower non-technical users to manage conversation logic, tools, or integrations.
- Build a **customized** chat frontend (or integrate into an existing React app).

---

## 2. **Endpoint: `/api/chat/`**

**Method:** `POST`

**Summary:**  
Sends a new message in the conversation. The response typically streams tokens (partial text chunks) from the LLM, so you can show a progressively rendered chat experience in your UI.

### **Request Body**

```json
{
  "messages": [
    {
      "role": "system",
      "content": "Hello, how can I assist you today?"
    }
  ]
}
```

| Field      | Description                                                                                         |
|------------|-----------------------------------------------------------------------------------------------------|
| `messages` | An array of messages. Each message must have a `role` (`system`, `user`, or `assistant`) and `content`. |

### **Request Headers**

- **Database-Id-Hash** (*required*): A unique hash referencing the database/tenant.  
- **Agent-Id** (*required*): The ID of the OAB agent that handles messages.
- **Agent-Session-Id** (optional): An identifier for the agent session (conversation). If not provided, a new session is created.
- **Current-Datetime-Iso** (optional): ISO timestamp for the request.
- **Current-Datetime** (optional): A human-readable date/time for the request.
- **Current-Timezone** (optional): The user’s timezone (e.g. `"Europe/Warsaw"`).

### **Authentication**

Supply your **API key** via the `Authorization` header (if using the standard approach) or whichever method your OAB instance requires. If the agent is **not** published, you may need elevated (admin) credentials.

---

## 3. **Response**

The response is typically **streamed**. That means your HTTP connection remains open, and tokens (fragments of the assistant’s reply) are sent in real time.

- **200 OK**:  
  A successful request returns a **chunked stream** of text data. If you choose not to stream, it can also be a single JSON block.

  ```json
  {
    "data": {
      // Stream of text tokens or JSON lines
    }
  }
  ```
- **400 Bad Request**:  
  Missing or invalid headers/body. For instance:

  ```json
  {
    "message": "The required HTTP headers: Database-Id-Hash, Agent-Session-Id and Agent-Id missing"
  }
  ```
- **403 Unauthorized**:  
  Agent or database header mismatch, or you have insufficient permissions.
- **499 Internal Server Error**:  
  A general catch for server-side or unexpected issues.

---

## 4. **Example React Integration with Vercel AI SDK**

Below is an **illustrative** example of how you might integrate the `/api/chat` endpoint into a React app. It uses:

- A **context** (`ExecProvider`) to store session, agent, and database config.
- A snippet of logic that calls `useChat` from `"ai/react"` to manage the conversation state.

### 4.1 **Context Provider**

Create a context file (e.g., `@/context/exec-context.tsx`) to handle:

- **Agent** loading/initialization
- **Database** and **session** tracking
- **Locale** or additional state

**`exec-context.tsx`**:

```tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { z } from 'zod';

// 1. Define an Agent DTO schema (you may customize as needed)
const agentDTOSchema = z.object({
  id: z.string().optional(),
  displayName: z.string().min(1),
  options: z.string().optional().nullable(),
  prompt: z.string().optional(),
  // ... more fields as your app requires ...
  createdAt: z.string(),
  updatedAt: z.string()
});
export type AgentDTO = z.infer<typeof agentDTOSchema>;

// 2. Define the context shape
export interface ExecContextType {
  agent: AgentDTO | null;
  databaseIdHash: string;
  sessionId: string;
  locale: string;
  init: (id: string, dbHash: string, locale: string, sessionId: string) => Promise<AgentDTO>;
  setDatabaseIdHash: (hash: string) => void;
  setSessionId: (sid: string) => void;
}

// 3. Create the context and default
const ChatContext = createContext<ExecContextType | undefined>(undefined);

// 4. Provider component
export const ExecProvider = ({ children }: { children: ReactNode }) => {
  const [agent, setAgent] = useState<AgentDTO | null>(null);
  const [databaseIdHash, setDatabaseIdHash] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [locale, setLocale] = useState<string>('en');

  // Basic init logic:
  const init = async (agentId: string, dbHash: string, loc: string, sid: string): Promise<AgentDTO> => {
    setDatabaseIdHash(dbHash);
    setSessionId(sid);
    setLocale(loc);

    // Example fetch from your backend or OAB admin. 
    // In reality, adjust the URL/headers to fit your setup.
    try {
      const url = `https://openagentsbuilder.com/api/agent/${agentId}`;
      const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) {
        throw new Error(`Failed to load agent ${agentId}`);
      }

      const data = await res.json();
      // Validate with Zod:
      const validatedData = agentDTOSchema.parse(data);
      setAgent(validatedData);

      return validatedData;
    } catch (err) {
      console.error(err);
      throw err; // or handle gracefully
    }
  };

  return (
    <ChatContext.Provider
      value={{
        agent,
        databaseIdHash,
        sessionId,
        locale,
        init,
        setDatabaseIdHash,
        setSessionId
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

// 5. Hook to access the context
export const useExecContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useExecContext must be used within an ExecProvider');
  }
  return context;
};
```

### 4.2 **Chat Page Component**

A basic example hooking into the context, using `useChat` from `ai/react`, and sending chat messages to `/api/chat`. You can adapt this to your UI library or layout.

```tsx
'use client';

import { useExecContext } from "@/context/exec-context";
import { useChat } from "ai/react";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";

export default function ChatPage({
  params
}: {
  params: { id: string; databaseIdHash: string; locale: string };
}) {
  const { agent, init, databaseIdHash, setDatabaseIdHash, sessionId, setSessionId, locale } = useExecContext();
  const [isInitializing, setIsInitializing] = useState(true);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // useChat from Vercel AI SDK
  const { messages, append, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat"  // Your OAB endpoint
  });

  // Build custom headers for each request
  const getSessionHeaders = () => ({
    'Database-Id-Hash': databaseIdHash,
    'Agent-Id': agent?.id ?? '',
    'Agent-Session-Id': sessionId,
    'Current-Datetime-Iso': new Date().toISOString(),
    'Current-Datetime': new Date().toLocaleString(),
    'Current-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  // On mount, init the agent context
  useEffect(() => {
    const newSessionId = nanoid();
    init(params.id, params.databaseIdHash, params.locale, newSessionId)
      .then(() => setIsInitializing(false))
      .catch((error) => {
        console.error(error);
        setGeneralError(error.message || 'Failed to init agent');
        setIsInitializing(false);
      });
  }, [init, params.id, params.databaseIdHash, params.locale]);

  // Example: auto-send a greeting once agent is loaded
  useEffect(() => {
    if (!isInitializing && agent) {
      append(
        {
          id: nanoid(),
          role: "user",
          content: "Hello, let's chat!"
        },
        { headers: getSessionHeaders() }
      ).catch((err) => {
        console.error("Initial chat error:", err);
      });
    }
  }, [agent, isInitializing]);

  // Basic message rendering
  function renderMessages() {
    return messages.map((msg) => (
      <div key={msg.id} style={{ margin: "4px 0" }}>
        <b>{msg.role}:</b> {msg.content}
      </div>
    ));
  }

  if (isInitializing) {
    return <div>Initializing chat...</div>;
  }

  if (generalError) {
    return <div>Error: {generalError}</div>;
  }

  if (!agent) {
    return <div>No agent loaded</div>;
  }

  return (
    <div>
      <h3>Chat with {agent.displayName}</h3>
      <div style={{ border: "1px solid #ccc", padding: 10, minHeight: 200 }}>
        {renderMessages()}
      </div>
      <form
        onSubmit={(e) => handleSubmit(e, { headers: getSessionHeaders() })}
        style={{ marginTop: 10 }}
      >
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
```

### 4.3 **Putting It All Together**

In your root or page layout, wrap your `ChatPage` with the `ExecProvider`, so the context is available:

```tsx
import ChatPage from "./ChatPage";
import { ExecProvider } from "@/context/exec-context";

export default function App({ params }) {
  return (
    <ExecProvider>
      <ChatPage params={params} />
    </ExecProvider>
  );
}
```

---

## 5. **Summary**

- **Endpoint**: Use `POST /api/chat` with the required headers (`Database-Id-Hash`, `Agent-Id`, etc.) to send messages.
- **Streaming**: The LLM responses come as a stream of tokens by default, suitable for building real-time chat UIs.
- **Vercel AI SDK**: Provides a `useChat` hook that works seamlessly with OAB’s Chat endpoint.
- **Context**: A React context (`ExecProvider`) can handle agent initialization, session IDs, and additional metadata. 

With this approach, you can easily create a Chat-like interface powered by Open Agents Builder’s flows, while letting **business users** manage the logic in OAB’s admin panel. Adjust and expand the example code to suit your environment—such as using environment variables for the `databaseIdHash`, applying localized messages, or hooking in custom tool calls. Enjoy your new chat interface!