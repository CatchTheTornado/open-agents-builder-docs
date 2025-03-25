---
title: Product Management API
description: How to create, delete and filter products thru API
---

Below is a **comprehensive REST API documentation** for managing **Products** in your **commerce** schema. Examples use the base URL **`https://app.openagentsbuilder.com`** and show both **cURL** and **TypeScript (fetch)** usage.

---

> **Note**: There is an API client plus example available at:
> - [open-agents-builder-client](https://github.com/CatchTheTornado/open-agents-builder-client)
> - [open-agents-builder-example](https://github.com/CatchTheTornado/open-agents-builder-example)

---

## 1. Overview

This API manages your **Product** records, including:

1. **Listing and querying products** (with pagination, searching, and sorting).  
2. **Creating or updating** products via upsert (`PUT`).  
3. **Deleting** products by ID.  
4. **Exporting** products to a ZIP archive (including images).  
5. **Generating a product description** (using an LLM) from a stored image and product data.  
6. **Serving product images** (via a storage route).

---

## 2. Data Schema: `ProductDTO`

Defined in `productDTOSchema` (in `src/data/dto.ts`):

```ts
export const productDTOSchema = z.object({
  id: z.string().optional(),
  agentId: z.string().optional().nullable(),

  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),

  price: priceSchema.optional(),
  priceInclTax: priceSchema.optional(),

  taxRate: z.number().min(0).max(1).optional(),
  taxValue: z.number().min(0).optional(),

  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  length: z.number().min(0).optional(),
  weight: z.number().min(0).optional(),

  widthUnit: z.string().optional(),
  heightUnit: z.string().optional(),
  lengthUnit: z.string().optional(),
  weightUnit: z.string().optional(),

  brand: z.string().optional(),
  status: z.string().optional(),

  imageUrl: z.string().url().optional().nullable(),

  attributes: z.array(productAttributeSchema).optional(),
  variants: z.array(productVariantSchema).optional(),
  images: z.array(productImageSchema).optional(),
  tags: z.array(z.string()).optional(),

  createdAt: z.string().default(() => getCurrentTS()),
  updatedAt: z.string().default(() => getCurrentTS()),
});
export type ProductDTO = z.infer<typeof productDTOSchema>;
```

**Key Fields**:  

- **`sku`** and **`name`**: required (both have `min(1)`).  
- **`price`** and **`priceInclTax`**: objects of `{ value: number; currency: string }`.  
- **`attributes`**, **`variants`**, **`images`**, **`tags`**: optional arrays.  
- **`imageUrl`**: optional string (URL to a main image).  
- **`agentId`**: optional link to a specific agent.  
- **`brand`, `status`**: optional strings.  
- **`createdAt`, `updatedAt`**: automatically set timestamps.

---

## 3. Endpoints

### 3.1 `GET /api/product`

#### 3.1.1 Description
Returns a **paginated** list of products, including support for partial text queries, sorting, etc.

#### 3.1.2 Query Parameters

- **`limit`** (default `10`) – how many records to return.  
- **`offset`** (default `0`) – how many records to skip.  
- **`orderBy`** – defaults to `"createdAt"`. You can specify `"name"`, `"price"`, etc.  
- **`query`** – partial match on the product’s `sku` or `name`.  
- **`id`** – fetch a single product by `id`.

#### 3.1.3 cURL Example

```bash
curl -X GET \
  "https://app.openagentsbuilder.com/api/product?limit=5&offset=0&orderBy=name&query=shoes" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>"
```

#### 3.1.4 TypeScript `fetch` Example

```ts
async function getProducts() {
  const params = new URLSearchParams({
    limit: "5",
    offset: "0",
    orderBy: "name",
    query: "shoes"
  });

  const response = await fetch(
    `https://app.openagentsbuilder.com/api/product?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Authorization": "Bearer <YOUR_API_KEY>",
        "database-id-hash": "<YOUR_DATABASE_ID_HASH>"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("Products result:", data);
  return data;
}
```

#### Using the TypeScript API Client

You can also fetch products using the **open-agents-builder-client**:

```ts
import { OpenAgentsBuilderClient } from "open-agents-builder-client";

const client = new OpenAgentsBuilderClient({
  apiKey: "YOUR_API_KEY",
  databaseIdHash: "YOUR_DATABASE_ID_HASH"
});

async function listProductsClientExample() {
  // The client.product.listProducts() method accepts optional query parameters.
  const products = await client.product.listProducts({
    limit: 5,
    offset: 0,
    orderBy: "name",
    query: "shoes"
  });
  console.log("Products from client:", products);
}

listProductsClientExample();
```

#### 3.1.5 Example Response (HTTP 200)

```json
{
  "rows": [
    {
      "id": "p-abc123",
      "sku": "SHOE-001",
      "name": "Nice Shoes",
      "price": { "value": 49.99, "currency": "USD" },
      "priceInclTax": { "value": 61.48, "currency": "USD" },
      "taxRate": 0.23,
      "taxValue": 11.49,
      "width": 0,
      "height": 0,
      "length": 0,
      "weight": 0,
      "widthUnit": "cm",
      "heightUnit": "cm",
      "lengthUnit": "cm",
      "weightUnit": "kg",
      "brand": "Some Brand",
      "status": "active",
      "imageUrl": null,
      "attributes": [],
      "variants": [],
      "images": [],
      "tags": [],
      "agentId": null,
      "createdAt": "2025-03-21T10:00:00.000Z",
      "updatedAt": "2025-03-21T10:05:00.000Z"
    },
    ...
  ],
  "total": 12,
  "limit": 5,
  "offset": 0,
  "orderBy": "name",
  "query": "shoes"
}
```

---

### 3.2 `PUT /api/product`

#### 3.2.1 Description

**Upserts** a product. If the `id` does not exist, it **creates** a new product. If `id` is found, it **updates** that record.

#### 3.2.2 Request Body

Must match `ProductDTO`. For example:

```json
{
  "id": "p-abc123",
  "sku": "SHOE-001",
  "name": "Nice Shoes",
  "price": { "value": 49.99, "currency": "USD" },
  ...
}
```

#### 3.2.3 cURL Example

```bash
curl -X PUT \
  "https://app.openagentsbuilder.com/api/product" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "p-abc123",
    "sku": "SHOE-001",
    "name": "Nice Shoes",
    "price": {
      "value": 49.99,
      "currency": "USD"
    },
    "taxRate": 0.23,
    "brand": "Some Brand",
    "status": "active"
  }'
