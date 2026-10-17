"""Fallback procedural usado SOMENTE quando o Ollama está fora do ar.

As respostas são marcadas com fonte="fallback" e seguem com rigor o tema
e os arquétipos visuais de cada imagem.
"""
from app.prompts import ARQUETIPOS_ARTEFATO, ARQUETIPOS_PICARETA
from app.schemas import ContextoGeracao, TipoGeracao


def gerar_fallback(tipo: TipoGeracao, tema: str, ctx: ContextoGeracao) -> dict:
    tema_t = tema.strip().title()
    nivel = ctx.nivel or 1
    numero = ctx.numero or 1
    mult = ctx.multiplicador or 2
    dur = ctx.duracao or 30

    arquetipo_pick = ARQUETIPOS_PICARETA.get(nivel, "Picareta reforçada")
    arquetipo_art = ARQUETIPOS_ARTEFATO.get(numero, "Relíquia arqueológica")

    picareta = {
        "nome": f"{arquetipo_pick} de {tema_t}",
        "descricao": f"Uma {arquetipo_pick.lower()} forjada diretamente com materiais de {tema_t}. "
        f"Quebra {ctx.poder_clique or 1:g} pedras por golpe nas minas deste planeta.",
    }
    buff = {
        "nome": f"Elixir Efervescente de {tema_t}",
        "descricao": f"Um frasco com essência concentrada de {tema_t}. "
        f"Acelera suas batidas na pedra em {mult:g}x por {dur}s com efeito revigorante.",
    }

    if tipo == "universo":
        return {"picareta": picareta, "buff": buff}
    if tipo == "picareta":
        return picareta
    if tipo == "buff":
        return buff
    if tipo == "artefato":
        return {
            "nome": f"{arquetipo_art} de {tema_t}",
            "descricao": f"Antigo {arquetipo_art.lower()} escavado nas camadas profundas de {tema_t}. "
            "Uma relíquia arqueológica inestimável preservada no museu.",
        }
    return {
        "titulo": f"O Universo {tema_t} foi totalmente catalogado",
        "texto": f"Pedra por pedra, você escavou todos os segredos do universo {tema_t}. "
        "As 8 relíquias repousam no museu e a lenda deste planeta está eternizada.",
    }
