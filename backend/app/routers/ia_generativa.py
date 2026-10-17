"""Rotas da modalidade de IA generativa de TEXTO (Llama 3.2 via Ollama)."""
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import verificar_api_key
from app.providers.ia_provider import IAProviderError, IATextoProvider, get_ia_provider
from app.schemas import StatusResponse, TextoRequest, TextoResponse

router = APIRouter(
    prefix="/v1/ia-generativa",
    tags=["IA Generativa"],
    dependencies=[Depends(verificar_api_key)],  # todas as rotas daqui exigem X-API-Key
)


@router.post(
    "/texto",
    response_model=TextoResponse,
    summary="Gera lore (picaretas, buffs, artefatos, epílogo) a partir do tema",
)
async def gerar_texto(
    body: TextoRequest,
    provider: IATextoProvider = Depends(get_ia_provider),
) -> TextoResponse:
    try:
        return await provider.gerar(body)
    except IAProviderError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@router.get("/status", response_model=StatusResponse, summary="Verifica se o Ollama/Llama está online")
async def status_ia(provider: IATextoProvider = Depends(get_ia_provider)) -> StatusResponse:
    return await provider.status()
