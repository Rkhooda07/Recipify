# Local dev server — Vercel uses api/index.py directly and serves
# frontend-main/ as static files (see vercel.json).
import os

from fastapi.staticfiles import StaticFiles

from api.index import app

app.mount("/", StaticFiles(directory="frontend-main", html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8080"))
    uvicorn.run("main:app", host=host, port=port, reload=True)
