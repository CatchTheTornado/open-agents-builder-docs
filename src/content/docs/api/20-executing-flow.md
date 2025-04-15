---
title: Executing Flow via API
description: How to execute flow-type agent via API
---

Below is a **step-by-step** tutorial on how to **execute a Flow-type agent via the API** in **Open Agents Builder**, **including** details of the `FlowChunkType` and `FlowChunkEvent` interfaces.

---

## 1. **Introduction: Why a Flow-type Agent?**

A **Flow-type** agent in Open Agents Builder enables **business users** to define and adapt business logic dynamically (through flows), while **developers** can call a **static REST endpoint** to run that logic. By separating the flow logic from the code, you get:

- A user-friendly interface for business analytics or non-developer users.
- On-the-fly updates to business rules (no code changes needed).
- A stable API endpoint for developers to integrate into existing applications.

---

## 2. **Prerequisites**

Before you begin:

1. Ensure you have **Open Agents Builder** set up.
2. [**Create an API key**](/api/0-creating-api-key.md) and have it at hand for authorization.
3. (Optional) Read up on [**concepts and architecture**](/guides/2-concepts) to understand how flows, sessions, and tools work together.
4. Be familiar with [**creating your first agent**](/guides/4-creating-first-agent) – but in this case, you’ll ensure to create it as a **Flow/API** type agent.

---

## 3. **Creating a Flow-Type Agent**

1. In the Open Agents Builder admin panel, **create a new agent**.
2. Select **Flow/API** as the **Agent Type**.
3. Define one or more **Flows** within that agent. Each flow has:
   - A **code** (an identifier like `import` or `processOrder`).
   - **Inputs** (variables your flow expects, possibly including file inputs in Base64).
   - A **flow diagram** describing the logic.

Once created, you now have an agent that can be executed via a REST API call. 

**Tip**: Mark it as **published** if you want external calls (outside an authorized admin context) to be allowed. If it’s **not published**, calls require admin credentials.

---

## 4. **Endpoint to Execute Flow**

Your main endpoint to **execute** a Flow inside your agent is:

```
POST /api/agent/${agentId}/exec
```

### Request Headers

- **Authorization**: `Bearer YOUR_API_KEY`  
  (See [Creating an API Key](/api/0-creating-api-key))

- **database-id-hash**: A unique hash referencing your database/tenant.  
  (Check your database’s hash in **Admin > API**.)

- **Agent-Session-Id** (optional): If you want to continue a session. Otherwise, a random `sessionId` is generated.

- **Content-Type**: `application/json`

### Request Body

```json
{
  "flow": "import",
  "execMode": "sync",
  "outputMode": "stream",
  "input": {}
}
```

| Field       | Description                                                                                                                               |
|-------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| `flow`      | The **code** name of the Flow you want to execute (e.g. `"import"`). If you omit it, the **agent’s defaultFlow** is used (if set).        |
| `execMode`  | `sync` or `async`. <br><br>**sync**: The flow executes immediately, and the response includes either a **stream** of chunks or a single result (if `outputMode=buffer`). <br>**async**: The flow executes in the background, and the response returns just `{ "sessionId": "...", "resultUrl": "..."} `. You can fetch the final output from the `resultUrl`. |
| `outputMode` | `stream` or `buffer`. <br><br>**stream**: The response is chunked (long-lived connection) with incremental updates in JSON lines. <br>**buffer**: The endpoint waits until execution finishes, then returns all results in one single JSON.                                                    |
| `input`     | A dictionary of inputs for your flow, e.g. `{ "username": "pkarw", "orderFile": "...(base64)..." }`. If your Flow expects files, they should be **base64-encoded**. |

#### Example cURL

```bash
curl -X POST \
  -H "Authorization: Bearer ${OPEN_AGENT_BUILDER_API_KEY}" \
  -H "database-id-hash: 35f5c5b139a6b569d4649b788c1851831eb44d8e32b716b8411ec6431af8121d" \
  -H "Content-Type: application/json" \
  -d '{"flow":"import","execMode":"sync","outputMode":"stream"}' \
  https://app.openagentsbuilder.com/api/agent/m8r22uvT2_KsMODoEw9ag/exec
```

