---
title: Keys API
description: How to manage the Sharing keys
---

Below is a **comprehensive REST API documentation** for the **Keys** resource, now **including** an important note referencing the **key creation** logic from GitHub.

All examples assume the base URL **`https://app.openagentsbuilder.com`**.

---

> **Note**: There is an API client plus example available on: [https://github.com/CatchTheTornado/open-agents-builder-client](https://github.com/CatchTheTornado/open-agents-builder-client) and [https://github.com/CatchTheTornado/open-agents-builder-example](https://github.com/CatchTheTornado/open-agents-builder-example)

---

## 1. Overview

**Keys** typically store:

1. **`keyLocatorHash`**: A unique 64-char hash that identifies the key.  
2. **`keyHash`**: A 32+ char string representing a hashed form of the key.  
3. **`encryptedMasterKey`**: The actual key contents (encrypted).  
4. **`databaseIdHash`**: The database this key belongs to.  
5. **`acl``, `extra`**, and **`expiryDate`**: Additional metadata or permission details.

The system provides three main operations:

1. **`GET /api/keys`**: Lists or filters keys.  
2. **`PUT /api/keys`**: Creates or updates a key by `keyLocatorHash` (requires **owner** role).  
3. **`DELETE /api/keys/[key]`**: Deletes a key by `keyLocatorHash` (requires **owner** role).

---

## 2. Data Schema: `KeyDTO`

From `keyDTOSchema`:

```ts
export const keyDTOSchema = z.object({
  displayName: z.string().min(1),
  keyLocatorHash: z.string().min(64).max(64),
  keyHash: z.string().min(32),
  keyHashParams: z.string().min(1),
  databaseIdHash: z.string().min(64).max(64),
  encryptedMasterKey: z.string().min(1),
  acl: z.string().nullable().optional(),
  extra: z.string().nullable().optional(),
  expiryDate: z.string().nullable(),
  updatedAt: z.string().default(() => getCurrentTS()),
});
export type KeyDTO = z.infer<typeof keyDTOSchema>;
```

Key fields:
- **`keyLocatorHash`**: 64-char unique identifier (primary).  
- **`keyHash`**: A 32+ char hashed representation.  
- **`encryptedMasterKey`**: The encrypted key material.  
- **`databaseIdHash`**: A 64+ char reference to your database.  
- **`acl`**, **`extra`**, **`expiryDate`**: Additional or optional fields.  
- **`displayName`**: A friendly name.

---

## 3. Endpoints

### 3.1 GET `/api/keys`

#### 3.1.1 Description

Lists **all** keys for the **current** database, or can filter by:

- **`keyLocatorHash`**  
- **`keyHash`**  
- **`databaseIdHash`**

#### 3.1.2 cURL Example

```bash
curl -X GET \
  "https://app.openagentsbuilder.com/api/keys?databaseIdHash=35f5c5b139a6b5..." \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: 35f5c5b139a6b5..."
```

#### 3.1.3 TypeScript (fetch) Example

```ts
async function listKeys(databaseIdHash: string) {
  const response = await fetch(
    `https://app.openagentsbuilder.com/api/keys?databaseIdHash=${databaseIdHash}`,
    {
      headers: {
        "Authorization": "Bearer <YOUR_API_KEY>",
        "database-id-hash": databaseIdHash
      }
    }
  );
  if (!response.ok) {
    throw new Error(`Error listing keys: ${response.statusText}`);
  }
  return await response.json();
}

// Usage
listKeys("35f5c5b139a6b569d4649b7...")
  .then((data) => console.log("All keys:", data))
  .catch(console.error);
```

#### 3.1.4 Example Response (HTTP 200)

```json
[
  {
    "displayName": "My Key #1",
    "keyLocatorHash": "1122334455667788aaabbbcccdddeeefff0011223344556677aaabbbcccdddee",
    "keyHash": "abc1234def5678...",
    "databaseIdHash": "35f5c5b139a6b569d4649b7...",
    "encryptedMasterKey": "base64-or-other-encrypted-string",
    "acl": null,
    "extra": null,
    "expiryDate": null,
    "updatedAt": "2025-03-21T11:00:00.000Z"
  },
  ...
]
```

#### Using the TypeScript API Client

```ts
import { OpenAgentsBuilderClient } from "open-agents-builder-client";

const client = new OpenAgentsBuilderClient({
  apiKey: "<YOUR_API_KEY>",
  databaseIdHash: "<YOUR_DATABASE_ID_HASH>"
});

async function listKeysClientExample() {
  const keys = await client.keys.listKeys({ databaseIdHash: "35f5c5b139a6b569d4649b7..." });
  console.log("Keys (via client):", keys);
}

listKeysClientExample();
```

---

### 3.2 PUT `/api/keys`

#### 3.2.1 Description

**Upserts** a key by `keyLocatorHash`. If none exists, it **creates** a new one; otherwise it **updates**. Requires **owner** role.  

**Important**: For details on **how keys are created** in the broader system, **please refer** to the relevant code in the [Key Context (GitHub)](https://github.com/CatchTheTornado/open-agents-builder/blob/a5b5582d1bcb5de04baa53e26ef58086f4c5d436/src/contexts/key-context.tsx#L91). This shows how `keyHash`, `keyLocatorHash`, and other fields might be derived or generated in practice.

#### 3.2.2 Request Body

Must match `KeyDTO`, for example:

```json
{
  "displayName": "My Key #1",
  "keyLocatorHash": "1122334455667788aaabbbcccdddeeefff0011223344556677aaabbbcccdddee",
  "keyHash": "abc123def456...",
  "keyHashParams": "some-params",
  "databaseIdHash": "35f5c5b139a6b569d4649b7...",
  "encryptedMasterKey": "some-encrypted-value",
  "acl": "{\"role\":\"owner\"}"
}
```

#### 3.2.3 cURL Example

```bash
curl -X PUT \
  "https://app.openagentsbuilder.com/api/keys" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: 35f5c5b139a6b5..." \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "My Key #1",
    "keyLocatorHash": "1122334455667788aaabbbcccdddeeefff0011223344556677aaabbbcccdddee",
    "keyHash": "abc123def456...",
    "keyHashParams": "some-params",
    "databaseIdHash": "35f5c5b139a6b569d4649b7...",
    "encryptedMasterKey": "some-encrypted-value"
  }'