```

#### 3.2.4 TypeScript `fetch` Example

```ts
async function upsertProduct(productData: any) {
  const response = await fetch("https://app.openagentsbuilder.com/api/product", {
    method: "PUT",
    headers: {
      "Authorization": "Bearer <YOUR_API_KEY>",
      "database-id-hash": "<YOUR_DATABASE_ID_HASH>",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(productData)
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(`Error upserting product: ${result.message}`);
  }

  console.log("Upserted product:", result);
  return result;
}

// Usage Example
upsertProduct({
  id: "p-abc123",
  sku: "SHOE-001",
  name: "Nice Shoes",
  price: { value: 49.99, currency: "USD" },
  taxRate: 0.23,
  brand: "Some Brand",
  status: "active"
}).catch(console.error);
```

#### Using the TypeScript API Client

```ts
import { OpenAgentsBuilderClient } from "open-agents-builder-client";

const client = new OpenAgentsBuilderClient({
  apiKey: "YOUR_API_KEY",
  databaseIdHash: "YOUR_DATABASE_ID_HASH"
});

async function upsertProductClientExample() {
  const result = await client.product.upsertProduct({
    id: "p-abc123",
    sku: "SHOE-001",
    name: "Nice Shoes",
    price: { value: 49.99, currency: "USD" },
    taxRate: 0.23,
    brand: "Some Brand",
    status: "active"
  });
  console.log("Upserted product via client:", result);
}

upsertProductClientExample();
```

#### 3.2.5 Example Success Response

```json
{
  "message": "Data saved successfully!",
  "data": {
    "id": "p-abc123",
    "sku": "SHOE-001",
    "name": "Nice Shoes",
    "price": { "value": 49.99, "currency": "USD" },
    "priceInclTax": { "value": 61.48, "currency": "USD" },
    "brand": "Some Brand",
    "status": "active",
    "attributes": [],
    "variants": [],
    "images": [],
    "tags": [],
    ...
    "createdAt": "2025-03-21T10:00:00.000Z",
    "updatedAt": "2025-03-21T10:05:00.000Z"
  },
  "status": 200
}
```

---

### 3.3 `DELETE /api/product/[id]`

#### 3.3.1 Description

Deletes a product by its `id`.

#### 3.3.2 cURL Example

```bash
curl -X DELETE \
  "https://app.openagentsbuilder.com/api/product/p-abc123" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>"
```

#### 3.3.3 TypeScript `fetch` Example

```ts
async function deleteProduct(productId: string) {
  const response = await fetch(
    `https://app.openagentsbuilder.com/api/product/${productId}`,
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
    throw new Error(`Error deleting product: ${result.message}`);
  }

  console.log("Delete response:", result);
  return result;
}

// Usage Example
deleteProduct("p-abc123").catch(console.error);
```

#### Using the TypeScript API Client

```ts
import { OpenAgentsBuilderClient } from "open-agents-builder-client";

const client = new OpenAgentsBuilderClient({
  apiKey: "YOUR_API_KEY",
  databaseIdHash: "YOUR_DATABASE_ID_HASH"
});

async function deleteProductClientExample() {
  const response = await client.product.deleteProduct("p-abc123");
  console.log("Delete product via client:", response);
}

deleteProductClientExample();
```

#### 3.3.4 Example Response (HTTP 200)

```json
{
  "message": "Data deleted successfully!",
  "status": 200
}
```

If not found, returns a 400 with:
```json
{ "message": "Data not found!", "status": 400 }
```

---

### 3.4 `GET /api/product/export`

#### 3.4.1 Description

**Exports** all products as a `.zip` file. Inside the ZIP you’ll find:

- `index.md` and `index.html` – listing products.  
- For each product, a `*.md` and `*.html` – rendered from `renderProductToMarkdown()`.  
- `images` folder – any product images referenced in `product.images` are embedded in the ZIP.  
- `products.json` – raw JSON of all products.

#### 3.4.2 cURL Example

```bash
curl -X GET \
  "https://app.openagentsbuilder.com/api/product/export" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>" \
  -o products-export.zip
```

#### 3.4.3 Usage

- You’ll receive a **binary ZIP** file. The server sets `Content-Type: application/zip`.

#### Using the TypeScript API Client

> The default `client.product` in **open-agents-builder-client** does not include a built-in `export` method. You can extend it similarly to other modules.

**Example**:

```ts
import { BaseClient } from "open-agents-builder-client";

class ExtendedProductApi extends BaseClient {
  public async exportProducts(): Promise<Blob> {
    const url = `${this.baseUrl}/api/product/export`;
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "database-id-hash": this.databaseIdHash
      }
    });
    if (!resp.ok) {
      throw new Error(`Error exporting products: ${resp.statusText}`);
    }
    return resp.blob();
  }
}

