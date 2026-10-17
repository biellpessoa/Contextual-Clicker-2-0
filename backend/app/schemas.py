"""Modelos de entrada e saída da API (validados pelo Pydantic)."""
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

TipoGeracao = Literal["universo", "picareta", "buff", "artefato", "epilogo"]


class ContextoGeracao(BaseModel):
    """Dados de gameplay que o jogo envia para a IA escrever lore coerente com a mecânica."""

    nivel: int | None = Field(None, ge=1, le=7, description="Nível da picareta (1 a 7)")
    poder_clique: float | None = Field(None, ge=0, description="Pedras por clique da picareta")
    por_segundo: float | None = Field(None, ge=0, description="Pedras por segundo da picareta")
    multiplicador: float | None = Field(None, ge=1, le=10, description="Multiplicador do buff")
    duracao: int | None = Field(None, ge=1, le=300, description="Duração do buff em segundos")
    raridade: int | None = Field(None, ge=1, le=5, description="Raridade do artefato (1 a 5)")
    numero: int | None = Field(None, ge=1, le=8, description="Número do artefato no museu")
    estatisticas: dict[str, Any] | None = Field(None, description="Estatísticas finais (epílogo)")


class TextoRequest(BaseModel):
    tipo: TipoGeracao = Field(..., description="O que deve ser gerado")
    tema: str = Field(..., min_length=1, max_length=40, description="Palavra-chave do universo")
    contexto: ContextoGeracao = Field(default_factory=ContextoGeracao)

    @field_validator("tema")
    @classmethod
    def limpar_tema(cls, valor: str) -> str:
        valor = " ".join(valor.split())
        if not valor:
            raise ValueError("tema não pode ser vazio")
        return valor

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"tipo": "universo", "tema": "Cozinha", "contexto": {}},
                {"tipo": "picareta", "tema": "Cozinha", "contexto": {"nivel": 3, "poder_clique": 4}},
                {"tipo": "artefato", "tema": "Oceano", "contexto": {"raridade": 4, "numero": 6}},
            ]
        }
    }


class TextoResponse(BaseModel):
    tipo: TipoGeracao
    tema: str
    conteudo: dict[str, Any] = Field(..., description="JSON gerado (formato depende do tipo)")
    fonte: Literal["llama3.2", "fallback"] = Field(
        ..., description="llama3.2 = gerado pelo modelo; fallback = Ollama indisponível"
    )
    modelo: str
    latencia_ms: int


class StatusResponse(BaseModel):
    ollama_online: bool
    modelo: str
    modelo_instalado: bool
    fallback_habilitado: bool
