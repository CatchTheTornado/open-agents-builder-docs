---
title: Custom integrations / AI Tools
description: How to add new custom AI tool to let the AI integrate with 3rd party systems
order: 10
---

Below is a **step-by-step** guide on how to extend **Open Agents Builder** by adding a **new custom AI tool**. We’ll walk through the complete flow: creating the new tool in the `src/tools/` directory, writing a configurator component, and registering the tool both in the `toolRegistry` and `toolConfiguratorsRepository`.

---

## 1. **Create your new tool file**

1. Navigate to `src/tools` directory in your project.
2. Create a new file, for example: **`googleSearchTool.ts`**.
3. In that file, place the code for your new tool. Below is an example for a **Google Search** tool that uses [Serply.io](https://serply.io) as a proxy to perform actual Google searches:

```ts
// src/tools/googleSearchTool.ts

import axios from 'axios'
import { z } from 'zod'
import { tool } from 'ai'
import s from 'dedent'

// Reuse the approach from your environment variable checks:
import { checkApiKey } from '@/lib/utils'

// 1. TypeScript interface for config
interface SerplyOptions {
  apiKey: string
  limit?: number
  hl?: string
  proxyLocation?: string
}

// 2. Default values
const defaults: Required<SerplyOptions> = {
  apiKey: '',
  limit: 5,
  hl: 'en',
  proxyLocation: 'US'
}

// 3. Response schema for normal search
const GoogleSearchResponseSchema = z.object({
  results: z.array(
    z.object({
      title: z.string(),
      link: z.string(),
      description: z.string(),
    })
  ),
})

// 4. Response schema for image search
const GoogleImageSearchResponseSchema = z.object({
  results: z.array(
    z.object({
      image: z.object({
        src: z.string(),
        alt: z.string(),
      }),
      link: z.object({
        href: z.string(),
        title: z.string(),
        domain: z.string(),
      }),
    })
  ),
})

// 5. Factory function to create the tools
export function createGoogleSearchTool() {
  // Resolve your Serply API key. 
  // You can set it in .env or any secret manager. 
  // For example: SERPLY_API_KEY=xxx
  const apiKey = checkApiKey(
    'Serply.io API key', 
    'SERPLY_API_KEY', 
    process.env.SERPLY_API_KEY || ''
  )

  // Prepare request config
  const config = {
    ...defaults,
    apiKey
  } satisfies Required<SerplyOptions>

  const request = {
    headers: {
      'X-Api-Key': config.apiKey,
      'X-User-Agent': 'desktop',
      'Content-Type': 'application/json',
      'X-Proxy-Location': config.proxyLocation,
    },
    params: {
      num: config.limit,
      gl: config.proxyLocation,
      hl: config.hl,
    },
  }

  // 6. Return a descriptor with two tools: "googleSearch" and "googleImageSearch"
  //    but you can just expose them individually if you prefer
  return {
    googleSearch: {
      displayName: 'Google Web Search',
      tool: tool({
        description: 'Perform a Google web search using Serply API',
        parameters: z.object({
          query: z.string().describe('Search query for Google search'),
        }),
        execute: async ({ query }) => {
          const url = `https://api.serply.io/v1/search/q=${encodeURIComponent(query)}`

          // 1) Perform the search
          const response = await axios.get(url, request)

          // 2) Validate the response
          const parsed = GoogleSearchResponseSchema.parse(response.data)

          // 3) Format the result
          const results = parsed.results
            .map(
              (res) => s`
                Title: ${res.title}
                Link: ${res.link}
                Description: ${res.description}
              `
            )
            .join('\n')

          return s`
            Search results for "${query}":
            ${results}
          `
        },
      }),
    },
    googleImageSearch: {
      displayName: 'Google Image Search',
      tool: tool({
        description: 'Perform a Google Image search using Serply API',
        parameters: z.object({
          query: z.string().describe('Search query for Google Image search'),
        }),
        execute: async ({ query }) => {
          const url = `https://api.serply.io/v1/search/q=${encodeURIComponent(query)}`

          const response = await axios.get(url, request)
          const parsed = GoogleImageSearchResponseSchema.parse(response.data)

          const results = parsed.results
            .map(
              (res) => s`
                Title: ${res.link.title}
                Link: ${res.link.href}
                Image: ${res.image.src}
              `
            )
            .join('\n')

          return s`
            Image search results for "${query}":
            ${results}
          `
        },
      }),
    }
  }
}
```

### Explanation
- We create a **factory function** `createGoogleSearchTool()` returning one or more **Tool Descriptors** (like `googleSearch` and `googleImageSearch`), each containing:
  - A `displayName` (human-readable name).
  - A `tool`, built from `tool({ ... })` imported from `'ai'`.

- We use environment variables plus a helper `checkApiKey` from your codebase to ensure an API key is present.

- We set up schemas (via `zod`) to validate the shape of the data returned by Serply’s JSON responses. 

---

## 2. **Create a configurator file (optional if no config is needed)**

If your tool requires user-configurable options (e.g. changing `limit` or `hl` from the UI), create a simple configurator component in `src/tools/`.

For example: **`googleSearchTool-configurator.tsx`**:

```tsx
// src/tools/googleSearchTool-configurator.tsx
'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

