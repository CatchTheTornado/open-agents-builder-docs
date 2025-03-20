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

- **InstaFit - fitness shop** - it's another e-commerce agent which has access to the internal `Product and Services` 