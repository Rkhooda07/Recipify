# Recipify

FastAPI backend + static frontend for generating recipes using Google's Gemini API.

## Prerequisites
- Python 3.10+
- A Gemini API key

## Setup
1. Create the env file in the project root:
   ```
   echo "GEMINI_API_KEY=your_key_here" > API-Key.env
   ```
2. Create and activate a virtual environment, then install deps:
   ```
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
3. Run the backend API:
   ```
   python main.py
   ```
   - Health check: `http://127.0.0.1:8000/health`
   - Recipe endpoint (POST): `http://127.0.0.1:8000/generate-recipe` with body `{ "ingredients": "eggs, tomatoes" }`

4. Serve the frontend (in a separate terminal). Any static server works, e.g.:
   ```
   python3 -m http.server 5500
   ```
   Then open `http://127.0.0.1:5500/index.html` in your browser.

## Notes
- The frontend calls the local backend at `http://127.0.0.1:8000` via `scripts/chat.js`.
- Do not commit your real API key. `.gitignore` excludes `API-Key.env`.



