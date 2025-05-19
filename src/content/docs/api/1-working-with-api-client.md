---
title: Working with the API Client
description: A fully‑typed TypeScript client for Open Agents Builder
order: 30
---

**Note**: For a complete example project using this client, see the [Open Agents Builder Example](https://github.com/CatchTheTornado/open-agents-builder-example).

The **open‑agents‑builder‑client** is a TypeScript client for the [Open Agents Builder](https://www.openagentsbuilder.com/) APIs. It provides fully‑typed, modular access to every public endpoint—agents, keys, attachments, stats, audits, sessions, results, calendars, products, orders, **memory**, and **chat**. All request/response payloads are validated with **Zod**, so you get rock‑solid type‑safety and early runtime validation.

## Key Features

* **Typed Data Transfer Objects (DTOs)** via Zod schemas
* **Modular** approach: `client.agent`, `client.keys`, `client.attachment`, `client.memory`, `client.chat`, etc.
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
* **Configurable** base URL, database hash and API key
* **Built‑in streaming helpers** for chat—yielding reasoning, tool calls, files, etc.

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

Below you’ll find a quick reference for each module.

---

### Agent

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

### Keys

* **`listKeys`**
* **`upsertKey`**
* **`deleteKey`**

```ts
const keys = await client.keys.listKeys();
await client.keys.deleteKey("KEY_LOCATOR_HASH");
```

> **How keys are generated** – see the [Key Context source](https://github.com/CatchTheTornado/open-agents-builder/blob/a5b5582d1bcb5de04baa53e26ef58086f4c5d436/src/contexts/key-context.tsx#L91).

---

### Attachments

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

### Stats

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

### Audit

* **`listAudit`**
* **`createAuditLog`**

```ts
await client.audit.createAuditLog({
  eventName: "priceUpdate",
  diff: JSON.stringify({ old: 9.99, new: 12.99 })
});
```

---

### Result

* **`listResults`**
* **`deleteResult`**

---

### Session

* **`listSessions`**
* **`deleteSession`**

---

### Calendar

* **`listEvents`**
* **`upsertEvent`**
* **`deleteEvent`**

---

### Product

* **`listProducts`**
* **`upsertProduct`**
* **`deleteProduct`**

---

### Order

* **`listOrders`**
* **`upsertOrder`**
* **`deleteOrder`**

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
```

---

## Contributing

We welcome **pull requests** and **issues**! See the [GitHub repo](https://github.com/CatchTheTornado/open-agents-builder-client) for guidelines.

---

## License

**MIT License** © [CatchTheTornado](https://www.catchthetornado.com/)

See the [LICENSE](https://github.com/CatchTheTornado/open-agents-builder-client/blob/main/LICENSE) for details.
