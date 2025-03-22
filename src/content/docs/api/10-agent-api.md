---
title: Agent Management API
description: How to create, delete and filter agents thru API
---

Below is a **comprehensive REST API documentation** for the **Agent** resource, covering both the base `/api/agent` endpoint (GET, PUT) and the **new** `/api/agent/[id]` endpoint (DELETE). All documentation is in **English**.  

---

> **Note**: There is an API client plus example available on: [https://github.com/CatchTheTornado/open-agents-builder-client](https://github.com/CatchTheTornado/open-agents-builder-client) and [https://github.com/CatchTheTornado/open-agents-builder-example](https://github.com/CatchTheTornado/open-agents-builder-example)

---

## **1. Overview**

We have two primary endpoint groups for managing **Agent** data:

1. **`/api/agent`**  
   - **GET**: Retrieve a list of agents.  
   - **PUT**: Create or update an agent.  

2. **`/api/agent/[id]`**  
   - **DELETE**: Delete a specific agent (and associated data).  

---

## **2. Mandatory Request Headers**

1. **`Authorization: Bearer <OPEN_AGENT_BUILDER_API_KEY>`**  
   - Used for authentication. Replace `<OPEN_AGENT_BUILDER_API_KEY>` with your actual API key.  

2. **`database-id-hash: <YOUR_DATABASE_ID_HASH>`**  
   - A constant key **per user’s database**.  
   - Obtain this hash from the *API tab* in the administration panel.  

Example:
```
Authorization: Bearer abc1234exampleKey
database-id-hash: 35f5c5b139a6b569d4649b788c1851831eb44d8e32b716b8411ec6431af8121d
```

---

## **3. Data Schema & Validation Rules**

From the `agentDTOSchema` (using [zod](https://github.com/colinhacks/zod)):

```ts
import { z } from 'zod';
import { getCurrentTS } from "@/lib/utils";

export const agentDTOSchema = z.object({
  id: z.string().optional(),
  displayName: z.string().min(1),           // Required, min length: 1
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
  createdAt: z.string().default(() => getCurrentTS()),
  updatedAt: z.string().default(() => getCurrentTS()),
  inputs: z.string().optional().nullable(),
  defaultFlow: z.string().optional().nullable(),
  flows: z.string().optional().nullable(),
  agents: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  extra: z.string().optional().nullable()
});
export type AgentDTO = z.infer<typeof agentDTOSchema>;
```

- **`displayName`** is required (`min(1)`).
- **`id`**:
  - Omit or set `null` to **create** a new agent.  
  - Provide an existing `id` to **update** an agent.  
- All other fields are optional. Some fields accept `null`.

---

## **4. Endpoints & Usage**

### **4.1 `/api/agent`**

#### **4.1.1 GET** `/api/agent`

- **Description**: Retrieve all agents. Supports optional query parameters:
  - `limit` (e.g., `?limit=10`)
  - `offset` (e.g., `?offset=0`)
  - Others (e.g., `?id=<someId>`) to filter by certain fields.

- **Example cURL**:
  ```bash
  curl -X GET \
    "https://app.openagentsbuilder.com/api/agent?limit=10&offset=0" \
    -H "Authorization: Bearer abc1234exampleKey" \
    -H "database-id-hash: 35f5c5b139a6b569d4649b788c1851831eb44d8e32b716b8411ec6431af8121d"
  ```
  
- **Example TypeScript (fetch)**:
  ```ts
  async function getAgents() {
    const response = await fetch("https://app.openagentsbuilder.com/api/agent?limit=10&offset=0", {
      method: "GET",
      headers: {
        "Authorization": "Bearer abc1234exampleKey",
        "database-id-hash": "35f5c5b139a6b569d4649b788c1851831eb44d8e32b716b8411ec6431af8121d"
      }
    });
    const data = await response.json();
    console.log("Agents:", data);
  }
  ```

- **Successful Response** (HTTP `200`):
  ```json
  [
    {
      "id": "agent-123",
      "displayName": "My First Agent",
      "prompt": "Sample prompt",
      "options": null,
      "expectedResult": null,
      "safetyRules": null,
      "published": null,
      "events": null,
      "tools": null,
      "status": null,
      "locale": null,
      "agentType": null,
      "createdAt": "2025-03-20T12:45:01.000Z",
      "updatedAt": "2025-03-20T12:45:01.000Z",
      "inputs": null,
      "defaultFlow": null,
      "flows": null,
      "agents": null,
      "icon": null,
      "extra": null
    },
    {
      "id": "agent-456",
      "displayName": "Another Agent",
      "prompt": "Some text ...",
      "...": "..."
    }
  ]
  ```

#### **4.1.2 PUT** `/api/agent`

- **Description**: Create or update an agent record.  
  - If `id` is **omitted**, a new agent is created.  
  - If `id` **exists** (and is found), that agent is updated.

- **Example cURL** (Create new):
  ```bash
  curl -X PUT \
    https://app.openagentsbuilder.com/api/agent \
    -H "Authorization: Bearer abc1234exampleKey" \
    -H "database-id-hash: 35f5c5b139a6b569d4649b788c1851831eb44d8e32b716b8411ec6431af8121d" \
    -H "Content-Type: application/json" \
    -d '{
      "displayName": "New Agent",
      "prompt": "Hello from my new agent"
    }'
  ```

- **Example cURL** (Update existing by `id`):
  ```bash
  curl -X PUT \
    https://app.openagentsbuilder.com/api/agent \
    -H "Authorization: Bearer abc1234exampleKey" \
    -H "database-id-hash: 35f5c5b139a6b569d4649b788c1851831eb44d8e32b716b8411ec6431af8121d" \
    -H "Content-Type: application/json" \
    -d '{
      "id": "agent-123",
      "displayName": "Agent 123 updated",
      "prompt": "Updated prompt text"
    }'
  ```

- **Example TypeScript (axios)**:
  ```ts
  import axios from "axios";

  async function createOrUpdateAgent(agentData: any) {
    const response = await axios.put("https://app.openagentsbuilder.com/api/agent", agentData, {
      headers: {
        "Authorization": "Bearer abc1234exampleKey",
        "database-id-hash": "35f5c5b139a6b569d4649b788c1851831eb44d8e32b716b8411ec6431af8121d",
        "Content-Type": "application/json"
      }
    });
    console.log("Operation successful. Returned data:", response.data);
  }

  // Usage example:
  createOrUpdateAgent({
    "id": "agent-XYZ",
    "displayName": "Updated Agent",
    "prompt": "New prompt"
  });
  ```

- **Successful Response** (HTTP `200`):
  ```json
  {
    "message": "Data saved successfully!",
    "data": {
      "id": "agent-123",
      "displayName": "Agent 123 updated",
      "prompt": "Updated prompt text",
      "options": null,
      "expectedResult": null,
      "safetyRules": null,
      "published": null,
      "events": null,
      "tools": null,
      "status": null,
      "locale": null,
      "agentType": null,
      "createdAt": "2025-03-20T12:45:01.000Z",
      "updatedAt": "2025-03-20T12:46:22.000Z",
      "...": "..."
    },
    "status": 200
  }
  ```

- **Validation Error** (HTTP `400`):
  ```json
  {
    "message": "Validation failed: displayName is required",
    "issues": [
      {
        "code": "too_small",
        "minimum": 1,
        "type": "string",
        "inclusive": true,
        "path": ["displayName"],
        "message": "String must contain at least 1 character(s)"
      }
    ],
    "status": 400
  }
  ```

---

### **4.2 `/api/agent/[id]`**

#### **4.2.1 DELETE** `/api/agent/{id}`

- **Description**:  
  Deletes the specified **Agent** record *and* automatically **removes** any associated:
  - **Results** (`resultRepo.delete({ agentId: <id> })`)
  - **Sessions** (`sessionRepo.delete({ agentId: <id> })`)
  - **Calendar events** (`calendarRepo.delete({ agentId: <id> })`)

  If the `id` is missing or invalid in the URL, a `400` is returned.  

- **Example cURL**:
  ```bash
  curl -X DELETE \
    https://app.openagentsbuilder.com/api/agent/agent-123 \
    -H "Authorization: Bearer abc1234exampleKey" \
    -H "database-id-hash: 35f5c5b139a6b569d4649b788c1851831eb44d8e32b716b8411ec6431af8121d"
  ```

- **Example TypeScript (fetch)**:
  ```ts
  async function deleteAgent(agentId: string) {
    const response = await fetch(`https://app.openagentsbuilder.com/api/agent/${agentId}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer abc1234exampleKey",
        "database-id-hash": "35f5c5b139a6b569d4649b788c1851831eb44d8e32b716b8411ec6431af8121d"
      }
    });

    const result = await response.json();
    console.log("Delete result:", result);
  }

  // Usage example:
  deleteAgent("agent-123");
  ```

- **Successful Response** (HTTP `200`):
  ```json
  {
    "message": "Data deleted successfully!",
    "status": 200
  }
  ```
  
  If the agent was found and deleted, you’ll see `"status": 200`.  

- **Not Found / Nothing Deleted** (HTTP `400`):
  ```json
  {
    "message": "Data not found!",
    "status": 400
  }
  ```
  This can happen if the agent does not exist.  

- **Missing ID** (HTTP `400`):
  ```json
  {
    "message": "Invalid request, no id provided within request url",
    "status": 400
  }
  ```

---

## **5. Error Handling**

Common error responses and their meanings:

- **400 Bad Request**  
  - Validation failed, missing or invalid request parameters, or agent not found when trying to delete.

- **403 Forbidden**  
  - For SaaS usage, you might hit usage quotas (if integrated) and be disallowed from creating more agents.

- **500 Internal Server Error**  
  - Server-side exceptions (database errors, internal logic failures, etc.).

In any error scenario, the response body generally includes:
```json
{
  "message": "<description>",
  "error": { ... },       // Optional, with error details
  "status": <numericCode>
}
```

---

## **6. Notes & Additional Info**

- **`database-id-hash`** is a unique identifier for your user database.  
- The code snippet under the hood also performs an **audit log** for create, update, or delete. This is not directly visible in normal operations but ensures record-keeping in the background.
- When deleting an agent, any associated records in other tables (`results`, `sessions`, `calendar events`) are also removed—this ensures data consistency.
- If you are using the **SaaS mode** with usage limits, certain actions (like creating new agents) might be restricted if you exceed your quota.

---

## **7. Summary of Endpoints**

1. **GET** `/api/agent`  
   - Get all agents (optionally filter with query parameters).  

2. **PUT** `/api/agent`  
   - Create a new agent (no `id`) or update an existing agent (with `id`).  

3. **DELETE** `/api/agent/[id]`  
   - Delete a specific agent by its `id`. Also cascades to related `Result`, `Session`, and `Calendar` records.  

