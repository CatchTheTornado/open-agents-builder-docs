---
title: AI Tools Documentation
description: Open Agents Builder available tools
order: 20
---
This document provides comprehensive documentation for all AI tools available in the project.

## Current Date Tool

Returns the current date in ISO format (GMT time).

```typescript
{
  displayName: 'Get current date',
  parameters: {} // No parameters required
}
```

_No parameters_

## Day Name Tool

Gets the weekday name for a given ISO date.

```typescript
{
  displayName: 'Get the day name',
  parameters: {
    locale?: string, // Optional locale like 'en-US', 'pl-PL'
    date: string     // ISO date (e.g. '2025-05-18T00:00:00Z')
  }
}
```
Parameters:
- `locale` (string, optional): Locale such as `en-US`, `pl-PL` used to localise the weekday name. Defaults to system locale when omitted.
- `date` (string, required): Date/time in ISO format for which the weekday name should be returned.

## Send Email Tool

Sends emails using Resend.com API.

```typescript
{
  displayName: 'Send Email',
  parameters: {
    from: string,           // "From" address (e.g. 'Acme <noreply@acme.dev>')
    to: string[],           // Array of recipient addresses
    subject: string,        // Email subject
    text: string,           // Plain-text body
    html: string            // HTML body
  }
}
```
Parameters:
- `from` (string, required): Email sender in the form `Name <address@example.com>`.
- `to` (string[], required): List of recipient email addresses.
- `subject` (string, required): Subject line.
- `text` (string, required): Plain-text version of the email body.
- `html` (string, required): HTML version of the email body.

## HTTP Tool

Makes HTTP requests to external services.

```typescript
{
  displayName: 'HTTP Requests',
  parameters: {
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    headers?: Record<string, string>,
    body: string
  }
}
```
Parameters:
- `url` (string, required): Target URL.
- `method` (enum, required): One of `GET`, `POST`, `PUT`, `DELETE`, `PATCH`.
- `headers` (record, optional): Additional HTTP headers.
- `body` (string, required): Request body. Pass an empty string for `GET` requests.

## Memory Tools

### Memory Save Tool

Saves documents to the vector store for later retrieval.

```typescript
{
  displayName: 'Save document to memory store',
  parameters: {
    id?: string,
    content: string,
    metadata: string,
    storeName?: string,
    shortTerm?: boolean,
    expirationPeriod?: number
  }
}
```
Parameters:
- `id` (string, optional): Custom identifier. Auto-generated when omitted.
- `content` (string, required): Raw document text to index.
- `metadata` (string, required): JSON string with arbitrary metadata associated with the document.
- `storeName` (string, optional): Name of the vector store. Defaults to `default`.
- `shortTerm` (boolean, optional): Treat the entry as short-term memory bound to current session. Default `false`.
- `expirationPeriod` (number, optional): Lifetime (in hours) when `shortTerm` is `true`.

### Memory Search Tool

Searches for documents in the memory store.

```typescript
{
  displayName: 'Search in memory store',
  parameters: {
    query: string,
    storeName?: string,
    limit?: number
  }
}
```
Parameters:
- `query` (string, required): Full-text query.
- `storeName` (string, optional): Store name. Defaults to `default`.
- `limit` (number, optional): Maximum number of matches to return. Default `5`.

## Calendar Tools

### Calendar Schedule Tool

Schedules calendar events.

```typescript
{
  displayName: 'Schedule event in the calendar',
  parameters: {
    id: string,
    title: string,
    description: string,
    sessionId: string,
    exclusive: string,
    start: string,
    location: string,
    end: string,
    participants: string
  }
}
```
Parameters:
- `id` (string): Existing event ID to update or empty string to create a new event.
- `title` (string): Title of the event.
- `description` (string): Event description.
- `sessionId` (string): Associated session identifier.
- `exclusive` (string): `"true"` / `"false"` flag to mark the event as blocking other bookings.
- `start` (string): ISO start date-time (must be in the future).
- `location` (string): Physical or virtual location.
- `end` (string): ISO end date-time.
- `participants` (string): JSON-encoded array of `{ name, email }`.

### Calendar List Tool

Lists calendar events.

```typescript
{
  displayName: 'Access events calendar',
  parameters: {
    limitedVisibility?: boolean
  }
}
```
Parameters:
- `limitedVisibility` (boolean, optional): When `true`, sensitive fields are anonymised in the returned events.

## Product Tools

### List Products Tool

Lists products with optional filtering.

```typescript
{
  displayName: 'List products',
  parameters: {
    query?: string,    // Optional filter by SKU or name
    limit?: number,    // Number of products to return (default: 10)
    offset?: number    // Pagination offset (default: 0)
  }
}
```

### Create Order Tool

Creates new orders.

```typescript
{
  displayName: 'Create order',
  parameters: {
    // Order creation parameters
  }
}
```

## Attachment Tools

### Attachment Content Tool

Retrieves content of an attachment and stores it inside the session workspace.

```typescript
{
  displayName: 'Get the attachment content',
  parameters: {
    id?: string  // Identifier (storageKey, filename, mimeType, etc.)
  }
}
```

### List Attachments Tool

Lists available attachments.

```typescript
{
  displayName: 'List attachments/files tool',
  parameters: {
    query?: string,     // Optional filter by storageKey, filename or mimeType
    mimeTypes?: string, // Optional comma-separated list of mime types to filter
    limit?: number,     // Number of attachments to return (default 10)
    offset?: number     // Pagination offset (default 0)
  }
}
```

## Code Execution Tool

Executes code in an isolated environment.

```typescript
{
  displayName: 'Execute code',
  parameters: {
    language: string, // Programming language (e.g. 'python', 'typescript')
    code: string,     // Source code to execute
    files?: Record<string, string>, // Optional additional files (filename → content)
    stdin?: string,   // Optional STDIN input
    timeout?: number  // Optional execution timeout in seconds
  }
}
```

Features:
- Persistent data storage between executions
- Isolated workspace
- Automatic container cleanup after 30 minutes
- Support for multiple programming languages

## UI Components Tools

### Available UI Components Tool

Lists available UI components and their properties.

```typescript
{
  displayName: 'Get available UI components',
  parameters: {} // No parameters required
}
```

### Render Component Tool

Renders UI components.

```typescript
{
  displayName: 'Render component',
  parameters: {
    // Component-specific parameters
  }
}
```

## Flow Execution Tool

Executes agent flows with provided input data.

```typescript
{
  displayName: 'Execute flow',
  parameters: {
    flow: string,          // Flow code to execute
    outputMode: string,    // Output mode
    execMode: string,      // Execution mode
    input: any            // Input data for the flow
  }
}
```

Features:
- Support for multiple flows
- Streaming output
- Tool execution tracking
- Usage statistics
- SaaS integration
- Error handling and validation 