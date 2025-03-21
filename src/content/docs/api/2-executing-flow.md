---
title: Executing Flow via API
description: How to execute flow-type agent via API
---

Creating the `Flow`-type agent is a convienient way of creating the API endpoint manageable by the business users / business analytics. They can adapt the changing business rules and requirements on the go - while develepers keep a static REST API endpoint to call the flow.

First, please create the `Flow/API` type of agent. Here you can find a guide on [how to create your first agent](../guides/4-creating-first-agent.md) and some basic [concepts and architecture explained](../guides/2-concepts.md).

After having this step done please use the following API endpoint.

**Note**: Please make sure you've got the [API key created](../api/1-creating-api-key.md) before executing requests.

### `POST /api/agent/${agentId}/exec`

Body request parameters:

```json
{
    "flow":"import",
    "execMode":"sync",
    "outputMode":"stream",
    "input": {}
}
```

- `flow` - is the name of one of the Flows defined within the Agent
- `execMode` - is a enum - with the selection of `sync` and `async`. If you choose `async` - then in return you'll get just the `sessionId` number you can use to get the result from `/api/agent/${agentId}/result/` endpoint
- `input` - if the defined flow has some optional either required input variables, please pass it via this object as a `{ "variableName": "variableValue" }` dictionary, files - must be `base64-encoded` (example below)
- `outputMode` - the default is `stream` in this mode the output progress is being streamed as a chunked response; the other option is `buffer` in which you'll be hold online until the flow execution is done - and get the whole response as a single JSON result


```bash
curl -X POST -H "Authorization: Bearer ${OPEN_AGENT_BUILDER_API_KEY}" -H "database-id-hash: 35f5c5b139a6b569d4649b788c1851831eb44d8e32b716b8411ec6431af8121d" -H "Content-Type: application/json" -d '{"flow":"import","execMode":"sync","outputMode":"stream"}' http://localhost:3000/api/agent/m8r22uvT2_KsMODoEw9ag/exec
```

**Note**: The `database-id-hash` header is dynamic - and unique for a database/data owner. Please check the hash of your database id in the `/admin/api` - the API tab of your Open Agents Builder admin panel


#### Input objects

When your flow has some input variables defined you may pass them via request body - `input` property as a JSON dictionary:

```json
{
    "userName": "pkarw",
    "orderFile": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIB....."
}
```
**Note**: Please note that if the input variable is set to `file` - it should be read, serialized as `base64` and passed along the mime type.

### The stream / chunked output

When the `outputMode` is set to `stream` (default) your connection to the exec endpoint will be held open and you'll get a constant stream of the data chunks in the following format. 

Each chunk is separated by a new line (`\n` ) so it can be easily parsed from the output.

