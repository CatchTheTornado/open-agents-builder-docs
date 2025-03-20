---
title: Creating the API Key
description: How to get manage the API keys
---

Most of the Open Agents Builder features are available thru the REST API.

The first step to access it is to [create your fist agent](../guides/4-creating-first-agent.md) and then navigate to the `/api` tab in order to create your first API Key

<Image src="../../../assets/api-keys.png" />

When you click the **Add API Key** button new API Key will be generated - but **Please note** this key is **NOT STORED IN THE APPLICATION** so we will not be able to show it again to you! Please copy and store it in the safe place. 

<Image src="../../../assets/create-key.png" />

The best option would probably be to set it in your current shell env (eg. exporting it in the `~/.bashrc` or `~/.zshrc` files) so it will be available every time you are about to call it:

```bash
export OPEN_AGENTS_BUILDER_API_KEY=ad_key_eyJhbGciOiJIUzI1NiJ9.eyJkYXRhYmFzZUlkSGFzaCI6IjM1ZjVjNWIxMzlhNmI1NjlkNDY0OWI3ODhjMTg1MTgzMWViNDRkOGUzMmI3MTZiODQxMWVjNjQzMWFmODEyMWQiLCJrZXlIYXNoIjoiJGFyZ29uMmQkdj0xOSRtPTE2Mzg0LHQ9MixwPTEkTUhkcU0ydGpVV1JRTmxOeFUwSXpOVlJpU1dWdFEyd3JVVGRtYjFaTlZVNXJWemhYT0VWMEx6TlRVVDAkNzgvdDZMczhzTkk2T3R1TjJ0dUpiZmZ1U2lIM24vbFNueU5sUlM0QkVYbyIsImtleUxvY2F0b3JIYXNoIjoiNGIzYzkzYTFhZGJjZTg0YjY5NmRkNWZiMWI2YTExZTFhZjA1ZjA3ZjIxZmVjYjY3YzU1ZDMyYzE0MzEyOTdlNSIsImlhdCI6MTc0MjQ3NjQ4MiwiaXNzIjoidXJuOmN0dDpvcGVuLWFnZW50cy1idWlsZGVyIiwiYXVkIjoidXJuOmN0dDpvcGVuLWFnZW50cy1idWlsZGVyIn0.iRluH4hmZXNJ0fqrdt9Mwn1o-K8VfDOwxoIpBE_lg6s
```

After running this command, your API Key will be available under the `$OPEN_AGENTS_BUILDER_API_KEY` environment variable.

To check if the API works please just call the:

```bash
curl -X GET -H "Authorization: Bearer ad_key_eyJhbGciOiJIUzI1NiJ9.eyJkYXRhYmFzZUlkSGFzaCI6IjM1ZjVjNWIxMzlhNmI1NjlkNDY0OWI3ODhjMTg1MTgzMWViNDRkOGUzMmI3MTZiODQxMWVjNjQzMWFmODEyMWQiLCJrZXlIYXNoIjoiJGFyZ29uMmQkdj0xOSRtPTE2Mzg0LHQ9MixwPTEkTUhkcU0ydGpVV1JRTmxOeFUwSXpOVlJpU1dWdFEyd3JVVGRtYjFaTlZVNXJWemhYT0VWMEx6TlRVVDAkNzgvdDZMczhzTkk2T3R1TjJ0dUpiZmZ1U2lIM24vbFNueU5sUlM0QkVYbyIsImtleUxvY2F0b3JIYXNoIjoiNGIzYzkzYTFhZGJjZTg0YjY5NmRkNWZiMWI2YTExZTFhZjA1ZjA3ZjIxZmVjYjY3YzU1ZDMyYzE0MzEyOTdlNSIsImlhdCI6MTc0MjQ3NjQ4MiwiaXNzIjoidXJuOmN0dDpvcGVuLWFnZW50cy1idWlsZGVyIiwiYXVkIjoidXJuOmN0dDpvcGVuLWFnZW50cy1idWlsZGVyIn0.iRluH4hmZXNJ0fqrdt9Mwn1o-K8VfDOwxoIpBE_lg6s" \
  -H "database-id-hash: 35f5c5b139a6b569d4649b788c1851831eb44d8e32b716b8411ec6431af8121d" \
  http://localhost:3000/api/agent
```


