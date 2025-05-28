---
title: Working with the API Client
description: A fully‑typed TypeScript client for Open Agents Builder
order: 30
---

**Note**: For a complete example project using this client, see the [Open Agents Builder Example](https://github.com/CatchTheTornado/open-agents-builder-example).

The **open‑agents‑builder‑client** is a TypeScript client for the [Open Agents Builder](https://www.openagentsbuilder.com/) APIs. It provides fully‑typed, modular access to every public endpoint—agents, keys, attachments, stats, audits, sessions, results, calendars, products, orders, **memory**, **chat**, and **evals**. All request/response payloads are validated with **Zod**, so you get rock‑solid type‑safety and early runtime validation.

## Key Features

* **Typed Data Transfer Objects (DTOs)** via Zod schemas
* **Modular** approach: `client.agent`, `client.keys`, `client.attachment`, `client.memory`, `client.chat`, `client.evals`, etc.
* **Automatic** request headers:

  * `Authorization: Bearer <API_KEY>`
  * `Database‑Id‑Hash` (multi‑tenant isolation)
* **Wide endpoint coverage**:

  * `Agent` → `/api/agent`
  * `Keys` → `/api/keys`
  * `Attachments` → `/api/attachment`
  * `Stats` → `/api/stats`
  * `Audit` → `/api/audit`
  * `Results` → `/api/result`
  * `Sessions` → `/api/session`
  * `Calendar` → `/api/calendar`
  * `Products` → `/api/product`
  * `Orders` → `/api/order`
  * **Vector‑store Memory** → `/api/memory/*`
  * **Chat** → `/api/chat` (SSE streaming)
  * **Evaluation** → `/api/eval/*`
* **Configurable** base URL, database hash and API key
* **Built‑in streaming helpers** for chat and evaluations—yielding reasoning, tool calls, files, etc.

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
  baseUrl: "https://app.openagentsbuilder.com", // optional – this is the default
  databaseIdHash: "YOUR_DATABASE_ID_HASH",      // required
  apiKey: "YOUR_API_KEY"                        // required
});
```

`baseUrl` defaults to **`https://app.openagentsbuilder.com`**.
`databaseIdHash` and `apiKey` come from your OAB dashboard.

---

## API Overview

Every top‑level resource is exposed as a property on the main client:

| Property            | Class           | Purpose                        |
| ------------------- | --------------- | ------------------------------ |
| `client.agent`      | `AgentApi`      | CRUD Agents                    |
| `client.keys`       | `KeysApi`       | Manage signing/encryption keys |
| `client.attachment` | `AttachmentApi` | Upload / query attachments     |
| `client.stats`      | `StatsApi`      | Usage metrics                  |
| `client.audit`      | `AuditApi`      | Audit trail                    |
| `client.result`     | `ResultApi`     | Persisted Agent outputs        |
| `client.session`    | `SessionApi`    | Chat or flow sessions          |
| `client.calendar`   | `CalendarApi`   | Calendar events                |
| `client.product`    | `ProductApi`    | Products (PIM)                 |
| `client.order`      | `OrderApi`      | Orders (OMS)                   |
| `client.memory`     | `MemoryApi`     | Vector‑store memory            |
| `client.chat`       | `ChatApi`       | Streaming chat with Agents     |
| `client.evals`      | `EvalApi`       | Evaluate agents & test cases   |

Below you’ll find a quick reference for each module.

---

### Agent 🤖

* **`listAgents`** – fetch all agents
* **`upsertAgent`** – create or update an agent
* **`deleteAgent`** – remove an agent by ID

```ts
// List Agents
const agents = await client.agent.listAgents();

// Upsert Agent
await client.agent.upsertAgent({
  displayName: "My Helper Bot",
  prompt: "You are a helpful AI assistant…"
});

// Delete Agent
await client.agent.deleteAgent("AGENT_ID");
```

---

### Keys 🔑

* **`listKeys`**
* **`upsertKey`**
* **`deleteKey`**

```ts
const keys = await client.keys.listKeys();
await client.keys.deleteKey("KEY_LOCATOR_HASH");
```