> **Note**: The `database-id-hash` is unique per database/data owner. Find it under **Admin > API**.  
> If the agent is not published, you also need admin privileges or an admin token to avoid 401 errors.

---

## 5. **Passing Inputs (Including Files)**

If your flow’s input schema declares certain variables, you can pass them via `input`. For example:

```json
{
  "flow": "import",
  "execMode": "sync",
  "input": {
    "userName": "pkarw",
    "orderFile": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
  }
}
```

- **Files**: If the flow input is typed as `fileBase64`, you must read the file, **encode** it in **Base64**, and set the `orderFile` value (or whatever the variable name is).  
- **Mime Type**: Ensure the string starts with something like `data:image/jpeg;base64,` if you want the flow to recognize it as an image.

---

## 6. **Stream vs. Buffer Output**

### Stream (`"outputMode":"stream"`)
- **Default** behavior for **sync** calls.
- The response is sent as a **chunked stream**.
- Each JSON chunk is separated by a newline (`\n`).
- You can parse them as they arrive to get **real-time** updates on flow progress.

**Sample chunked stream:**
```json
{
    "type": "stepFinish",
    "name": "Extracting text from files ...",
    "timestamp": "2025-03-21T09:46:55.370Z"
}{
    "type": "flowStart",
    "flowNodeId": "thBrmSYYbtTzXLAthUwhe",
    "message": "Params: `{\"flow\":\"import\",\"input\":{\"orderFile\":\"File content removed\"},...}`",
    "name": "Executing flow import",
    "timestamp": "2025-03-21T09:46:55.373Z"
}
...
{
    "type": "toolCalls",
    "flowNodeId": "XirxLY6Poi94bDGZkwebv-GbLf40p8yj9mag0z6U-1U",
    "name": "Order agent (gpt-4o)",
    "message": "**currentDate** ...",
    "toolResults": [...]
}
{
    "type": "finalResult",
    "flowNodeId": "someId",
    "name": "import",
    "result": {"someKey":"someValue"}
}
```

### Buffer (`"outputMode":"buffer"`)
- If `stream` is **not** desired, set `"outputMode":"buffer"`.
- The server holds the connection until the flow completes.
- A **single** JSON response is returned at once, containing the final result.

> **Tip**: If you choose `"execMode":"async"`, you automatically get a **non-stream** response with just a `sessionId` + a link to retrieve the results later.

---

## 7. **Full Example of Stream Parsing in TypeScript**

Below is a small snippet showing how you might **consume** the chunked stream on the client side:

```typescript
export class FlowExecApiClient {
  async *execStream(
    agentId: string,
    flowId: string,
    uiState: any,
    input: any,
    execMode: string,
    headers: Record<string, string>
  ): AsyncGenerator<any, void, unknown> {
    const body = JSON.stringify({ 
      flow: flowId, 
      input, 
      execMode, 
      outputMode: "stream", 
      uiState 
    });

    const response = await fetch(`https://openagentsbuilder.com/api/agent/${agentId}/exec`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers
      },
      body
    });

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop()!; // keep the incomplete chunk in buffer

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          yield JSON.parse(line);
        } catch (err) {
          console.error("JSON parse error:", err, "\nLine:", line);
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim()) {
      try {
        yield JSON.parse(buffer);
      } catch (err) {
        console.error("JSON parse error:", err, "\nLine:", buffer);
      }
    }
  }
}
```

This code reads the stream in chunks, splits by newline, and yields each chunked JSON object one by one.

---

## 8. **FlowChunkType and FlowChunkEvent Specifications**

When you run a flow in **stream** mode, each chunk is a `FlowChunkEvent` describing a piece of execution progress. Below is an example of how **FlowChunkType** and **FlowChunkEvent** are defined in code:

```typescript
export enum FlowChunkType {
  FlowStart = "flowStart",
  FlowStepStart = "flowStepStart",
  FlowFinish = "flowFinish",
  Generation = "generation",
  GenerationEnd = "generationEnd",
  ToolCalls = "toolCalls",
  TextStream = "textStream",
  FinalResult = "finalResult",
  Error = "error",
  Message = "message",
  UIComponent = "uiComponent" // e.g. a custom React component
}

