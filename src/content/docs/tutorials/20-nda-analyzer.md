---
title: Crafting NDA analyzer in 3 min.
description: How to build an NDA analyzer in uder 3 minutes with Open Agents Builder
order: 20
---

> **Introduced in v0.5.0**  – upload files directly in any Chat‑type agent so the model can read, reason over, and reference them in its responses.

---

<iframe width="560" height="315" src="https://www.youtube.com/embed/ROADGz4HOGk?si=ehD-EHO4cJwi-s0a" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

### 1.  Why You’ll Care

* Give users a **one‑click way to share context** (contracts, images, spreadsheets) without leaving the chat.
* Build specialised agents – e.g. NDA risk analyzers, invoice auditors, image describers – **with zero extra code**.
* Every file becomes an **Attachment record** that you can query or export later via the Attachments API.

### 2.  Feature Overview

| Capability | Details |
|------------|---------|
| File picker in chat | Paper‑clip icon appears in the chat input of every *Chat* agent. |
| Supported file types | PDF, DOCX, TXT, Markdown, CSV, images (PNG/JPG/GIF/WebP), JSON, ZIP. |
| Automatic text extraction | PDFs & images → OCR; Office docs → plain‑text; everything stored in `attachment.content`. |
| Security | Binary lives in object storage; extracted text is AES‑encrypted in DB when a SaaS encryption key is set. |
| Public URLs | `/storage/attachment/{databaseIdHash}/{storageKey}` – no auth required; great for shareable links. ([github.com](https://github.com/CatchTheTornado/open-agents-builder-docs/blob/main/src/content/docs/api/16-attachments-api.md))|

### 3.  Using Chat Attachments in the UI

1. **Create (or open) a Chat‑type agent.**  
   *In the video demo we named it **“Can I Sign It?”***


<Image alt="" src="../../../assets/tutorials/11.png" />


2. In **Prompt → System instructions** tell the agent *how* to use uploaded files, e.g.:
   ```text
   You are a professional legal assistant. Analyse every document the user uploads and list: (1) risks, (2) liabilities, (3) a short recommendation: “SAFE TO SIGN” or “DON’T SIGN”.
   ```

<Image alt="" src="../../../assets/tutorials/12.png" />

3. **Save** and click **Run Agent**.
4. In chat, type a message (e.g. *“Please verify this document”*) and click the 📎 icon to upload a file.  
   The UI shows a progress bar while the file is sent.
5. Wait for the agent’s reply.  
   Behind the scenes:
   * the file is stored ⇒ `Attachment` record is created
   * text/content is extracted and injected into the model prompt
   * the attachment appears under **Admin → Attachments** with full metadata.
6. **Review the answer.** The model response will reference the extracted text. For PDFs each page is delimited so you can ask follow‑up questions (e.g. *“Explain clause 10 in simpler language”*).

<Image alt="" src="../../../assets/tutorials/13.png" />


####. Tip   Version Control of Attachments
All chat uploads are **session‑bound**. Export a full chat (messages + attachments) from **Admin → Sessions → ➔ Export ZIP** whenever you need an audit trail.

### 4.  Under the Hood (Developer Notes)

#### 4.1. Data Model
`AttachmentDTO` contains metadata plus optional extracted `content` field. See the **Attachments Management API** for the full schema and endpoints. ([github.com](https://github.com/CatchTheTornado/open-agents-builder-docs/blob/main/src/content/docs/api/16-attachments-api.md))

#### 4.2. REST Endpoints You’ll Use Most
| Endpoint | Purpose |
|----------|---------|
| `PUT /api/attachment` | Upsert attachment (metadata + file). |
| `GET /api/attachment/{id}` | Download binary (auth required). |
| `GET /storage/attachment/{dbHash}/{id}` | Public download (no auth). |
| `GET /api/attachment/query` | Full‑text search your attachments (`?query=`). |
| `GET /api/attachment/export` | Bulk export all attachments (ZIP). |


### 5.  FAQ

**Q: Can I upload multiple files in one message?**  
Yes, up to 5 per turn. Each appears as its own `Attachment` and is concatenated in the prompt in the order you attach them.

**Q: Are files re‑used in subsequent turns?**  
Yes—files you upload stay in the session’s memory. Delete them from **Attachments** if you want to prevent further use.

**Q: Does the public URL expose private data?**  
Only if you share it. The URL contains an unguessable hash; disable public access by removing the `/storage` route.

