---
title: Session Management API
description: How to create, delete and filter results thru API
---


Below is a **REST API documentation** for managing **Session** data in your application. The **Session** entity references a single conversation or session with a specific agent (and optionally includes user name/email).  

---

> **Note**: There is an API client plus example available on: [https://github.com/CatchTheTornado/open-agents-builder-client](https://github.com/CatchTheTornado/open-agents-builder-client) and [https://github.com/CatchTheTornado/open-agents-builder-example](https://github.com/CatchTheTornado/open-agents-builder-example)

---

## 1. Overview

The **Session** endpoints let you:

- **List** all sessions (with optional filters).  
- **Create** a session or **retrieve an existing** one by ID (via `/api/exec/session/[id]`).  
- **Delete** a session by ID.  

By default, certain fields (`userName`, `userEmail`, `messages`) may be **encrypted** at rest if a `storageKey` is provided. The server automatically encrypts/decrypts these fields.

---

## 2. Data Schema (SessionDTO)

From `sessionDTOSchema` in `src/data/dto.ts`:

```ts
export const sessionDTOSchema = z.object({
  id: z.string().min(1),          // A unique session identifier
  agentId: z.string().min(1),     // The agent to which this session belongs
  userName: z.string().optional().nullable(),
  userEmail: z.string().optional().nullable(),
  acceptTerms: z.string().optional().nullable(),
  messages: z.string().optional().nullable(),   // JSON-serialized chat data
  promptTokens: z.number().optional().nullable(),
  completionTokens: z.number().optional().nullable(),
  createdAt: z.string().default(() => getCurrentTS()),
  updatedAt: z.string().default(() => getCurrentTS()),
  finalizedAt: z.string().optional().nullable(),
});
export type SessionDTO = z.infer<typeof sessionDTOSchema>;
```

**Key Fields**:

- **`id`**: The session’s primary key (string).  
- **`agentId`**: Ties this session to a specific agent.  
- **`userName`**, **`userEmail`**: Potentially sensitive data, often encrypted.  
- **`messages`**: A JSON string representing chat messages or conversation steps.  
- **`promptTokens`**, **`completionTokens`**: Keep track of usage for LLM tokens.  
- **`acceptTerms`**: If user accepted terms of use.  
- **`createdAt`** & **`updatedAt`**: Timestamps.  
- **`finalizedAt`**: If set, indicates session is no longer active.

---

## 3. Endpoints

### 3.1 `GET /api/session`

- **Description**  
  Returns **all sessions**, optionally filtered by query parameters:
  - `id`: filter by session ID  
  - `agentId`: filter by specific agent.  

  Internally uses `genericGET<SessionDTO>` and `ServerSessionRepository.findAll()`.

- **cURL Example**:
  ```bash
  curl -X GET \
    "https://app.openagentsbuilder.com/api/session?agentId=agent-123" \
    -H "Authorization: Bearer <YOUR_API_KEY>" \
    -H "database-id-hash: <YOUR_DATABASE_ID_HASH>"
  ```

- **Success Response** (HTTP 200):
  ```json
  [
    {
      "id": "session-001",
      "agentId": "agent-123",
      "userName": "Alice",
      "userEmail": "[email protected]",
      "acceptTerms": "true",
      "messages": "[{\"role\":\"user\",\"content\":\"Hello\"}]",
      "promptTokens": 34,
      "completionTokens": 76,
      "createdAt": "2025-03-21T10:00:00.000Z",
      "updatedAt": "2025-03-21T10:05:00.000Z",
      "finalizedAt": null
    },
    ...
  ]
  ```
  Each session is a decrypted `SessionDTO`.  

- **Error Response** (e.g., 499 or 500):
  ```json
  {
    "message": "Server error details",
    "status": 499
  }
  ```

---

### 3.2 `DELETE /api/session/[id]`

- **Description**  
  Deletes the session record whose **`id`** matches `[id]`.  
  Also logs an audit entry (`eventName: 'deleteSession'`).

- **cURL Example**:
  ```bash
  curl -X DELETE \
    "https://app.openagentsbuilder.com/api/session/session-001" \
    -H "Authorization: Bearer <YOUR_API_KEY>" \
    -H "database-id-hash: <YOUR_DATABASE_ID_HASH>"
  ```

- **Success Response** (HTTP 200) if found and deleted:
  ```json
  {
    "message": "Data deleted successfully!",
    "status": 200
  }
  ```

- **Not Found** (HTTP 400 if no record is deleted):
  ```json
  {
    "message": "Data not found!",
    "status": 400
  }
  ```

- **Missing ID** (HTTP 400 if `[id]` is invalid):
  ```json
  {
    "message": "Invalid request, no id provided within request url",
    "status": 400
  }
  ```

---

### 3.3 `POST /api/exec/session/[id]`

- **Description**  
  This endpoint is slightly different. It **creates** a new session (with the provided `id`), or **returns** an existing session if it’s already present.  

- **Request Body**:  
  ```json
  {
    "agentId": "agent-123",
    "userName": "Alice",
    "userEmail": "[email protected]",
    "acceptTerms": "true"
  }
  ```
  - **`agentId`**: Required  
  - **`userName`** & **`userEmail`**: Required in this example.  
  - **`acceptTerms`**: A string that can be `"true"` or `"false"`.  

- **Behavior**:  
  1. If a session with `[id]` already exists, return:
     ```json
     { "message": "Session already exists", "data": { "id": "session-XYZ" } }
     ```
  2. If it does **not** exist, create it (encrypting `userName`, `userEmail` if `storageKey` is set) and return:
     ```json
     { "message": "Session created", "data": { "id": "session-XYZ" }, "status": 200 }
     ```

- **cURL Example**:
  ```bash
  curl -X POST \
    "https://app.openagentsbuilder.com/api/exec/session/session-XYZ" \
    -H "Authorization: Bearer <YOUR_API_KEY>" \
    -H "database-id-hash: <YOUR_DATABASE_ID_HASH>" \
    -H "Content-Type: application/json" \
    -d '{
      "agentId": "agent-123",
      "userName": "Alice",
      "userEmail": "[email protected]",
      "acceptTerms": "true"
    }'
  ```

- **Success** (200 OK):
  ```json
  {
    "message": "Session created",
    "data": { "id": "session-XYZ" },
    "status": 200
  }
  ```
  Or if it already exists:
  ```json
  {
    "message": "Session already exists",
    "data": { "id": "session-XYZ" }
  }
  ```

- **Error** (400 if required fields missing):
  ```json
  {
    "message": "Invalid request, missing required fields",
    "status": 400
  }
  ```
  or if `[id]` is missing in the URL.

---

## 4. Encryption Details

In `ServerSessionRepository`, the fields `userName`, `userEmail`, and `messages` are automatically encrypted/decrypted:

```ts
if (this.encUtils) {
  if (item.userName) item.userName = await this.encUtils.encrypt(item.userName);
  if (item.userEmail) item.userEmail = await this.encUtils.encrypt(item.userEmail);
  if (item.messages) item.messages = await this.encUtils.encrypt(item.messages);
}
```

- **Database** will store ciphertext for these fields if a `storageKey` is set.  
- **Responses** return the fields decrypted.

---

## 5. Searching & Pagination for Sessions

You may see a `queryAll(agentId, { limit, offset, orderBy, query })` method in `ServerSessionRepository`. If you want to expose a **paginated** endpoint (similar to how `Agent` or `Result` endpoints do it), you can create a route such as:

```
GET /api/agent/[agentId]/session?limit=10&offset=0&orderBy=updatedAt&query=alice
```

- **`limit`** & **`offset`**: numeric pagination.  
- **`orderBy`**: can be `userName`, `userEmail`, `createdAt`, or `updatedAt`. Defaults to `updatedAt` descending.  
- **`query`**: partial match for (encrypted) `userEmail`, `userName`, or session `id`.  

Such an endpoint would return a structure:

```json
{
  "rows": [
    { ... SessionDTO ... },
    ...
  ],
  "total": 25,
  "limit": 10,
  "offset": 0,
  "orderBy": "updatedAt",
  "query": "alice"
}
```

*(Implementation details vary depending on how you set up the route.)*

---

## 6. Typical Use Cases

1. **User starts a new conversation** – A front-end calls `POST /api/exec/session/[sessionId]` with user details and an agent ID.  
2. **List all sessions** – A back-end or admin panel calls `GET /api/session`, optionally filtering by `agentId`.  
3. **Delete a session** – Admin or system calls `DELETE /api/session/[sessionId]` if it’s no longer needed.  
4. **View session data** – The system or admin might retrieve sessions or decrypt messages for analysis.

---

## 7. Error Handling

- **400 Bad Request**: Missing or invalid parameters, e.g., `[id]` not provided, or required fields absent.  
- **499 / 500**: Internal server or encryption errors, or unexpected conditions.  
- **401 / 403**: If authorization or `database-id-hash` headers are incorrect or missing.  

Error responses typically have a JSON body with a `"message"` and `"status"`.

---

## 8. Summary

- **`GET /api/session`**: Retrieve all sessions (filter with `agentId`, `id`).  
- **`DELETE /api/session/[id]`**: Remove a session by ID.  
- **`POST /api/exec/session/[id]`**: Create a new session (if none exists) or return an existing one.  
- **Encryption**: `userName`, `userEmail`, `messages` can be stored encrypted if a `storageKey` is provided.  
- **Auditing**: Deletion triggers an `auditLog` entry.  

This covers the main endpoints and usage patterns for **Session** data. If you want paginated queries per agent, you can extend the logic with `queryAll()`, similarly to the `Agent` or `Result` endpoints.