---
title: Evals API
description: How to run agent's evaluations
---

> **Note** – All endpoints sit behind the same authentication layer used across Open Agents Builder.
> You **must** send a valid **Bearer API key** *and* the **database-id-hash** header with every request.

---

## 1. Overview

With this API you can:

| # | Capability                                                            | Endpoint                                   |
| - | --------------------------------------------------------------------- | ------------------------------------------ |
| 1 | **Generate** test-cases directly from an agent’s system prompt        | `POST /api/agent/{agentId}/evals/generate` |
| 2 | **Run** one or many cases (streamed ND-JSON)                          | `POST /api/agent/{agentId}/evals/run`      |
| 3 | **Adjust** a failed case so that it becomes the *new* source-of-truth | `POST /api/agent/{agentId}/evals/adjust`   |

---

## 2. Mandatory Request Headers

| Header                                                | Description                                       |
| ----------------------------------------------------- | ------------------------------------------------- |
| `Authorization: Bearer <OPEN_AGENTS_BUILDER_API_KEY>` | API key obtained from **Settings → API Keys**     |
| `database-id-hash: <YOUR_DATABASE_ID_HASH>`           | Constant per-workspace hash (visible in Settings) |
| *Optional* `Content-Type: application/json`           | Required for `POST` bodies                        |

**Example**

```text
Authorization: Bearer abc1234exampleKey
database-id-hash: 35f5c5b139a6b569d4649b788c1851831eb44d8e32b716b8411ec6431af8121d
Content-Type: application/json
```

---

## 3. Data Models & Validation Rules (Exact Schema)

Below are the *canonical* TypeScript-style definitions, reconstructed **directly from the Zod validators in the source code**.

### 3.1 Tool Call (inside a test-case request)

```ts
export interface ToolCallRequest {
  name: string;                           // tool identifier, e.g. "checkAvailability"
  arguments: Record<string, unknown>;     // JSON-serialisable args
}
```

### 3.2 Chat Message

```ts
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  /** present **only** in assistant messages that simulate tool usage */
  toolCalls?: ToolCallRequest[];
}
```

> **Validation notes**
>
> * `role` must be exactly `"user"` or `"assistant"`.
> * `content` cannot be empty.
> * `toolCalls` is **optional** and, when provided, must be a **non-empty array** of valid `ToolCallRequest`s.

### 3.3 Test Case (`/evals/generate` & `/evals/run` payload)

```ts
export interface TestCase {
  id: string;                  // unique across the suite (client generates or taken from /generate)
  messages: ChatMessage[];     // ≥ 2 items (at least 1 user + 1 assistant)
  expectedResult: string;      // natural-language assertion to grade against
}
```

Zod reference (`testCaseSchema`):

```ts
z.object({
  id: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
      toolCalls: z.array(
        z.object({
          name: z.string(),
          arguments: z.record(z.unknown())
        })
      ).optional()
    })
  ),
  expectedResult: z.string()
})
```

### 3.4 Evaluation Object (returned by `/evals/run` & `/evals/adjust`)

```ts
export interface EvaluationResult {
  isCompliant: boolean;   // true ⇢ meets or exceeds expectations
  explanation: string;    // concise reasoning produced by the LLM rubric
  score: number;          // 0.0 → 1.0
}
```

Zod reference (`evaluationSchema`):

```ts
z.object({
  isCompliant: z.boolean(),
  explanation: z.string(),
  score: z.number().min(0).max(1)
})
```

### 3.5 Conversation Flow (object streamed back during `/evals/run`)

```ts
export interface ToolCallRuntime {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  result: unknown;
}

export interface ConversationFlow {
  messages: (ChatMessage & {        // same structure as request messages
    /** runtime-filled tool call results */
    toolCalls?: ToolCallRuntime[];
  })[];
  /** flattened list of tool calls for quick inspection */
  toolCalls?: ToolCallRuntime[];
}
```

---

These models are **strictly enforced** at runtime via Zod; any payload that deviates will trigger a `400 Bad Request` (during adjustment/generation) or a `500 Internal Server Error` (during run).




## 4. Endpoints & Usage

### 4.1 GENERATE  `/api/agent/{id}/evals/generate`

Create a ready-to-run test-suite from your agent’s prompt.

| Method | Body                                        |
| ------ | ------------------------------------------- |
| `POST` | `json { "prompt": "Full system prompt…" } ` |

<details>
<summary>Example – Generate test-cases (cURL)</summary>

```bash
curl -X POST \
  https://app.example.com/api/agent/agt_123/evals/generate \
  -H "Authorization: Bearer abc1234exampleKey" \
  -H "database-id-hash: 35f5c5b139a6b569..." \
  -H "Content-Type: application/json" \
  -d '{ "prompt": "You are a salon booking assistant..." }'
```

</details>

**Success (200)**

```jsonc
{
  "testCases": [
    {
      "id": "tc-book-haircut",
      "messages": [
        { "role": "user", "content": "I want to book a haircut." },
        { "role": "assistant", "content": "Sure – what time suits you?" }
      ],
      "expectedResult": "The haircut is successfully booked for next Monday at 10 AM."
    },
    ...
  ]
}
```

**Errors**

| Code | Body                                           | Meaning                      |
| ---- | ---------------------------------------------- | ---------------------------- |
| 500  | `{ "error": "Failed to generate test cases" }` | LLM failure or invalid input |

