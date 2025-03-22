---
title: Attachments Management API
description: How to create, delete and filter attachments thru API
---

Below is an **updated REST API documentation** for **Attachments**, now including a **publicly accessible URL** for fetching a file without authorization. All other endpoints remain the same, but we add one more section for this public route under **Storage**.

---

> **Note**: There is an API client plus example available on: [https://github.com/CatchTheTornado/open-agents-builder-client](https://github.com/CatchTheTornado/open-agents-builder-client) and [https://github.com/CatchTheTornado/open-agents-builder-example](https://github.com/CatchTheTornado/open-agents-builder-example)

---

## 1. Overview

**Attachments** store binary files (images, PDFs, etc.) plus metadata in the database (`AttachmentDTO`). You can:

1. **Create/Update** (upsert) an attachment record (optionally with file upload)  
2. **List** attachments and search them via `/api/attachment` or `/api/attachment/query`  
3. **Retrieve** the raw file content in two ways:
   - **Authorized** route: `GET /api/attachment/[id]`
   - **Public** route: `GET /storage/attachment/[databaseIdHash]/[id]` (no auth required)
4. **Delete** an attachment record and its file  
5. **Export** all attachments in a ZIP archive  

If your environment uses a SaaS mode with an encryption key, the `content` field can be automatically encrypted.

---

## 2. Data Schema: `AttachmentDTO`

```ts
export const attachmentDTOSchema = z.object({
  id: z.number().positive().optional(),
  displayName: z.string().optional().nullable(),
  safeNameIdentifier: z.string().optional().nullable(),
  description: z.string().optional().nullable(),

  mimeType: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  json: z.string().optional().nullable(),
  extra: z.string().optional().nullable(),

  size: z.number().positive().int().nullable(),
  storageKey: z.string().min(1),
  filePath: z.string().optional(),

  content: z.string().optional().nullable(),

  createdAt: z.string().default(() => getCurrentTS()),
  updatedAt: z.string().default(() => getCurrentTS()),

  assignedTo: z.string().optional().nullable()
});
export type AttachmentDTO = z.infer<typeof attachmentDTOSchema>;
```

**Key fields**:

- **`storageKey`**: Uniquely identifies the file in storage (also used in the public route).
- **`displayName`**: Friendly name.  
- **`mimeType`**: E.g., `image/png`.  
- **`content`**: If text was extracted from the file.  
- **`size`**: Size in bytes.  
- **`extra`**: Additional JSON metadata.  
- **`createdAt`** & **`updatedAt`**: Timestamps.

---

## 3. Endpoints

### 3.1 Create / Update (Upsert) – `PUT /api/attachment`

Allows **JSON**-based or **multipart/form-data**-based upserts.

1. **JSON** (no file upload).
2. **Form-data** (binary file + JSON metadata in the `attachmentDTO` field).

**See full code** in the previous doc for how the server merges them and saves your file.

#### 3.1.1 Example (JSON Body)

```bash
curl -X PUT \
  "https://app.openagentsbuilder.com/api/attachment" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>" \
  -H "Content-Type: application/json" \
  -d '{
    "storageKey": "file-key-123",
    "displayName": "example.txt",
    "mimeType": "text/plain",
    "content": "Some text content"
  }'
```

#### 3.1.2 Example (Multipart/Form-Data)

```bash
curl -X PUT \
  "https://app.openagentsbuilder.com/api/attachment" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>" \
  -F "file=@/path/to/file.pdf" \
  -F "attachmentDTO={\"storageKey\":\"my-pdf-file\",\"displayName\":\"Doc.pdf\",\"mimeType\":\"application/pdf\"}"
```

**Response** (HTTP 200 on success):

```json
{
  "message": "Data saved successfully!",
  "data": {
    "id": 101,
    "storageKey": "my-pdf-file",
    "displayName": "Doc.pdf",
    "mimeType": "application/pdf",
    ...
  },
  "status": 200
}
```

---

### 3.2 **List All** – `GET /api/attachment`

Returns an **array** of all attachments. Basic filtering is possible with query parameters (e.g., `?storageKey=someKey`).

**cURL**:

```bash
curl -X GET \
  "https://app.openagentsbuilder.com/api/attachment" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>"
```

---

### 3.3 **Search / Pagination** – `GET /api/attachment/query`

Enables advanced searching with `limit`, `offset`, `orderBy`, and `query`.

```bash
curl -X GET \
  "https://app.openagentsbuilder.com/api/attachment/query?limit=5&offset=0&orderBy=createdAt&query=jpg" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>"
```

Returns a paginated structure:

```json
{
  "rows": [...AttachmentDTO...],
  "total": 25,
  "limit": 5,
  "offset": 0,
  "orderBy": "createdAt",
  "query": "jpg"
}
```

---

### 3.4 **Retrieve Binary (Authorized)** – `GET /api/attachment/[id]`

Requires **authorization** and `database-id-hash`. Returns the raw file content with `Content-Type: application/octet-stream` (can be changed if you store `mimeType`).

```bash
curl -X GET \
  "https://app.openagentsbuilder.com/api/attachment/my-file-key" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>" \
  -o downloaded-file
```

---

### 3.5 **Retrieve Binary (Public / No Auth)** – `GET /storage/attachment/[databaseIdHash]/[id]`

**New**: This route **does NOT** require authentication. Useful for public-facing file URLs.

- `[databaseIdHash]`: The user’s DB hash.  
- `[id]`: The file’s `storageKey`.  

If found, returns the file with the stored `mimeType`. Otherwise, `404`.

**cURL**:

```bash
curl -X GET \
  "https://app.openagentsbuilder.com/storage/attachment/35f5c5b139a6b569d4649b7.../my-file-key" \
  -o downloaded-file
```

*(No `Authorization` or `database-id-hash` headers needed.)*

**TypeScript**:

```ts
async function fetchPublicAttachment(databaseIdHash: string, storageKey: string) {
  const response = await fetch(
    `https://app.openagentsbuilder.com/storage/attachment/${databaseIdHash}/${storageKey}`
  );
  if (!response.ok) {
    throw new Error("File not found or server error");
  }
  // e.g., blob or arrayBuffer
  const blob = await response.blob();
  console.log("Public file blob:", blob);
  return blob;
}
```

---

### 3.6 **Delete** – `DELETE /api/attachment/[id]`

Removes the DB record and **also** deletes the file from storage if found.

```bash
curl -X DELETE \
  "https://app.openagentsbuilder.com/api/attachment/my-file-key" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>"
