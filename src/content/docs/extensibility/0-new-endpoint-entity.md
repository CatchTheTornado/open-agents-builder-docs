---
title: Custom Entities and API Endpoints
description: How to add new Entity and API endpoint to manage it
order: 10
---

Below is a **step-by-step tutorial** on **how to create a new entity** (called **`Customer`** in this example) and **add a REST endpoint** in your Next.js + Drizzle + TypeScript setup. We’ll show both the **server** (back-end) phase and the **client** (front-end) phase, using patterns consistent with your existing codebase.

---

## 1. **SERVER Phase**

### **1.1 Add Your New Table to `db-schema.ts`**

In Drizzle, we define database tables by exporting them from `src/data/server/db-schema.ts`. Suppose we want to store **Customer** data. Let’s create a table named `customers`:

```ts
// src/data/server/db-schema.ts

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Add this near your existing tables (e.g. agents, sessions, etc.)
export const customers = sqliteTable("customers", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name"),           // We'll store the customer's name
  email: text("email"),         // We'll store the customer's email
  company: text("company"),     // optional company name
  createdAt: text("createdAt")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updatedAt")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
```

**What the code does**:

- The `customers` table has an auto-increment `id` (primaryKey).
- We have a few string fields (`name`, `email`, `company`) plus timestamps.

> **Note**: You will later run `drizzle-kit` migrations to create/update the physical table in your SQLite (or other) database.

---

### **1.2 Add the Zod Schema & DTO to `dto.ts`**

In `src/data/dto.ts`, define the **Zod schema** for your new Customer object, and create the TypeScript type from it:

```ts
// src/data/dto.ts

import { z } from "zod";
import { getCurrentTS } from "@/lib/utils";

export const customerDTOSchema = z.object({
  id: z.number().positive().int().optional(),  // auto-increment primary key
  name: z.string().min(1),                    // must have at least 1 character
  email: z.string().email().optional(),       // optional but must be valid email if present
  company: z.string().optional().nullable(),
  createdAt: z.string().default(() => getCurrentTS()),
  updatedAt: z.string().default(() => getCurrentTS()),
});

// The encryption settings for the new DTO (if needed):
export const CustomerDTOEncSettings = { ecnryptedFields: [] };

export type CustomerDTO = z.infer<typeof customerDTOSchema>;
```

**Key Points**:  
- `customerDTOSchema` uses `zod` to **validate** inbound/outbound data.  
- `id` is optional because it’s auto-increment.  
- We allow or disallow certain field values with `min(1)`, `email()`, etc.

---

### **1.3 Create a Server Repository in `src/data/server/`**

Next, you’ll want to define a repository class that handles typical CRUD operations (similar to `ServerAgentRepository`). Let’s call it `ServerCustomerRepository.ts`.

```ts
// src/data/server/server-customer-repository.ts

import { BaseRepository, IQuery } from "./base-repository";
import { CustomerDTO } from "../dto";
import { customers } from "./db-schema";
import { eq } from "drizzle-orm";
import { create } from "./generic-repository";
import { getCurrentTS } from "@/lib/utils";

export default class ServerCustomerRepository extends BaseRepository<CustomerDTO> {
  async create(item: CustomerDTO): Promise<CustomerDTO> {
    const db = await this.db();
    return create(item, customers, db); // uses a generic "create" helper
  }

  async upsert(query: Record<string, any>, item: CustomerDTO): Promise<CustomerDTO> {
    const db = await this.db();
    let existing: CustomerDTO | null = null;

    if (query.id) {
      // If we got an id in the query, we find an existing record
      existing = (db.select().from(customers).where(eq(customers.id, query.id)).get()) as CustomerDTO;
    }

    if (!existing) {
      // If it doesn't exist, create it
      return this.create(item);
    } else {
      // If it exists, update
      item.updatedAt = getCurrentTS();
      db.update(customers).set(item).where(eq(customers.id, query.id)).run();
      return item;
    }
  }

  async delete(query: Record<string, any>): Promise<boolean> {
    const db = await this.db();
    if (!query.id) return false; // must specify "id"
    const result = db.delete(customers).where(eq(customers.id, query.id)).run();
    return result.changes > 0;
  }

  async findAll(query?: IQuery): Promise<CustomerDTO[]> {
    const db = await this.db();
    let dbQuery = db.select().from(customers);

    if (query?.filter) {
      if (query.filter["id"]) {
        dbQuery.where(eq(customers.id, parseInt(query.filter["id"], 10)));
      }
      if (query.filter["name"]) {
        // example: you might do partial matching, or eq, etc.
        // For eq:
        // dbQuery.where(eq(customers.name, query.filter["name"]));
      }
    }

    return Promise.resolve(dbQuery.all() as CustomerDTO[]);
  }

  async findOne(query: { id: number }): Promise<CustomerDTO | null> {
    const db = await this.db();
    const record = db
      .select()
      .from(customers)
      .where(eq(customers.id, query.id))
      .get();
    return record ? (record as CustomerDTO) : null;
  }
}
```