> **How keys are generated** – see the [Key Context source](https://github.com/CatchTheTornado/open-agents-builder/blob/a5b5582d1bcb5de04baa53e26ef58086f4c5d436/src/contexts/key-context.tsx#L91).

---

### Attachments 📎

* **`listAttachments`**
* **`queryAttachments`** (server‑side filtering/querying)
* **`upsertAttachment`** – create/update small or text‑based files
* **`deleteAttachment`**
* **`exportAttachments`** – bulk export as a Blob

```ts
await client.attachment.upsertAttachment({
  storageKey: "doc.pdf",
  displayName: "Project Spec",
  mimeType: "application/pdf",
  content: "<base64‑encoded‑string>"
});
```

---

### Stats 📊

* **`putStats`** – record usage
* **`getAggregatedStats`** – monthly / daily token usage, cost & request counts

```ts
await client.stats.putStats({
  eventName: "agent.run",
  promptTokens: 130,
  completionTokens: 42
});

const { data } = await client.stats.getAggregatedStats();
console.log("Today’s usage:", data.today);
```

---

### Audit 🕵️

* **`listAudit`**
* **`createAuditLog`**

```ts
await client.audit.createAuditLog({
  eventName: "priceUpdate",
  diff: JSON.stringify({ old: 9.99, new: 12.99 })
});
```

---

### Result 🗂️

Persist assistant outputs or any artefacts generated during a session—perfect for auditing, hand‑off, or building analytics dashboards.

* **`listResults(params)`** – retrieve results, filterable by `sessionId`, `agentId`, `dateRange`, etc.
* **`deleteResult(sessionId)`** – purge all records linked to a session (irreversible).

```ts
// Fetch all assistant replies produced in a session
const logs = await client.result.listResults({ sessionId: "SESSION_ID" });

// Inspect the most recent answer
console.log("Assistant replied:", logs.at(-1)?.content);

// Remove the results once exported to your data‑lake
await client.result.deleteResult("SESSION_ID");
```

---

### Session  📑

Manage chat or flow sessions—useful for analytics or cleanup.

* **`listSessions(params)`** – supports pagination & filtering by `agentId`, `dateRange`, etc.
* **`deleteSession(sessionId)`** – hard‑deletes a session and cascades to its results & stats.

```ts
// List the 20 most recent sessions for a specific Agent
const sessions = await client.session.listSessions({
  agentId: agent.id!,
  limit: 20,
  offset: 0,
  sort: "createdAt:desc"
});

// Wipe a test session after QA
await client.session.deleteSession("SESSION_ID");
```

---

### Calendar  📅

Create and query **iCal‑style events** so your Agent can schedule meetings or block time.

* **`listEvents(params)`** – filter by `start`, `end`, `agentId`, `exclusive`, etc.
* **`upsertEvent(event)`** – create or update (idempotent by `id`).
* **`deleteEvent(eventId)`** – remove an event.

```ts
// Block 30 minutes for a product demo
await client.calendar.upsertEvent({
  id: crypto.randomUUID(),
  title: "Demo call with Acme",
  agentId: agent.id!,
  start: "2025-06-02T10:00:00Z",
  end: "2025-06-02T10:30:00Z",
  location: "Zoom"
});

// Pull all events for June 2025
const june = await client.calendar.listEvents({
  agentId: agent.id!,
  start: "2025-06-01",
  end: "2025-06-30"
});

// Cancel an event
await client.calendar.deleteEvent(june[0].id);
```

---

### Product  🛍️

Store **catalog data**—prices, variants, attributes—ready for RAG or order processing.

* **`listProducts(params)`** – full‑text search & pagination (`query`, `limit`, `offset`).
* **`upsertProduct(product)`** – insert or patch by `sku` / `id`.
* **`deleteProduct(productId)`** – logical delete.

```ts
// Upsert a simple product with two color variants
await client.product.upsertProduct({
  sku: "TSHIRT-BASE",
  name: "Unisex Tee",
  price: { value: 19.99, currency: "USD" },
  variants: [
    { sku: "TSHIRT-BASE-RED-M", name: "Red / M", price: { value: 19.99, currency: "USD" } },
    { sku: "TSHIRT-BASE-RED-L", name: "Red / L", price: { value: 19.99, currency: "USD" } }
  ],
  images: [
    { url: "https://cdn.example.com/img/tee-red.png", alt: "Front view" }
  ],
  tags: ["tshirt","summer"]
});

// Quick catalog search
const tees = await client.product.listProducts({ query: "tshirt", limit: 10 });

// Retire a SKU
await client.product.deleteProduct("TSHIRT-BASE");
```

---

### Order  📦

End‑to‑end **OMS** primitives—quotes, carts, fulfilment, status tracking.

* **`listOrders(params)`** – filter by `status`, `date`, `email`, etc.
* **`upsertOrder(order)`** – create or update (by `id`).
* **`deleteOrder(orderId)`** – remove an order.

```ts
// ➊ Create a new order from a cart
const order = await client.order.upsertOrder({
  status: "new",
  email: "jane@example.com",
  items: [{
    id: crypto.randomUUID(),
    productSku: "TSHIRT-BASE",
    variantSku: "TSHIRT-BASE-RED-M",
    price: { value: 19.99, currency: "USD" },
    quantity: 2
  }],
  shippingPrice: { value: 5, currency: "USD" },
  total: { value: 44.98, currency: "USD" }
});

// ➋ Transition to "shipped"
await client.order.upsertOrder({
  id: order.id!,
  status: "shipped",
  statusChanges: [
    ...(order.statusChanges ?? []),
    { date: new Date().toISOString(), message: "Label created", newStatus: "shipped" }
  ]
});

// ➌ List all completed orders this week
const fulfilled = await client.order.listOrders({
  status: "completed",
  from: "2025-05-26",
  to: "2025-06-02"
});
```

---

### Memory  🧠

Vector‑store operations for long‑term memory, RAG or embeddings:

* **`createStore(name)`** – create an empty store
* **`listStores({ limit, offset, query })`** – paginated listing & search
* **`getStore(filename)`** – download entire store
* **`deleteStore(filename)`** – remove a store
* **`listRecords(filename, { embeddingSearch, topK })`** – filter/semantic search
* **`createRecord(filename, record)`** – add an embedding & metadata
* **`deleteRecord(filename, recordId)`**
* **`generateEmbeddings(content)`** – call the backend’s embedding model

```ts
// Create a store
await client.memory.createStore("support‑kb");

// Add a record (after generating an embedding)
const { embedding } = await client.memory.generateEmbeddings("How do I reset my password?");
await client.memory.createRecord("support‑kb", {
  id: crypto.randomUUID(),
  content: "How do I reset my password?",
  embedding,
  metadata: { source: "FAQ" }
});

// Semantic search – top‑3 most similar
const results = await client.memory.listRecords("support‑kb", {
  embeddingSearch: "reset password forgotten",
  topK: 3
});
```

---

### Chat  💬

Low‑latency chat with an Agent. The backend streams **Server‑Sent Events (SSE)** using the Vercel AI protocol. The client ships three convenience helpers:

| Method                            | What it does                                                                              |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| `chat(messages, opts)`            | Returns the raw `Response` so you can read the stream manually                            |
| `streamChat(messages, opts)`      | Async generator yielding decoded chunks (`text`, `tool_call`, etc.)                       |
| `collectMessages(messages, opts)` | Awaits the entire response, returns the full assembled assistant message & next sessionId |

#### Minimal example (non‑streaming)

```ts
import { ChatMessage } from "open-agents-builder-client";

const system: ChatMessage = { role: "system", content: "You are a poet." };
const user:   ChatMessage = { role: "user",   content: "Write a haiku about spring." };

const { messages: fullHistory } = await client.chat.collectMessages(
  [system, user],
  { agentId: "AGENT_ID" }
);

console.log(fullHistory[fullHistory.length - 1].content);
```

#### Streaming with async iteration

```ts
for await (const chunk of client.chat.streamChat([
  { role: "user", content: "Stream me some wisdom" }
], { agentId: "AGENT_ID" })) {
  if (chunk.type === "text") process.stdout.write(chunk.content);
}
```

#### Handling attachments

If you supply a local file path in an attachment (`{ file: "./logo.png" }`) the helper automatically reads the file, infers MIME type (png, jpeg, pdf) and sends it as an in‑line `data:` URL—no extra work required.

```ts
await client.chat.collectMessages([
  {
    role: "user",
    content: "What’s in this image?",
    experimental_attachments: [
      { file: "./parrot.png" }
    ]
  }
], { agentId: "VISION_AGENT" });
```

---

### Evaluation Framework  🧪

The client ships a **comprehensive evaluation framework** that lets you *generate*, *run* and *iterate* test cases against any Agent. This is invaluable for regression testing, prompt‑engineering experiments and continuous performance tracking.

| Method                                                | Description                                                                                           |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `generateTestCases(agentId, prompt)`                  | Produce a curated set of diverse test cases derived from the Agent’s system prompt.                   |
| `runTestCases(agentId, testCases)`                    | Execute the test suite and **stream** incremental updates (`test_case_update`) as each case finishes. |
| `adjustTestCase(agentId, testCaseId, actualResponse)` | Update an existing case when real‑world behaviour diverges from expectations.                         |

#### Generate Test Cases

```ts
const { testCases } = await client.evals.generateTestCases(
  "AGENT_ID",
  "You are a helpful assistant that can answer questions about various topics."
);
console.log("Generated test cases:", testCases);
```

#### Run Test Cases (streaming)

```ts
const stream = await client.evals.runTestCases("AGENT_ID", testCases);
const reader = stream.getReader();
const decoder = new TextDecoder();

while (true) {
  const { value, done } = await reader.read();
  if (done) break;

  // SSE chunks are JSONL
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n').filter(line => line.trim());

  for (const line of lines) {
    const update = JSON.parse(line);
    if (update.type === "test_case_update") {
      const testCase = update.data;
      console.log(`Test case ${testCase.id}: ${testCase.status}`);
      if (testCase.evaluation) {
        console.log(`  Score:        ${testCase.evaluation.score}`);
        console.log(`  Explanation:  ${testCase.evaluation.explanation}`);
      }
    }
  }
}
```

#### Adjust Test Cases

If a test fails—or you want to incorporate the real answer returned by the Agent—call `adjustTestCase`:

```ts
const adjusted = await client.evals.adjustTestCase(
  "AGENT_ID",
  "TEST_CASE_ID",
  "This is the actual result we got"
);
console.log("Adjusted test case:", adjusted.testCase);
```

#### What You Get

* **Automatic test‑case synthesis** tuned to the Agent’s scope & instructions
* **Real‑time feedback loop** via SSE (`test_case_update` events)
* **Granular scores & rationales** (pass/fail or 0‑100) to quantify quality
* **Seamless RAG & tool‑call support** for complex, multi‑step flows
* **One‑line adjustments** keep your ground‑truth constantly in sync

> **TIP** Integrate the evaluation run into your CI pipeline for bullet‑proof guardrails before shipping prompt changes.

---

## Extending the Client

* **Multipart uploads** – For very large binaries you may extend `AttachmentApi` to use `multipart/form-data` instead of base64.
* **Custom schemas** – All DTO schemas are exported; compose or extend them with `z.intersection` or `z.extend`.
* **New endpoints** – Derive a new class from `BaseClient` and add methods following the same `request()` convention.

---

## Putting It All Together

```ts
// 1 · Init
const client = new OpenAgentsBuilderClient({
  databaseIdHash: "YOUR_DB_HASH",
  apiKey: "YOUR_API_KEY"
});

// 2 · Create an Agent
const agent = await client.agent.upsertAgent({
  displayName: "Helper",
  prompt: "You are very helpful"
});

// 3 · Chat
const history = [ { role: "user", content: "Hello" } ];
const { messages, sessionId } = await client.chat.collectMessages(history, { agentId: agent.id! });
console.log("Assistant says:", messages.at(-1)?.content);

// 4 · Store the conversation in vector memory
await client.memory.createStore("conversations");
await client.memory.createRecord("conversations", {
  id: sessionId!,
  content: JSON.stringify(messages),
  embedding: (await client.memory.generateEmbeddings(messages.at(-1)?.content ?? "")).embedding,
  metadata: { agentId: agent.id }
});

// 5 · Stats
await client.stats.putStats({ eventName: "chat", promptTokens: 15, completionTokens: 25 });

// 6 · Evaluate the Agent after an update
const { testCases } = await client.evals.generateTestCases(agent.id!, agent.prompt);
await client.evals.runTestCases(agent.id!, testCases); // stream & assert in CI
```
