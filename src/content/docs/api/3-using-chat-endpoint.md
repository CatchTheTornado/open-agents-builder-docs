---
title: Using the Chat endpoint
description: How to use the Chat endpoint along with your Vercel AI SDK app
---

The [`Chat` type flows](../guides/2-concepts.md) are being served by the API endpoint, 100% compliant with the [Vercel AI SDK](https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot) - which makes it suepr easy to build your own Chat-like interface using Open Agents Builder as a Backend.

Why this option is so useful? Because it makes it very easy to let the business users or business analysts manage the business logic, give the chat flow access to all business entitities and integrations on the backend, while prepareing your customized frontend or integrating it into existing app.

### **Endpoint:** `/api/chat/`

**Method:** `POST`

**Summary:** This endpoint is used to send a new message in the conversation. It requires authentication and authorization headers.

**Request Body:**

* `messages`: An array of CoreMessage objects that will be sent as part of this request.
	+ Example:
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
**Request Headers:**

* `Database-Id-Hash`: A unique identifier for the database that this request is associated with.
	+ Required
* `Agent-Session-Id`: An ID for the agent session that this request is part of. If not provided, a new one will be generated.
	+ Optional (but recommended)
* `Agent-Id`: The ID of the agent that should handle this message.
	+ Required
* `Current-Datetime-Iso`: A timestamp in ISO format representing when this message was sent. Can be omitted if no value is available.
	+ Optional
* `Current-Datetime`: A human-readable date and time string representing when this message was sent. Can be omitted if no value is available.
	+ Optional
* `Current-Timezone`: The timezone that the current date and time should be represented in. Can be omitted if no value is available.
	+ Optional

**Response:**

* **200 OK**: A successful request with a stream of text data representing the response from the LLM model.
```json
{
  "data": {
    // Stream of text data here
  }
}
```
* **400 Bad Request**: The request was invalid or unable to be processed. This can include missing required headers, invalid JSON in the request body, etc.
```json
{
  "message": "The required HTTP headers: Database-Id-Hash, Agent-Session-Id and Agent-Id missing"
}
```
* **403 Unauthorized**: The user does not have access to send messages on behalf of this agent. This can occur if:
	+ No `Agent-Id` is provided.
	+ The `Database-Id-Hash`, `Agent-Session-Id`, or `Current-Datetime-Iso` headers are missing or invalid.
* **499 Internal Server Error**: An unexpected error occurred while processing the request. This can include server-side errors, database issues, etc.

**Notes:**

* This endpoint uses a secure connection (HTTPS) to protect against eavesdropping and tampering with the data being sent.
* The `Agent-Session-Id` header is used to associate this message with an existing agent session. If no value is provided, a new one will be generated.
* The LLM model's response is returned as a stream of text data. This can be processed by the client-side application or saved for later use.

**Authorization:**

* **Agent Authentication**: The `Agent-Id` header must match an existing agent in the database to send messages on behalf of that agent.


### Integarting into React app

Here's just a short example on integrating the above endpoint into React app, using the [Vercel AI SDK](https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot).

First: please make sure you've got the [Vercel SDK properly installed](https://sdk.vercel.ai/).

First, create the `@/context/exec-context`  component for managing the chat context and state.

```typescript
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { error } from 'console';
import { z } from 'zod';

export const agentDTOSchema = z.object({
  id: z.string().optional(),
  displayName: z.string().min(1),
  options: z.string().optional().nullable(),
  prompt: z.string().optional(),
  expectedResult: z.string().optional().nullable(),
  safetyRules: z.string().optional().nullable(),
  published: z.string().optional().nullable(),
  events: z.string().optional().nullable(),
  tools: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  locale: z.string().optional().nullable(),
  agentType: z.string().optional().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  inputs: z.string().optional().nullable(),
  defaultFlow: z.string().optional().nullable(),
  flows: z.string().optional().nullable(),
  agents: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  extra: z.string().optional().nullable()
});
export type AgentDTO = z.infer<typeof agentDTOSchema>;

export interface ExecContextType {
    initFormRequired: boolean;
    initFormDone: boolean;
    databaseIdHash: string;
    sessionId: string
    locale: string;
    setDatabaseIdHash: (databaseIdHash: string) => void;
    setSessionId: (sessionId: string) => void;
    agent: AgentDTO | null;
    init: (id: string, databaseIdHash: string, locale: string, sessionId: string) => Promise<AgentDTO>;
}

const ChatContext = createContext<ExecContextType | undefined>(undefined);

export const ExecProvider = ({ children }: { children: ReactNode }) => {
    const [agent, setAgent] = useState<Agent | null>(null);
    const [databaseIdHash, setDatabaseIdHash] = useState<string>('');
    const [sessionId, setSessionId] = useState<string>('');
    const [locale, setLocale] = useState<string>('en');

    const init = async (id: string, databaseIdHash: string, locale: string, sessionId: string): Promise<AgentDTO> => {
        setDatabaseIdHash(databaseIdHash);
        setSessionId(sessionId);
        setLocale(locale);

        const url = 'https://openagentsbuilder.com/api/agent';
        const headers = {
        'Content-Type': 'application/json',
        };

        try {
            const response = (await fetch(url, { headers })).json();
        } catch (error) {
            console.error('Error:', error);
        }
        
        if (response.status === 200) {
            const agt = response as agt
            setAgent(agt);

            // if (agt.options?.collectUserEmail || agt.options?.mustConfirmTerms) {
            //     setInitFormRequired(true);
            // } else {
            //     setInitFormRequired(false);
            // }

            return agt;        
        } else {
            throw new Error(t(response.message));
        }
    }

    return (
        <ChatContext.Provider value={{ 
            agent,
            locale,
            init,
            databaseIdHash,
            setDatabaseIdHash,
            sessionId,
            setSessionId
            }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useExecContext = (): ExecContextType => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useExecContext must be used within an ExecProvider');
    }
    return context;
};

```