```

If success:

```json
{
  "message": "Data deleted successfully!",
  "status": 200
}
```

If not found:

```json
{
  "message": "Record not found",
  "status": 404
}
```

---

### 3.7 **Export** – `GET /api/attachment/export`

Creates a **ZIP** with:

- **`index.md`** and **`index.html`** listing attachments.  
- Each file itself included.  
- If an attachment has `.content`, it also includes `.md` and `.html` versions of that text.  
- **`attachments.json`** with all metadata.

**cURL**:

```bash
curl -X GET \
  "https://app.openagentsbuilder.com/api/attachment/export" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>" \
  -o attachments.zip
```

---

## 4. Encryption Details

If a **SaaS** `storageKey` is provided:

- The field **`content`** is encrypted in the database.
- On read (`GET` or search), it’s automatically decrypted.  
- The binary file stored in your system’s **storage** is **not** automatically encrypted – only the `content` string in DB.  
- If you need end-to-end encryption for the file itself, adapt the `StorageService` to encrypt the file before saving.

---

## 5. Error Handling

- **400 Bad Request**: Missing necessary fields (`storageKey`), or invalid data in `PUT`.
- **404 Not Found**: The `storageKey` does not exist in DB or file system (on `GET` or `DELETE`).
- **499 / 500 Internal Server Error**: Server or database failure.
- **401 / 403 Unauthorized**: For the **authorized** endpoints only, if missing `Authorization` or `database-id-hash`.
- **Public** route (`GET /storage/attachment/[databaseIdHash]/[id]`) does **not** require authentication.

---

## 6. Summary of Attachment Endpoints

| **Endpoint**                                                                  | **Method** | **Requires Auth?** | **Purpose**                                                                                                 |
|-------------------------------------------------------------------------------|-----------|--------------------|-------------------------------------------------------------------------------------------------------------|
| `/api/attachment`                                                             | **PUT**    | **Yes**            | Upsert (create/update) attachment with optional file upload or JSON body.                                   |
| `/api/attachment`                                                             | **GET**    | **Yes**            | List all attachments (array).                                                                               |
| `/api/attachment/query?limit=&offset=&orderBy=&query=`                        | **GET**    | **Yes**            | Paginated search across attachments.                                                                        |
| `/api/attachment/[id]` **(GET)**                                              | **GET**    | **Yes**            | Retrieve **binary** content. `id` = `storageKey`. Sets `Content-Type=application/octet-stream`.             |
| `/storage/attachment/[databaseIdHash]/[id]` **(GET)**                         | **GET**    | **No**             | **Public**: fetches the file with no authentication required.                                               |
| `/api/attachment/[id]` **(DELETE)**                                           | **DELETE** | **Yes**            | Deletes the DB record and the file from storage.                                                            |
| `/api/attachment/export`                                                      | **GET**    | **Yes**            | Export all attachments in a ZIP (`index.md/html`, each file, plus `.md/html` if `content` exists, JSON).    |

This completes the **Attachments** documentation, now featuring a **public** route (`/storage/attachment/[databaseIdHash]/[id]`) for unauthenticated file access.