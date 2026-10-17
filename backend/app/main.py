"""Ponto de entrada da API do Contextual Clicker.

Rodar (dentro da pasta backend):  uvicorn app.main:app --reload
- Swagger:  http://127.0.0.1:8000/docs
- Jogo:     http://127.0.0.1:8000/jogo/
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import FRONTEND_DIR, get_settings
from app.routers import ia_generativa

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

settings = get_settings()

app = FastAPI(
    title="Contextual Clicker API",
    version="1.0.0",
    description=(
        "Back-end do jogo **Contextual Clicker** (CP5). Encapsula a IA generativa de texto "
        "(Llama 3.2 via Ollama) para que o jogo nunca chame o serviço de IA diretamente.\n\n"
        "Use o botão **Authorize** e informe a `X-API-Key`."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-API-Key"],
)

app.include_router(ia_generativa.router)


@app.get("/health", tags=["Infra"], summary="Health check público")
async def health() -> dict:
    return {"status": "ok"}


@app.get("/", include_in_schema=False)
async def raiz() -> RedirectResponse:
    return RedirectResponse(url="/jogo/")


@app.get("/painel", include_in_schema=False)
async def rota_painel() -> RedirectResponse:
    return RedirectResponse(url="/jogo/painel.html")


# Serve o front-end do jogo pela mesma origem da API
if FRONTEND_DIR.exists():
    app.mount("/jogo", StaticFiles(directory=FRONTEND_DIR, html=True), name="jogo")
