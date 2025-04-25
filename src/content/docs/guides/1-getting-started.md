---
title: Getting Started
description: Getting Started with Open Agents Builder
order: 10
---

The easiest way to start building agents with Open Agents Builder is to [create a free, cloud-hosted instance](https://openagentsbuilder.com) at `openagentsbuilder.com`. Once that’s done, you can start building agents right away with full API access.

<a href="https://openagentsbuilder.com"><Image alt="Create a free account on OpenAgentsBuilder.com to start building agents right away" src="../../../assets/register.png" /></a>

## How Does It Work?

<div>
    <a href="https://www.loom.com/share/267cb3ac88aa430983983daf2f6b1fdf">
      <p>Building AI Agents Made Easy 🤖 – Watch Video</p>
    </a>
    <a href="https://www.loom.com/share/267cb3ac88aa430983983daf2f6b1fdf">
      <img style="max-width:300px;" src="https://cdn.loom.com/sessions/thumbnails/267cb3ac88aa430983983daf2f6b1fdf-f96286df0e058072-full-play.gif">
    </a>
</div>

## Local Setup

The cloud edition is great for getting started, building PoCs, or if you just want to avoid technical hassles and begin quickly. However, if you plan to build custom integrations, use open-source LLM models, or develop custom AI tools, you’ll likely need to deploy the software locally.

Fortunately, it only takes a few shell commands!

First, check out the project:

```bash
git clone https://github.com/CatchTheTornado/open-agents-builder
cd open-agents-builder
```

Make sure you have Node.js version `22` installed, which is required by the project. If not, you can switch to version 22 using `nvm` (see [how to install nvm](https://github.com/nvm-sh/nvm) if you haven’t already):

```bash
nvm install 22
nvm use 22
```

If you plan to use the Attachments module to extract text from PDF and Office files, you’ll need to install some Python dependencies. If you don’t already have a local Python environment set up, the easiest approach is to use [`pipx`](https://github.com/pypa/pipx) instead of `pip`, so the packages are installed into an isolated, global environment:

Install `pipx` using `brew install pipx` (on macOS) or `apt-get install pipx` (on Debian), and then run:

```bash
pipx install markitdown
pipx install poppler
```

Next, edit the environment variables:

```bash
cp .env.defaults .env.local
```

Then open and modify the `.env.local` file:

```bash
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o

# OpenAI API key
OPENAI_API_KEY=

# Resend.com API key
RESEND_API_KEY=

# Absolute app URL starting with http://
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_URL=http://localhost:3000
PORT=3000 # 3002 is the production app port
NEXT_PUBLIC_EMAIL_FROM=no-reply@.... # According to your Resend.com settings
NEXT_PUBLIC_ENV=dev
```

### OpenAI API Key and LLM Support

We use Vercel AI to access LLMs and embedding models, which allows you to switch the LLM provider to any supported by the Vercel AI SDK (e.g., Google Gemini, Claude, etc.). 

Currently, due to extensive usage of Tools and Structured Outputs, the application works best with OpenAI models.  

Go to [platform.openai.com](https://platform.openai.com/api-keys) to create your API key, and then set it in the environment variables shown above.

### Resend API Key

We use Resend.com for sending emails. You can create an account and an [API key on resend.com](https://resend.com/docs/dashboard/api-keys/introduction). 

This step isn’t mandatory for testing and extending the app, but without it, email sending won’t work.

### Running the Application

```bash
yarn
yarn dev
```

That’s it! Now open your browser and navigate to [http://localhost:3000](http://localhost:3000).

## Note on the Tech Stack

As you may have noticed, Open Agents Builder requires almost no external dependencies. We use the `SQLite` database—a single instance per data owner (account)—capable of [enormous data storage](https://www.sqlite.org/whentouse.html) (up to 281 TB). It should easily handle a few terabytes of data. 

This approach provides minimal dependencies and enhanced security (each SQLite file is encrypted and isolated, which is beneficial for multi-tenant setups).

Porting Open Agents Builder to another database (e.g., Postgres) shouldn’t require major effort. All data operations are done via [`Drizzle`](https://orm.drizzle.team/) and follow a Repository design pattern.

## Note on database

You might be surprised that there are no other dependencies, but by default, the app uses an SQLite database. The database files are stored in the `/data/{databaseIdHash}/` folder. These files can be accessed and read using third-party SQLite managers such as:

- [DB Browser for SQLite](https://sqlitebrowser.org/)
- [SQLiteStudio](https://sqlitestudio.pl/)
- [TablePlus](https://tableplus.com/)

This makes it easy to inspect or manage the database if needed.