export interface FlowChunkEvent {
  type: FlowChunkType;
  flowNodeId?: string;
  flowAgentId?: string;
  duration?: number;
  name?: string;
  timestamp?: Date;
  issues?: any[];

  result?: string | string[];
  message?: string;
  input?: any;

  // If this chunk describes tool calls and results:
  toolResults?: Array<{
    args?: any;
    result?: string;
  }>;

  // If this chunk includes final messages
  messages?: Array<{
    role: string;
    content: Array<{ type: string; text: string }>;
    id?: string;
  }>;
}
```

**Common chunk types**:
- `flowStart` / `flowFinish`: Marks when the flow begins or ends.
- `flowStepStart`: Each node or step within the flow has started execution.
- `generation`: AI model generation output chunk.
- `toolCalls`: Summaries of **tool usage** (if the flow or sub-agent used any tools).
- `finalResult`: The **end** chunk containing the final result returned by the flow.
- `error`: Something went wrong.

You can use these chunk types to track how your flow is executing in near-real-time, handle errors gracefully, or display progress in a UI.

---

## 9. **Behind the Scenes: `/src/api/agent/[id]/exec`**

Below is a **simplified overview** of what happens server-side when you hit `POST /api/agent/[id]/exec`:

1. **Headers Check**: It extracts your `database-id-hash`, `Agent-Session-Id`, and the target `agentId` from either headers or URL params.
2. **Authorization**: 
   - Checks if you have a valid **API Key**.
   - Verifies if the agent is **published**. If not, you need admin credentials.
3. **Request Body**: 
   - Expects `flow`, `execMode`, `outputMode`, `input`.
4. **Locate the Flow**: Finds the agent in DB, looks for the specified flow by its `code`.
5. **Exec Mode**:
   - `async` => schedules flow in background, returns a minimal JSON with `sessionId` and a `resultUrl`.
   - `sync` => runs the flow immediately.
6. **Output Mode**:
   - `stream` => creates a **ReadableStream** and sends chunked `FlowChunkEvent` updates.
   - `buffer` => executes fully and returns the final result as a single JSON object.
7. **Flow Execution**:  
   - The system compiles your flow, injects variables, processes Base64 files, and orchestrates calls to sub-agents or tools.
   - If streaming, each step or tool call is emitted as a JSON chunk (`FlowChunkEvent`).
8. **Result Storage**: The final answer is saved in your database, so it can be retrieved later (especially useful in `async` mode).

### The Actual Implementation

If you want to see the **full** source code of `POST /api/agent/[id]/exec`, check:

```
/src/api/agent/[id]/exec/route.ts
```

It includes:

- **SaaS** mode checks (`saasContext`).
- Tools and flows integration via `execFlowTool`.
- Handling of both streaming and non-streaming execution paths.
- Error handling with Zod validations, environment variable checks, etc.

*(See the code snippet in your question for the entire listing.)*

---

## 10. **Summary**

- **Flow-type** agents provide a **powerful, dynamic** way to manage business logic.
- **Developers** can call a **stable** REST endpoint (`POST /api/agent/${agentId}/exec`) using minimal JSON input.
- **Business users** can update flow diagrams, tools, or logic **on the fly** without needing new code deployments.
- The **API** supports **streaming** or **buffered** modes, **sync** or **async** execution, and **file** (Base64) inputs.
- The **output** is broken down into **FlowChunkEvent** objects, each describing a part of the flow execution process.

With this approach, your organization can iterate rapidly on business requirements, while your developers integrate a single endpoint for each agent flow. If you need deeper customization—e.g., building custom tools or transformations—see the [Extending Open Agents Builder with new tools](/extensibility/10-new-tool-integration) guide. Happy Flow building!