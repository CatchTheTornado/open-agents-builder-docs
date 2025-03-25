---
title: Stats API
description: How to get the token usage etc
---

Below is a **REST API documentation** for **Stats** endpoints, which track usage metrics such as prompt/completion tokens, event names, and aggregated monthly stats.  

All examples assume a base URL of **`https://app.openagentsbuilder.com`**.  

---

> **Note**: There is an API client plus example available on: [https://github.com/CatchTheTornado/open-agents-builder-client](https://github.com/CatchTheTornado/open-agents-builder-client) and [https://github.com/CatchTheTornado/open-agents-builder-example](https://github.com/CatchTheTornado/open-agents-builder-example)

---

## 1. Overview

The **Stats** API helps you **record** usage data (like prompt/completion tokens for LLM usage) and **retrieve** aggregated metrics for:

- **This month**  
- **Last month**  
- **Today**  

**Key Capabilities**:

1. **Add** or **update** a stats record (via a “PUT” that aggregates tokens by hour/day/month).
2. **Fetch aggregated** usage stats for the current month, last month, and today.

---

## 2. Data Schema

### 2.1 `StatDTO` (for storing usage events)

```ts
export const statsSchema = z.object({
  id: z.number().positive().int().optional(),
  eventName: z.string().min(1),
  promptTokens: z.number().positive().int(),
  completionTokens: z.number().positive().int(),
  finishReasons: z.string().nullable().optional(),
  createdAt: z.string().default(() => getCurrentTS()),
  createdMonth:  z.number().positive().int().nullable().optional(),
  createdDay:  z.number().positive().int().nullable().optional(),
  createdYear:  z.number().positive().int().nullable().optional(),
  createdHour:  z.number().positive().int().nullable().optional(),
  counter: z.number().positive().int().optional()
});
export type StatDTO = z.infer<typeof statsSchema>;
```

**Key fields**:

- **`eventName`**: A string label (e.g., `chat`, `apiCall`, etc.).  
- **`promptTokens`** & **`completionTokens`**: For usage metrics (LLM token counts, etc.).  
- **`finishReasons`**: Additional info about why or how the event completed.  
- **`createdAt`**: Timestamp, defaults to now if not provided.  
- **`createdMonth`, `createdDay`, `createdYear`, `createdHour`**: The server auto-fills these to group by date/time.  
- **`counter`**: How many times that event occurred in the hour/day partition (the server increments it automatically).

### 2.2 `AggregatedStatsDTO` (for the aggregated stats response)

```ts
export type AggregatedStatsDTO = {
  thisMonth: {
    overallTokens: number;
    promptTokens: number;
    completionTokens: number;
    overalUSD: number;
    requests: number;
  };
  lastMonth: {
    overallTokens: number;
    promptTokens: number;
    completionTokens: number;
    overalUSD: number;
    requests: number;
  };
  today: {
    overallTokens: number;
    promptTokens: number;
    completionTokens: number;
    overalUSD: number;
    requests: number;
  };
};
```

**Key sections**:

- **`thisMonth`**  
- **`lastMonth`**  
- **`today`**  

Each includes:

- **`overallTokens`** = `promptTokens + completionTokens`  
- **`promptTokens`**, **`completionTokens`**  
- **`requests`** = the sum of `counter` for all events.  
- **`overalUSD`**: A rough cost estimate based on a reference model’s pricing (like GPT-4).  

---

## 3. Endpoints

### 3.1 `PUT /api/stats`

#### 3.1.1 Description

Takes a `StatDTO` in the body and **aggregates** it. This means:

- If an event with the same hour/day/month/year and the same `eventName` already exists, it increments `counter` by 1 and adds the new tokens.  
- Otherwise, it creates a new row.  

This is how it compresses many usage events into hourly stats.

#### 3.1.2 cURL Example

```bash
curl -X PUT \
  "https://app.openagentsbuilder.com/api/stats" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>" \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "chat",
    "promptTokens": 100,
    "completionTokens": 150
  }'
```

#### 3.1.3 TypeScript `fetch` Example

```ts
async function putStats(statData: any) {
  const response = await fetch("https://app.openagentsbuilder.com/api/stats", {
    method: "PUT",
    headers: {
      "Authorization": "Bearer <YOUR_API_KEY>",
      "database-id-hash": "<YOUR_DATABASE_ID_HASH>",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(statData)
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(`Error aggregating stats: ${result.message}`);
  }
  console.log("Stats aggregated:", result.data);
  return result.data;
}

// Usage:
putStats({
  eventName: "chat",
  promptTokens: 100,
  completionTokens: 150
}).catch(console.error);
```

#### 3.1.4 Example Success Response (HTTP 200)

```json
{
  "message": "Stats aggregated!",
  "data": {
    "id": 42,
    "eventName": "chat",
    "promptTokens": 200,    // if we already had 100, now 100 more added
    "completionTokens": 300,// if 150 more added
    "createdAt": "2025-03-21T10:00:00.000Z",
    "createdMonth": 2,
    "createdDay": 21,
    "createdYear": 2025,
    "createdHour": 10,
    "counter": 2
  },
  "status": 200
}
```

*(The server might have aggregated it with an existing row, incrementing `counter` to 2.)*

#### Using the TypeScript API Client

```ts
import { OpenAgentsBuilderClient } from "open-agents-builder-client";

const client = new OpenAgentsBuilderClient({
  apiKey: "YOUR_API_KEY",
  databaseIdHash: "YOUR_DATABASE_ID_HASH"
});

async function putStatsClientExample() {
  await client.stats.putStats({
    eventName: "chat",
    promptTokens: 100,
    completionTokens: 150
  });
  console.log("Stats aggregated via client!");
}

putStatsClientExample();
```

---

### 3.2 `GET /api/stats/aggregated`

#### 3.2.1 Description

Returns the **aggregated usage** for:

- **This month**  
- **Last month**  
- **Today**  

**In a single JSON** (`AggregatedStatsDTO`).

#### 3.2.2 cURL Example

```bash
curl -X GET \
  "https://app.openagentsbuilder.com/api/stats/aggregated" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>"
```

#### 3.2.3 TypeScript `fetch` Example

```ts
async function getAggregatedStats() {
  const response = await fetch("https://app.openagentsbuilder.com/api/stats/aggregated", {
    method: "GET",
    headers: {
      "Authorization": "Bearer <YOUR_API_KEY>",
      "database-id-hash": "<YOUR_DATABASE_ID_HASH>"
    }
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(`Error fetching aggregated stats: ${result.message}`);
  }
  console.log("Aggregated stats:", result.data);
  return result.data;
}

// Usage:
getAggregatedStats().catch(console.error);
```

#### 3.2.4 Example Success Response (HTTP 200)

```json
{
  "message": "Stats aggregated!",
  "data": {
    "thisMonth": {
      "overallTokens": 9999,
      "promptTokens": 4000,
      "completionTokens": 5999,
      "overalUSD": 4.50,
      "requests": 27
    },
    "lastMonth": {
      "overallTokens": 3000,
      "promptTokens": 1000,
      "completionTokens": 2000,
      "overalUSD": 2.30,
      "requests": 10
    },
    "today": {
      "overallTokens": 999,
      "promptTokens": 400,
      "completionTokens": 599,
      "overalUSD": 0.45,
      "requests": 2
    }
  },
  "status": 200
}
```

#### Using the TypeScript API Client

```ts
async function getAggregatedStatsClientExample() {
  const aggregated = await client.stats.getAggregatedStats();
  console.log("Aggregated stats via client:", aggregated);
}

getAggregatedStatsClientExample();
```

---

## 4. Internal Pricing Logic

The server uses a reference cost structure from a JSON file (`pricing.json`) to estimate **`overalUSD`**. E.g., GPT-4 might cost `$0.03/1k tokens` for prompt and `$0.06/1k tokens` for completion. These values are simplified in the code:

```ts
currentPricing["gpt-4o"].input / 1000 * promptTokens + currentPricing["gpt-4o"].output / 1000 * completionTokens
```

Hence the `overalUSD` is just a rough cost estimate. Modify in the code if you track a different model or want more accurate pricing.

---

## 5. Error Handling

- **400 or 499/500**: If an unexpected server or DB error occurs.
- **401/403 Unauthorized**: Missing or invalid `Authorization` or `database-id-hash`.
- **Validation Errors (400)**: If you pass a `StatDTO` missing `eventName`, `promptTokens`, or `completionTokens`.

Error responses generally include:

```json
{
  "message": "Error details",
  "status": <number>
}
```

---

## 6. Summary of Stats Endpoints

| **Endpoint**                       | **Method** | **Purpose**                                                                                                 |
|-----------------------------------|-----------|-------------------------------------------------------------------------------------------------------------|
| **`/api/stats`**                  | **PUT**    | Aggregates usage stats (tokens, eventName). Automatically merges same hour.                                |
| **`/api/stats/aggregated`**       | **GET**    | Returns an object with monthly + daily usage cost/tokens (thisMonth, lastMonth, today).                     |

You can expand the logic to add more time frames or advanced queries as needed. This approach focuses on **LLM usage** but can be adapted for other usage tracking.

