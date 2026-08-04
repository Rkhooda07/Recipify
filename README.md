# Recipify

AI recipe generator: type your ingredients, get a full recipe. FastAPI backend
with a multi-provider AI fallback (Groq → NVIDIA NIM → Gemini) serving a static frontend.

## Prerequisites
- Python 3.10+
- At least one free API key: [Groq](https://console.groq.com),
  [NVIDIA NIM](https://build.nvidia.com), or
  [Gemini](https://aistudio.google.com/apikey)

## Setup
1. Create the env file:
   ```
   cp .env.example .env
   ```
   Fill in the keys you have. Providers are tried in order
   (Groq → NVIDIA → Gemini); one key is enough.
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
   Open `http://127.0.0.1:8000` — the backend serves the frontend too.
   - Health check: `http://127.0.0.1:8000/health`
   - Recipe endpoint (POST): `/generate-recipe` with body `{ "ingredients": "eggs, tomatoes" }`
