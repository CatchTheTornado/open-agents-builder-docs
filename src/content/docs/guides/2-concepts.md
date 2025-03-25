---
title: Concepts and Architecture
description: Open Agents Builder concepts and architecture
order: 20
---

The main concept behind Open Agents Builder and its architecture revolves around the `Agent` entity. You can create multiple agents of different types, each responsible for a distinct business case.

Agents can be [created from templates or started as plain projects](../4-creating-first-agent).

<Image src="../../../assets/overall-view.png" />

You can switch between agents via the top-bar menu. Agents can also be exported/imported as JSON files or saved as templates.

All application features—such as managing `Orders`, `Products`, or `Sessions`—are organized per agent. This means you can use agents to organize data similarly to how you'd use projects/folders or separate databases in other applications.

## User Interface

Each agent can be **easily shared** with end users through a unique URL. Depending on the agent type, users can interact with it via:

- A **Chat** user interface (the default and easiest way to build agents),
- A **Form** user interface (for more complex use cases),
- An **API** (for integrating agents with other systems).

<Image src="../../../assets/screenshot-oab-6.png" />

Above is an example of the Chat user interface, which is accessible through a shareable link. You can post this link on your website, social media, or in onboarding messages to let users directly engage with the agent.

## Agent Types

Agents can be defined as single-prompt `Chats` or multi-agent `Flows` (based on the [flows-ai](https://github.com/callstackincubator/flows-ai) framework):

- **Single-Prompt Chats** are ideal for linear flows such as gathering user data, creating orders, or scheduling services.
  
  <Image src="../../../assets/prompt.png" />

- **Multi-Agent Flows** support more complex scenarios, such as parallel generation or evaluating multiple LLM results. You can define intricate data flows between `Sub-Agents`, each with its own roles, message history, and LLM context. Tasks can be handed off from one sub-agent to another to achieve the main agent’s goal.

  <Image src="../../../assets/flows.png" />

You’ll notice that the right sidebar menu items **differ based on the current agent type**.

To simplify agent creation, we’ve pre-defined four agent types (each combining a UI with a specific agent type):

1. **Survey Agent** (Chat Interface) – Designed to guide users through a process with a clear end goal, such as creating a `Result`. It’s great for building intake forms or collecting other user data.
2. **Smart Assistant** (Chat Interface) – A general-purpose AI chatbot for tasks like user support.
3. **Sales Assistant** – Tailored for e-commerce, with prompts configured to prevent actions like purchasing items priced at zero.
4. **Flows / API** – Uses the `Flows` type, defined by complex flows rather than a single prompt.

## Tools

Agents can **use tools** such as accessing the `Products` catalog, creating `Orders`, executing API requests, and more.

<Image src="../../../assets/tools.png" />

`Tools` are the agent’s interface to the outside world. They can interact with internal data structures (e.g., orders, products) or external systems. You can also create custom tools to implement your own business logic or data exchange.

## Sessions and Results

By default, user interactions with agents are stored in `Sessions`, which capture the entire conversation (e.g., chat messages). A new `Session` is created each time a user starts a `Chat` or `Flow`.

Each interaction can (and typically should) produce a `Result`, which could be a Markdown report or a JSON object. For example, if you build a pre-visit intake form, the result might be a list of the user’s responses. If you create a shopping or make-to-order bot, the result might be an order object.

## Batteries Included

Our goal is to make OAB ready for building both proof-of-concept (PoC) and production AI agents for businesses in no time. That’s why we’ve added various useful, standard business features directly into the panel. You can start creating agents quickly, and once they’re up and running, you can integrate the internal data structures into your own ERP, CRM, or PIM systems via an API.

With an OAB account, you get not just an AI Agents IDE but also:

- **Products and Services** – A simple Product Information Management (PIM) system where you can define products, including support for multiple currencies, variants, AI-generated descriptions, and more.
- **Orders** – A useful Order Management System that agents can operate on.
- **Calendar** – A basic scheduler and calendar service (with Gmail and Outlook integrations coming soon). Agents can use it to check available time slots or book events.
- **Attachments** – A space where you can upload files in various formats (PDF, Word, Excel, PowerPoint, text, JSON, ZIP, etc.). They’re automatically converted to Markdown and made accessible to the AI agents.