**Notes**:  
- We rely on `BaseRepository` to handle general DB logic.  
- The `create()` and `upsert()` patterns mirror your `AgentRepository`.

---

### **1.4 Create the Routes in `src/app/api/customer/`**

We’ll create two route files:

1. **`src/app/api/customer/route.ts`** – for **GET** (list) and **PUT** (create/update).  
2. **`src/app/api/customer/[id]/route.tsx`** – for **DELETE** (and possibly GET-by-id if we want).  

> We can replicate the patterns from your existing `agent` endpoints.

#### **1.4.1 `/api/customer` (GET & PUT)**

```ts
// src/app/api/customer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { customerDTOSchema, CustomerDTO } from "@/data/dto";
import ServerCustomerRepository from "@/data/server/server-customer-repository";
import { genericGET, genericPUT } from "@/lib/generic-api";
import { auditLog, authorizeSaasContext } from "@/lib/generic-api";
import { authorizeRequestContext } from "@/lib/authorization-api";
import { getErrorMessage } from "@/lib/utils";
import { detailedDiff } from "deep-object-diff";

export async function GET(request: NextRequest, response: NextResponse) {
  try {
    const requestContext = await authorizeRequestContext(request, response);
    const saasContext = await authorizeSaasContext(request);

    const repo = new ServerCustomerRepository(requestContext.databaseIdHash);
    // We can reuse the genericGET utility for listing
    const list = await genericGET<CustomerDTO>(request, repo, 50, 0);
    return Response.json(list);
  } catch (error) {
    return Response.json({ message: getErrorMessage(error), status: 500 }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, response: NextResponse) {
  try {
    const requestContext = await authorizeRequestContext(request, response);
    const saasContext = await authorizeSaasContext(request);

    const inputObj = await request.json();
    const repo = new ServerCustomerRepository(requestContext.databaseIdHash);

    // If we want to handle "upsert" or "create" specifically:
    const existing = inputObj.id ? await repo.findOne({ id: inputObj.id }) : null;
    const apiResult = await genericPUT<CustomerDTO>(inputObj, customerDTOSchema, repo, "id");

    if (!existing && apiResult.status === 200) {
      // new record
      auditLog(
        {
          eventName: "createCustomer",
          diff: JSON.stringify(inputObj),
          recordLocator: JSON.stringify({ id: apiResult.data?.id }),
        },
        request,
        requestContext,
        saasContext
      );
    } else if (existing && apiResult.status === 200) {
      // update
      const changes = detailedDiff(existing, apiResult.data || {});
      auditLog(
        {
          eventName: "updateCustomer",
          diff: JSON.stringify(changes),
          recordLocator: JSON.stringify({ id: apiResult.data?.id }),
        },
        request,
        requestContext,
        saasContext
      );
    }

    return Response.json(apiResult, { status: apiResult.status });
  } catch (error) {
    return Response.json({ message: getErrorMessage(error), status: 500 }, { status: 500 });
  }
}
```

**What this does**:  
- `GET` – returns the entire list of customers (with optional `limit` / `offset` queries).  
- `PUT` – upserts a customer record. If `id` is missing, we create a new one. Otherwise, we update. Also calls `auditLog()` to log the event.

#### **1.4.2 `/api/customer/[id]` (DELETE)**

