---
title: Getting started
description: Getting started with Open Agnets Builder
order: 10
---

The easiest way to start building agents with Open Agents Builder is to [create a free, cloud hosted instance](https://openagentsbuilder.com) on `openagentsbuilder.com`. Having this done you may start building the agents right away with full API access etc.

<a href="https://openagentsbuilder.com"><Image alt="Create free account on OpenAgentsBuilder.com to start building agents right away" src="../../../assets/register.png" /></a>


## Local setup

Cloud edition is great for starting out, building PoC's or if you like to avoid technical hassle - willing to quickly start out. 

However if you plan to build custom integrations, use Open Source LLM models, build custom AI tools - you probably need to deploy the software locally.

Fortunately, it's just a few shell command away!

First, checkout the project:

```bash
git clone https://github.com/CatchTheTornado/open-agents-builder
cd open-agents-builder
```

Make sure you've got the node version `22` installed which is required by the project. If not, you may switch the node version using `nvm` (read [how to install nvm i if you haven't already](https://github.com/nvm-sh/nvm)):

```bash
nvm install 22
nvm use 22
```

For using the Attachments module, to have the text content extracted out of the PDF, Office files you'll need to install some python dependencies. If you don't have the local python env set, the best way would be [to use `pipx`](https://github.com/pypa/pipx) instead of `pip` to have the packages installed within the default, global python env:

Install `pipx` using `brew install pipx` (on Mac) or `apt-get install pipx` (on Debian) for managing your defualt Python 3 env automatically, and run:

```bash
pipx install markitdown
pipx install poppler
```


Now, edit the `ENV` variables:

```bash
cp .env.defaults .env.local
```

Edit the `.env.local` file:

```bash
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o

# OpenAI API key
OPENAI_API_KEY=

# Resend.com API key
RESEND_API_KEY=

# absoulte app url starting with http://
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_URL=http://localhost:3000
PORT=3000 # 3002 is prod app port
NEXT_PUBLIC_EMAIL_FROM=no-reply@.... # accordingly to your Resend.com settings
NEXT_PUBLIC_ENV=dev
```

### Open AI API key and LLM support

We are using Vercel AI for accessing LLM's and embedding models. This means you are able to switch the LLM model and provider to any supported by Vercel AI SDK (eg. Google Gemini, Claude etc.).

At this point, becase of pretty extensive usage of Tools and Structured Outputs - the app works best with Open AI Models. 

Please go to [platform.openai.com and create your API key](https://platform.openai.com/api-keys) which then should be exported via `ENV` variable shown above.

### Resend API key
Note - for sending e-mails we're using Resend.com. Please create your account and [API key on resend.com](https://resend.com/docs/dashboard/api-keys/introduction). 

This step is not required to test and extend the app - however sending result over e-email will not work :(



Run the app!

```bash
yarn
yarn dev
```

That's it! Now you can get open your browser and navigate to: https://localhost:3000

## Note on the tech-stack

As you might noticed OAB requires almost no external dependecing. We're using the `SQLite` database - single instance per data-owner (account) which is capable of pretty [enormous data storage](https://www.sqlite.org/whentouse.html) - limited to 281TB of data, probably working great with few TB of data at minimum. 

It gives us no dependencies plus safety (the SQLite files are individualy encrypted, separated and thus safer for multi-tenant configurations).

There should be no major effort of work required for porting OAB to - for example - Postgres - as we're doing all the data operations thru [`Drizzle`](https://orm.drizzle.team/) and using the `Repository` design pattern.