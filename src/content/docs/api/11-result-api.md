---
title: Result Management API
description: How to create, delete and filter results thru API
---

Below is a **REST API documentation** for managing **Result** data in your application. The **Result** entity references user-generated output from a Session or Agent and may contain encrypted fields (e.g., `userName`, `userEmail`, `content`).  

---

## 1. Overview

The **Result** entity (based on the `resultDTOSchema`) stores output data associated with agents and sessions. The relevant endpoints let you:

1. **List all results** (globally or per agent).  
2. **Search/paginate** results.  
3. **Export** results to a ZIP archive.  
4. **Delete** specific results.  

Some endpoints also perform **encryption/decryption** at the database level for sensitive fields (`userName`, `userEmail`, `content`).

---

## 2. Data Schema & Fields

From the `ResultDTO` definition (`src/data/dto.ts`):

```ts
export const resultDTOSchema = z.object({
  agentId: z.string().min(1),
  sessionId: z.string().min(1),         // The session to which the result belongs
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

- **`agentId`**: String reference to an Agent’s ID.  
- **`sessionId`**: String reference to the Session.  
- **`userName`** & **`userEmail`**: Potentially sensitive user info (often encrypted).  
- **`content`**: The actual text or output from the session.  
- **`format`**: e.g., `markdown`, `json`, or any textual descriptor.  
- **`createdAt`** & **`updatedAt`**: Timestamps (default to current time).  
- **`finalizedAt`**: Optional. If set, indicates no further modifications.

---

## 3. Endpoints

### 3.1 **`GET /api/result`**

- **Description**:  
  Returns **all** results across all agents/sessions, optionally filtered by query parameters (e.g., `sessionId`, `agentId`, etc.).  
  Internally calls `genericGET<ResultDTO>` with a `ServerResultRepository`.

- **Example**:
  ```bash
  curl -X GET \
    "https://your-domain.com/api/result?sessionId=session-123" \
    -H "Authorization: Bearer <YOUR_API_KEY>" \
    -H "database-id-hash: <YOUR_DATABASE_ID_HASH>"
  ```

- **Success Response** (HTTP 200):  
  Returns an array of `ResultDTO`:
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

---

### 3.2 **`DELETE /api/result/[id]`**

- **Description**:  
  Deletes a specific **Result** based on a **`sessionId`** matching `[id]`.  
  The code references `genericDELETE()` with `{ sessionId: recordLocator }`, so `[id]` is treated as the `sessionId`.  

- **Example**:
  ```bash
  curl -X DELETE \
    "https://your-domain.com/api/result/mySession123" \
    -H "Authorization: Bearer <YOUR_API_KEY>" \
    -H "database-id-hash: <YOUR_DATABASE_ID_HASH>"
  ```

- **Success Response** (HTTP 200) if deleted:
  ```json
  {
    "message": "Data deleted successfully!",
    "status": 200
  }
  ```

- **Failure** (HTTP 400, if no match):
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

---

### 3.3 **`GET /api/agent/[id]/result`**

- **Description**:  
  Returns **paginated** results for a specific agent identified by `[id]`.  
  Accepts query params:
  - **`limit`** (integer)  
  - **`offset`** (integer)  
  - **`orderBy`** (defaults to `"createdAt"`; can be `"userName"`, `"userEmail"`, `"createdAt"`, or `"updatedAt"`).  
  - **`query`** (string; partial search across `userEmail`, `userName`, or `sessionId`).  

- **Example**:
  ```bash
  curl -X GET \
    "https://your-domain.com/api/agent/agent-123/result?limit=10&offset=0&orderBy=userName&query=alice" \
    -H "Authorization: Bearer <YOUR_API_KEY>" \
    -H "database-id-hash: <YOUR_DATABASE_ID_HASH>"
  ```
  
- **Success Response** (HTTP 200) in a **paginated** format:
  ```json
  {
    "rows": [
      {
        "agentId": "agent-123",
        "sessionId": "session-001",
        "userName": "Alice",
        "userEmail": "[email protected]",
        "content": "Result content for agent 123",
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

---

### 3.4 **`GET /api/agent/[id]/result/export`**

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

- **Example**:
  ```bash
  curl -X GET \
    "https://your-domain.com/api/agent/agent-123/result/export" \
    -H "Authorization: Bearer <YOUR_API_KEY>" \
    -H "database-id-hash: <YOUR_DATABASE_ID_HASH>"
  ```

- **Success Response** (HTTP 200):  
  - Returns a `.zip` file.  
  - The `Content-Type` is `application/zip`.  
  - The response body is binary data.  

- **Usage**:
  - Save the response to a file, e.g.:  
    ```bash
    curl -X GET \
      "https://your-domain.com/api/agent/agent-123/result/export" \
      -H "Authorization: Bearer <YOUR_API_KEY>" \
      -H "database-id-hash: <YOUR_DATABASE_ID_HASH>" \
      -o results-export.zip
    ```

---

## 4. Encryption Details

In `ServerResultRepository`, certain fields (`userName`, `userEmail`, `content`) are **encrypted** with a storage key if present:
```ts
async encryptItem(item: ResultDTO): Promise<ResultDTO> {
  if (this.encUtils) {
    if (item.userName) item.userName = await this.encUtils.encrypt(item.userName);
    if (item.userEmail) item.userEmail = await this.encUtils.encrypt(item.userEmail);
    if (item.content) item.content = await this.encUtils.encrypt(item.content);
  }
  return item;
}
```

Similarly, data is **decrypted** when reading it from the DB. This means:

- **Clients** need to send plaintext for `userName`, `userEmail`, or `content`.  
- **Storage** is encrypted automatically.  
- **Response** from the endpoints is decrypted back to plaintext.  

If you see gibberish or random strings in the DB, that’s expected (ciphertext). The REST endpoints return human-readable plaintext (assuming your request is properly authorized and the server has the correct key).

---

## 5. Common Workflows

### 5.1 Listing All Results

**`GET /api/result`** without parameters:

```bash
curl -X GET \
  "https://your-domain.com/api/result" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>"
```

**Response**: `[ ResultDTO, ... ]`

### 5.2 Listing Results for One Agent, With Pagination

**`GET /api/agent/[id]/result?limit=10&offset=0&orderBy=updatedAt&query=john`**:

- Returns up to 10 results matching `john` in either `userEmail`, `userName`, or `sessionId`.
- Sorted by `updatedAt` descending.

### 5.3 Exporting Results

**`GET /api/agent/[id]/result/export`**:

- Downloads a **`result-export.zip`** file containing `.md`, `.html`, `.json` versions of each result.

### 5.4 Deleting a Single Result

**`DELETE /api/result/[id]`**:

- `[id]` is interpreted as the `sessionId`.
- The record is removed from the `results` table if found.

---

## 6. Example Requests and Responses

### 6.1 cURL Example: Retrieve Paginated Results for an Agent

```bash
curl -X GET \
  "https://your-domain.com/api/agent/agent-ABC/result?limit=5&offset=0&orderBy=userName&query=al" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>"
```

**Possible Response** (200 OK):
```json
{
  "rows": [
    {
      "agentId": "agent-ABC",
      "sessionId": "session-001",
      "userName": "Alice",
      "userEmail": "[email protected]",
      "content": "...",
      "format": "markdown",
      "createdAt": "2025-03-21T10:00:00.000Z",
      "updatedAt": "2025-03-21T11:00:00.000Z",
      "finalizedAt": null
    },
    ...
  ],
  "total": 13,
  "limit": 5,
  "offset": 0,
  "orderBy": "userName",
  "query": "al"
}
```

### 6.2 cURL Example: Delete a Result

```bash
curl -X DELETE \
  "https://your-domain.com/api/result/session-001" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>"
```

**Response** (200 OK, if found and deleted):
```json
{
  "message": "Data deleted successfully!",
  "status": 200
}
```
Otherwise, 400 with `"Data not found!"`.

### 6.3 cURL Example: Export Results

```bash
curl -X GET \
  "https://your-domain.com/api/agent/agent-ABC/result/export" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>" \
  -o my-results.zip
```

Downloadable `.zip` (use `-o` to save the file).

---

## 7. Error Handling

- **400 Bad Request**: Missing or invalid parameters (e.g., invalid `[id]`, or the data you want to delete doesn’t exist).  
- **499** or **500**: Internal issues (server errors, encryption failures, etc.).  
- **401** or **403**: If the request is unauthorized (invalid token or missing `database-id-hash`).  

Each error typically includes a JSON body with a `message` field describing the issue.

---

## 8. Summary

**Result** records are stored in `results` and typically reference an `agentId` and `sessionId`. You can:

1. **List all** (`GET /api/result`) or **list for a specific agent** (`GET /api/agent/[id]/result`).  
2. **Search** with `limit`, `offset`, `query`, `orderBy`.  
3. **Export** to a `.zip` with `GET /api/agent/[id]/result/export`.  
4. **Delete** a result by `sessionId` with `DELETE /api/result/[id]`.  

Sensitive fields (`userName`, `userEmail`, `content`) may be encrypted in the database. The repository automatically handles encryption/decryption. You see plaintext in the JSON responses if you have a valid key.  

This covers all relevant endpoints and usage patterns for the **Result** entity. If you have additional questions or need advanced filtering, refer to the code in **`ServerResultRepository`** or the generic API helpers (`genericGET`, `genericDELETE`, etc.).