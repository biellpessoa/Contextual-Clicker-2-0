"""Testes automatizados da API (rodar dentro de backend/:  python -m pytest -v)."""
import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings, get_settings
from app.main import app
from app.providers.ia_provider import IAProviderError, IATextoProvider, get_ia_provider, validar_conteudo
from app.schemas import ContextoGeracao, StatusResponse, TextoRequest, TextoResponse

CHAVE = "chave-de-teste"


def settings_teste(**extra) -> Settings:
    base = dict(
        api_key=CHAVE,
        ollama_url="http://127.0.0.1:9",  # porta fechada: simula Ollama fora do ar
        ollama_model="llama3.2",
        ollama_timeout=1,
        fallback_habilitado=True,
        cors_origins=["http://localhost:8000"],
    )
    base.update(extra)
    return Settings(**base)


class ProviderFalso:
    """Simula o Llama devolvendo um JSON válido, sem depender do Ollama."""

    async def gerar(self, req: TextoRequest) -> TextoResponse:
        return TextoResponse(
            tipo=req.tipo,
            tema=req.tema,
            conteudo={"nome": f"Picareta de {req.tema}", "descricao": "Teste."},
            fonte="llama3.2",
            modelo="llama3.2",
            latencia_ms=1,
        )

    async def status(self) -> StatusResponse:
        return StatusResponse(ollama_online=True, modelo="llama3.2", modelo_instalado=True, fallback_habilitado=True)


@pytest.fixture
def client():
    # lambda sem parâmetros: o FastAPI inspeciona a assinatura do override
    app.dependency_overrides[get_settings] = lambda: settings_teste()
    app.dependency_overrides[get_ia_provider] = lambda: ProviderFalso()
    yield TestClient(app)
    app.dependency_overrides.clear()


# ---------- infraestrutura ----------

def test_health_publico(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_swagger_habilitado(client):
    assert client.get("/docs").status_code == 200
    schema = client.get("/openapi.json").json()
    assert "/v1/ia-generativa/texto" in schema["paths"]


def test_cors_permite_origem_configurada(client):
    resp = client.options(
        "/v1/ia-generativa/texto",
        headers={"Origin": "http://127.0.0.1:8000", "Access-Control-Request-Method": "POST"},
    )
    assert resp.status_code == 200
    assert resp.headers["access-control-allow-origin"] == "http://127.0.0.1:8000"


# ---------- autenticação ----------

def test_sem_api_key_retorna_401(client):
    resp = client.post("/v1/ia-generativa/texto", json={"tipo": "picareta", "tema": "Cozinha"})
    assert resp.status_code == 401


def test_api_key_errada_retorna_401(client):
    resp = client.post(
        "/v1/ia-generativa/texto",
        json={"tipo": "picareta", "tema": "Cozinha"},
        headers={"X-API-Key": "errada"},
    )
    assert resp.status_code == 401


# ---------- rota de texto ----------

def test_gera_texto_com_chave_valida(client):
    resp = client.post(
        "/v1/ia-generativa/texto",
        json={"tipo": "picareta", "tema": "Cozinha", "contexto": {"nivel": 2}},
        headers={"X-API-Key": CHAVE},
    )
    assert resp.status_code == 200
    corpo = resp.json()
    assert corpo["fonte"] == "llama3.2"
    assert corpo["conteudo"]["nome"] == "Picareta de Cozinha"


@pytest.mark.parametrize(
    "payload",
    [
        {"tipo": "picareta", "tema": ""},
        {"tipo": "picareta", "tema": "   "},
        {"tipo": "dragao", "tema": "Cozinha"},
        {"tipo": "picareta", "tema": "x" * 41},
        {"tipo": "picareta", "tema": "Cozinha", "contexto": {"nivel": 99}},
    ],
)
def test_validacao_de_entrada_422(client, payload):
    resp = client.post("/v1/ia-generativa/texto", json=payload, headers={"X-API-Key": CHAVE})
    assert resp.status_code == 422


# ---------- provider ----------

@pytest.mark.anyio
async def test_provider_usa_fallback_quando_ollama_offline():
    provider = IATextoProvider(settings_teste())
    for tipo in ["universo", "picareta", "buff", "artefato", "epilogo"]:
        resp = await provider.gerar(TextoRequest(tipo=tipo, tema="Oceano", contexto=ContextoGeracao()))
        assert resp.fonte == "fallback"
        assert resp.conteudo


@pytest.mark.anyio
async def test_provider_sem_fallback_levanta_erro():
    provider = IATextoProvider(settings_teste(fallback_habilitado=False))
    with pytest.raises(IAProviderError):
        await provider.gerar(TextoRequest(tipo="picareta", tema="Oceano"))


def test_validacao_normaliza_chaves_acentuadas_e_aninhadas():
    bruto = {"Picareta": {"Nome": "Picareta de Sal", "Descrição": "  Muito   salgada. "}}
    assert validar_conteudo("picareta", bruto) == {"nome": "Picareta de Sal", "descricao": "Muito salgada."}


def test_validacao_universo_exige_os_dois_grupos():
    with pytest.raises(IAProviderError):
        validar_conteudo("universo", {"picareta": {"nome": "a", "descricao": "b"}})


def test_validacao_corta_texto_longo():
    resp = validar_conteudo("artefato", {"nome": "Ovo", "descricao": "a" * 1000})
    assert len(resp["descricao"]) <= 280


@pytest.fixture
def anyio_backend():
    return "asyncio"