---

### 4.2 RUN  `/api/agent/{id}/evals/run`

Execute one or many test-cases **streaming** progress & results.

| Method | Body                                        |
| ------ | ------------------------------------------- |
| `POST` | `json { "testCases": [/* TestCase[] */] } ` |

*The endpoint returns `Transfer-Encoding: chunked` & emits **ND-JSON** (one JSON object per line).*

#### 4.2.1 Stream Event Shapes

| `type`             | Payload `data` fields                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `test_case_update` | `status` (`running` \| `TX` \| `RX` \| `completed` \| `warning` \| `failed`), `actualResult`, `evaluation`, `conversationFlow`, `sessionId`, … |
| `test_case_error`  | `error`, `status:"failed"`, `sessionId`, full original test case                                                                               |
| `error`            | Top-level fatal issue (`error` string)                                                                                                         |

#### 4.2.2 Status Colours & Thresholds

| Final `status` | Condition            | Meaning       |
| -------------- | -------------------- | ------------- |
| `completed`    | `score ≥ 0.75`       | Passed        |
| `warning`      | `0.5 ≤ score < 0.75` | Partial match |
| `failed`       | `score < 0.5`        | Failed        |

<details>
<summary>Example – Run two cases and print results (Node)</summary>

```ts
import fetch from 'node-fetch';
import { createInterface } from 'readline';

const body = JSON.stringify({ testCases: myCases });
const res = await fetch('https://app.example.com/api/agent/agt_123/evals/run', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer abc1234exampleKey',
    'database-id-hash': '35f5c5b139a6b569...',
    'Content-Type': 'application/json'
  },
  body
});

const rl = createInterface({ input: res.body! });
rl.on('line', line => {
  const evt = JSON.parse(line);
  if (evt.type === 'test_case_update' && ['completed','failed','warning'].includes(evt.data.status)) {
    console.log(evt.data.id, '→', evt.data.status, '(' + evt.data.evaluation.score + ')');
  }
});
```

</details>

**Errors**

| Code | Body                                       |
| ---- | ------------------------------------------ |
| 500  | `{ "error": "Failed to run evaluations" }` |

---

### 4.3 ADJUST  `/api/agent/{id}/evals/adjust`

Let the LLM rewrite a failing test-case to match a new, legitimate behaviour.

| Method | Body                                                                                                |
| ------ | --------------------------------------------------------------------------------------------------- |
| `POST` | `json { "testCaseId": "<string>", "actualResult": "Assistant reply that should become expected" } ` |

<details>
<summary>Example – Adjust after a spec change (cURL)</summary>

```bash
curl -X POST \
  https://app.example.com/api/agent/agt_123/evals/adjust \
  -H "Authorization: Bearer abc1234exampleKey" \
  -H "database-id-hash: 35f5c5b139a6b569..." \
  -H "Content-Type: application/json" \
  -d '{
        "testCaseId": "tc-book-haircut",
        "actualResult": "Your appointment is locked for 3 PM on 4 June, see you then!"
      }'
```

</details>

**Success (200)**

```json
{
  "testCase": {
    "id": "tc-book-haircut",
    "messages": [
      { "role": "user", "content": "I'd like to book a haircut." },
      { "role": "assistant", "content": "Your appointment is locked for 3 PM on 4 June, see you then!" }
    ],
    "expectedResult": "Your appointment is locked for 3 PM on 4 June, see you then!",
    "status": "completed",
    "evaluation": {
      "isCompliant": true,
      "explanation": "Test case adjusted to match actual result",
      "score": 1
    }
  }
}
```

**Errors**

| Code | Body                                        |
| ---- | ------------------------------------------- |
| 500  | `{ "error": "Failed to adjust test case" }` |

---

## 5. Error Handling (General)

| Code      | When / Why                                              |
| --------- | ------------------------------------------------------- |
| 400       | Validation issues (missing body field, malformed JSON…) |
| 401 / 403 | Invalid or missing API key / database-hash              |
| 404       | Agent ID not found                                      |
| 500       | Internal errors (LLM time-out, tool failure, etc.)      |

Error payloads follow:

```jsonc
{
  "error": "Human-readable description",
  "status": 500      // optional numeric code
}
```

---

## 6. Best Practices & Notes

* **Store tests in Git** – keep the JSON you receive from **Generate** in source-control.
* **CI Automation** – hit `/evals/run` in your pipeline; fail the build when any case returns `failed`.
* **Dynamic dates** – prefer relative dates (e.g., “next Monday”) so the suite stays evergreen.
* **Score thresholds** – raise the pass bar to `≥ 0.9` for stricter QA, or read the explanation string for granular gating.
* **Streaming** – always treat `/run` as an infinite stream until the connection closes; do not wait for `Content-Length`.

---

## 7. Summary of Endpoints

| # | Verb     | URL                                                                    |
| - | -------- | ---------------------------------------------------------------------- |
| 1 | **POST** | `/api/agent/{id}/evals/generate` – build a suite from the agent prompt |
| 2 | **POST** | `/api/agent/{id}/evals/run` – run one/many tests (stream ND-JSON)      |
| 3 | **POST** | `/api/agent/{id}/evals/adjust` – auto-repair a failing test            |

---

**End of Documentation**
