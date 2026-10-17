"""Provider de IA generativa de TEXTO.

Toda a comunicação com o serviço externo (Ollama rodando o Llama 3.2) fica isolada
aqui. O router só conhece a interface `IATextoProvider.gerar()`; o jogo só conhece
o router. Assim o jogo nunca chama o Ollama diretamente.
"""
import json
import logging
import time
import unicodedata
from typing import Any

import httpx

from app.core.config import Settings, get_settings
from app.prompts import CHAVES_ESPERADAS, SYSTEM_PROMPT, montar_prompt
from app.providers.fallback_provider import gerar_fallback
from app.schemas import StatusResponse, TextoRequest, TextoResponse

logger = logging.getLogger("contextual_clicker.ia")

LIMITE_CARACTERES = {"nome": 60, "titulo": 60, "descricao": 280, "texto": 420}


class IAProviderError(Exception):
    """Falha ao obter uma resposta válida do modelo."""


def _sem_acento(texto: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn")


def _normalizar_chaves(obj: Any) -> Any:
    """'Descrição' -> 'descricao', recursivamente (o Llama às vezes acentua as chaves)."""
    if isinstance(obj, dict):
        return {_sem_acento(str(k)).strip().lower(): _normalizar_chaves(v) for k, v in obj.items()}
    return obj


def _limpar_campo(chave: str, valor: Any) -> str:
    if not isinstance(valor, str) or not valor.strip():
        raise IAProviderError(f"campo '{chave}' vazio ou não textual")
    texto = " ".join(valor.split())
    limite = LIMITE_CARACTERES.get(chave, 280)
    return texto if len(texto) <= limite else texto[: limite - 1].rstrip() + "…"


def validar_conteudo(tipo: str, bruto: dict) -> dict:
    """Garante que o JSON do modelo tem exatamente as chaves que o jogo espera."""
    dados = _normalizar_chaves(bruto)
    esperado = CHAVES_ESPERADAS[tipo]

    if "_" in esperado:
        campos = esperado["_"]
        # Modelos pequenos às vezes embrulham o objeto: {"picareta": {"nome":..., ...}}
        if not all(c in dados for c in campos):
            aninhados = [v for v in dados.values() if isinstance(v, dict)]
            if len(aninhados) == 1:
                dados = aninhados[0]
        res = {c: _limpar_campo(c, dados.get(c)) for c in campos}
        if tipo == "picareta" and not res.get("nome", "").lower().startswith("picareta"):
            res["nome"] = f"Picareta {res['nome']}"
        return res

    resultado = {}
    for grupo, campos in esperado.items():
        sub = dados.get(grupo)
        if not isinstance(sub, dict):
            raise IAProviderError(f"grupo '{grupo}' ausente na resposta")
        resultado[grupo] = {c: _limpar_campo(c, sub.get(c)) for c in campos}
    if tipo == "universo" and "picareta" in resultado:
        if not resultado["picareta"].get("nome", "").lower().startswith("picareta"):
            resultado["picareta"]["nome"] = f"Picareta {resultado['picareta']['nome']}"
    return resultado


class OllamaClient:
    """Cliente HTTP mínimo para a API REST do Ollama (porta 11434)."""

    def __init__(self, base_url: str, modelo: str, timeout: float):
        self.base_url = base_url.rstrip("/")
        self.modelo = modelo
        self.timeout = timeout

    async def chat_json(self, prompt: str) -> dict:
        payload = {
            "model": self.modelo,
            "stream": False,
            "format": "json",  # força o Ollama a devolver JSON válido
            "options": {"temperature": 0.9},
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        }
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(f"{self.base_url}/api/chat", json=payload)
                resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise IAProviderError(f"Ollama indisponível: {exc!r}") from exc

        conteudo = resp.json().get("message", {}).get("content", "")
        try:
            dados = json.loads(conteudo)
        except json.JSONDecodeError as exc:
            raise IAProviderError(f"resposta não é JSON: {conteudo[:120]!r}") from exc
        if not isinstance(dados, dict):
            raise IAProviderError("JSON retornado não é um objeto")
        return dados

    async def status(self) -> tuple[bool, bool]:
        """Retorna (ollama_online, modelo_instalado)."""
        try:
            async with httpx.AsyncClient(timeout=3) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                resp.raise_for_status()
        except httpx.HTTPError:
            return False, False
        nomes = [m.get("name", "") for m in resp.json().get("models", [])]
        instalado = any(n == self.modelo or n.startswith(f"{self.modelo}:") for n in nomes)
        return True, instalado


class IATextoProvider:
    TENTATIVAS = 2  # 1 tentativa + 1 retry se o modelo devolver JSON fora do formato

    def __init__(self, settings: Settings):
        self.settings = settings
        self.cliente = OllamaClient(settings.ollama_url, settings.ollama_model, settings.ollama_timeout)

    async def gerar(self, req: TextoRequest) -> TextoResponse:
        inicio = time.perf_counter()
        prompt = montar_prompt(req.tipo, req.tema, req.contexto)
        ultimo_erro: Exception | None = None

        for tentativa in range(1, self.TENTATIVAS + 1):
            try:
                bruto = await self.cliente.chat_json(prompt)
                conteudo = validar_conteudo(req.tipo, bruto)
                return self._resposta(req, conteudo, "llama3.2", inicio)
            except IAProviderError as exc:
                ultimo_erro = exc
                logger.warning("[IA] tentativa %s falhou (%s): %s", tentativa, req.tipo, exc)
                if "indisponível" in str(exc):
                    break  # não adianta repetir se o servidor está fora do ar

        if not self.settings.fallback_habilitado:
            raise IAProviderError(str(ultimo_erro))

        conteudo = gerar_fallback(req.tipo, req.tema, req.contexto)
        return self._resposta(req, conteudo, "fallback", inicio)

    def _resposta(self, req: TextoRequest, conteudo: dict, fonte: str, inicio: float) -> TextoResponse:
        latencia = int((time.perf_counter() - inicio) * 1000)
        logger.info("[IA] tipo=%s tema=%r fonte=%s latencia=%sms", req.tipo, req.tema, fonte, latencia)
        return TextoResponse(
            tipo=req.tipo,
            tema=req.tema,
            conteudo=conteudo,
            fonte=fonte,
            modelo=self.settings.ollama_model if fonte == "llama3.2" else "fallback-procedural",
            latencia_ms=latencia,
        )

    async def status(self) -> StatusResponse:
        online, instalado = await self.cliente.status()
        return StatusResponse(
            ollama_online=online,
            modelo=self.settings.ollama_model,
            modelo_instalado=instalado,
            fallback_habilitado=self.settings.fallback_habilitado,
        )


def get_ia_provider() -> IATextoProvider:
    """Dependência FastAPI (sobrescrita nos testes por um provider falso)."""
    return IATextoProvider(get_settings())
