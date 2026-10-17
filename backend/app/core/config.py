"""Configurações da API lidas de variáveis de ambiente (.env)."""
import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_DIR = BACKEND_DIR.parent
FRONTEND_DIR = PROJECT_DIR / "frontend"

load_dotenv(BACKEND_DIR / ".env")


def _lista(valor: str) -> list[str]:
    return [item.strip() for item in valor.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    # Chave exigida no header X-API-Key. O valor padrão é só para desenvolvimento local.
    api_key: str = field(default_factory=lambda: os.getenv("CC_API_KEY", "cc-dev-key-troque-me"))
    ollama_url: str = field(default_factory=lambda: os.getenv("OLLAMA_URL", "http://localhost:11434"))
    ollama_model: str = field(default_factory=lambda: os.getenv("OLLAMA_MODEL", "llama3.2"))
    ollama_timeout: float = field(default_factory=lambda: float(os.getenv("OLLAMA_TIMEOUT", "60")))
    fallback_habilitado: bool = field(
        default_factory=lambda: os.getenv("FALLBACK_HABILITADO", "true").lower() == "true"
    )
    cors_origins: list[str] = field(
        default_factory=lambda: _lista(
            os.getenv(
                "CORS_ORIGINS",
                "http://localhost:8000,http://127.0.0.1:8000,"
                "http://localhost:5500,http://127.0.0.1:5500",
            )
        )
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
