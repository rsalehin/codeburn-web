# CodeBurn Web

A browser-based dashboard for AI coding cost observability.  
Tracks spending across Claude, Codex, Cursor, Copilot, and OpenCode — with waste detection, model comparison, and an AI-powered cost advisor.

![Dashboard screenshot](docs/dashboard.png)

## Features

- **Multi-provider cost tracking** – automatic session discovery from VS Code / terminal SDKs
- **Real-time dashboard** – total spend, daily charts, model and activity breakdowns
- **Currency support** – 160+ currencies with live exchange rates via Frankfurter API
- **One-shot success metrics** – colour-coded pass rates per activity category
- **Waste scanner** – detects junk reads, duplicate reads, bloated `CLAUDE.md`, MCP overhead, cache bloat, ghost commands, and more
- **Model comparison** – side-by-side performance, category success, and working-style metrics
- **AI Cost Advisor** – ask questions in plain English; Claude answers with specific, actionable savings from your own data
- **Export** – download CSV or JSON reports
- **Settings** – subscription plan tracking, currency, model aliases

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS 4, Recharts, React Query, shadcn/ui |
| Backend | Node.js 22, Express 5, TypeScript, SQLite via `better-sqlite3` |
| AI | Anthropic Claude for Advisor |
| Package manager | npm workspaces monorepo |
| CLI | Original CodeBurn CLI can be used alongside the web UI |

## Getting Started

### Prerequisites

- Node.js >= 22
- npm >= 9
- Claude API key, optional and only required for the Advisor

### Installation

```bash
git clone https://github.com/rsalehin/codeburn-web.git
cd codeburn-web
npm install
```

### Running

Both the frontend and backend start together:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Backend API:

```text
http://localhost:3000
```

## Advisor Setup

1. Open `http://localhost:5173/settings`.
2. Paste your Claude API key, for example `sk-ant-...`.
3. Click **Save**.
4. Go to the **Advisor** tab and ask questions such as:

```text
Where am I wasting the most money?
Which project is least efficient?
How can I save $5 this month?
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Server health check |
| GET | `/api/providers` | List detected AI coding providers |
| GET | `/api/report?provider=claude` | Full dashboard data |
| GET | `/api/optimize?provider=claude` | Waste scanner results |
| GET | `/api/compare?model_a=...&model_b=...` | Model comparison |
| POST | `/api/advisor` | AI-powered cost analysis |
| GET | `/api/settings` | Current user settings |
| POST | `/api/settings/plan` | Set subscription plan |
| POST | `/api/settings/currency` | Set display currency |
| POST | `/api/settings/model-alias` | Add model alias |
| GET | `/api/export?format=csv` | Download CSV report |

## Project Structure

```text
codeburn-web/
├── frontend/                # React + Vite
│   ├── src/
│   │   ├── pages/           # Dashboard, Optimize, Compare, Advisor, Settings
│   │   ├── lib/             # API client, AdvisorContext
│   │   └── ...
│   └── vite.config.ts
├── backend/                 # Express + core logic
│   ├── src/
│   │   ├── server.ts        # API routes
│   │   ├── scanner.ts       # Provider session scanner
│   │   ├── aggregator.ts    # Dashboard data builder
│   │   ├── core/            # Original CodeBurn parser, classifier, models, optimize, etc.
│   │   └── db.ts            # SQLite connection
│   └── tsconfig.json
└── package.json             # Workspace root
```

## Privacy

CodeBurn Web does not send your code or session data to any external service.

Only cost, token, and tool metadata are processed. The Advisor sends an anonymised snapshot to Claude — no source code and no file paths.

## License

MIT