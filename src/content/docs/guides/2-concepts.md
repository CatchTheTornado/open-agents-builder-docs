---
title: Concepts and architecture
description: Open Agents Builder concepts and architecture
order: 20
---

The main concept of Open Agents Builder and it's architecture circles around the  `Agent` entity. You may create many different agents, each of different type and in charge of different Business Case.

Agents can be [created from templates or as just plain projects](../4-creating-first-agent.md).

<Image src="../../../assets/overall-view.png" />

You may switch the current `Agent` you're working on using the top-bar menu. Agents can be exported/and imported from JSON files or saved as templates as well.

All the application features - like managing the `Orders`, `Products` or `Sessions` are oriented per-agent - so you can simply use the agents to organize the data like you'd use the projects/folders or separate databases in other apps.

## User Interface

Each agent can be **easily shared with the users** via unique URL link **you may share with your end users**. Depending on the type of the Agent they might ba used by the users via:
- **Chat** user interface (the default, and easiest way to build first agents)
- **Form** user interface (for the more complex use cases),
- **API** (for integrating the agents with other systesm).


<Image src="../../../assets/screenshot-oab-6.png" />
This is just an example of Chat user interface - it's under a link you can share with your users, put on your website, Instagram or send in onboarding messages in order to get your users being served by the Agents.


## Agent types

Agents can be defined as a single-prompt `Chats` or multi-agent `Flows` (based on the [flows-ai](https://github.com/callstackincubator/flows-ai) framework).

The first type is great when there's a linear flow - like gathering the users' data, making orders, scheduling services.

<Image src="../../../assets/prompt.png" >

In the latter type, more complex cases are possible to handle - like calling parallel generations, evaulating multiple LLM results etc. In this case you can define very complex dataflows between `Sub-Agents` which are meant as sperate LLM-contexts with it's own roles, message histories etc. Tasks might be easily hand-over from one sub-agent to another in order to achieve the main Agent's goal.

<Image src="../../../assets/flows.png" >

You may notice, that the right sidebar menu items **differ based on the current agent type** 

For making the agent's creation process easier, we pre-defined four agent types (UI combined with the agent type):

1. **Survey Agent** with Chat Interface - it's goals is navigate user thru the process with the clear goal in the end: create the `Result`. It's great for creating intake forms or gathering other types of data from users.
2. **Smart Assistant** with Chat Interface - assistants are general purpose AI chat-bots you might create for use cases like user support etc.
3. **Sales Assistant** - this kind agents are prepared to work with e-commerce data - for example they're pre-prompted to not let the users buy 0-priced products etc.
4. **Flows / API** - this kind of agents are based on the `Flows` agent type and are defined not by a linear prompt but rather by the Flows.

## Tools

Agents can **use tools** like accessing the `Products` catalog, creating `Orders`, executing API requests and so on.

<Image src="../../../assets/tools.png" />

`Tools` are the agent's interface to the world. You might use it to interact with internal data structures (like orders, products etc) or with the external systems. Eventually you might create your own tools for implementing the custom business logic or data exchange.


## Sessions and Results

By default the User interactions with agents are stored within `Sessions` what stores the entire conversation (eg. chat messages).

`Session` is created each time user starts the `Chat` or `Flow`

Each interaction can (and by default should) end up with generating a `Result` - which can be a markdown report or JSON object. 

For example if you created a pre-visit intake form - it's result would be the list of the user answers. If you created a shopping or make-to-order bot - the results would be an order object.

## Batteries included

Our idea was to have OAB ready for building PoC's (Proof of Concept) or Production AI Agents for business - at no time.

This is the reason we decided to include some cool, typical business features inside the panel. The idea is that you can start your Agent ASAP - and when it works - integrate the internal data structres - via API - with your desired systems like your ERP, CRM and PIM.

You may noticed that with the OAB account you're getting not only the AI Agents IDE but also:
- `Products and Services` - which is a simple PIM where you can define products including support for currencies, variants, AI generated descriptions etc.
- `Orders` - which is a pretty usefull Order Management System - AI can operate upon,
- `Calendar` - which is basic Scheduler and Calendar service (GMail and Outlook integrations comming soon) - Agents can check the available time slots or book events,
- `Attachments` - where you can upload any files in: PDF, Word, Excel, Powerpoint, text, json, ZIP (including all above mentioned formats) files - and have them automatically processed to `markdown` and accesible to the AI Agents.
