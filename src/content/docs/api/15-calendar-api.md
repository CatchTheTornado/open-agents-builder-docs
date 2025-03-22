---
title: Calendar Management API
description: How to create, delete and filter calendar events thru API
---


Below is a **REST API documentation** for managing **Calendar Events** in your application, with both **cURL** and **TypeScript** examples. The base URL in examples is **`https://app.openagentsbuilder.com`**.  

---

> **Note**: There is an API client plus example available on: [https://github.com/CatchTheTornado/open-agents-builder-client](https://github.com/CatchTheTornado/open-agents-builder-client) and [https://github.com/CatchTheTornado/open-agents-builder-example](https://github.com/CatchTheTornado/open-agents-builder-example)

---

## 1. Overview

The **Calendar** endpoints allow you to:

1. **Retrieve** calendar events.  
2. **Create or update** (upsert) an event by ID.  
3. **Delete** an event by ID.  

Additionally, certain fields (`title`, `location`, `description`, `participants`, `start`, `end`) can be **encrypted** at the database level if a `storageKey` is provided (SaaS mode).

---

## 2. Data Schema: **`CalendarEventDTO`**

Defined in `calendarEventDTOSchema` (from `src/data/dto.ts`):

```ts
export const calendarEventDTOSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  agentId: z.string().min(1),
  description: z.string().optional().nullable(),
  exclusive: z.string().optional().nullable(),
  start: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  end: z.string().optional().nullable(),
  allDay: z.boolean().optional().nullable(),
  sessionId: z.string().optional().nullable(),
  createdAt: z.string().default(() => getCurrentTS()),
  participants: z.string().optional().nullable(),
  updatedAt: z.string().default(() => getCurrentTS()),
});
export type CalendarEventDTO = z.infer<typeof calendarEventDTOSchema>;
```

**Key fields**:

- **`id`** (string, required) – Unique identifier for the event.  
- **`agentId`** (string, required) – Ties the event to a particular agent.  
- **`title`** (string, required) – Short label for the event.  
- **`description`**, **`location`** – Optional text fields.  
- **`start`, `end`** – Date/time strings (ISO) if provided.  
- **`allDay`** – Boolean flag indicating if it’s an all-day event.  
- **`participants`** – String with JSON data describing participants.  
- **`sessionId`** – Ties the event to a session if relevant.  
- **`createdAt`, `updatedAt`** – Timestamps, auto-populated if not provided.

---

## 3. Endpoints

### 3.1 `GET /api/calendar`

#### 3.1.1 Description

Returns **all** calendar events, optionally filtered by `id`, `agentId`, or `sessionId` as query parameters (thanks to the `genericGET` approach).

#### 3.1.2 Query Parameters

- **`id`**: Return only the event with this ID.  
- **`agentId`**: Return events belonging to a specific agent.  
- **`sessionId`**: Return events with a matching `sessionId`.  

#### 3.1.3 cURL Example

```bash
curl -X GET \
  "https://app.openagentsbuilder.com/api/calendar?agentId=agent-123" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>"
```

#### 3.1.4 TypeScript `fetch` Example

```ts
async function getCalendarEvents() {
  const response = await fetch(
    "https://app.openagentsbuilder.com/api/calendar?agentId=agent-123",
    {
      method: "GET",
      headers: {
        "Authorization": "Bearer <YOUR_API_KEY>",
        "database-id-hash": "<YOUR_DATABASE_ID_HASH>"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Error fetching calendar events: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("Calendar events:", data);
  return data;
}
```

#### 3.1.5 Example Success Response (HTTP 200)

```json
[
  {
    "id": "evt-001",
    "title": "Meeting with Bob",
    "agentId": "agent-123",
    "description": "Discuss project updates",
    "location": "Conference Room",
    "start": "2025-04-01T10:00:00.000Z",
    "end": "2025-04-01T11:00:00.000Z",
    "participants": "[{\"name\":\"Bob\",\"email\":\"[email protected]\"}]",
    "allDay": null,
    "sessionId": null,
    "createdAt": "2025-03-21T12:00:00.000Z",
    "updatedAt": "2025-03-21T12:00:00.000Z",
    "exclusive": null
  },
  ...
]
```

---

### 3.2 `PUT /api/calendar`

#### 3.2.1 Description

**Upserts** a calendar event. If `id` is new, it creates a record. If `id` already exists, it updates the existing event.

#### 3.2.2 Request Body

Must match `CalendarEventDTO`:

```json
{
  "id": "evt-001",
  "title": "Meeting with Bob",
  "agentId": "agent-123",
  "start": "2025-04-01T10:00:00.000Z",
  "end": "2025-04-01T11:00:00.000Z",
  "description": "Discuss project updates",
  "location": "Conference Room",
  "participants": "[{\"name\":\"Bob\",\"email\":\"[email protected]\"}]"
}
```

#### 3.2.3 cURL Example

```bash
curl -X PUT \
  "https://app.openagentsbuilder.com/api/calendar" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "evt-001",
    "title": "Meeting with Bob",
    "agentId": "agent-123",
    "start": "2025-04-01T10:00:00.000Z",
    "end": "2025-04-01T11:00:00.000Z",
    "description": "Discuss project updates",
    "location": "Conference Room"
  }'
```

#### 3.2.4 TypeScript `fetch` Example

```ts
async function upsertCalendarEvent(eventData: any) {
  const response = await fetch("https://app.openagentsbuilder.com/api/calendar", {
    method: "PUT",
    headers: {
      "Authorization": "Bearer <YOUR_API_KEY>",
      "database-id-hash": "<YOUR_DATABASE_ID_HASH>",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(eventData)
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(`Error upserting calendar event: ${result.message}`);
  }

  console.log("Upserted event:", result);
  return result;
}

// Usage example:
upsertCalendarEvent({
  id: "evt-001",
  title: "Meeting with Bob",
  agentId: "agent-123",
  start: "2025-04-01T10:00:00.000Z",
  end: "2025-04-01T11:00:00.000Z"
}).catch(console.error);
```

#### 3.2.5 Example Success Response (HTTP 200)

```json
{
  "message": "Data saved successfully!",
  "data": {
    "id": "evt-001",
    "title": "Meeting with Bob",
    "agentId": "agent-123",
    "description": "Discuss project updates",
    "start": "2025-04-01T10:00:00.000Z",
    "end": "2025-04-01T11:00:00.000Z",
    "participants": null,
    "createdAt": "2025-03-21T12:00:00.000Z",
    "updatedAt": "2025-03-21T12:00:00.000Z",
    ...
  },
  "status": 200
}
```

---

### 3.3 `DELETE /api/calendar/[id]`

#### 3.3.1 Description

Deletes a specific calendar event identified by `[id]`.

#### 3.3.2 cURL Example

```bash
curl -X DELETE \
  "https://app.openagentsbuilder.com/api/calendar/evt-001" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "database-id-hash: <YOUR_DATABASE_ID_HASH>"
```

#### 3.3.3 TypeScript `fetch` Example

```ts
async function deleteCalendarEvent(eventId: string) {
  const response = await fetch(
    `https://app.openagentsbuilder.com/api/calendar/${eventId}`,
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
    throw new Error(`Error deleting event: ${result.message}`);
  }

  console.log("Delete result:", result);
  return result;
}