```json
{
    "type": "stepFinish",
    "name": "Extracting text from files ...",
    "timestamp": "2025-03-21T09:46:55.370Z"
}{
    "type": "flowStart",
    "flowNodeId": "thBrmSYYbtTzXLAthUwhe",
    "message": "Params: `{\"flow\":\"import\",\"input\":{\"orderFile\":\"File content removed\"},\"execMode\":\"sync\",\"outputMode\":\"stream\",\"uiState\":{}}`",
    "name": "Executing flow import",
    "timestamp": "2025-03-21T09:46:55.373Z"
}{
    "type": "flowStepStart",
    "flowNodeId": "RYbDmGiRphVTTUdN54FoW",
    "name": "sequenceAgent",
    "input": [
        {
            "id": "UvcpiUhMERmkvPH0UVkyQ",
            "input": "{\"role\":\"user\",\"content\":[{\"type\":\"text\",\"text\":\"try to parse the input of @orderFile (if provided) to JSON \\nif it's not possible use the undefined undefined and undefined information to create the order\\nuse the tool to create the order in the database\\nreturn the order in JSON format\"},{\"type\":\"text\",\"text\":\"Current UI state: `{}`\"},{\"type\":\"text\",\"text\":\"User input: `{}`\"},{\"type\":\"text\",\"text\":\"Context: `{\\\"sessionId\\\":\\\"_LOO11XDbz8AxFsZUi2Qf\\\",\\\"currentDateTimeIso\\\":\\\"2025-03-21T10:46:54.914+01:00\\\",\\\"currentLocalDateTime\\\":\\\"3/21/2025, 10:46:54 AM\\\",\\\"currentTimezone\\\":\\\"Europe/Warsaw\\\",\\\"agentId\\\":\\\"m8r22uvT2_KsMODoEw9ag\\\",\\\"defaultLocale\\\":\\\"en\\\"}`\"},{\"type\":\"image\",\"image\":\"File content removed\",\"mimeType\":\"image/jpeg\"}]}",
            "name": "sequenceAgent > Order agent"
        }
    ],
    "timestamp": "2025-03-21T09:46:55.377Z"
}{
    "type": "generation",
    "name": "Order agent",
    "flowAgentId": "XirxLY6Poi94bDGZkwebv",
    "flowNodeId": "XirxLY6Poi94bDGZkwebv-eHrGqZ7ZSaAmpLmdWzk5q",
    "timestamp": "2025-03-21T09:46:55.379Z"
}
{
    "type": "toolCalls",
    "flowNodeId": "XirxLY6Poi94bDGZkwebv-GbLf40p8yj9mag0z6U-1U",
    "flowAgentId": "XirxLY6Poi94bDGZkwebv",
    "name": "Order agent (gpt-4o)",
    "message": "**currentDate** (`{}`): call_h4HS5jTMXXIMQRMPWIREdxXF\r\n**listProducts** (`{\"query\":\"100274\",\"limit\":10,\"offset\":0}`): call_8hFjBj3YGVD5Ht0qijA0EsY2\r\n**listProducts** (`{\"query\":\"100266\",\"limit\":10,\"offset\":0}`): call_nJP8oxh1yrwE9lew9ZL9ma6q\r\n**listProducts** (`{\"query\":\"100263\",\"limit\":10,\"offset\":0}`): call_clm0DRAqaQoZxEjIYfzHITWn\r\n",
    "toolResults": [
        {
            "type": "tool-result",
            "toolCallId": "call_h4HS5jTMXXIMQRMPWIREdxXF",
            "toolName": "tool-XRu1H3jdGeK4mX0CvCOUr",
            "args": {},
            "result": "2025-03-21T09:47:00.413Z"
        },
        {
            "type": "tool-result",
            "toolCallId": "call_8hFjBj3YGVD5Ht0qijA0EsY2",
            "toolName": "tool-VgmY7d4WGDSedwdsSwHM2",
            "args": {
                "query": "100274",
                "limit": 10,
                "offset": 0
            },
            "result": []
        },
        {
            "type": "tool-result",
            "toolCallId": "call_nJP8oxh1yrwE9lew9ZL9ma6q",
            "toolName": "tool-VgmY7d4WGDSedwdsSwHM2",
            "args": {
                "query": "100266",
                "limit": 10,
                "offset": 0
            },
            "result": []
        },
        {
            "type": "tool-result",
            "toolCallId": "call_clm0DRAqaQoZxEjIYfzHITWn",
            "toolName": "tool-VgmY7d4WGDSedwdsSwHM2",
            "args": {
                "query": "100263",
                "limit": 10,
                "offset": 0
            },
            "result": []
        }
    ],
    "timestamp": "2025-03-21T09:47:00.514Z"
}
```


### Available Flow output chunks

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
  UIComponent = "uiComponent", // np. customowy komponent React
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

  toolResults?: Array<{
    args?: any;
    result?: string;
  }>;

  messages?: Array<{
    role: string;
    content: Array<{ type: string; text: string }>;
    id?: string;
  }>;

}
```

### Example TypeScript code calling and parsing the stream mode output

```typescript

let abortController: AbortController;

export class FlowExecApiClient  
{
  async *execStream(
    agentId: string,
    flowId: string,
    uiState: any,
    input: any,
    execMode: string,
    headers: Record<string, string>
  ): AsyncGenerator<any, void, unknown> {
    // Abort any previous connection
    if (abortController) abortController.abort();
    abortController = new AbortController();

    const requestBody = JSON.stringify({ flow: flowId, input, execMode, outputMode: "stream", uiState });
    if (!headers) headers = {};
    this.setAuthHeader('', headers);

    const response = await fetch(`https://openagentsbuilder.com/api/agent/${agentId}/exec/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: requestBody,
      signal: abortController.signal
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
      buffer = lines.pop()!;
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          yield JSON.parse(line);
        } catch (err) {
          console.error("JSON parse error:", err, "\nLine:", line);
        }
      }
    }

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