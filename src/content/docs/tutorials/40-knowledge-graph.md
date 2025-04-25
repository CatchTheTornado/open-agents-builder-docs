---
title: Building company knowledge store
description: How to create a relationship database based on all your documents
order: 20
---

<iframe width="560" height="315" src="https://www.youtube.com/embed/GSmuboHuYf8?si=0FAaaYmfHxRL05jt" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

### 1. Create the agent

| Field | What to do |
|-------|------------|
| **Agent Name** | `Company ecosystem` |
| **Agent type** | `Smart assistant [Chat]` (default) |

> **Tip:** keep everything else in the *General* tab at its defaults for now.  

<Image alt="" src="../../../assets/tutorials/20.png" />

---

### 2. Give it a role

1. Switch to **AI Prompt** in the left menu.  
2. Paste the prompt below (it’s exactly what you typed in the video):

```text
You’re the company-ecosystem managing agent. Users will upload files with invoices and all sorts of agreements. Please save in memory the data about the ecosystem:

◦ every record should be one graph node – company with a unique id  
◦ within the record – as JSON – save the relation information to us (invoice, agreement, etc.)

Let the users search through the memory to check up the relation with different companies.
```
3. Click **Save**.

<Image alt="" src="../../../assets/tutorials/21.png" />

---

### 3. Create a vector store

1. Go to **Memory and Knowledge**.  
2. Press **Create Store** ➜ name it `companies` ➜ **Save**.  
3. (Optional) create another store called `facts` for free-form snippets.

You should now see two cards – _facts_ and _companies_ – just like the video.

<Image alt="" src="../../../assets/tutorials/23.png" />

---

### 4. Add two memory tools 

Navigate to **Tools** and click **Add Tool** twice:

| Tool | Setting | Value |
|------|---------|-------|
| 1 | **Tool type** | `Memory/vector save` |
|   | **Description** | `company-relationships graph save` |
|   | **Store** | `companies` |
| 2 | **Tool type** | `Memory/vector search` |
|   | **Description** | `company-relationships graph search` |
|   | **Store** | `companies` |

Click **Save** at the bottom.

<Image alt="" src="../../../assets/tutorials/22.png" />


---

### 5. Preview & upload documents

1. Hit the **Preview** button (top-right).  
2. Drag-and-drop your PDFs (NDAs, invoices, agreements, etc.) into the chat and send:  
   > “Save those documents for me, please.”

The agent will OCR/parse every file, then call **Memory/vector save** to store the clean text plus metadata in the `companies` vector store.

---

### 6. Inspect what was saved

Back in **Memory and Knowledge**, click **View Records** on the `companies` store.  
The pop-up lists each saved chunk, shows its similarity score and lets you run an ad-hoc **Vector Search** (e.g. “invoice to Acme”).

<Image alt="" src="../../../assets/tutorials/24.png" />

---

### 7. Chatting with your knowledge base

Because you wired the search tool, the agent can now answer questions that require recalling those chunks.  
Example session (exactly like in your demo):

```
User: what relationship do we have with Acme?
Agent: We have a Consulting Services Agreement with Acme Ltd… (plus two invoices and an NDA)

User: Tell me about the risks we have out of this NDA?
Agent: … (summarises confidentiality obligations, liability caps, etc.)
```

<Image alt="" src="../../../assets/tutorials/25.png" />


---

### 8. How vector search actually works (quick primer)

* Every sentence is turned into a numerical “embedding”.  
* **Similarity** is computed as the distance between vectors.  
* That’s why “Acme retainer invoice” still finds “Invoice JD-ACME-001” even if you didn’t type the exact file name – the semantic meaning is close enough.

---

### 9. Next-level ideas

| Idea | How |
|------|-----|
| **Short-term memory** | Tick “Short-term memory – with expiration date” in the *save* tool if you want records to disappear automatically (e.g. 30-day draft docs). |
| **Multiple ecosystems** | Create one vector store per subsidiary and switch tools accordingly. |
| **Graphs & reports** | Export the JSON metadata to Neo4j or draw Org-charts inside the agent with a simple Python tool. |
| **Compliance alerts** | Add an *Events* rule: on every new NDA upload, trigger a policy-check prompt. |

---

### That’s it!

You now have a self-updating, searchable knowledge base of every agreement, invoice and NDA your company signs – all built with a handful of clicks.

Let me know if you’d like this tutorial as a downloadable PDF or if you want to expand the agent with extra features (automated reminders, Slack notifications, etc.).