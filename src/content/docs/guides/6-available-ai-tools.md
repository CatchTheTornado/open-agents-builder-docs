---
title: AI Tools Documentation
description: Open Agents Builder available tools
order: 20
---
# AI Tools Documentation

This document provides comprehensive documentation for all AI tools available in the project.

## Table of Contents
- [Current Date Tool](#current-date-tool)
- [Send Email Tool](#send-email-tool)
- [HTTP Tool](#http-tool)
- [Memory Tools](#memory-tools)
- [Calendar Tools](#calendar-tools)
- [Product Tools](#product-tools)
- [Attachment Tools](#attachment-tools)
- [Code Execution Tool](#code-execution-tool)
- [UI Components Tools](#ui-components-tools)
- [Flow Execution Tool](#flow-execution-tool)

## Current Date Tool

Returns the current date in ISO format (GMT time).

```typescript
{
  displayName: 'Get current date',
  parameters: {} // No parameters required
}
```

## Send Email Tool

Sends emails using Resend.com API.

```typescript
{
  displayName: 'Send Email',
  parameters: {
    apiKey: string, // Resend.com API key
    url?: string    // Optional override of default Resend API endpoint
  }
}
```

## HTTP Tool

Makes HTTP requests to external services.

```typescript
{
  displayName: 'HTTP Requests',
  parameters: {
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    headers?: Record<string, string>,
    body?: any
  }
}
```

## Memory Tools

### Memory Save Tool

Saves documents to the vector store for later retrieval.

```typescript
{
  displayName: 'Save document to memory store',
  parameters: {
    id?: string,           // Optional unique identifier
    content: string,       // Document content
    metadata: string,      // Additional metadata
    storeName?: string,    // Optional store name (defaults to 'default')
    shortTerm?: boolean,   // Whether to save as short-term memory
    expirationPeriod?: number // Expiration period in hours for short-term memory
  }
}
```

### Memory Search Tool

Searches for documents in the memory store.

```typescript
{
  displayName: 'Search in memory store',
  parameters: {
    query: string,         // Search query
    storeName?: string,    // Optional store name (defaults to 'default')
    limit?: number         // Maximum number of results (defaults to 5)
  }
}
```

## Calendar Tools

### Calendar Schedule Tool

Schedules calendar events.

```typescript
{
  displayName: 'Schedule events',
  parameters: {
    // Calendar event parameters
  }
}
```

### Calendar List Tool

Lists calendar events.

```typescript
{
  displayName: 'Access events calendar',
  parameters: {
    // Calendar listing parameters
  }
}
```

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

Retrieves content of attachments.

```typescript
{
  displayName: 'Attachment Content',
  parameters: {
    id?: string  // Optional filter by storageKey, filename or mimeType
  }
}
```

### List Attachments Tool

Lists available attachments.

```typescript
{
  displayName: 'List Attachments',
  parameters: {
    // Attachment listing parameters
  }
}
```

## Code Execution Tool

Executes code in an isolated environment.

```typescript
{
  displayName: 'Execute code',
  parameters: {
    // Code execution parameters
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