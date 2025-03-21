---
title: Custom Entity CRUD Panel
description: How to add new custom Entity Admin UI
order: 10
---

Below is a **step-by-step** guide on how to create a **Customer** entity in Open Agents Builder (OAB) and build a **simple admin UI** for listing, creating, editing, and deleting **customers**. It demonstrates how to:

1. Define a **`Customer`** model in the frontend (with `fromDTO`, `toDTO`, etc.).
2. Create a **`CustomerApiClient`** that communicates with your custom backend endpoints.
3. Wrap it all in a **`CustomerContext`** for React components.
4. Make **listing** and **detail/edit** pages that use this context and API client.

---

## 1. **Prerequisite: Custom Backend Endpoints**

Before writing the frontend, ensure you have the **server-side endpoints** available, for example:

- **`GET /api/customer`** returns all customers or optionally filters by an ID query param.
- **`PUT /api/customer`** creates/updates a customer.
- **`DELETE /api/customer/[id]`** removes a customer.

You can also add optional endpoints for pagination (e.g. `POST /api/customer/query`) if you plan to handle large data sets.

---

## 2. **Create the `Customer` Model**

We define a `Customer` class that handles transformations between **DTO** (Data Transfer Object) and our **model** class in the frontend. It’s a consistent approach that keeps your code clean:

```ts
// src/data/client/models/customer.ts
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

  /**
   * Optionally, a helper to create or update from a form:
   */
  static fromForm(data: Record<string, any>, existing?: Customer): Customer {
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

**Key Points**  
- `fromDTO(...)` and `toDTO()` let us convert seamlessly between backend responses and local objects.  
- `fromForm(...)` is an optional helper for React forms, so we can fill the model with the user’s input.

---

## 3. **Create a `CustomerApiClient`**

You likely have a base `AdminApiClient` (or similar) that handles things like environment-based URLs, encryption, or authentication. We extend it for **customers**:

```ts
// src/data/client/customer-api-client.ts
import { AdminApiClient, ApiEncryptionConfig } from "./admin-api-client";
import {
  CustomerDTO,
  CustomerDTOEncSettings,
  PaginatedQuery,
  PaginatedResult,
} from "@/data/dto";
import { DatabaseContextType } from "@/contexts/db-context";
import { SaaSContextType } from "@/contexts/saas-context";
import { Customer } from "./models/customer";

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

export type PutCustomerResponse =
  | PutCustomerResponseSuccess
  | PutCustomerResponseError;

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
    return this.request<GetCustomersResponse>(
      "/api/customer",
      "GET",
      CustomerDTOEncSettings
    );
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
    return this.request<PutCustomerResponse>(
      "/api/customer",
      "PUT",
      CustomerDTOEncSettings,
      record
    );
  }

  // DELETE /api/customer/[id]
  async delete(customerId: number): Promise<DeleteCustomerResponse> {
    return this.request<DeleteCustomerResponse>(
      `/api/customer/${customerId}`,
      "DELETE",
      CustomerDTOEncSettings
    );
  }

  /**
   * If you need pagination:
   * POST /api/customer/query
   */
  async query(params: PaginatedQuery): Promise<PaginatedResult<CustomerDTO[]>> {
    return this.request<PaginatedResult<CustomerDTO[]>>(
      "/api/customer/query",
      "POST",
      CustomerDTOEncSettings,
      params
    );
  }
}
```

**Highlights**  
- We rely on a shared `request(...)` method in `AdminApiClient` to manage fetch calls, headers, encryption, etc.  
- Each method corresponds to a backend route (`getAll()`, `getById()`, `put()`, `delete()`, optionally `query()` for pagination).

---

## 4. **Create a `CustomerContext`**

Now we’ll **wrap** React components in a context that orchestrates the **`CustomerApiClient`** calls, transforms data into the `Customer` model, and updates local state.

```ts
// src/contexts/customer-context.tsx
"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";
import { DatabaseContext } from "./db-context";
import { SaaSContext } from "./saas-context";
import { DataLoadingStatus } from "@/data/client/models";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "@/lib/utils";
import { CustomerApiClient } from "@/data/client/customer-api-client";
import { Customer } from "@/data/client/models/customer";
import {
  PaginatedQuery,
  PaginatedResult,
  CustomerDTO,
} from "@/data/dto";
import { toast } from "sonner";

