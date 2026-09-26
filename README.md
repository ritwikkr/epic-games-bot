# 🎮 Epic Free Games Bot

Watches the Epic Games Store for free game promotions and emails you a digest
every morning. Ships with a small web UI for choosing the price range you care
about, and runs either locally (long-running process) or entirely on
**GitHub Actions** (no server needed).

## Features

- 🎁 Fetches the real current free games from the Epic Games Store API
- 💰 Price filter — only get emails for games under a limit you choose (stored in MongoDB)
- ⏰ Daily digest email at **9:00 AM IST**
- 🔁 De-duplication — a game is only ever emailed once (`notifiedAt` in MongoDB)
- 🖥️ Minimal web UI (no web framework, uses Node's built-in `http`)
- 🤖 Optional GitHub Actions workflow so emails send without a running server

## Requirements

- Node.js 20+
- A MongoDB database (local via `docker-compose up -d`, or MongoDB Atlas)
- An SMTP account (e.g. Zoho, Gmail app password) for sending mail

## Setup

```bash
npm install
cp .env.example .env   # then fill in your values
```

`.env` variables:

| Variable | Description |
| --- | --- |
| `EMAIL_HOST` | SMTP host, e.g. `smtp.zoho.in` |
| `EMAIL_PORT` | SMTP port, e.g. `465` |
| `EMAIL_SECURE` | `true` for port 465, `false` for 587 |
| `EMAIL_USER` | SMTP username (also used as the `From` address) |
| `EMAIL_PASSWORD` | SMTP password / app password |
| `EMAIL_TO` | Where the digest is sent |
| `MONGO_URL` | MongoDB connection string |
| `PORT` | Web UI port (default `3000`) |

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the web UI **and** the scheduler (detection every 6h, digest daily at 9:00 AM IST) |
| `npm run digest` | One-shot: detect free games, email the digest, then exit (used by GitHub Actions) |
| `npm run build` | Compiles TypeScript to `dist/` |
| `npm start` | Runs the compiled `dist/index.js` |

Open the UI at <http://localhost:3000> to set your maximum price and preview the
current free games.

## GitHub Actions (no server required)

The workflow at `.github/workflows/send-digest.yml` runs `npm run digest` on a
schedule (and can be triggered manually from the **Actions** tab).

### 1. Add repository secrets

**Settings → Secrets and variables → Actions → New repository secret**

Add each of: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`,
`EMAIL_PASSWORD`, `EMAIL_TO`, `MONGO_URL`.

> `.env` is git-ignored on purpose — never commit real credentials.

### 2. Allow GitHub Actions to reach MongoDB Atlas

GitHub runners have dynamic IP addresses, so in **Atlas → Network Access** you
must allow access from the runners (the simplest option is `0.0.0.0/0`). If you
skip this, the workflow will fail with a connection timeout.

### 3. Schedule

```yaml
on:
  schedule:
    - cron: "30 3 * * *"   # 03:30 UTC = 09:00 AM IST
  workflow_dispatch:
```

## How it works

```
Epic API ──► EpicClient ──► GameService ──► GameRepository (MongoDB)
                                 │                     │
                          price filter          notifiedAt flag
                                 │                     │
                                 └──► GameScheduler ───┴──► EmailService
                                       (detect every 6h, digest at 9:00 AM IST)
```

- **Detection** records new free games in MongoDB and never sends email.
- **Digest** emails every game whose `notifiedAt` is still `null`, then marks
  those games as notified — so a game is emailed exactly once. A game whose
  email fails is retried on the next run.

## Project layout

```
src/
  cli/digest.ts              one-shot entry point (GitHub Actions)
  database/database.ts       MongoDB connection
  epic/                      Epic Games Store API client + types
  games/                     model, repository, service, price filter
  notifications/             email service (nodemailer)
  scheduler/                 cron detection + daily digest
  settings/                  user preferences (max price)
  ui/                        built-in http web UI
  index.ts                   local app entry point (UI + scheduler)
```

## Notes & caveats

- **GitHub Actions scheduled workflows can be delayed** during peak load and are
  **disabled after 60 days of repository inactivity**. Push a commit (or
  re-enable in the Actions tab) to keep them alive.
- GitHub cron is evaluated in **UTC**; `30 3 * * *` = 9:00 AM IST.
- The digest only sends emails **at 9:00 AM IST** — running the app does not
  trigger an immediate email.