or - if you exported the `OPEN_AGENTS_BUILDER_API_KEY`: 


```bash
curl -X GET -H "Authorization: Bearer $OPEN_AGENTS_BUILDER_API_KEY" \
  -H "database-id-hash: 35f5c5b139a6b569d4649b788c1851831eb44d8e32b716b8411ec6431af8121d" \
  http://localhost:3000/api/agent
```


**Note**: You might noticed that the pretty unique `database-id-hash` header is always set with all new requests. This header is the database identifier - unique as per user account. It always will be the same for all your API Requests within single OAB database/owner account.


This request should return the following JSON array:


```json
[
    {
        "id": "zb18x8kjoilNo-vL99r9s",
        "displayName": "New from template: InstaFit - fitness shop for Instagram",
        "options": "{\"welcomeMessage\":\"Hey! Welcome to my store with **ActiveWearPro** brand products! Check out our top products, ask for details, choose your size, and order!\",\"termsAndConditions\":\"\",\"mustConfirmTerms\":false,\"resultEmail\":\"\",\"collectUserEmail\":true,\"collectUserName\":true}",
        "events": "{}",
        "tools": "{\"tool-1740483491887\":{\"tool\":\"listProducts\",\"description\":\"\",\"options\":{}},\"tool-1740483500288\":{\"tool\":\"createOrderTool\",\"description\":\"\",\"options\":{}}}",
        "prompt": "You are an assistant in an online store. You help customers choose and order products from our assortment. Answer all questions about the products. Show their photos. Show their variants and attributes. Let them choose variants.\n\nAt the start, proactively ask what the customer is interested in and show 3  products from the catalog with photos as a table: photo, product name, price, available variants. Always show products this way. In the alt text of product photos, provide \"product-{id}\" where {id} is the product number.\n\nManage a cart for the customer - collecting products they want to order.\n\nIf the customer changes their mind, save their cart as a sales opportunity rather than an order.\n\nIf the customer wants to place an order, save the order in the expected format.\n\nAs for payment methods, the customer will receive a link to pay for the order (sent manually by store staff) after placing the order.",
        "flows": "null",
        "published": null,
        "defaultFlow": null,
        "inputs": null,
        "agents": "null",
        "expectedResult": "The result is an order. Before placing the order, summarize the cart by listing the products, prices, quantities, and the total order value.\n\nIf the customer wants to place an order - ask the customer for all the necessary data for the order, which are:\n\nFirst and last name\n\nEmail\n\nDelivery address (city, postal code, street)\nInvoice address if different from the delivery address\n\nThe result should be an order in **markdown** format with a nice table of ordered goods and all the data needed to fulfill the order",
        "safetyRules": "Do not let the customers to add zero-priced products to the cart. Do not let customers to order products out of catalog.",
        "status": "active",
        "locale": "en",
        "agentType": "commerce-agent",
        "createdAt": "2025-03-20T10:29:31.076Z",
        "updatedAt": "2025-03-20T10:29:31.076Z",
        "icon": null,
        "extra": null
    },
    {
        "id": "m8r22uvT2_KsMODoEw9ag",
        "displayName": "New from template: Import and invoice orders",
        "options": "{\"welcomeMessage\":\"Welcome to the **Import and Invoice** orders agent. Upload a file with your order data or enter it manually, and we'll try to import it plus generate an invoice. You can call this agent as a convenient API import as well.\",\"termsAndConditions\":\"\",\"mustConfirmTerms\":false,\"resultEmail\":\"\",\"collectUserEmail\":false,\"collectUserName\":false}",
        "events": "{}",
        "tools": "{}",
        "prompt": "",
        "flows": "[{\"name\":\"Import order\",\"code\":\"import\",\"flow\":{\"type\":\"sequence\",\"steps\":[{\"type\":\"step\",\"agent\":\"Order agent\",\"input\":\"try to parse the input of @orderFile (if provided) to JSON \\nif it's not possible use the @seller @buyer and @items information to create the order\\nuse the tool to create the order in the database\\nreturn the order in JSON format\"},{\"type\":\"step\",\"agent\":\"Invoice agent\",\"input\":\"based on the order generated in the previous step please take the @Invoicedocumentdocx template and generate the document with the invoice\"}]},\"inputs\":[{\"name\":\"orderFile\",\"description\":\"order file - PDF, CSV, Excel, Word ...\",\"required\":false,\"type\":\"fileBase64\"},{\"name\":\"items\",\"description\":\"text including ordered items\",\"required\":false,\"type\":\"longText\"},{\"name\":\"seller\",\"description\":\"seller information including address\",\"required\":false,\"type\":\"shortText\"},{\"name\":\"buyer\",\"description\":\"buyer information\",\"required\":false,\"type\":\"shortText\"}]}]",
        "published": null,
        "defaultFlow": null,
        "inputs": null,
        "agents": "[{\"name\":\"Order agent\",\"model\":\"gpt-4o\",\"system\":\"You are a skilled order agent who can map imported order files or text information to existing products  (if exists) or create virtual line items in order to save the order into database. If some information is not provided try to fake it.\",\"tools\":[{\"name\":\"currentDate\",\"options\":{}},{\"name\":\"listProducts\",\"options\":{}},{\"name\":\"createOrderTool\",\"options\":{\"virtualProducts\":true}}]},{\"name\":\"Invoice agent\",\"model\":\"gpt-4o\",\"system\":\"You're invoice agent - based on the Invoice template document you're generating invoice based on the order data\",\"tools\":[{\"name\":\"listAttachments\",\"options\":{}},{\"name\":\"attachmentContent\",\"options\":{}}]}]",
        "expectedResult": "",
        "safetyRules": "",
        "status": "active",
        "locale": "en",
        "agentType": "flow",
        "createdAt": "2025-03-20T11:08:14.606Z",
        "updatedAt": "2025-03-20T11:08:14.606Z",
        "icon": null,
        "extra": null
    },
    {
        "id": "7Wq387dQ59f-x7p73dTcv",
        "displayName": "New from template: InstaFit - fitness shop for Instagram",
        "options": "{\"welcomeMessage\":\"Hey! Welcome to my store with **ActiveWearPro** brand products! Check out our top products, ask for details, choose your size, and order!\",\"termsAndConditions\":\"\",\"mustConfirmTerms\":false,\"resultEmail\":\"\",\"collectUserEmail\":true,\"collectUserName\":true}",
        "events": "{}",
        "tools": "{\"tool-1740483491887\":{\"tool\":\"listProducts\",\"description\":\"\",\"options\":{}},\"tool-1740483500288\":{\"tool\":\"createOrderTool\",\"description\":\"\",\"options\":{}}}",
        "prompt": "You are an assistant in an online store. You help customers choose and order products from our assortment. Answer all questions about the products. Show their photos. Show their variants and attributes. Let them choose variants.\n\nAt the start, proactively ask what the customer is interested in and show 3  products from the catalog with photos as a table: photo, product name, price, available variants. Always show products this way. In the alt text of product photos, provide \"product-{id}\" where {id} is the product number.\n\nManage a cart for the customer - collecting products they want to order.\n\nIf the customer changes their mind, save their cart as a sales opportunity rather than an order.\n\nIf the customer wants to place an order, save the order in the expected format.\n\nAs for payment methods, the customer will receive a link to pay for the order (sent manually by store staff) after placing the order.",
        "flows": "null",
        "published": null,
        "defaultFlow": null,
        "inputs": null,
        "agents": "null",
        "expectedResult": "The result is an order. Before placing the order, summarize the cart by listing the products, prices, quantities, and the total order value.\n\nIf the customer wants to place an order - ask the customer for all the necessary data for the order, which are:\n\nFirst and last name\n\nEmail\n\nDelivery address (city, postal code, street)\nInvoice address if different from the delivery address\n\nThe result should be an order in **markdown** format with a nice table of ordered goods and all the data needed to fulfill the order",
        "safetyRules": "Do not let the customers to add zero-priced products to the cart. Do not let customers to order products out of catalog.",
        "status": "active",
        "locale": "en",
        "agentType": "commerce-agent",
        "createdAt": "2025-03-20T12:05:45.591Z",
        "updatedAt": "2025-03-20T12:05:45.591Z",
        "icon": null,
        "extra": null
    }
]
```



## Further reading

- Read [about reference](https://diataxis.fr/reference/) in the Diátaxis framework