type CustomerContextType = {
  current: Customer | null;
  loaderStatus: DataLoadingStatus;
  setCurrent: (customer: Customer | null) => void;

  // CRUD:
  getAllCustomers: () => Promise<Customer[]>;
  getCustomerById: (id: number) => Promise<Customer>;
  updateCustomer: (customer: Customer) => Promise<Customer>; 
  deleteCustomer: (customer: Customer) => Promise<void>;

  // Optional for pagination
  queryCustomers: (params: PaginatedQuery) => Promise<PaginatedResult<Customer[]>>;

  refreshDataSync: string;
  setRefreshDataSync: (val: string) => void;
};

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider = ({ children }: { children: ReactNode }) => {
  const dbContext = useContext(DatabaseContext);
  const saasContext = useContext(SaaSContext);
  const { t } = useTranslation();

  const [current, setCurrent] = useState<Customer | null>(null);
  const [loaderStatus, setLoaderStatus] = useState<DataLoadingStatus>(DataLoadingStatus.Idle);
  const [refreshDataSync, setRefreshDataSync] = useState("");

  // Create a new instance of the API client
  const getApiClient = (): CustomerApiClient => {
    return new CustomerApiClient("", dbContext, saasContext, { useEncryption: false });
  };

  // Basic CRUD
  async function getAllCustomers(): Promise<Customer[]> {
    setLoaderStatus(DataLoadingStatus.Loading);
    try {
      const client = getApiClient();
      const dtos = await client.getAll();
      setLoaderStatus(DataLoadingStatus.Success);
      return dtos.map((dto) => Customer.fromDTO(dto));
    } catch (err) {
      setLoaderStatus(DataLoadingStatus.Error);
      toast.error(t(getErrorMessage(err)));
      return [];
    }
  }

  async function getCustomerById(id: number): Promise<Customer> {
    setLoaderStatus(DataLoadingStatus.Loading);
    try {
      const client = getApiClient();
      const dtos = await client.getById(id);
      if (!dtos || !dtos.length) {
        throw new Error(t("Customer not found") as string);
      }
      setLoaderStatus(DataLoadingStatus.Success);
      return Customer.fromDTO(dtos[0]);
    } catch (err) {
      setLoaderStatus(DataLoadingStatus.Error);
      toast.error(t(getErrorMessage(err)));
      throw err;
    }
  }

  async function updateCustomer(customer: Customer): Promise<Customer> {
    const client = getApiClient();
    const dto = customer.toDTO();
    const resp = await client.put(dto);
    if (resp.status !== 200) {
      toast.error(resp.message);
      throw new Error(resp.message);
    }
    const updated = Customer.fromDTO(resp.data);
    setRefreshDataSync(new Date().toISOString());
    return updated;
  }

  async function deleteCustomer(customer: Customer): Promise<void> {
    const client = getApiClient();
    const resp = await client.delete(customer.id!);
    if (resp.status !== 200) {
      toast.error(resp.message);
      throw new Error(resp.message);
    }
    setRefreshDataSync(new Date().toISOString());
  }

  // If you need pagination:
  async function queryCustomers(params: PaginatedQuery): Promise<PaginatedResult<Customer[]>> {
    setLoaderStatus(DataLoadingStatus.Loading);
    try {
      const client = getApiClient();
      const raw = await client.query(params);
      setLoaderStatus(DataLoadingStatus.Success);
      return {
        ...raw,
        rows: raw.rows.map((r: CustomerDTO) => Customer.fromDTO(r)),
      };
    } catch (err) {
      setLoaderStatus(DataLoadingStatus.Error);
      toast.error(t(getErrorMessage(err)));
      throw err;
    }
  }

  const value: CustomerContextType = {
    current,
    loaderStatus,
    setCurrent,

    getAllCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,

    queryCustomers,

    refreshDataSync,
    setRefreshDataSync,
  };

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
};

export const useCustomerContext = (): CustomerContextType => {
  const ctx = useContext(CustomerContext);
  if (!ctx) {
    throw new Error("useCustomerContext must be used within a CustomerProvider");
  }
  return ctx;
};
```

**Explanation**  
- We store the **current** customer for potential editing or easy reference.  
- `queryCustomers(...)` or `getAllCustomers()` uses the `CustomerApiClient` under the hood.  
- `updateCustomer(...)` calls `client.put(...)` and transforms the response back into a model instance.  
- We keep track of `refreshDataSync` in case we want to re-fetch data after changes.

---

## 5. **Use the `CustomerProvider` in Your Admin Layout**

In your **layout** or **root** admin component, wrap the child routes so they can access `useCustomerContext()`:

```tsx
// src/app/[locale]/admin/layout.tsx
"use client";