type GoogleSearchToolOptions = {
  limit?: number;
  hl?: string;
  proxyLocation?: string;
};

type GoogleSearchToolConfiguratorProps = {
  options: GoogleSearchToolOptions;
  onChange: (updated: GoogleSearchToolOptions) => void;
};

export function GoogleSearchToolConfigurator({
  options,
  onChange,
}: GoogleSearchToolConfiguratorProps) {
  const { t } = useTranslation();

  // Update the limit
  const handleLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...options, limit: parseInt(event.target.value, 10) || 5 });
  };

  // Update the hl (interface language)
  const handleHlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...options, hl: event.target.value });
  };

  // Update the proxyLocation
  const handleProxyLocationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...options, proxyLocation: event.target.value });
  };

  return (
    <div className="space-y-2 text-sm text-gray-600">
      <p>{t('Configure Google Search tool:')}</p>
      <label className="block">
        <span>{t('Results limit')}:</span>
        <input
          type="number"
          value={options.limit ?? ''}
          onChange={handleLimitChange}
          className="border p-1 block w-32"
        />
      </label>
      <label className="block">
        <span>{t('Language')} (hl):</span>
        <input
          type="text"
          value={options.hl ?? ''}
          onChange={handleHlChange}
          className="border p-1 block w-32"
        />
      </label>
      <label className="block">
        <span>{t('Proxy location')} (gl):</span>
        <input
          type="text"
          value={options.proxyLocation ?? ''}
          onChange={handleProxyLocationChange}
          className="border p-1 block w-32"
        />
      </label>
    </div>
  );
}
```

> **Note**: If your tool truly needs **no** user options, you can simply create a placeholder message (like the `CalendarScheduleConfigurator` example) or skip this file. However, it’s often good practice to include a minimal configurator so it can appear in the UI’s “Tools” settings panel.

---

## 3. **Register your tool in the `toolRegistry`**

Open the **`src/tools/registry.ts`** (sometimes called `toolRegistry`) and locate the big object where tools are instantiated. 

You will:
1. **Import** your factory function (`createGoogleSearchTool`) at the top.
2. **Call** it within the `init` method and add its returned tool(s) to the `availableTools` record.

Example:

```ts
// src/tools/registry.ts

import { Tool } from 'ai';
import { createGoogleSearchTool } from './googleSearchTool';  // <-- Add this
// ...other imports...

export type ToolDescriptor = {
  displayName: string;
  tool: Tool;
  injectStreamingController?: (streamingController: ReadableStreamDefaultController<any>) => void;
}

let availableTools: Record<string, ToolDescriptor> | null = null;

