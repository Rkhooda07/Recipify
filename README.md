# Recipify

AI recipe generator: type your ingredients, get a full recipe. FastAPI backend
with a multi-provider AI fallback (Groq → Gemini → NVIDIA NIM) and a
zero-dependency vanilla JS frontend. Deploys to Vercel as a serverless
function with the frontend on the CDN.

## Features

- **Multi-provider fallback** — providers are tried in order (Groq → Gemini →
  NVIDIA); if one is rate-limited or down, the next takes over. One key is
  enough to run.
- **Recipe history** — generated recipes are saved in the browser
  (`localStorage`, last 20). No accounts, no database.
- **Safe rendering** — AI output is HTML-escaped before markdown formatting,
  so model output can't inject markup.
- **Rate limiting** — 10 recipes per hour per IP on the API.

## Prerequisites

- Python 3.10+
- At least one free API key: [Groq](https://console.groq.com),
  [Gemini](https://aistudio.google.com/apikey), or
  [NVIDIA NIM](https://build.nvidia.com)

## Run locally

1. Create the env file and fill in the keys you have:
   ```
   cp .env.example .env
   ```
2. Create a virtual environment and install deps:
   ```
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
3. Run everything with one command:
   ```
   python main.py
   ```
   Open `http://127.0.0.1:8080` — the backend serves the frontend too.
   Set `PORT` to use a different port.

## API

| Method | Route                  | Body                                  |
|--------|------------------------|---------------------------------------|
| POST   | `/api/generate-recipe` | `{ "ingredients": "eggs, tomatoes" }` |
| GET    | `/api/health`          | —                                     |

Returns `{ "recipe": "...", "provider": "Groq" }`, `429` when rate-limited,
`503` when all providers fail.

## Deploy (Vercel)

1. Import the repo on [vercel.com](https://vercel.com) → **Add New → Project**.
2. Set Framework Preset to **Other** (not the auto-detected FastAPI preset —
   that would route static files through the Python function). Leave build
   command and output directory empty; `vercel.json` handles both.
3. Add `GROQ_API_KEY`, `GEMINI_API_KEY`, `NVIDIA_API_KEY` as environment
   variables and deploy.

Static files are served from Vercel's CDN; `/api/*` runs as a serverless
function (60s max, so the slow NVIDIA fallback may not finish there —
Groq/Gemini answer in seconds and are the paths that matter).

## Project structure

```
api/index.py      FastAPI app: recipe endpoint, provider fallback, rate limit
main.py           Local dev server: same app + static frontend on port 8080
frontend-main/    Static site (three pages, vanilla HTML/CSS/JS)
vercel.json       Vercel routing: CDN static + /api/* → function
```
