---
title: Creating e-Commerce agent
description: Creating e-Commerce agent in 3 minutes
order: 20
---

<iframe width="560" height="315" src="https://www.youtube.com/embed/FkfTdRx6M9E?si=kuv1mAS5CAWBtgXO" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>


### 1. Sign up & Log in
```text
1. Visit https://openagentsbuilder.com
2. Click **Get started free** and create your account  
   ▸ The whole process takes < 30 s.
3. Log in — you’ll land in the **Open Agents Builder** workspace.
```

---

### 2. Create a New Agent from a Template
| Action | Where to click | What happens |
| ------ | -------------- | ------------ |
| Open the **Templates** modal | **New Agent… → Use Template** | A gallery of ready‑made bots appears. |
| Choose **“InstaFit – fitness shop for Instagram”** | | The template is copied into **your** workspace. |
| Click **Use template** | — | Your personal copy is instantly published. |

<Image alt="" src="../../../assets/tutorials/7.png" />

> **Why this template?** It ships with a minimal product catalog (Gradient Performance Hoodie), a built‑in shopping cart, checkout logic, and order management screens — perfect for learning the flow.

---

### 3. Test‑drive the Agent (Front‑end)
1. Press **Preview** in the top‑right corner of the builder.  
2. Shareable chat URL opens in a new tab – this is the same link you can embed on your site, IG bio, WhatsApp, etc.
3. **Enter a test name & e‑mail** (required because the template collects user data).
4. Chat away:
   ```text
   User: Do you have any hoodie?
   Agent: [Shows Gradient Performance Hoodie, price $130, sizes XS‑L]
   User: I’ll take size M
   Agent: Adds item to the cart, shows order summary
   User: Please make the order, my name is John Doe, New York City, 46 Street 52, 23W42
   Agent: Generates order confirmation + Order ID, and promises a payment link
   ```
   The agent **never hallucinates** prices or SKUs – data is pulled straight from the catalog you control.


<Image alt="" src="../../../assets/tutorials/8.png" />


---

### 4. Inspect the Order (Back‑office)
1. In the builder, open **Orders** in the left sidebar.  
2. You’ll see two cards by default:
   * **#ORD‑YYYY‑MM‑DD‑IBV** – status = New  
   * **Shopping Cart** – the live cart for the current chat session
3. Click the order card to view details: billing/shipping address, line items, tax, shipping method, totals, internal notes, status dropdown, etc.

<Image alt="" src="../../../assets/tutorials/9.png" />


---

### 5. Manage the Product Catalog
#### 5.1 Product Information (PIM)
* Navigate to **Products and services → Gradient Performance Hoodie**  
* Fields you can edit:
  * **Images** – upload any number, reorder, crop
  * **Description** – rich‑text or auto‑generated from an image (see §5.3)
  * **Attributes** – Color, Material, Size, Feature …
  * **Variants** – one row per SKU (price, tax, stock, etc.)

<Image alt="" src="../../../assets/tutorials/10.png" />


#### 5.2 Generate Variant Combinations Automatically
1. Add/select attributes (e.g. `Color: Pink|Blue`, `Size: S|M|L|XL`).
2. Click **Generate Variants**.
3. OABuilder creates all combinations (`Pink S`, `Pink M`, …) with unique SKUs and inherits pricing — massive time‑saver.

#### 5.3 AI‑assist: Write Descriptions from Photos
* Inside a product, drop a new photo into **Images**.
* Hit **🪄 Generate** (magic‑wand icon).  
* The builder writes:
  * A marketing description (“Elevate your workout wardrobe…”)  
  * Suggested attribute values (Material, Sleeve Length, etc.)

---

### 6. Configure Shipping, Payments, Statuses
| Setting | Where | Notes |
| ------- | ----- | ----- |
| **Shipping methods** | *Orders → Shipping Method* | Add flat rates, per‑region pricing, or API‑driven carriers. |
| **Payment link / provider** | *Integrations* | Plug in Stripe, PayPal, manual invoice, etc. |
| **Order statuses** | *Orders → Status dropdown* | Draft → New → Paid → Shipped → Completed (customizable). |

---

### 7. Share or Embed Your Agent
* **Public chat URL** (found under **Preview**) – paste in Instagram bio, Stories “link sticker”, Facebook, WhatsApp, email campaigns…
* **iFrame script** – copy from **API and widgets** to [embed on any webpage](/guides/5-integrating-with-the-website.md).
* **Zapier / Make / Webhooks** – automate notifying fulfillment centers, CRMs, sheets, you name it. Read on [how to integrate external tools](/extensibility/5-integrating-with-the-website.md).




---

### 8. Power‑tips & Next Steps
* **Terms & Conditions / GDPR** – toggle *Must confirm T&C* in **General** if you sell in EU.  
* **Custom prompts & safety rules** – fine‑tune how the AI replies (tab **AI Prompt** & **Safety Rules**).  
* **Multi‑language storefront** – set **Default language** per agent or use dynamic `locale` detection.  
* **Inventory sync** – connect your existing e‑commerce DB via the **Integrations** tab; OABuilder becomes a chat front‑end, orders flow back automatically.  
* **Analytics** – each chat session appears under **Sessions** with full transcripts for QA and marketing insights.

---

### 9. Cheat‑sheet (Copy & Keep)

```markdown
1. New Agent → Use Template → InstaFit
2. Preview link → test chat, add to cart, place order
3. Orders tab → verify order data
4. Products & services → edit item, Generate Variants 🪄
5. Images → 🪄 Generate description
6. Configure shipping, payment, statuses
7. Share the public URL or embed widget
```

Happy selling! 🎉 Every order captured by the bot hits your **Orders** dashboard in real time, 100 % driven by the data you just configured.