// Usage example:
deleteCalendarEvent("evt-001").catch(console.error);
```

#### 3.3.4 Example Success Response (HTTP 200)

```json
{
  "message": "Data deleted successfully!",
  "status": 200
}
```

If no record is found, returns:
```json
{
  "message": "Data not found!",
  "status": 400
}
```

---

## 4. Encryption Details

In the **`ServerCalendarRepository`**:

- Fields like `title`, `location`, `description`, `participants`, `start`, `end` can be **encrypted** using an `EncryptionUtils` instance if a `storageKey` is provided (SaaS mode).  
- When **creating/updating** an event, these fields are encrypted.  
- When **retrieving** events, they are decrypted automatically.

Your REST API responses always return **plaintext** in JSON if the correct `storageKey` is set on the server side. The actual database column stores ciphertext.

---

## 5. Error Handling

- **400 Bad Request**:  
  - For example, if `[id]` is missing on DELETE, or required fields (`id`, `agentId`, `title`) are missing on PUT.  
- **499** or **500 Internal Server Error**:  
  - Unexpected server issues, e.g., database error or encryption error.  
- **401/403 Unauthorized**:  
  - Missing or invalid `Bearer` token or `database-id-hash`.  

All errors typically include a JSON structure:

```json
{
  "message": "Error details",
  "status": <number>
}
```

---

## 6. Summary of Endpoints

| **Endpoint**                    | **HTTP** | **Purpose**                                        |
|--------------------------------|---------|----------------------------------------------------|
| `/api/calendar`                | **GET**  | List all events (optional `id`, `agentId`, `sessionId` filter). |
| `/api/calendar`                | **PUT**  | Upsert (create/update) a calendar event by `id`.   |
| `/api/calendar/[id]`           | **DELETE** | Remove the specified event by `id`.               |

---

**That concludes the Calendar API documentation**. You can:

- Query events (`GET /api/calendar`) with optional filters.  
- Create/update events (`PUT /api/calendar`).  
- Delete an event (`DELETE /api/calendar/[id]`).  

Sensitive fields may be encrypted at rest, ensuring privacy. If you need advanced search features (e.g., date ranges), you can expand the code in `ServerCalendarRepository`.