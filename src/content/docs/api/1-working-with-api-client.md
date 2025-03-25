---
title: Working with the API Client
description: A fully-typed TypeScript client for Open Agents Builder
order: 30
---

**Note**: For a complete example project using this client, see the [Open Agents Builder Example](https://github.com/CatchTheTornado/open-agents-builder-example).

The **open-agents-builder-client** is a TypeScript client for the [Open Agents Builder](https://www.openagentsbuilder.com/) APIs. It provides modular classes for agents, keys, attachments, stats, audits, sessions, results, calendars, products, and orders. The library relies on **Zod** for type validation, allowing you to confidently work with the responses and requests.

## Key Features

- **Typed Data Transfer Objects (DTOs)** via Zod schemas  
- **Modular** approach: `client.agent`, `client.keys`, `client.attachment`, etc.  
- **Automatic** setup of request headers:
  - `Authorization: Bearer <API_KEY>`
  - `database-id-hash`
- **Multiple endpoints** supported:
  - `Agent`: `/api/agent`
  - `Keys`: `/api/keys`
  - `Attachments`: `/api/attachment`
  - `Stats` & `Audit` logs: `/api/stats`, `/api/audit`
  - `Results` & `Sessions`: `/api/result`, `/api/session`
  - `Calendar` Events: `/api/calendar`
  - `Products` & `Orders`: `/api/product`, `/api/order`
- **Configurable**:
  - Base URL (`baseUrl`)
  - Database ID Hash (`databaseIdHash`)
  - API Key (`apiKey`)

---

## Installation

```bash
npm install open-agents-builder-client zod
```

Or with Yarn:

```bash
yarn add open-agents-builder-client zod
```

---

## Initial Setup

```ts
import { OpenAgentsBuilderClient } from "open-agents-builder-client";

const client = new OpenAgentsBuilderClient({
  baseUrl: "https://app.openagentsbuilder.com", 
  databaseIdHash: "YOUR_DATABASE_ID_HASH",
  apiKey: "YOUR_API_KEY"
});
```

- `baseUrl` (optional): Defaults to `https://app.openagentsbuilder.com`
- `databaseIdHash` (required): Uniquely identifies your OAB account
- `apiKey` (required): The API key generated in OAB (not stored in the system after generation)

---

## API Overview

Below is a quick rundown of each resource. Each resource is encapsulated in its own class and exposed through the main `OpenAgentsBuilderClient`.

### Agent

All operations related to managing Agents:
- **listAgents**: Retrieve all agents
- **upsertAgent**: Create or update an agent
- **deleteAgent**: Remove an agent by ID

**Example**:

```ts
// List Agents
const agents = await client.agent.listAgents();
console.log("Agents:", agents);

// Upsert Agent
await client.agent.upsertAgent({
  displayName: "My New Agent",
  prompt: "You are a helpful AI assistant..."
});

// Delete Agent
await client.agent.deleteAgent("AGENT_ID");
```

---

### Keys

Managing API keys:
- **listKeys**: Retrieve a list of existing keys  
- **upsertKey**: Create or update a key  
- **deleteKey**: Remove a key by `keyLocatorHash`

**Example**:

```ts
// List Keys
const keys = await client.keys.listKeys();
console.log("Keys:", keys);

// Delete Key
await client.keys.deleteKey("LOCATOR_HASH_OF_THE_KEY");
```

> **Note**: For low-level details on how keys are generated (e.g., how `keyHash` and `keyLocatorHash` are created), see the [Key Context](https://github.com/CatchTheTornado/open-agents-builder/blob/a5b5582d1bcb5de04baa53e26ef58086f4c5d436/src/contexts/key-context.tsx#L91) in the official repo.

---

### Attachments

Managing files uploaded to OAB:
- **listAttachments**: Retrieve all attachments
- **queryAttachments**: Filter attachments by query parameters
- **upsertAttachment**: Create or update an attachment (e.g., for small or text-based files)
- **deleteAttachment**: Remove an attachment by `storageKey`
- **exportAttachments**: Export all attachments as a downloadable file

**Example**:

```ts
// List Attachments
const attachments = await client.attachment.listAttachments();

// Upsert Attachment
await client.attachment.upsertAttachment({
  storageKey: "my-file-key",
  displayName: "document.pdf",
  mimeType: "application/pdf",
  content: "Text content or base64..."
});

// Delete Attachment
await client.attachment.deleteAttachment("my-file-key");
```

> **Note**: For large binary files, you might need to extend the client to use `multipart/form-data`. See the [example project](https://github.com/CatchTheTornado/open-agents-builder-example) for details.

---

### Stats

Recording or retrieving usage stats:
- **putStats**: Create or update statistics
- **getAggregatedStats**: Retrieve aggregated usage data (e.g., monthly or daily tokens used)

**Example**:

```ts
// Record Stats
await client.stats.putStats({
  eventName: "sampleEvent",
  promptTokens: 50,
  completionTokens: 20
});

// Get Aggregated Stats
const { data } = await client.stats.getAggregatedStats();
console.log("This month's usage:", data.thisMonth);
```

---

### Audit

Logging and retrieving audit events:
- **listAudit**: Retrieve audit records with optional query parameters
- **createAuditLog**: Add a new entry to the audit log

**Example**:

```ts
// Create an Audit Log
await client.audit.createAuditLog({
  eventName: "updateProduct",
  recordLocator: JSON.stringify({ productId: "1234" }),
  diff: JSON.stringify({
    old: { name: "Old Product" },
    new: { name: "New Product" }
  })
});

// List Audit Logs
const audits = await client.audit.listAudit();
```

---

### Result

Storing and retrieving final outputs (`Result`s) from Agents or Sessions:
- **listResults**: Retrieve results with optional filters
- **deleteResult**: Remove a result by `sessionId`

**Example**:

```ts
// List Results
const results = await client.result.listResults();

// Delete a specific result
await client.result.deleteResult("SESSION_ID");
```

---

### Session

Storing and managing user sessions for chat or flows:
- **listSessions**: Retrieve sessions with optional filters
- **deleteSession**: Delete a session by `sessionId`

**Example**:

```ts
// List Sessions
const sessions = await client.session.listSessions({ agentId: "AGENT_ID" });

// Delete Session
await client.session.deleteSession("SESSION_ID");
```

---

### Calendar

Managing events in the built-in calendar module:
- **listEvents**: Fetch existing events
- **upsertEvent**: Create or update an event
- **deleteEvent**: Remove an event by its ID

**Example**:

```ts
// List Events
const events = await client.calendar.listEvents({ agentId: "AGENT_ID" });

// Upsert Event
await client.calendar.upsertEvent({
  id: "event-123",
  title: "Weekly Meeting",
  agentId: "AGENT_ID",
  start: "2025-03-21T10:00:00Z",
  end: "2025-03-21T11:00:00Z"
});
```

---

### Product

Managing products in the built-in PIM:
- **listProducts**: Retrieve all or filtered products
- **upsertProduct**: Create or update a product with variants, images, pricing, etc.
- **deleteProduct**: Remove a product by its ID

**Example**:

```ts
// List Products
const products = await client.product.listProducts();

// Upsert Product
await client.product.upsertProduct({
  sku: "PROD-XYZ",
  name: "New Product",
  description: "An awesome product"
});

// Delete Product
await client.product.deleteProduct("PRODUCT_ID");
```

---

### Order

Managing orders in the built-in Order Management System (OMS):
- **listOrders**: Retrieve all or filtered orders
- **upsertOrder**: Create or update an order (e.g., from a cart session)
- **deleteOrder**: Remove an order by its ID

**Example**:

```ts
// List Orders
const orders = await client.order.listOrders({ status: "new" });

// Upsert Order
await client.order.upsertOrder({
  status: "new",
  email: "customer@example.com",
  items: [
    {
      id: "item-123",
      productSku: "PROD-XYZ",
      quantity: 2,
      price: { value: 19.99, currency: "USD" },
    }
  ]
});
```

---

## Extending the Client

- **Zod Schemas**: Each API’s data is validated with Zod-based schemas (e.g., `agentDTOSchema`, `productDTOSchema`). You can use these or create custom schemas if you need additional fields.  
- **Multipart File Uploads**: For large file uploads (e.g., PDFs or images), you may want to extend `AttachmentApi` to handle `multipart/form-data`.  
- **New Endpoints**: You can add new modules or methods by extending the base `BaseClient` class and following a similar pattern for sending requests.

---

## Putting It All Together

Below is a simple example showing how you might combine multiple operations in one go:

```ts
// 1. Initialize the client
const client = new OpenAgentsBuilderClient({
  databaseIdHash: "YOUR_DATABASE_ID_HASH",
  apiKey: "YOUR_API_KEY"
});

// 2. Create an Agent
const newAgent = await client.agent.upsertAgent({
  displayName: "My Example Agent",
  prompt: "You are a helpful agent..."
});

// 3. Create a Product
await client.product.upsertProduct({
  sku: "SKU-123",
  name: "Cool Gadget",
  description: "A cool gadget for demonstration",
  price: { value: 99.99, currency: "USD" }
});

// 4. Record Stats
await client.stats.putStats({
  eventName: "agentCreation",
  promptTokens: 10,
  completionTokens: 5
});

// 5. Retrieve and log all Agents
const agents = await client.agent.listAgents();
console.log("All Agents:", agents);
```

---

## Contributing

We welcome **pull requests** and **issues** if you find bugs or want to suggest improvements. Please check the [GitHub repository](https://github.com/CatchTheTornado/open-agents-builder-client) for contribution guidelines and additional information.

---

## License

**MIT License** © [CatchTheTornado](https://www.catchthetornado.com/)

See the [LICENSE](https://github.com/CatchTheTornado/open-agents-builder-client/blob/main/LICENSE) file for details.