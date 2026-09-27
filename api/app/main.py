from fastapi import FastAPI
from sqlalchemy import text

from app.core.database import engine

app = FastAPI(title="Tareka API")


@app.get("/health")
def health() -> dict[str, str]:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "ok",
            "database": "connected",
        }

    except Exception:
        return {
            "status": "error",
            "database": "unavailable",
        }