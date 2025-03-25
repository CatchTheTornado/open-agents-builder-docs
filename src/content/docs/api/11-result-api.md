---
title: Result Management API
description: How to create, delete, and filter results through the API
---

Below is the **REST API documentation** for managing **Result** data in your application. The **Result** entity stores user-generated outputs from a session or agent, and may contain encrypted fields (e.g., `userName`, `userEmail`, `content`).  

---

> **Note**: A TypeScript API client and example usage are available here:  
> - [open-agents-builder-client](https://github.com/CatchTheTornado/open-agents-builder-client)  
> - [open-agents-builder-example](https://github.com/CatchTheTornado/open-agents-builder-example)

---

## **1. Overview**

The **Result** entity (based on the `resultDTOSchema`) stores session output data. Relevant endpoints allow you to:

1. **List** all results (globally or per agent).  
2. **Search/paginate** results.  
3. **Export** results to a ZIP archive.  
4. **Delete** specific results.  

Some fields (`userName`, `userEmail`, `content`) may be **encrypted** at the database level.

---

## **2. Data Schema & Fields**

From the `ResultDTO` definition:

```ts
export const resultDTOSchema = z.object({
  agentId: z.string().min(1),
  sessionId: z.string().min(1),
  userName: z.string().optional().nullable(),
  userEmail: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  format: z.string().optional().nullable(),
  createdAt: z.string().default(() => getCurrentTS()),
  updatedAt: z.string().default(() => getCurrentTS()),
  finalizedAt: z.string().optional().nullable(),
});
export type ResultDTO = z.infer<typeof resultDTOSchema>;
```

- **`agentId`**: String reference to the agent’s ID.  
- **`sessionId`**: String reference to the session.  
- **`userName`** & **`userEmail`**: User-provided info, often encrypted in the database.  
- **`content`**: The session’s output or result text.  
- **`format`**: A descriptor such as `markdown`, `json`, etc.  
- **`createdAt`** & **`updatedAt`**: Default to the current timestamp.  
- **`finalizedAt`**: Optional. If set, indicates no further modifications are expected.

---

## **3. Endpoints**

### **3.1 `GET /api/result`**

- **Description**:  
  Returns **all** results across all agents and sessions, optionally filtered by query parameters (e.g., `sessionId`, `agentId`, etc.).
- **Example cURL**:
  ```bash
  curl -X GET \
    "https://app.openagentsbuilder.com/api/result?sessionId=session-123" \
    -H "Authorization: Bearer <YOUR_API_KEY>" \
    -H "database-id-hash: <YOUR_DATABASE_ID_HASH>"
  ```
- **Successful Response** (HTTP `200`):
  ```json
  [
    {
      "agentId": "agent-123",
      "sessionId": "session-123",
      "userName": "Alice",
      "userEmail": "[email protected]",
      "content": "Some result content",
      "format": "markdown",
      "createdAt": "2025-03-21T10:00:00.000Z",
      "updatedAt": "2025-03-21T11:00:00.000Z",
      "finalizedAt": null
    },
    ...
  ]
  ```

- **Error Response** (e.g., 499, 500):  
  ```json
  {
    "message": "Internal server error",
    "status": 499
  }
  ```

#### Using the TypeScript Client
```ts
import { OpenAgentsBuilderClient } from "open-agents-builder-client";

const client = new OpenAgentsBuilderClient({
  databaseIdHash: "YOUR_DATABASE_ID_HASH",
  apiKey: "YOUR_API_KEY"
});

async function listAllResults() {
  const results = await client.result.listResults({ sessionId: "session-123" });
  console.log("Results:", results);
}
```

---

### **3.2 `DELETE /api/result/[id]`**

- **Description**:  
  Deletes a specific **Result** by `sessionId`. The `[id]` in the URL is interpreted as `sessionId`.
- **Example cURL**:
  ```bash
  curl -X DELETE \
    "https://app.openagentsbuilder.com/api/result/mySession123" \
    -H "Authorization: Bearer <YOUR_API_KEY>" \
    -H "database-id-hash: <YOUR_DATABASE_ID_HASH>"
  ```
- **Successful Response** (HTTP `200`):
  ```json
  {
    "message": "Data deleted successfully!",
    "status": 200
  }
  ```
- **Failure** (HTTP `400`):
  ```json
  {
    "message": "Data not found!",
    "status": 400
  }
  ```

  Or, if `[id]` is missing or invalid:
  ```json
  {
    "message": "Invalid request, no id provided within request url",
    "status": 400
  }
  ```


#### Using the TypeScript Client
```ts
async function deleteResult(sessionId: string) {
  await client.result.deleteResult(sessionId);
  console.log(`Result for session ${sessionId} was deleted.`);
}
```

---

### **3.3 `GET /api/agent/[id]/result`**

- **Description**:  
  Lists **paginated** results for the agent identified by `[id]`.  
  Accepts query params:
  - **`limit`** (e.g., `10`)  
  - **`offset`** (e.g., `0`)  
  - **`orderBy`** (`"userName"`, `"userEmail"`, `"createdAt"`, `"updatedAt"`, default: `"createdAt"`)  
  - **`query`** (partial string search in `userEmail`, `userName`, or `sessionId`)
- **Example cURL**:
  ```bash
  curl -X GET \
    "https://app.openagentsbuilder.com/api/agent/agent-123/result?limit=10&offset=0&orderBy=userName&query=alice" \
    -H "Authorization: Bearer <YOUR_API_KEY>" \
    -H "database-id-hash: <YOUR_DATABASE_ID_HASH>"
  ```
- **Successful Response** (HTTP `200`, paginated):
  ```json
  {
    "rows": [
      {
        "agentId": "agent-123",
        "sessionId": "session-001",
        "userName": "Alice",
        "userEmail": "[email protected]",
        "content": "Result content",
        "format": "markdown",
        "createdAt": "2025-03-21T10:00:00.000Z",
        "updatedAt": "2025-03-21T11:00:00.000Z",
        "finalizedAt": null
      },
      ...
    ],
    "total": 37,
    "limit": 10,
    "offset": 0,
    "orderBy": "userName",
    "query": "alice"
  }
  ```

  - **`rows`** is an array of `ResultDTO` objects.  
  - **`total`** is the total matches for the query.  
  - **`limit`**, **`offset`**, **`orderBy`**, **`query`** are echoed back for reference.


#### Using the TypeScript Client
```ts
async function listResultsForAgent(agentId: string) {
  // There's currently no specialized method for this route in the client,
  // but you can call it by passing custom query params to `listResults`.
  // If needed, you can add a new method to the ResultApi class for more direct usage.
  const results = await client.result.listResults({
    agentId, limit: 10, offset: 0, orderBy: "userName", query: "alice"
  });
  console.log(`Paginated results for agent ${agentId}:`, results);
}
```

> You may need to extend the client or call `fetch` directly if you want the exact paginated format (`rows`, `total`, etc.) returned by `GET /api/agent/[id]/result`. By default, `listResults` calls `/api/result`, so partial adaptation might be required.

---

### **3.4 `GET /api/agent/[id]/result/export`**

- **Description**:  
  Exports **all** results (currently from *all* agents, though the code snippet also references `[id]`; you might adapt it) into a **.zip** archive with multiple files.  
  Each result is saved in a different format (`.md`, `.json`, `.html`) depending on its `format` field.  
  Also creates an `index.md`, `index.html`, and `results.json` inside the ZIP.  

- **Notes**:
  1. Uses **`JSZip`** to package files in-memory.  
  2. If a result has `format: "markdown"`, we also produce a `.md` file and an `.html` version (converted by `showdown`).  
  3. If a result has `format: "json"`, we produce `.json` and `.html` (converted by `json2html`).  
  4. Filenames are generated from a sanitized combination of `createdAt` + `sessionId`.  
  5. The route triggers an **audit log** with `eventName: 'exportResults'`.  
- **Example cURL**:
  ```bash
  curl -X GET \
    "https://app.openagentsbuilder.com/api/agent/agent-123/result/export" \
    -H "Authorization: Bearer <YOUR_API_KEY>" \
    -H "database-id-hash: <YOUR_DATABASE_ID_HASH>" \
    -o result-export.zip
  ```
- **Success Response** (HTTP 200):  
  - Returns a `.zip` file.  
  - The `Content-Type` is `application/zip`.  
  - The response body is binary data.  

#### Using the TypeScript Client
Currently, the `result` sub-client doesn’t implement a dedicated `export` method for handling ZIP responses. You can:
1. Extend the **ResultApi** to include a `exportResults` method.  
2. Use a direct `fetch` approach for the ZIP download.

**Example** (extending the client):

```ts
import { BaseClient } from "open-agents-builder-client";

class ExtendedResultApi extends BaseClient {
  public async exportResults(agentId: string): Promise<Blob> {
    const resp = await fetch(`${this.baseUrl}/api/agent/${agentId}/result/export`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "database-id-hash": this.databaseIdHash
      }
    });
    if (!resp.ok) {
      throw new Error(`Error exporting results: ${resp.statusText}`);
    }
    return resp.blob();
  }
}

// Usage in your code:
const extendedResultApi = new ExtendedResultApi({
  databaseIdHash: "YOUR_DATABASE_ID_HASH",
  apiKey: "YOUR_API_KEY"
});

async function exportResultsForAgent(agentId: string) {
  const zipBlob = await extendedResultApi.exportResults(agentId);
  // Now handle the Blob (e.g., save to local filesystem in an Electron app, or upload elsewhere, etc.)
}
```





---

## **4. Encryption Details**

- Fields like `userName`, `userEmail`, and `content` are encrypted at rest using your storage key if provided in the server context.
- You send **plaintext** to the server, which encrypts it before storing.  
- When you fetch a result, the server decrypts it and returns plaintext.
- This ensures data at rest is securely encrypted.

---

## **5. Common Workflows**

1. **List all results**: `GET /api/result`  
2. **Filter by session or agent**: `GET /api/result?sessionId=...&agentId=...`  
3. **Paginated listing** for a specific agent: `GET /api/agent/[id]/result?limit=...&offset=...`  
4. **Export** all results for an agent: `GET /api/agent/[id]/result/export`  
5. **Delete** a result by session ID: `DELETE /api/result/[sessionId]`  

---

## **6. Example Calls**

### 6.1 Listing All Results
```bash
curl -X GET \
  "https://app.openagentsbuilder.com/api/result" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>"
```
Returns `[ ResultDTO, ... ]`.

#### Using the TypeScript Client
```ts
const allResults = await client.result.listResults();
console.log("All results:", allResults);
```

### 6.2 Deleting a Single Result
```bash
curl -X DELETE \
  "https://app.openagentsbuilder.com/api/result/session-001" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>"
```
Returns `{ "message": "Data deleted successfully!", "status": 200 }` if found.

#### Using the TypeScript Client
```ts
await client.result.deleteResult("session-001");
console.log("Result with session-001 deleted");
```

### 6.3 Exporting Results (ZIP)
```bash
curl -X GET \
  "https://app.openagentsbuilder.com/api/agent/agent-ABC/result/export" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>" \
  -o agentABC-results.zip
```
Downloadable `.zip`.

---

## **7. Error Handling**

- **400 Bad Request**: Missing or invalid parameters (e.g., invalid `[id]`).  
- **401/403 Unauthorized/Forbidden**: Invalid or missing credentials/headers.  
- **499/500 Internal Error**: Server issues (encryption/decryption failures, DB errors, etc.).

Each error typically includes a JSON body with a `message` and `status`.

---

## **8. Summary**

**Result** records store user-submitted data (`content`) from sessions (`sessionId`) and reference a specific agent (`agentId`). You can:

- **List** results (`GET /api/result` or `GET /api/agent/[id]/result`).  
- **Filter** by query parameters (`sessionId`, `userEmail`, etc.).  
- **Export** them to a `.zip` (`GET /api/agent/[id]/result/export`).  
- **Delete** a result by session ID (`DELETE /api/result/[sessionId]`).  

Sensitive fields (`userName`, `userEmail`, `content`) are encrypted at rest. If you have additional requirements—like custom search parameters or file uploads—you can extend the existing endpoints or the official **open-agents-builder-client** TypeScript library accordingly.