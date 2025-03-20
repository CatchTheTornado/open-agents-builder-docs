---
title: Creating the first agent
description: Getting started with Open Agnets Builder
order: 20
---

After creating a [free demo access](https://openagentsbuilder.com) or [deploying OAB](../guides/1-getting-started.md) locally  - and opening the app - you should see a screen for picking up the template for your new agent:

<Image src="../../../assets/templates.png" />

It's pretty convienient way to get started as the basic 6 templates covers pretty much most of the [supported agent types](../guides/2-concepts.md).

- **Bella Styles - hairdresser bookings** - is a general purpose booking AI Chat - you may create it and then post the link on your webpage to start getting the bookings for visits or services coming from your end - users. This bot uses the `Calendar` module so the bookings will be already checked against and scheduled in internal `Calendar` to avoid overbookings.

- **Cake Factory** - it's an e-commerce and made-to-order product customization bot in which users may create their desired Cake, give the order details and even select a production date - which all ends up scheduling a `Calendar` event, placing an `Order` and keeping the cake specification in the `Result` entity.

- **InstaFit - fitness shop** - it's another e-commerce agent which has access to the internal `Product and Services` and `Orders` tools - letting your customers chat with the products database and place the orders, it also effectively manages the shopping carts while your customers are still thinking what to buy, not letting the AI to halucinate about the prices or taxes.

- **Import order or invoices** - this is the `Flows` based agent - which is way more comples and can be non-linear, it also provides the user with the `Form` instead of `Chat` user interface - in which they can upload a PDF, Image, Word or Excel including an order - which using AI OCR features will be transformed and saved as `Order` in the OMS  (!). This agent can be also called via the API.

- **Analyze Github project** - this `Flows` based agent is here to show you how you can create a parallel generations - in this case, calling the `HTTP` tool to get the issues and project information from Github, handing it over to the report creator sub-agent analyizing the project condition as an end result.


For our tutorial - please check the **"InstaFit - fitness shop for Instagram"**. 

**Congratulations!** 

After clicking the "Use template" you should be immediately redirected to a new Agent General settings:

<Image src="../../../assets/general.png" />

You can modify the **Welcome Message** which is being shown to your end user once they enter the Agent page. It could contain some intro how they are intended to use this Agent or some info about your company.

Pretty much important features are located below - where you can (and probably should) provide the users with some **Terms and conditions**. 

For example if you're building an e-commerce agent it should be your e-store policy containing info on how you handle customers rights, how you process their personal data etc.

If you're about to publish your agent to a wider audience - please consider asking your Legal Advisor in order to help creating the terms.

Users **Must confirm the terms** if you provide them and check this option.

The last two options are set for making the users provide the Name and E-mail for getting the access to the agent itself and the last checkbox **Published** marks if the agent is just available for internal purposes (after authenthication) or **publicly available** when the checkbox is checked. Make sure it's published before sharing it with your customers :)

<Image src="../../../assets/general-bottom.png" />


## Setting the prompt

After having the general settings set and done you might want to go to the **Prompt** tab. This is where you set the flow for your agent - describing each step it should take in response to the user's feedback

<Image src="../../../assets/ai-prompt.png" />

In our case it's describing the shop assistant behavior - please don't hesitate to play with the prompt and modify it to check how does it work.

After every change you can **Preview** your agent using the button in the top-bar.

<Image src="../../../assets/top-bar.png" />

When you click it the End User - Chat UI will be opened in new browser tab so you can test how it works.

If you're wondering where the heck the agent is taking the products from - it's from the **Products and services** tab where you can define them. 

**Note**: The products catalog is shared between agents so it's easier for you to create for example an agent for specific category or types of products while operating on a shared catalog.

<Image src="../../../assets/screenshot-oab-4.png" />

The product has the access to the product catalog and - by the way - can create Orders because they're given access to it on the **Tools tab** where you can check all the available tools as well and maybe enable some other ones as well.

<Image src="../../../assets/tools.png" />


***Congratulations!*** Your first agent has been just created. Don't hesitate to try out all the other templates or to play with some new concepts using the Blank template as well.

