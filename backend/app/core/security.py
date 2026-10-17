"""Autenticação simples por API Key enviada no header X-API-Key."""
import secrets

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader

from app.core.config import Settings, get_settings

api_key_header = APIKeyHeader(
    name="X-API-Key",
    auto_error=False,
    description="Chave de acesso do Contextual Clicker (definida em CC_API_KEY no .env).",
)


def verificar_api_key(
    chave: str | None = Security(api_key_header),
    settings: Settings = Depends(get_settings),
) -> str:
    # compare_digest evita ataques de timing na comparação da chave
    if not chave or not secrets.compare_digest(chave, settings.api_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key ausente ou inválida. Envie o header X-API-Key.",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    return chave
