---
title: Batteries Included
description: Open Agents Builder concepts and architecture
order: 20
---

Our idea was to have OAB ready for building PoC's (Proof of Concept) or Production AI Agents for business - **at no time**.

This is the reason we decided to include some cool, typical business features inside the panel. The idea is that you can start your Agent ASAP - and when it works - integrate the internal data structres - via API - with your desired systems like your ERP, CRM and PIM.

The second **thesiss we had** is that **AI is lacking UI** and the Chat interface - as it might be usefull for the End Users - it's rarely **enough for business stakeholders** especially for numeric entties like Orders or some more complex - though standard - structures.

It's also covenient to have the basic tooling - like creating order which is calculating rather than guessing - proper tax values etc. 

**All these heuristics are included on purpose to make making most of the AI for the Business the way Business works.**


## Business features included

You may noticed that with the OAB account you're getting not only the AI Agents IDE but also:

- `Products and Services` - which is a simple PIM where you can define products including support for currencies, variants, AI generated descriptions etc.

<Image src="../../../assets/screenshot-oab-4.png" />

- `Orders` - which is a pretty usefull Order Management System - AI can operate upon,
- `Calendar` - which is basic Scheduler and Calendar service (GMail and Outlook integrations comming soon) - Agents can check the available time slots or book events,

<Image src="../../../assets/calendar.png" />

- `Attachments` - where you can upload any files in: PDF, Word, Excel, Powerpoint, text, json, ZIP (including all above mentioned formats) files - and have them automatically processed to `markdown` and accesible to the AI Agents.

## Enterprise grade features included

More than business features - OAB includes some Enterprise features as well, including:

- **GDPR ready** - we're encrypting all the user data gathered by You in the app using individual encryption keys, we're doing audit logs (accessible from the admin panel as well),
- **Data Encryption** - SSL supported, data is encrypted on storage and in transit,
- **Sharing** - you may create  the Shared Keys for other employees to work together on the agents and the data gathered,

<Image src="../../../assets/shared-keys.png" />

- **Audit logs** - check who and when had access to your data or modify it

<Image src="../../../assets/audit.png" />