```ts
// src/app/api/customer/[id]/route.tsx
import ServerCustomerRepository from "@/data/server/server-customer-repository";
import { NextRequest } from "next/server";
import { getErrorMessage } from "@/lib/utils";
import { auditLog, authorizeSaasContext, genericDELETE } from "@/lib/generic-api";
import { authorizeRequestContext } from "@/lib/authorization-api";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const recordLocator = parseInt(params.id, 10);
    if (!recordLocator) {
      return Response.json({ message: "Invalid id in request URL", status: 400 }, { status: 400 });
    }

    const requestContext = await authorizeRequestContext(request);
    const saasContext = await authorizeSaasContext(request);

    // If you had references, you'd delete them here (like you do for agent's results, sessions, etc.)
    // e.g. await someRepo.delete({ customerId: recordLocator });

    auditLog(
      {
        eventName: "deleteCustomer",
        recordLocator: JSON.stringify({ id: recordLocator }),
      },
      request,
      requestContext,
      saasContext
    );

    const repo = new ServerCustomerRepository(requestContext.databaseIdHash);
    const apiResult = await genericDELETE(request, repo, { id: recordLocator });
    return Response.json(apiResult, { status: apiResult.status });
  } catch (error) {
    return Response.json({ message: getErrorMessage(error), status: 500 }, { status: 500 });
  }
}
```

**What this does**:  
- Reads the ID from the URL, calls the `delete()` method on our new repository.  
- Calls `auditLog()` to keep an audit trail.  

Now you have a basic **CRUD** approach for `Customer`:

- `GET /api/customer` → list  
- `PUT /api/customer` → create/update  
- `DELETE /api/customer/[id]` → delete  

(You could also add a `GET /api/customer/[id]` if you want to fetch a single record by ID.)

---

## 2. **CLIENT Phase**

Typically, you’ll want a front-end model (e.g., a class for the `Customer` DTO) and an **API client** for making calls to these new routes.

### **2.1 Add a Model Class in `src/data/client/models.ts`**

Let’s make a `Customer` class to handle the data in your front-end, similar to your `Agent` or `Session` classes:

```ts
// src/data/client/models.ts

import { CustomerDTO } from "@/data/dto";
import { getCurrentTS } from "@/lib/utils";

export class Customer {
  id?: number;
  name: string;
  email?: string;
  company?: string | null;
  createdAt: string;
  updatedAt: string;

  constructor(dto: CustomerDTO) {
    this.id = dto.id;
    this.name = dto.name;
    this.email = dto.email;
    this.company = dto.company || null;
    this.createdAt = dto.createdAt;
    this.updatedAt = dto.updatedAt;
  }

  static fromDTO(dto: CustomerDTO): Customer {
    return new Customer(dto);
  }

  toDTO(): CustomerDTO {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      company: this.company,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Optionally, a "fromForm" helper if you have a form:
  static fromForm(data: Record<string, any>, existing?: Customer) {
    return new Customer({
      ...existing,
      id: existing?.id || data.id,
      name: data.name || "",
      email: data.email || "",
      company: data.company || null,
      createdAt: existing?.createdAt || getCurrentTS(),
      updatedAt: getCurrentTS(),
    } as CustomerDTO);
  }
}
```

**Now** the front-end can consistently transform from **DTO** to **model** and back.

---

### **2.2 Create a Simple API Client**

You already have the pattern with `AdminApiClient` or `AgentApiClient`. Let’s define a new `CustomerApiClient` that calls our new endpoints:

```ts
// src/data/client/customer-api-client.ts

import { AdminApiClient, ApiEncryptionConfig } from "./admin-api-client";
import { CustomerDTO, CustomerDTOEncSettings, PaginatedQuery, PaginatedResult } from "@/data/dto";
import { DatabaseContextType } from "@/contexts/db-context";
import { SaaSContextType } from "@/contexts/saas-context";
import { Customer } from "./models";

export type GetCustomersResponse = CustomerDTO[];
export type PutCustomerRequest = CustomerDTO;

export type PutCustomerResponseSuccess = {
  message: string;
  data: CustomerDTO;
  status: 200;
};

export type PutCustomerResponseError = {
  message: string;
  status: 400;
  issues?: any[];
};

export type PutCustomerResponse = PutCustomerResponseSuccess | PutCustomerResponseError;

export type DeleteCustomerResponse = {
  message: string;
  status: number;
};

export class CustomerApiClient extends AdminApiClient {
  constructor(
    baseUrl: string,
    dbContext?: DatabaseContextType | null,
    saasContext?: SaaSContextType | null,
    encryptionConfig?: ApiEncryptionConfig
  ) {
    super(baseUrl, dbContext, saasContext, encryptionConfig);
  }

  // GET /api/customer
  async getAll(): Promise<GetCustomersResponse> {
    return this.request<GetCustomersResponse>("/api/customer", "GET", CustomerDTOEncSettings);
  }

  // GET /api/customer?id=...
  async getById(id: number): Promise<GetCustomersResponse> {
    return this.request<GetCustomersResponse>(
      `/api/customer?id=${encodeURIComponent(id.toString())}`,
      "GET",
      CustomerDTOEncSettings
    );
  }

  // PUT /api/customer
  async put(record: PutCustomerRequest): Promise<PutCustomerResponse> {
    return this.request<PutCustomerResponse>("/api/customer", "PUT", CustomerDTOEncSettings, record);
  }

  // DELETE /api/customer/[id]
  async delete(customerId: number): Promise<DeleteCustomerResponse> {
    return this.request<DeleteCustomerResponse>(
      `/api/customer/${customerId}`,
      "DELETE",
      CustomerDTOEncSettings
    );
  }
}
```

**What this does**:

- Uses `AdminApiClient` for the base functionality (setting authorization headers, handle encryption if enabled, etc.).  
- Exposes convenient methods: `getAll()`, `getById(...)`, `put(...)`, `delete(...)`.

### **2.3 Example Usage**

In a React component or another front-end utility:

```tsx
import React, { useEffect, useState } from "react";
import { Customer } from "@/data/client/models"; // your model
import { CustomerApiClient } from "@/data/client/customer-api-client";
import { useDatabaseContext } from "@/contexts/db-context";
import { useSaaSContext } from "@/contexts/saas-context";

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const dbContext = useDatabaseContext();
  const saasContext = useSaaSContext();

  // Initialize your API client
  const client = new CustomerApiClient(
    "",
    dbContext,
    saasContext,
    { useEncryption: false } // or pass a secretKey
  );

  useEffect(() => {
    client
      .getAll()
      .then((res) => {
        const cList = res.map((dto) => Customer.fromDTO(dto));
        setCustomers(cList);
      })
      .catch((err) => console.error("Error loading customers:", err));
  }, []);

  return (
    <div>
      <h2>Customer List</h2>
      <ul>
        {customers.map((cust) => (
          <li key={cust.id}>
            {cust.id}: {cust.name} ({cust.email})
          </li>
        ))}
      </ul>
    </div>
  );
}
```

> That’s it! Now you can create, update, and delete customers from the front end, calling your new endpoints.

---

## 3. **Summary**

1. **Define the table** in `db-schema.ts` using drizzle-orm.  
2. **Create a Zod schema** (`customerDTOSchema`) and **add a type** (`CustomerDTO`) in `dto.ts`.  
3. **Create a server repository** (e.g., `ServerCustomerRepository`) to handle CRUD logic with Drizzle.  
4. **Create route handlers** in `src/app/api/customer/route.ts` (for GET & PUT) and `src/app/api/customer/[id]/route.tsx` (for DELETE).  
   - These routes use `genericGET`, `genericPUT`, `genericDELETE`, and call `auditLog` for auditing.  
5. **Add a front-end model** class (e.g., `Customer`) in `models.ts` to handle converting to/from DTO.  
6. **Create an API client** (e.g., `CustomerApiClient`) extending your `AdminApiClient` to easily call the new routes from front-end code.  
7. **Use** that API client within your React pages or components.

This approach keeps your code consistent with the rest of your **Next.js + Drizzle** project, reusing utilities like `genericPUT`, `BaseRepository`, `AdminApiClient`, and more.