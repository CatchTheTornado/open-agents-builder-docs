---
title: Audit log API
description: How to list and manage audit logs
---

Below is a **REST API documentation** for **Audit Logs**, covering:

1. **Data schema** (`AuditDTO`)  
2. **Endpoints** (GET and PUT)  
3. **Usage** (with cURL and TypeScript examples)  
4. **Encryption Details** (optional end-to-end encryption)  
5. **Partitions** (how logs are divided daily/monthly)  

All examples assume a base URL of **`https://app.openagentsbuilder.com`**.

---

## 1. Overview

Audit logs capture **changes** or **events** in your system, such as:  
- Who changed what data  
- Timestamps, IP addresses, user agent  
- Diffs of before/after changes  

**Key Capabilities**:

- **Save** (PUT `/api/audit`) a new log entry.  
- **List** (GET `/api/audit`) existing audit logs, optionally referencing different *partitions* (e.g., monthly groupings).  
- **Encryption**: The `diff` field can be encrypted if a `storageKey` is configured.

---

## 2. Data Schema: `AuditDTO`

From `auditDTOSchema`:

```ts
export const auditDTOSchema = z.object({
  id: z.number().positive().int().optional(),
  ip: z.string().optional(),
  ua: z.string().optional(),
  keyLocatorHash: z.string().optional(),
  databaseIdHash: z.string().optional(),
  recordLocator: z.string().optional(),
  diff: z.string().optional(),
  eventName: z.string().optional(),
  createdAt: z.string().default(() => getCurrentTS()).optional(),
});
export type AuditDTO = z.infer<typeof auditDTOSchema>;
```

**Key fields**:

- **`id`**: Numeric primary key (auto-increment).  
- **`ip`** & **`ua`**: IP address & user agent.  
- **`diff`**: JSON describing changes (often encrypted).  
- **`eventName`**: Name of the event, e.g. `"createAgent"`.  
- **`recordLocator`**: JSON referencing which record was affected, e.g. `{"id": "agent-123"}`.  
- **`createdAt`**: Timestamp.

---

## 3. Endpoints

### 3.1 `PUT /api/audit`

#### 3.1.1 Description

Saves a new audit log entry to the database. The server also may enrich it with IP, user agent, etc. (via `auditLog()` method).

#### 3.1.2 cURL Example

```bash
curl -X PUT \
  "https://app.openagentsbuilder.com/api/audit" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>" \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "updateUserProfile",
    "recordLocator": "{\"userId\": \"user-123\"}",
    "diff": "{\"old\": {\"name\": \"Alice\"}, \"new\": {\"name\": \"Alice Updated\"}}"
  }'
```

#### 3.1.3 TypeScript `fetch` Example

```ts
async function createAuditLog(auditLog: any) {
  const response = await fetch("https://app.openagentsbuilder.com/api/audit", {
    method: "PUT",
    headers: {
      "Authorization": "Bearer <YOUR_API_KEY>",
      "database-id-hash": "<YOUR_DATABASE_ID_HASH>",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(auditLog)
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(`Error creating audit log: ${result.message}`);
  }
  console.log("Created audit log:", result);
  return result;
}

// Usage example:
createAuditLog({
  eventName: "updateUserProfile",
  recordLocator: JSON.stringify({ userId: "user-123" }),
  diff: JSON.stringify({
    old: { name: "Alice" },
    new: { name: "Alice Updated" }
  })
}).catch(console.error);
```

#### 3.1.4 Example Response (HTTP 200)

```json
{
  "message": "Data saved successfully!",
  "data": {
    "id": 77,
    "eventName": "updateUserProfile",
    "recordLocator": "{\"userId\":\"user-123\"}",
    "diff": "ENCRYPTED_OR_PLAINTEXT_DIFF",
    "ip": "203.0.113.42",
    "ua": "Mozilla/5.0 ...",
    "databaseIdHash": "35f5c5b139a6b569d4649b7...",
    "createdAt": "2025-03-21T12:34:56.000Z"
  },
  "status": 200
}
```

