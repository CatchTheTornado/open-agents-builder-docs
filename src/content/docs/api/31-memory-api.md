---
title: Memory API
description: How to manage the Agent's memory
---

Below is a **comprehensive REST API documentation** for managing **Vector Stores** (referred to as "memory" or "store" in the code). 

---

> **Note**: This API is part of a system that leverages [oab-vector-store](https://github.com/CatchTheTornado/open-agents-builder-client)*-style* storage and embeddings. Typically, you must provide valid **API credentials** (and a **database-id-hash**) to access or modify stores.  

---

## **1. Overview**

This API allows you to:

1. **Create and list vector stores** using the [`/api/memory/create`](#41-create-apimemorycreate) and [`/api/memory/query`](#42-query-apimemoryquery) endpoints.  
2. **Get or delete specific stores** (by `filename`) via [`/api/memory/[filename]`](#43-stores-apimemoryfilename).  
3. **List, query, and store vector records** within a specific store using the [`/api/memory/[filename]/records`](#44-records-apimemoryfilenamerecords) endpoint.  
4. **Delete a specific record** by `recordId` via [`/api/memory/[filename]/records/[recordId]`](#45-record-deletion-apimemoryfilenamerecordsrecordid).  
5. **Generate embeddings** for arbitrary text using [`/api/memory/embeddings`](#46-generate-embeddings-apimemoryembeddings).  

---

## **2. Mandatory Request Headers**

1. **`Authorization: Bearer <OPEN_AGENT_BUILDER_API_KEY>`**  
   Used for authentication. Replace `<OPEN_AGENT_BUILDER_API_KEY>` with your actual API key.

2. **`database-id-hash: <YOUR_DATABASE_ID_HASH>`**  
   A constant key **per user’s database**.  
   - Obtain this from your administration or environment settings.

**Example**:
```
Authorization: Bearer abc1234exampleKey
database-id-hash: 35f5c5b139a6b569d4649b788c1851831eb44d8e32b716b8411ec6431af8121d
```

---

## **3. Data Schema & Validation Rules**

### **3.1 Vector Store**

- A **store** is a collection of vector records saved in a JSON file on disk (plus its indexing structures).  
- **`storeName`** (used as `filename` in the URL) must:
  - Not be empty or only whitespace
  - Not contain invalid filesystem characters (`<>:"/\\|?*`)
  - Not start/end with a space or dot (`.`)
  - Not exceed 255 characters
  - Must be unique (cannot create a store that already exists)

### **3.2 Vector Store Record**

Each record in a vector store is validated via the `VectorStoreEntry` schema:
```ts
export const vectorStoreEntrySchema = z.object({
  id: z.string(),
  content: z.string(),
  embedding: z.array(z.number()),
  metadata: z.record(z.unknown()),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
```

Key points:
- **`id`**: A unique identifier string for the record. **Required**.
- **`content`**: The raw text (or data) the embedding is generated from. **Required**.
- **`embedding`**: An array of numbers representing the vector embedding. **Required**.
- **`metadata`**: A freeform object (key/value pairs) for any additional data about this record. **Optional**.
- **`createdAt`, `updatedAt`**: Timestamps assigned internally; typically optional.

---

## **4. Endpoints & Usage**

### **4.1 CREATE** `/api/memory/create`

**Method**: `POST`  
**Description**: Create a new vector store.  

- **Request Body**:
  ```json
  {
    "storeName": "<string>"
  }
  ```
  - **`storeName`** is required and must be unique. If a store already exists with this name, a `400` is returned.

**Example Request (cURL)**:
```bash
curl -X POST \
  https://app.example.com/api/memory/create \
  -H "Authorization: Bearer abc1234exampleKey" \
  -H "database-id-hash: 35f5c5b139a6b569..." \
  -H "Content-Type: application/json" \
  -d '{
    "storeName": "my-new-store"
  }'
```

**Success Response** (HTTP `200`):
```json
{
  "message": "Store created successfully"
}
```

**Error Response** (HTTP `400` for validation issues, `500` for internal server errors):
```json
{
  "error": "Store already exists"
}
```
or
```json
{
  "error": "Store name contains invalid characters..."
}
```

---

### **4.2 QUERY** `/api/memory/query`

**Method**: `GET`  
**Description**: List available vector stores and their metadata, optionally with pagination and text filtering.

- **Query Parameters**:
  - **`limit`** (default: 10)  
  - **`offset`** (default: 0)  
  - **`query`** – a partial store name to match (case-insensitive)

**Example Request**:
```bash
curl -X GET \
  "https://app.example.com/api/memory/query?limit=10&offset=0&query=my" \
  -H "Authorization: Bearer abc1234exampleKey" \
  -H "database-id-hash: 35f5c5b139a6b569..."
```

**Success Response** (HTTP `200`):
```json
{
  "files": [
    {
      "file": "my-new-store",
      "displayName": "my-new-store",
      "itemCount": 5,
      "createdAt": "2025-03-20T12:45:01.000Z",
      "updatedAt": "2025-03-20T12:46:22.000Z",
      "lastAccessed": "2025-03-21T08:00:00.000Z"
    },
    {
      "file": "my-other-store",
      "displayName": "my-other-store",
      "itemCount": 17,
      "createdAt": "...",
      "updatedAt": "...",
      "lastAccessed": "..."
    }
  ],
  "limit": 10,
  "offset": 0,
  "hasMore": false,
  "total": 2
}
```

---

### **4.3 STORES** `/api/memory/[filename]`

Endpoints for **one specific vector store** identified by `[filename]`.

#### **4.3.1 GET** `/api/memory/[filename]`

- **Description**: Fetches all records (`items`) stored in `filename` as raw JSON.  
  - Does **not** perform vector-based search.  
  - Returns an array of stored items (full embeddings included).

**Example**:
```bash
curl -X GET \
  https://app.example.com/api/memory/my-new-store \
  -H "Authorization: Bearer abc1234exampleKey" \
  -H "database-id-hash: 35f5c5b139a6b569..."
```

**Success Response** (HTTP `200`):
```json
[
  {
    "id": "record-123",
    "content": "Some content here...",
    "embedding": [0.12, -0.08, ...], 
    "metadata": { "source": "docs" }
  },
  {
    "id": "record-456",
    "content": "Another piece of text",
    "embedding": [...],
    "metadata": {}
  }
]
```

**Error Response** (HTTP `404` if store not found):
```json
{
  "error": "Store not found"
}
```

---

#### **4.3.2 DELETE** `/api/memory/[filename]`

- **Description**: Permanently deletes the entire store (the JSON file and its index). **All** records in that store are removed.

**Example**:
```bash
curl -X DELETE \
  https://app.example.com/api/memory/my-new-store \
  -H "Authorization: Bearer abc1234exampleKey" \
  -H "database-id-hash: 35f5c5b139a6b569..."
```

**Success Response** (HTTP `200`):
```json
{
  "message": "Store deleted successfully",
  "status": 200
}
```

**Error Response** (HTTP `404` if store not found, or `500` on server error):
```json
{
  "message": "Store 'my-new-store' not found",
  "status": 404
}
```

---

### **4.4 RECORDS** `/api/memory/[filename]/records`

Endpoints for **managing records** within a specific store `[filename]`.

#### **4.4.1 GET** `/api/memory/[filename]/records`

- **Description**: List or vector-search the records in `[filename]`.  
  - If **`embeddingSearch`** is provided, a vector similarity search is performed on the server. 
  - Otherwise, it returns a paginated list of records (with partial embeddings shown).

**Query Parameters**:
- **`limit`** (default: 10)  
- **`offset`** (default: 0)  
- **`embeddingSearch`**: a string to vectorize and search.  
- **`topK`** (default: 5 if `embeddingSearch` is used): how many top results to return.

**Examples**:

1) **List records**:
   ```bash
   curl -X GET \
     "https://app.example.com/api/memory/my-new-store/records?limit=10&offset=0" \
     -H "Authorization: Bearer abc1234exampleKey" \
     -H "database-id-hash: 35f5c5b139a6b569..."
   ```
   **Success**:
   ```json
   {
     "rows": [
       {
         "id": "record-123",
         "metadata": {...},
         "content": "Some content...",
         "embeddingPreview": [0.12, -0.08, ...]  // only first 8 numbers
       },
       {
         "id": "record-456",
         "...": "..."
       }
     ],
     "total": 2
   }
   ```

2) **Vector search**:
   ```bash
   curl -X GET \
     "https://app.example.com/api/memory/my-new-store/records?embeddingSearch=climate+change&topK=3" \
     -H "Authorization: Bearer abc1234exampleKey" \
     -H "database-id-hash: 35f5c5b139a6b569..."
   ```
   **Success**:
   ```json
   {
     "rows": [
       {
         "id": "record-789",
         "content": "Text related to climate change",
         "embeddingPreview": [...],
         "similarity": 0.89234,
         "metadata": { "category": "environment" }
       },
       ...
     ],
     "total": 3,
     "vectorSearchQuery": "climate change"
   }
   ```

**Possible Error** (HTTP `500` on internal errors):
```json
{
  "error": "Failed to fetch records"
}
```

---

#### **4.4.2 POST** `/api/memory/[filename]/records`

- **Description**: Insert a new record into the store.  

**Request Body**:
```json
{
  "id": "record-123",
  "content": "Hello world",
  "metadata": { "language": "en" },
  "embedding": [0.12, -0.07, 0.99, ...]
}
```
- **`id`**: Unique ID for this record.  
- **`content`**: Main text.  
- **`embedding`**: Numerically generated vector (e.g., from an embedding model).  
- **`metadata`**: Optional object with custom fields.

**Example**:
```bash
curl -X POST \
  https://app.example.com/api/memory/my-new-store/records \
  -H "Authorization: Bearer abc1234exampleKey" \
  -H "database-id-hash: 35f5c5b139a6b569..." \
  -H "Content-Type: application/json" \
  -d '{
    "id": "intro-text-01",
    "content": "Introduction to vector stores",
    "embedding": [0.12345, 0.54321, ...],
    "metadata": {
      "category": "tutorial"
    }
  }'
```

**Success Response** (HTTP `200`):
```json
{
  "success": true
}
```

**Validation Error** (HTTP `400` if `id`/`content`/`embedding` missing):
```json
{
  "error": "Missing required fields"
}
```

---

### **4.5 RECORD DELETION** `/api/memory/[filename]/records/[recordId]`

**Method**: `DELETE`  
**Description**: Deletes a single record from a specific store.

**Example**:
```bash
curl -X DELETE \
  https://app.example.com/api/memory/my-new-store/records/intro-text-01 \
  -H "Authorization: Bearer abc1234exampleKey" \
  -H "database-id-hash: 35f5c5b139a6b569..."
```

**Success Response** (HTTP `200`):
```json
{
  "message": "Record deleted successfully"
}
```

**Error Response** (HTTP `404` if store or record not found):
```json
{
  "error": "Store not found"
}
```
or
```json
{
  "error": "Record not found"
}
```
*(The exact message depends on whether the store or record is missing.)*

---

### **4.6 GENERATE EMBEDDINGS** `/api/memory/embeddings`

**Method**: `POST`  
**Description**: Generates an embedding array using OpenAI (or a configured provider) for the supplied text content. This is a *convenience* endpoint if you want the server to handle embedding generation.

**Request Body**:
```json
{
  "content": "Text to embed"
}
```

**Example**:
```bash
curl -X POST \
  https://app.example.com/api/memory/embeddings \
  -H "Authorization: Bearer abc1234exampleKey" \
  -H "database-id-hash: 35f5c5b139a6b569..." \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello world"
  }'
```

**Success Response** (HTTP `200`):
```json
{
  "embedding": [0.12345, -0.0321, ...]
}
```

**Error Response** (HTTP `400` if `content` missing, or `500` on internal failure):
```json
{
  "error": "Content is required"
}
```

---

## **5. Error Handling**

Common error responses and their meanings:

- **400 Bad Request**  
  - Typically means a validation issue (missing `id`, invalid `storeName`, etc.).

- **404 Not Found**  
  - The requested store or record does not exist.

- **500 Internal Server Error**  
  - Server-side exceptions (file I/O issues, embedding generation failures, etc.).

All error responses generally follow the pattern:
```json
{
  "error": "<description>",
  "status": <numericCode>   // optional
}
```
or
```json
{
  "message": "<description>",
  "status": <numericCode>
}
```

---

## **6. Additional Notes**

- **Embedding**: The server can create embeddings automatically if you use the `POST /api/memory/embeddings` endpoint. Otherwise, you must supply your own numerical vectors.
- **Store Deletion**: Deleting a store is irreversible, and all records in that store are lost.
- **Record Deletion**: Deleting a record removes it permanently from that store’s underlying JSON file and index.
- **Pagination**: For listing records or stores, always consider using `limit` and `offset` for performance with large data sets.
- **Usage Quotas**: In SaaS mode, creating too many stores or records may be restricted if you exceed your plan limits. Expect `403` or similar errors in such cases.

---

## **7. Summary of Endpoints**

1. **POST** `/api/memory/create`  
   - Create a new vector store.  

2. **GET** `/api/memory/query`  
   - List existing stores (with metadata, pagination, and optional name filter).  

3. **POST** `/api/memory/embeddings`  
   - Generate vector embeddings for a given text.  

4. **GET** `/api/memory/[filename]`  
   - Retrieve **all** records from a specific store as raw JSON.  

5. **DELETE** `/api/memory/[filename]`  
   - Delete an entire store (its file and index).  

6. **GET** `/api/memory/[filename]/records`  
   - Paginated listing or vector search of records in a single store.  

7. **POST** `/api/memory/[filename]/records`  
   - Create (insert) a new record into a single store.  

8. **DELETE** `/api/memory/[filename]/records/[recordId]`  
   - Delete a single record by its `id` from a store.

---

**End of Documentation**