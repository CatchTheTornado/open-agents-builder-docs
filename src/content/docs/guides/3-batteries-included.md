---
title: Batteries Included
description: Open Agents Builder concepts and architecture
order: 20
---

Our goal was to make OAB ready for building PoCs (Proof of Concept) or production AI agents for businesses **in no time**.

That’s why we decided to include a variety of typical business features right in the panel. You can start building your agent as soon as possible, and once it’s working, integrate your internal data structures—via API—into your chosen ERP, CRM, or PIM.

A second principle guiding us is that **AI often lacks a suitable user interface**. While a chat interface might be useful for end users, it’s often insufficient for business stakeholders who need to work with numeric entities such as orders, or with more complex (though standard) data structures. It’s also convenient to have basic tooling—for example, an order system that calculates rather than guesses proper tax values.

**All these features and heuristics are included intentionally to help businesses make the most of AI in a way that aligns with real-world operations.**

## Business Features Included

You may have noticed that with an OAB account, you get not only an AI Agents IDE but also:

- **Products and Services** – A simple PIM where you can define products, including support for multiple currencies, variants, AI-generated descriptions, and more.

  <Image src="../../../assets/screenshot-oab-4.png" />

- **Orders** – A useful order management system that AI can operate on.
- **Calendar** – A basic scheduler and calendar service (with Gmail and Outlook integrations coming soon) that agents can use to check available time slots or book events.

  <Image src="../../../assets/calendar.png" />

- **Attachments** – An area where you can upload files (PDF, Word, Excel, PowerPoint, text, JSON, ZIP, etc.) to be automatically converted into Markdown and made accessible to AI agents.

## Enterprise-Grade Features Included

In addition to standard business features, OAB also offers several enterprise-level capabilities:

- **GDPR Compliance** – All user data gathered by your agents is encrypted with individual encryption keys, and we generate audit logs (accessible from the admin panel).
- **Data Encryption** – SSL is supported, and data is encrypted both at rest and in transit.
- **Sharing** – You can create shared keys that allow other team members to collaborate on agents and the data collected.
  
  <Image src="../../../assets/shared-keys.png" />

- **Audit Logs** – Easily track who accessed or modified your data and when.
  
  <Image src="../../../assets/audit.png" />

- **Export/Import** – Apply these features to all entities, such as `Products`, `Orders`, `Agents`, `Results`, and `Attachments`. You own your data and can export it at any time, including all uploaded files.