---

### 3.2 `GET /api/audit`

#### 3.2.1 Description

Lists audit logs, defaulting to the **current** partition (e.g., monthly grouping). You can supply `?partition=YYYY-MM` to fetch older logs.

**The server** uses `genericGET<AuditDTO>` with a limit/offset approach under the hood. By default, it **limits** logs to 100. If you need pagination, pass `?limit=NN`.

#### 3.2.2 cURL Example

```bash
curl -X GET \
  "https://app.openagentsbuilder.com/api/audit?partition=2025-02&limit=50" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>"
```

#### 3.2.3 TypeScript `fetch` Example

```ts
async function listAuditLogs(partition: string, limit = 50) {
  const url = new URL("https://app.openagentsbuilder.com/api/audit");
  url.searchParams.set("partition", partition);
  url.searchParams.set("limit", limit.toString());

  const response = await fetch(url.toString(), {
    headers: {
      "Authorization": "Bearer <YOUR_API_KEY>",
      "database-id-hash": "<YOUR_DATABASE_ID_HASH>"
    }
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Error listing audit logs: ${data.message}`);
  }
  console.log("Audit logs:", data);
  return data;
}

// Usage:
listAuditLogs("2025-02").catch(console.error);
```

#### 3.2.4 Example Response (HTTP 200)

```json
[
  {
    "id": 75,
    "eventName": "createAgent",
    "recordLocator": "{\"id\":\"agent-XYZ\"}",
    "diff": "...",
    "databaseIdHash": "35f5c5b139a6b569d4...",
    "createdAt": "2025-02-15T09:12:00.000Z",
    "ip": "203.0.113.55",
    "ua": "Mozilla/5.0 (Macintosh; ...)",
    ...
  },
  {
    "id": 76,
    "eventName": "updateAgent",
    "diff": "ENCRYPTED_OR_PLAINTEXT_DIFF",
    "createdAt": "2025-02-15T09:13:22.000Z",
    ...
  }
]
```

---

## 4. Encryption Details

If a **SaaS** `storageKey` is configured, the **`diff`** field is **encrypted**. The log repository (`ServerAuditRepository`) automatically does:

1. **encryptItem**(AuditDTO) → encrypts `diff`.
2. **decryptItem**(AuditDTO) → decrypts `diff`.

Hence, the DB stores ciphertext, but this endpoint returns plaintext if the server has the correct key.

---

## 5. Partitioning Logs

Because **audit logs** can grow large, the system uses **partitions**:

- A partition name is typically `"YYYY-MM"` (the current year-month).
- The code picks a default partition based on **the current date** if none is specified.
- You can **override** by passing `?partition=YYYY-MM` to fetch older partitions.

Examples:

- **`GET /api/audit?partition=2025-02`** → fetch logs from February 2025 partition.  
- If not provided, it defaults to the current year and month.

---

## 6. Error Handling

- **400 Bad Request**: If your partition is invalid or if the input data fails validation.
- **401/403 Unauthorized**: If missing or invalid `Authorization` or `database-id-hash`.
- **500**: For internal server errors (DB or encryption issues).
- **499**: Generic server error code used in some places (like unexpected exceptions).

Typical error structure:

```json
{
  "message": "Error details",
  "status": 400
}
```

---

## 7. Summary of Audit Log Endpoints

| **Endpoint**                 | **Method** | **Purpose**                                     |
|-----------------------------|-----------|-------------------------------------------------|
| **`/api/audit?partition=`** | **GET**    | List audit logs for a given partition (`YYYY-MM`) or the current month by default. Supports `limit` query param. |
| **`/api/audit`**            | **PUT**    | Append a new audit log record (`AuditDTO`). The server also auto-populates IP, user agent, etc.                 |

**That’s it**. Now you can track every event or data change, optionally store diffs, and retrieve them by monthly partitions. If you have more advanced pagination or searching needs (e.g., filtering by eventName, date ranges, etc.), you can extend the code in the repository or implement custom endpoints.