```

#### 3.2.4 TypeScript (fetch) Example

```ts
async function upsertKey(keyData: any) {
  const response = await fetch("https://app.openagentsbuilder.com/api/keys", {
    method: "PUT",
    headers: {
      "Authorization": "Bearer <YOUR_API_KEY>",
      "database-id-hash": "<YOUR_DATABASE_ID_HASH>",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(keyData)
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(`Error upserting key: ${result.message}`);
  }
  console.log("Upserted key:", result);
  return result;
}

// Usage:
upsertKey({
  displayName: "My Key #1",
  keyLocatorHash: "1122334455667788aaabbbcccdddeeefff0011223344556677aaabbbcccdddee",
  keyHash: "abc123def456...",
  keyHashParams: "some-params",
  databaseIdHash: "35f5c5b139a6b569d4649b7...",
  encryptedMasterKey: "some-encrypted-value"
}).catch(console.error);
```

#### 3.2.5 Example Success Response (HTTP 200)

```json
{
  "message": "Data saved successfully!",
  "data": {
    "displayName": "My Key #1",
    "keyLocatorHash": "1122334455667788aaabbbcccdddeeefff0011223344556677aaabbbcccdddee",
    "keyHash": "abc123def456...",
    "keyHashParams": "some-params",
    "databaseIdHash": "35f5c5b139a6b569d4649b7...",
    "encryptedMasterKey": "some-encrypted-value",
    "acl": null,
    "extra": null,
    "expiryDate": null,
    "updatedAt": "2025-03-21T11:00:00.000Z"
  },
  "status": 200
}
```

#### Using the TypeScript API Client

```ts
import { OpenAgentsBuilderClient } from "open-agents-builder-client";

const client = new OpenAgentsBuilderClient({
  apiKey: "<YOUR_API_KEY>",
  databaseIdHash: "<YOUR_DATABASE_ID_HASH>"
});

async function upsertKeyClientExample() {
  const keyData = {
    displayName: "My Key #1",
    keyLocatorHash: "1122334455667788aaabbbcccdddeeefff0011223344556677aaabbbcccdddee",
    keyHash: "abc123def456...",
    keyHashParams: "some-params",
    databaseIdHash: "35f5c5b139a6b569d4649b7...",
    encryptedMasterKey: "some-encrypted-value"
  };
  const result = await client.keys.upsertKey(keyData);
  console.log("Upserted key via client:", result);
}

upsertKeyClientExample();
```

---

### 3.3 DELETE `/api/keys/[key]`

#### 3.3.1 Description

Deletes the key whose `keyLocatorHash` equals `[key]`. Also requires **owner** role.

#### 3.3.2 cURL Example

```bash
curl -X DELETE \
  "https://app.openagentsbuilder.com/api/keys/1122334455667788aaabbbcccdddeeefff0011223344556677aaabbbcccdddee" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: 35f5c5b139a6b5..."
```

#### 3.3.3 TypeScript (fetch) Example

```ts
async function deleteKey(keyLocatorHash: string) {
  const response = await fetch(
    `https://app.openagentsbuilder.com/api/keys/${keyLocatorHash}`,
    {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer <YOUR_API_KEY>",
        "database-id-hash": "<YOUR_DATABASE_ID_HASH>"
      }
    }
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(`Error deleting key: ${result.message}`);
  }
  console.log("Delete result:", result);
  return result;
}

// Usage:
deleteKey("1122334455667788aaabbbcccdddeeefff0011223344556677aaabbbcccdddee")
  .catch(console.error);
```

#### 3.3.4 Example Success Response (HTTP 200)

```json
{
  "message": "Data deleted successfully!",
  "status": 200
}
```

If not found:

```json
{ "message": "Data not found!", "status": 400 }
```

#### Using the TypeScript API Client

```ts
async function deleteKeyClientExample() {
  const keyLocatorHash = "1122334455667788aaabbbcccdddeeefff0011223344556677aaabbbcccdddee";
  const deleted = await client.keys.deleteKey(keyLocatorHash);
  console.log("Deleted key via client:", deleted);
}

deleteKeyClientExample();
```

---

## 4. Authorization & Roles

Only an **`owner`** role can create, update, or delete keys:

```ts
if (requestContext.acl.role !== 'owner') {
  return Response.json({ message: "Owner role is required", status: 401 }, { status: 401});
}
```

If the user is not `owner`, the endpoints return `401 Unauthorized`.

---

## 5. Error Handling

- **400**: Missing or invalid input (e.g., `keyLocatorHash` must be 64 chars).  
- **401**: If your ACL role is not `owner` for `PUT`/`DELETE`.  
- **404** or **400**: If the key does not exist on delete.  
- **499/500**: Server or DB issues.

Error responses generally have:

```json
{
  "message": "Error details",
  "status": <number>
}
```

---

## 6. Important Note on Key Creation

When **creating** a key (via `PUT /api/keys`), please refer to the **key creation logic** in the **[Key Context code on GitHub](https://github.com/CatchTheTornado/open-agents-builder/blob/a5b5582d1bcb5de04baa53e26ef58086f4c5d436/src/contexts/key-context.tsx#L91)**. That code shows how the fields (`keyHash`, `keyLocatorHash`, `encryptedMasterKey`, etc.) might be **derived** or generated in a broader context. Understanding that logic ensures your new keys are correctly formed.

---

## 7. Summary of Keys Endpoints

| **Endpoint**             | **Method** | **Requires**           | **Purpose**                                                                            |
|--------------------------|-----------|------------------------|----------------------------------------------------------------------------------------|
| **`/api/keys`**          | **GET**    | Valid bearer & DB hash | List keys; filters by `databaseIdHash`, `keyLocatorHash`, `keyHash`.                   |
| **`/api/keys`**          | **PUT**    | `role === 'owner'`     | Upsert a key by `keyLocatorHash`. Requires reading the Key Context logic.              |
| **`/api/keys/[key]`**    | **DELETE** | `role === 'owner'`     | Delete a key record by `keyLocatorHash`.                                               |

That’s the full **Keys** API reference. Remember to check the [Key Context creation logic](https://github.com/CatchTheTornado/open-agents-builder/blob/a5b5582d1bcb5de04baa53e26ef58086f4c5d436/src/contexts/key-context.tsx#L91) to properly form your key data before calling these endpoints!

