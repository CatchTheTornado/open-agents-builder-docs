---
title: Order Management API
description: How to create, delete and filter orders thru API
---

Below is a **comprehensive REST API documentation** for managing **Orders** in your **e-commerce** (`"commerce"`) schema. It includes **cURL** examples _and_ **TypeScript** examples (using the native `fetch` API) for each endpoint.  

---

> **Note**: There is an API client plus example available on: [https://github.com/CatchTheTornado/open-agents-builder-client](https://github.com/CatchTheTornado/open-agents-builder-client) and [https://github.com/CatchTheTornado/open-agents-builder-example](https://github.com/CatchTheTornado/open-agents-builder-example)

---

## 1. Overview

The **`/api/order`** endpoints allow you to:

1. **Query orders** with pagination, filtering, and sorting.  
2. **Create or update** an order via upsert.  
3. **Delete** an order by ID.  

> **Note**: Orders are stored in a **commerce**-partitioned table, with certain fields (like addresses, email) **encrypted** if a `storageKey` is provided (SaaS mode).  

---

## 2. Data Schema: `OrderDTO`

From `orderDTOSchema` in `src/data/dto.ts`:

```ts
export const orderDTOSchema = z.object({
  id: z.string().optional(),
  agentId: z.string().optional(),
  sessionId: z.string().optional(),

  billingAddress: addressSchema.optional(),
  shippingAddress: addressSchema.optional(),

  attributes: z.record(z.any()).optional(),
  notes: z.array(noteSchema).optional(),
  statusChanges: z.array(statusChangeSchema).optional(),
  status: z.enum([
    "shopping_cart",
    "quote",
    "new",
    "processing",
    "shipped",
    "completed",
    "cancelled",
  ]).default("shopping_cart"),
  email: z.string().email().optional(),
  customer: customerSchema.optional(),

  // Price fields
  subtotal: priceSchema.optional(),
  subTotalInclTax: priceSchema.optional(),
  subtotalTaxValue: priceSchema.optional(),
  total: priceSchema.optional(),
  totalInclTax: priceSchema.optional(),
  shippingMethod: z.string().optional(),
  shippingPrice: priceSchema.optional(),
  shippingPriceInclTax: priceSchema.optional(),
  shippingPriceTaxRate: z.number().optional(),

  items: z.array(orderItemSchema).optional(),

  createdAt: z.string().default(() => getCurrentTS()),
  updatedAt: z.string().default(() => getCurrentTS()),
});
export type OrderDTO = z.infer<typeof orderDTOSchema>;
```

**Key fields**:
- **`id`** (string, optional) – unique identifier for the order (often user-defined).  
- **`status`** – one of `"shopping_cart"`, `"quote"`, `"new"`, `"processing"`, `"shipped"`, `"completed"`, `"cancelled"`.  
- **`email`** – optional, must be a valid email if present.  
- **`items`** – an array of order line items, each containing fields like `sku`, `quantity`, etc.  
- **`subtotal`, `total`** and other price objects hold numeric values plus a currency code.  

---

## 3. Endpoints

### 3.1 `GET /api/order`

#### 3.1.1 Description
Returns a **paginated** list of orders, allowing you to filter or sort by certain fields. Supports query parameters:

- **`limit`** (default `10`): how many records per page.  
- **`offset`** (default `0`): how many records to skip.  
- **`orderBy`**: defaults to `"createdAt"`. Possible values: `"status"`, `"email"`, `"createdAt"`.  
- **`id`**: fetch a single order by ID.  
- **`agentId`**: filter by an agent’s ID.  
- **`query`**: partial match on `email`, `id`, or `status`.  

#### 3.1.2 cURL Example

```bash
curl -X GET \
  "https://your-domain.com/api/order?limit=5&offset=0&orderBy=status&query=shipped" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>"
```

#### 3.1.3 TypeScript `fetch` Example

```ts
async function getOrders() {
  const limit = 5;
  const offset = 0;
  const orderBy = "status";
  const query = "shipped";

  const response = await fetch(
    `https://your-domain.com/api/order?limit=${limit}&offset=${offset}&orderBy=${orderBy}&query=${query}`, 
    {
      method: "GET",
      headers: {
        "Authorization": "Bearer YOUR_API_KEY",
        "database-id-hash": "YOUR_DATABASE_ID_HASH"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Error fetching orders: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("Paginated order list:", data);
  // data.rows => array of OrderDTO
  return data;
}
```

#### Using the TypeScript API Client

You can also retrieve orders using the **open-agents-builder-client**:

```ts
import { OpenAgentsBuilderClient } from "open-agents-builder-client";

const client = new OpenAgentsBuilderClient({
  apiKey: "YOUR_API_KEY",
  databaseIdHash: "YOUR_DATABASE_ID_HASH"
});

async function listOrdersClientExample() {
  const orders = await client.order.listOrders({ limit: 5, offset: 0, orderBy: "status", query: "shipped" });
  console.log("Orders via client:", orders);
}
```

#### 3.1.4 Example Response (HTTP 200)

A **paginated** structure:
```json
{
  "rows": [
    {
      "id": "ORD-2025-03-21-ABC",
      "agentId": "agent-XYZ",
      "sessionId": "session-123",
      "billingAddress": {},
      "shippingAddress": {},
      "attributes": {},
      "notes": [],
      "statusChanges": [],
      "customer": { "name": "Alice", "email": "[email protected]" },
      "status": "shipped",
      "email": "[email protected]",
      "subtotal": { "value": 100, "currency": "USD" },
      "subTotalInclTax": { "value": 123, "currency": "USD" },
      "subtotalTaxValue": { "value": 23, "currency": "USD" },
      "total": { "value": 120, "currency": "USD" },
      "totalInclTax": { "value": 150, "currency": "USD" },
      "shippingPrice": { "value": 10, "currency": "USD" },
      "shippingPriceTaxRate": 0.08,
      "shippingPriceInclTax": { "value": 10.8, "currency": "USD" },
      "items": [
        {
          "id": "line-1",
          "sku": "PROD-001",
          "variantSku": "VAR-001",
          "quantity": 2,
          ...
        }
      ],
      "createdAt": "2025-03-21T10:00:00.000Z",
      "updatedAt": "2025-03-21T10:05:00.000Z"
    },
    ...
  ],
  "total": 10,
  "limit": 5,
  "offset": 0,
  "orderBy": "status",
  "query": "shipped"
}
```

---

### 3.2 `PUT /api/order`

#### 3.2.1 Description
**Upserts** an order. If `id` does not exist in DB, creates a new record; otherwise updates the existing one.

- **Request Body** must match `OrderDTO` structure.

#### 3.2.2 cURL Example

```bash
curl -X PUT \
  "https://your-domain.com/api/order" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "database-id-hash: YOUR_DATABASE_ID_HASH" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "ORD-2025-03-21-ABC",
    "agentId": "agent-XYZ",
    "status": "new",
    "email": "[email protected]",
    "items": [
      {
        "id": "line-1",
        "productSku": "PROD-ABC",
        "variantSku": "VAR-ABC",
        "quantity": 2,
        "price": { "value": 50, "currency": "USD" }
      }
    ],
    "shippingMethod": "UPS",
    "shippingPrice": { "value": 10, "currency": "USD" }
  }'
```

#### 3.2.3 TypeScript `fetch` Example

```ts
async function upsertOrder(orderData: any) {
  const response = await fetch("https://your-domain.com/api/order", {
    method: "PUT",
    headers: {
      "Authorization": "Bearer YOUR_API_KEY",
      "database-id-hash": "YOUR_DATABASE_ID_HASH",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(orderData)
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(`Error upserting order: ${result?.error?.message || result?.message}`);
  }

  console.log("Upserted order:", result.data);
  return result.data;
}

// Example usage
upsertOrder({
  id: "ORD-2025-03-21-ABC",
  status: "new",
  agentId: "agent-XYZ",
  email: "[email protected]",
  items: [
    {
      id: "line-1",
      productSku: "PROD-ABC",
      variantSku: "VAR-ABC",
      quantity: 2,
      price: { value: 50, currency: "USD" }
    }
  ],
  shippingMethod: "UPS",
  shippingPrice: { value: 10, currency: "USD" }
});
```

#### Using the TypeScript API Client

```ts
import { OpenAgentsBuilderClient } from "open-agents-builder-client";

const client = new OpenAgentsBuilderClient({
  apiKey: "YOUR_API_KEY",
  databaseIdHash: "YOUR_DATABASE_ID_HASH"
});

async function upsertOrderClientExample() {
  const updated = await client.order.upsertOrder({
    id: "ORD-2025-03-21-ABC",
    status: "new",
    agentId: "agent-XYZ",
    email: "[email protected]",
    items: [
      {
        id: "line-1",
        productSku: "PROD-ABC",
        variantSku: "VAR-ABC",
        quantity: 2,
        price: { value: 50, currency: "USD" }
      }
    ],
    shippingMethod: "UPS",
    shippingPrice: { value: 10, currency: "USD" }
  });
  console.log("Upserted via client:", updated);
}
```

#### 3.2.4 Example Success Response (HTTP 200)

```json
{
  "status": 200,
  "data": {
    "id": "ORD-2025-03-21-ABC",
    "agentId": "agent-XYZ",
    "sessionId": null,
    "billingAddress": {},
    "shippingAddress": {},
    "status": "new",
    "email": "[email protected]",
    "items": [
      {
        "id": "line-1",
        "productSku": "PROD-ABC",
        "variantSku": "VAR-ABC",
        "quantity": 2,
        "price": { "value": 50, "currency": "USD" }
      }
    ],
    ...
    "createdAt": "2025-03-21T10:00:00.000Z",
    "updatedAt": "2025-03-21T10:05:00.000Z"
  }
}
```

#### 3.2.5 Validation Error (HTTP 400)

```json
{
  "status": 400,
  "error": {
    "issues": [
      {
        "code": "invalid_type",
        "path": [...],
        ...
      }
    ]
  }
}
```

---

### 3.3 `DELETE /api/order/[id]`

#### 3.3.1 Description
Deletes an order with the given `id`. If it doesn’t exist, returns `404 Not Found`.

#### 3.3.2 cURL Example

```bash
curl -X DELETE \
  "https://your-domain.com/api/order/ORD-2025-03-21-ABC" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "database-id-hash: YOUR_DATABASE_ID_HASH"
```

#### 3.3.3 TypeScript `fetch` Example

```ts
async function deleteOrder(orderId: string) {
  const response = await fetch(`https://your-domain.com/api/order/${orderId}`, {
    method: "DELETE",
    headers: {
      "Authorization": "Bearer YOUR_API_KEY",
      "database-id-hash": "YOUR_DATABASE_ID_HASH"
    }
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(`Error deleting order: ${result.message}`);
  }
  console.log("Delete response:", result);
  return result;
}

// Usage:
deleteOrder("ORD-2025-03-21-ABC")
  .then(() => console.log("Order deleted."))
  .catch((err) => console.error(err));
```

#### Using the TypeScript API Client

```ts
import { OpenAgentsBuilderClient } from "open-agents-builder-client";

const client = new OpenAgentsBuilderClient({
  apiKey: "YOUR_API_KEY",
  databaseIdHash: "YOUR_DATABASE_ID_HASH"
});

async function deleteOrderClientExample(orderId: string) {
  const result = await client.order.deleteOrder(orderId);
  console.log("Order deleted:", result);
}

// Usage
deleteOrderClientExample("ORD-2025-03-21-ABC");
```

#### 3.3.4 Success Response (HTTP 200)

```json
{
  "message": "Order deleted",
  "status": 200
}
```

#### 3.3.5 Not Found (HTTP 404)

```json
{
  "message": "Not found",
  "status": 404
}
```

---

## 4. Encryption Details

In the `ServerOrderRepository`, these fields are stored **encrypted** at rest:

- `billingAddress`  
- `shippingAddress`  
- `attributes`  
- `notes`  
- `customer`  
- `email`

When you **create** or **update** an order, the server encrypts those fields before storing them in the database. When reading data, it decrypts them automatically.

> **Result**: If you look at the raw database, you’ll see ciphertext for these fields. The REST endpoint always returns plaintext to your client if you have a valid `storageKey`.

---

## 5. Example Workflow

1. **Create a new order**  
   - `PUT /api/order` with no `id` or a unique new `id`.  
   - Provide `items`, `email`, shipping method, etc. The server automatically calculates totals.  
2. **Retrieve orders** for admin UI  
   - `GET /api/order?limit=20&offset=0&orderBy=createdAt&query=someSearchTerm`  
3. **Update order** (add items, change status)  
   - `PUT /api/order` with the existing `id`.  
4. **Delete** an unwanted or canceled order  
   - `DELETE /api/order/[id]`.

---

## 6. Error Handling

- **400 Bad Request**  
  - Invalidation by `zod` schema or missing mandatory fields.  
- **404 Not Found**  
  - Attempt to `DELETE` an order that doesn’t exist.  
- **499 or 500 Internal Server Error**  
  - Unexpected issues (e.g., DB connection or encryption error).  
- **401 / 403 Unauthorized**  
  - Missing or invalid credentials (`Bearer token`, `database-id-hash`).

Each error typically includes a JSON structure with `"message"` and `"status"`.

---

## 7. Summary

| **Endpoint**                          | **Method** | **Purpose**                                         |
|---------------------------------------|-----------|-----------------------------------------------------|
| `/api/order?limit=&offset=...`       | **GET**    | List or search orders (paginated, sorted).         |
| `/api/order`                          | **PUT**    | Upsert (create or update) an order by `id`.        |
| `/api/order/[id]`                    | **DELETE** | Delete a specific order.                           |

**Important**:  
- **`calcTotals()`** automatically adjusts the price/tax fields on the server.  
- Encryption ensures sensitive data (addresses, email) remain secure.  
- An **audit log** records every create/update/delete action with the differences.

This completes the **Order** endpoint documentation, including **cURL**, **TypeScript `fetch`**, **and** **open-agents-builder-client** examples.