import { CustomerProvider } from "@/contexts/customer-context";
// ...other providers...

export default function AdminLayout({ children, params }: {
  children: React.ReactNode;
  params: { locale: string; id: string };
}) {
  // ... Possibly set up translations, other contexts ...
  return (
    <CustomerProvider>
      {/* ... any other providers or layout markup ... */}
      {children}
    </CustomerProvider>
  );
}
```

Now anything under `/admin/...` can call `useCustomerContext()` to manage customers.

---

## 6. **Listing Page (with Pagination)**

Create a page like **`src/app/[locale]/admin/agent/[id]/customers/page.tsx`**:

```tsx
"use client";

import React, { useState, useEffect } from "react";
import { useCustomerContext } from "@/contexts/customer-context";
import { PaginatedQuery, PaginatedResult } from "@/data/dto";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NoRecordsAlert } from "@/components/shared/no-records-alert";
import InfiniteScroll from "@/components/infinite-scroll";
import { Loader2, FolderOpenIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import Link from "next/link";

export default function CustomersPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const customerContext = useCustomerContext();

  // Searching / pagination
  const [query, setQuery] = useState<PaginatedQuery>({
    limit: 5,
    offset: 0,
    orderBy: "createdAt",
    query: "",
  });
  const [debouncedQuery] = useDebounce(query, 500);

  // Data
  const [customersData, setCustomersData] = useState<PaginatedResult<any>>({
    rows: [],
    total: 0,
    limit: 5,
    offset: 0,
    orderBy: "createdAt",
    query: "",
  });
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Initial load / search
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const result = await customerContext.queryCustomers({
          ...debouncedQuery,
          offset: 0,
        });
        setCustomersData(result);
        setHasMore(result.rows.length < result.total);
      } catch (err) {
        toast.error(t(getErrorMessage(err)));
      }
      setLoading(false);
    })();
  }, [debouncedQuery, customerContext.refreshDataSync]);

  // Check if more data is available
  useEffect(() => {
    setHasMore(customersData.offset + customersData.limit < customersData.total);
  }, [customersData]);

  // Load next page
  const loadMore = async () => {
    if (loading) return;
    const newOffset = customersData.offset + customersData.limit;
    if (newOffset >= customersData.total) {
      setHasMore(false);
      return;
    }
    setLoading(true);
    try {
      const result = await customerContext.queryCustomers({
        ...debouncedQuery,
        offset: newOffset,
      });
      setCustomersData((prev) => ({
        ...prev,
        rows: [...prev.rows, ...result.rows],
        offset: newOffset,
      }));
      setHasMore(newOffset + result.rows.length < result.total);
    } catch (err) {
      toast.error(t(getErrorMessage(err)));
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-2">
        <Link href={"./customers/new"} className="inline-flex">
          <Button size="sm" variant="outline">
            <PlusIcon className="w-4 h-4 mr-2" />
            {t("Add new customer")}
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Input
        placeholder={t("Search customers...") || "Search..."}
        onChange={(e) => setQuery({ ...query, query: e.target.value })}
        value={query.query}
      />

      {/* No Records */}
      {customersData.rows.length === 0 && !loading && (
        <NoRecordsAlert title={t("No customers found") as string}>
          {t("Try adjusting your search or add a new customer.")}
        </NoRecordsAlert>
      )}

      {/* List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customersData.rows.map((customer: any) => (
          <div key={customer.id} className="border rounded p-4">
            <div className="font-bold">
              {customer.name}
            </div>
            <div className="text-sm text-gray-500">{customer.email}</div>
            {customer.company && (
              <div className="text-sm text-gray-500 mt-1">
                {customer.company}
              </div>
            )}
            <div className="mt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push(`./customers/${customer.id}`)}
              >
                <FolderOpenIcon className="w-4 h-4 mr-1" />
                {t("Open")}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <InfiniteScroll hasMore={hasMore} isLoading={loading} next={loadMore}>
        {hasMore && (
          <div className="flex justify-center">
            <Loader2 className="my-4 h-8 w-8 animate-spin" />
          </div>
        )}
      </InfiniteScroll>
    </div>
  );
}
```

---

## 7. **Details/Edit Page**

For editing an existing customer (`id`) or creating a new one (`id = "new"`):

```tsx
// src/app/[locale]/admin/agent/[id]/customers/[customerId]/page.tsx
"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCustomerContext } from "@/contexts/customer-context";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Customer } from "@/data/client/models/customer";

interface CustomerFormData {
  name: string;
  email: string;
  company?: string;
}

export default function CustomerFormPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const { getCustomerById, updateCustomer, deleteCustomer } = useCustomerContext();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>();

  const isNew = params.customerId === "new";

  // Load data if editing
  useEffect(() => {
    if (!isNew) {
      const idNum = parseInt(params.customerId, 10);
      (async () => {
        try {
          const existing = await getCustomerById(idNum);
          reset({
            name: existing.name,
            email: existing.email,
            company: existing.company || "",
          });
        } catch (err) {
          toast.error(t(getErrorMessage(err)));
        }
      })();
    }
  }, [isNew, params.customerId]);

  // Save
  const onSubmit = async (data: CustomerFormData) => {
    try {
      if (isNew) {
        // Create new
        const newCust = Customer.fromForm(data, undefined);
        const saved = await updateCustomer(newCust);
        toast.success(t("Customer created!") as string);
      } else {
        // Update existing
        const idNum = parseInt(params.customerId, 10);
        const existing = Customer.fromForm(data, new Customer({
          id: idNum,
          // placeholders for existing fields
          name: data.name,
          email: data.email,
          company: data.company,
          createdAt: "",
          updatedAt: "",
        }.toDTO()));

        await updateCustomer(existing);
        toast.success(t("Customer updated!") as string);
      }
      router.push("../");
    } catch (err) {
      toast.error(t(getErrorMessage(err)));
    }
  };

  // Delete
  const handleDelete = async () => {
    if (isNew) return; // nothing to delete
    const confirmed = confirm(t("Are you sure you want to delete?") as string);
    if (!confirmed) return;

    try {
      await deleteCustomer({ id: parseInt(params.customerId, 10) } as Customer);
      toast.success(t("Customer deleted!") as string);
      router.push("../");
    } catch (err) {
      toast.error(t(getErrorMessage(err)));
    }
  };

  return (
    <div className="max-w-xl">
      <Button variant="outline" size="sm" onClick={() => router.back()}>
        {t("Back")}
      </Button>

      <h2 className="text-2xl font-bold mt-4">
        {isNew ? t("New Customer") : t("Edit Customer")}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        <div>
          <label className="block font-medium">{t("Name")}</label>
          <Input {...register("name", { required: "Name is required" })} />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block font-medium">{t("Email")}</label>
          <Input type="email" {...register("email")} />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block font-medium">{t("Company")}</label>
          <Input {...register("company")} />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit">{isNew ? t("Create") : t("Save")}</Button>
          {!isNew && (
            <Button variant="destructive" onClick={handleDelete}>
              {t("Delete")}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
```

**Key Points**  
- If `customerId === "new"`, we create a blank record.  
- Otherwise, we fetch the existing customer from `getCustomerById`.  
- On form submit, we build or update a `Customer` model via `Customer.fromForm(data, existing)`.  
- We call `updateCustomer(...)` and redirect or show a toast.

---

## 8. **Summary**

1. **Backend**: Implement or confirm endpoints (`/api/customer`) for listing, creating, updating, deleting customers (optionally with pagination).
2. **Frontend**:
   - **`Customer` model**: `fromDTO(...)` / `toDTO()` for consistent transformations.
   - **`CustomerApiClient`**: Wrappers around fetch/HTTP calls using `AdminApiClient`.
   - **`CustomerContext`**: Provides easy methods (like `getAllCustomers`, `updateCustomer`, `deleteCustomer`) to your React components.
   - **Admin Layout**: Wrap everything in `<CustomerProvider>`.
   - **Listing Page**: Display customers, implement search/pagination if needed.
   - **Edit/New Page**: Basic React Hook Form for user input, calls `CustomerContext` for create/edit operations.
3. **Enhance** with additional fields, validations, or logic as your application grows.

With these steps, you have a **simple, maintainable** pattern for any new entity—just replicate the approach for other objects (Orders, Products, etc.). Happy coding!