export const toolRegistry = {
  init: ({
    saasContext,
    databaseIdHash,
    storageKey,
    agentId,
    agent,
    sessionId,
    streamingController
  }: {
    saasContext?: AuthorizedSaaSContext,
    agentId: string,
    sessionId: string,
    agent?: Agent,
    databaseIdHash: string,
    storageKey: string | undefined | null,
    streamingController?: ReadableStreamDefaultController<any>
  }): Record<string, ToolDescriptor> => {

    const streamToOutput = (chunk: FlowChunkEvent) => {
      // ... streaming code ...
    };

    // Create or reset your tools record
    availableTools = {
      // Existing tools
      sendEmail: createEmailTool({
        apiKey: checkApiKey('Resend.com API key', 'RESEND_API_KEY', process.env.RESEND_API_KEY || ''),
      }),
      currentDate: currentDateTool,
      calendarSchedule: createCalendarScheduleTool(agentId, sessionId, databaseIdHash, storageKey),
      calendarList: createCalendarListTool(agentId, sessionId, databaseIdHash, storageKey),
      // ...others...

      // 1. Use your new factory function:
      // createGoogleSearchTool returns { googleSearch, googleImageSearch }
      // so let's destructure them as two tool entries:
      googleSearch: createGoogleSearchTool().googleSearch,
      googleImageSearch: createGoogleSearchTool().googleImageSearch,
    }

    // Additional logic, flows, etc.
    // ...
    
    return availableTools;
  },
};
```

**Key points**:
- We imported and invoked `createGoogleSearchTool()`.
- The factory returns an object with two tool descriptors:
  - `googleSearch`
  - `googleImageSearch`
- Each is added to the `availableTools` object under keys `googleSearch` and `googleImageSearch`.

---

## 4. **(Optional) Register your tool configurator**

If you have a configurator (like `GoogleSearchToolConfigurator`), you can register it in **`src/tools/configurators.ts`** (or wherever the configurators are aggregated). 

1. **Import** your `GoogleSearchToolConfigurator`.
2. **Add** a matching entry to the configurators record.

```ts
// src/tools/configurators.ts

import { GoogleSearchToolConfigurator } from './googleSearchTool-configurator'; 
// ...other imports...

type ToolConfiguratorDescriptor = {
  displayName: string;
  configurator: React.ComponentType<any>;
}

export const toolConfiguratorsRepository = {
  init: ({ agent }: { agent?: Agent }): Record<string, ToolConfiguratorDescriptor> => {

    let configurators: Record<string, ToolConfiguratorDescriptor> = {
      // Existing
      sendEmail: {
        displayName: 'Send Email',
        configurator: SendEmailConfigurator
      },
      currentDate: {
        displayName: 'Get current date',
        configurator: CurrentDateConfigurator
      },
      // ...
      // Insert your Google search configurator entry:
      googleSearch: {
        displayName: 'Google Web Search',
        configurator: GoogleSearchToolConfigurator,
      },
      googleImageSearch: {
        displayName: 'Google Image Search',
        configurator: GoogleSearchToolConfigurator,
      },
    }

    // Additional logic for flows or other agent types
    // ...

    return configurators;
  }
}
```

Now, inside your builder UI, if a user looks at the list of available tools, there will be an option to configure the **Google Search** or **Google Image Search** tool. 

---

## 5. **Verification & Usage**

With these changes:

1. **Run** or **restart** your dev server.
2. In your **Open Agents Builder** UI, go to the agent’s tool settings page. 
3. You should see **“Google Web Search”** and **“Google Image Search”** among the tool list.
4. If you open each configurator, you should see any inputs or placeholders you configured.

When the agent is active (and you have code that calls `toolRegistry.init(...)` with your environment variables properly set), it can invoke `googleSearch` or `googleImageSearch` to perform queries using Serply’s API.

---

## 6. **Putting it all together**

### Example final project structure

```
src/
  tools/
    googleSearchTool.ts             # Your new tool
    googleSearchTool-configurator.tsx   # Tool configurator
    calendarListTool.ts
    calendarScheduleTool.ts
    calendarScheduleTool-configurator.tsx
    ...
    registry.ts                     # Tools registry (toolRegistry.init)
    configurators.ts                # Tools configurators registry
...
```

### Example usage in an agent’s code

If your agent logic (or the conversation UI) calls:
```md
@tool googleSearch
{
  "query": "Best restaurants in New York City"
}
```
…the agent will respond with formatted results from Google/Serply.

---

## 7. **Summary of steps**

1. **Create** your custom AI tool file (e.g. `googleSearchTool.ts`) under `src/tools/`.
2. **Implement** your tool using `tool({...})` from `'ai'` (or your equivalent library).
3. **Optionally** create a configurator (`googleSearchTool-configurator.tsx`) if you want user-facing configuration options.
4. **Add** your tool(s) to `availableTools` in `toolRegistry.init()`.
5. **(Optional)** Add a new configurator to `toolConfiguratorsRepository.init()`.
6. **Restart** or re-deploy to ensure the new tool is recognized.
7. **Verify** by checking the agent’s available tools and possibly test in a conversation or code snippet.

That’s it! You have successfully extended **Open Agents Builder** by adding a **custom Google Search (Serply-based) tool**. Feel free to adapt and refine further—such as additional error handling, caching logic, or more advanced configuration options.