Then create the React component:


```typescript
'use client'

import { ExecContextType, useExecContext } from "@/contexts/exec-context";
import { useChat } from "ai/react";
import moment from "moment";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";

export default function ChatPage({children,
    params,
  }: {
    children: React.ReactNode;
    params: { id: string, databaseIdHash: string, locale: string };
  }) {
    const [isInitializing, setIsInitializing] = useState(true);
    const [generalError, setGeneralError] = useState<string | null>(null);
    const chatContext = useExecContext();
    const { t } = useTranslation();
    const { messages, append, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: "/api/chat",
      })
    
    const getSessionHeaders = () => {
        return {
            'Database-Id-Hash': chatContext.databaseIdHash,
            'Agent-Id': chatContext.agent?.id ?? '',
            'Agent-Locale': chatContext.locale,
            'Agent-Session-Id': chatContext.sessionId,
            'Current-Datetime-Iso': moment(new Date()).toISOString(true),
            'Current-Datetime': new Date().toLocaleString(),
            'Current-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
        }
    }
    
    useEffect(() => {
        chatContext.init(params.id, params.databaseIdHash, params.locale, nanoid() /** generate session id */).catch((e) => {
          console.error(e);
          setGeneralError(t(getErrorMessage(e)));
        }).then(() => {
          setIsInitializing(false);
        });
    }, [params.id, params.databaseIdHash, params.locale]);

    useEffect(() => {
        if (chatContext.agent){
          if(chatContext.initFormRequired && !chatContext.initFormDone){
            return; // wait until user fills the form
          }

          append({
            id: nanoid(),
            role: "user",
            content: t("Lets chat")
          }, {
            headers: getSessionHeaders()
          }).catch((e) => {
            toast.error(t(getErrorMessage(e)));
          });
        }
      }, [chatContext.agent, chatContext.initFormRequired, chatContext.initFormDone]);

      const authorizedChat =  () => (
        (chatContext.initFormRequired && !chatContext.initFormDone) ? (
          <ChatInitForm
              welcomeMessage={chatContext.agent?.options?.welcomeMessage ?? ''}
            displayName={chatContext.agent?.displayName ?? ''}
          />
      ):(
          <Chat 
              headers={getSessionHeaders()} 
              welcomeMessage={chatContext.agent?.options?.welcomeMessage ?? ''}
              messages={messages}
              handleInputChange={handleInputChange}
              isLoading={isLoading}
              handleSubmit={handleSubmit}
              input={input}
              displayName={chatContext.agent?.displayName ?? ''}
          />
      )    
    )


      return (
        <ExecProvider>
            <div>
                <div className="pt-10">
                {isInitializing ? (
                    <div className="text-center">
                    <div className="text-gray-500 text-center">{t("Initializing agent...")}</div>
                    </div>
                ) : (
                generalError ? (
                    <div className="text-center">
                    <div className="flex justify-center m-4 text-red-400 text-2xl">{t('Error')}</div>
                    <div className="text-red-500 text-center">{generalError}</div>
                    </div>
                ): (
                    chatContext.agent?.published ? (
                        authorizedChat()
                    ) : (
                        <div>The chat has not yet been published :-( </div>
                    )
                )
                )}
                </div>
            </div>
      </ExecProvider>
    )
}
```

**Note**: The `Chat` component has been skipped in this example - and you should create one on yourself based on the Vercel AI SDK or using the example from the [open-agents-builder/src/components/](https://github.com/CatchTheTornado/open-agents-builder/blob/main/src/components/Chat.tsx)