// Usage
(async () => {
  const extendedProductApi = new ExtendedProductApi({
    apiKey: "YOUR_API_KEY",
    databaseIdHash: "YOUR_DATABASE_ID_HASH"
  });

  const zipBlob = await extendedProductApi.exportProducts();
  console.log("Exported Products as ZIP Blob:", zipBlob);
})();
```

---

### 3.5 `POST /api/product/descriptor/[storageKey]`

#### 3.5.1 Description

Takes an **image** identified by `[storageKey]` from your attachments, plus a `ProductDTO` in the request body, and uses an LLM to **generate** or **enhance** a product description. Returns a validated `ProductDTO` schema object.

- Expects a JSON body matching at least the shape of `productDTOSchema`.
- Embeds the image as a base64 `data:` URL in the LLM prompt.

#### 3.5.2 cURL Example

```bash
curl -X POST \
  "https://app.openagentsbuilder.com/api/product/descriptor/unique-image-storage-key" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "DES-123",
    "name": "Description from LLM",
    "price": { "value": 19.99, "currency": "USD" }
  }'
```

#### 3.5.3 TypeScript `fetch` Example

```ts
async function describeProductWithImage(storageKey: string, product: any) {
  const response = await fetch(
    `https://app.openagentsbuilder.com/api/product/descriptor/${storageKey}`,
    {
      method: "POST",
      headers: {
        "Authorization": "Bearer <YOUR_API_KEY>",
        "database-id-hash": "<YOUR_DATABASE_ID_HASH>",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(product)
    }
  );

  const result = await response.json();
  if (!response.ok) {
    throw new Error(`Error describing product: ${result.message}`);
  }

  console.log("Described product:", result);
  return result;
}

// Usage Example
describeProductWithImage("unique-image-storage-key", {
  sku: "DES-123",
  name: "LLM Enhanced Product",
  price: { value: 19.99, currency: "USD" }
}).catch(console.error);
```

#### Using the TypeScript API Client

By default, **open-agents-builder-client** does **not** include a specialized method for `POST /api/product/descriptor/[storageKey]`. You can:

1. Extend `ProductApi` similarly to the export method above.
2. Or simply use `fetch` or `axios` for this route.

**Example** extension:

```ts
class ExtendedProductApi extends BaseClient {
  public async describeProduct(storageKey: string, productData: Partial<ProductDTO>) {
    const url = `${this.baseUrl}/api/product/descriptor/${storageKey}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "database-id-hash": this.databaseIdHash,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(productData)
    });
    if (!resp.ok) {
      throw new Error(`Error describing product: ${resp.statusText}`);
    }
    return resp.json();
  }
}

// Usage:
(async () => {
  const extendedProductApi = new ExtendedProductApi({
    apiKey: "YOUR_API_KEY",
    databaseIdHash: "YOUR_DATABASE_ID_HASH"
  });

  const result = await extendedProductApi.describeProduct("unique-image-storage-key", {
    sku: "DES-123",
    name: "From LLM",
    price: { value: 19.99, currency: "USD" }
  });

  console.log("LLM-based described product:", result);
})();
```

#### 3.5.4 Example Response (HTTP 200)

Returns a validated `ProductDTO` or partial structure the LLM generated (like a refined `description`, `attributes`, etc.).  
```json
{
  "sku": "DES-123",
  "name": "LLM Enhanced Product",
  "description": "A wonderful product described by the LLM...",
  ...
}
```

---

### 3.6 `GET /storage/product/[databaseIdHash]/[id]`

#### 3.6.1 Description

Serves a **binary** attachment (e.g., product image) from the **`commerce`** partition. The `[id]` is the `storageKey` referencing the attachment.

- The server sets `Content-Type` based on the attachment’s stored `mimeType`.

#### 3.6.2 cURL Example

```bash
curl -X GET \
  "https://app.openagentsbuilder.com/storage/product/35f5c5b139a6b569d4.../my-image-storageKey" \
  -H "Authorization: Bearer <YOUR_API_KEY>"
  # => binary image data
```

*(You can add `-o my-file.jpg` to save locally.)*

#### 3.6.3 TypeScript `fetch` Example

```ts
async function fetchProductImage(databaseIdHash: string, storageKey: string) {
  const response = await fetch(
    `https://app.openagentsbuilder.com/storage/product/${databaseIdHash}/${storageKey}`,
    {
      headers: {
        "Authorization": "Bearer <YOUR_API_KEY>"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Error fetching product image: ${response.statusText}`);
  }

  // For example, to create an object URL in a browser:
  const blob = await response.blob();
  const imageURL = URL.createObjectURL(blob);
  console.log("Image URL:", imageURL);
  return imageURL;
}
```

> The client library does not have a dedicated method for retrieving product images from storage. You can add your own extension if needed.

---

## 4. Error Handling

- **400 Bad Request**:  
  - Missing `id` parameter on DELETE, invalid JSON, or failed zod validation.  
- **404 Not Found**:  
  - If an image or product does not exist.  
- **500 / 499 Internal Server Error**:  
  - On unexpected failures (DB, encryption, or LLM errors).  
- **401 / 403 Unauthorized**:  
  - Missing or invalid credentials (`Bearer token` or `database-id-hash`).  

Each error typically includes a JSON object:  
```json
{
  "message": "Error details",
  "status": <number>
}
```

---

## 5. Summary of Endpoints

| **Endpoint**                                                        | **Method** | **Purpose**                                                                                                                      |
|---------------------------------------------------------------------|-----------|----------------------------------------------------------------------------------------------------------------------------------|
| **`/api/product?limit=&offset=&orderBy=...&query=...`**            | **GET**    | List/search products with pagination, sorting, partial query, etc.                                                               |
| **`/api/product`**                                                 | **PUT**    | Upsert (create/update) a product.                                                                                                |
| **`/api/product/[id]`**                                            | **DELETE** | Delete a product by ID.                                                                                                          |
| **`/api/product/export`**                                          | **GET**    | Export all products into a ZIP (including `index.md/html`, product `*.md/html`, `images/`, and a `products.json` file).          |
| **`/api/product/descriptor/[storageKey]`**                         | **POST**   | Generate/describe a product using an LLM, providing an image (from `[storageKey]`) and a `ProductDTO` in JSON body.              |
| **`/storage/product/[databaseIdHash]/[id]`**                       | **GET**    | Retrieve a stored product image or binary file from the commerce partition, returning raw file data in `Content-Type` response. |

---

**That concludes the Products API documentation**, showing:

1. **How to query** products.  
2. **How to upsert** (create or update).  
3. **How to delete**.  
4. **How to export** them to a ZIP.  
5. **How to generate** product descriptions from an image.  
6. **How to retrieve** product images via a dedicated storage route.

