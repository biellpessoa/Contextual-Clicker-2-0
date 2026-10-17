"""Prompts enviados ao Llama 3.2.

Baseados no prompt testado na CP4, com reforço estrito de coesão temática
com a palavra-chave e alinhamento direto com os arquétipos visuais das imagens.
"""
from app.schemas import ContextoGeracao, TipoGeracao

SYSTEM_PROMPT = (
    "Você é o motor de geração de itens de um jogo de MINERAÇÃO (estilo clicker) chamado "
    "Contextual Clicker. O objetivo do jogador é sempre quebrar pedras em um planeta. "
    "Você escreve SEMPRE em português do Brasil, com humor absurdo, e responde APENAS "
    "com JSON válido, sem markdown e sem nenhum texto fora do JSON. "
    "REQUISITO CRÍTICO: Mantenha 100% de coesão com a palavra-chave do tema fornecido pelo jogador."
)

RARIDADES = {1: "comum", 2: "incomum", 3: "raro", 4: "épico", 5: "lendário"}

ARQUETIPOS_PICARETA = {
    1: "Picareta rústica / improvisada",
    2: "Picareta de pedra / reforçada",
    3: "Picareta de ferro / maquinada",
    4: "Picareta com brocas / engrenagens",
    5: "Picareta laser / cristalina",
    6: "Picareta de energia / plasma",
    7: "Picareta cósmica / lendária definitiva",
}

ARQUETIPO_BUFF = "Poção, elixir ou frasco mágico com aura e vapor de velocidade"

ARQUETIPOS_ARTEFATO = {
    1: "Fóssil ou osso petrificado",
    2: "Cristal ou geodo minerado",
    3: "Ferramenta antiga ou chave fóssil",
    4: "Amuleto ancestral ou ídolo pequeno",
    5: "Relíquia arqueológica brilhante",
    6: "Crânio misterioso ou dispositivo enigmático",
    7: "Disco cósmico / relíquia de matéria escura",
    8: "Artefato celestial lendário / núcleo estelar",
}


def _cabecalho(tema: str) -> str:
    return (
        f'O tema atual do universo é: "{tema}".\n'
        f'REGRA DE OURO: Todo o vocabulário, objetos e materiais DEVEM pertencer estritamente ao tema "{tema}".\n'
        "Siga ESTAS REGRAS estritamente:\n"
    )


def montar_prompt(tipo: TipoGeracao, tema: str, ctx: ContextoGeracao) -> str:
    if tipo == "universo":
        # Inicial: Picareta Nível 1 (Rústica/Improvisada) + Buff de velocidade
        return _cabecalho(tema) + (
            f'1. A ferramenta gerada DEVE ser uma "Picareta rústica / improvisada" feita exclusivamente de materiais típicos do tema "{tema}". '
            f'O nome DEVE obrigatoriamente começar com a palavra "Picareta" (exemplo: se o tema for Escola, "Picareta Rústica de Lápis e Réguas"; se Cozinha, "Picareta Improvisada de Pão Francês"). '
            "A descrição deve ser engraçada e explicar como ela quebra pedras no planeta.\n"
            f'2. O buff DEVE ser um consumível inspirado em "{ARQUETIPO_BUFF}", pertencente ao tema "{tema}". '
            "A descrição deve explicar de forma cômica como ele dobra (2x) a VELOCIDADE DE BATER NA PEDRA durante 30 segundos.\n"
            "3. Cada descrição deve ter no máximo 2 frases curtas, absurdas e fiéis ao tema.\n\n"
            "Retorne APENAS um formato JSON válido, sem nenhum outro texto, com as chaves: "
            '"picareta" (com "nome" e "descricao") e "buff" (com "nome" e "descricao").'
        )

    if tipo == "picareta":
        nivel = ctx.nivel or 1
        arquetipo = ARQUETIPOS_PICARETA.get(nivel, "Picareta reforçada")
        poder = ctx.poder_clique or 1
        return _cabecalho(tema) + (
            f"1. A ferramenta é de NÍVEL {nivel} de 7 e seu arquétipo visual é: \"{arquetipo}\". "
            f'Você DEVE fundir o arquétipo "{arquetipo}" com materiais e objetos icônicos do tema "{tema}".\n'
            f'2. O nome DEVE começar com a palavra "Picareta" e refletir o arquétipo e o tema "{tema}".\n'
            f"3. A descrição deve citar de forma cômica que ela quebra {poder:g} pedras por golpe no planeta. Máximo 2 frases curtas.\n\n"
            'Retorne APENAS JSON válido com as chaves "nome" e "descricao".'
        )

    if tipo == "buff":
        mult = ctx.multiplicador or 2
        dur = ctx.duracao or 30
        return _cabecalho(tema) + (
            f"1. O item é um consumível visualmente inspirado em \"{ARQUETIPO_BUFF}\", adaptado de forma hilária ao tema \"{tema}\".\n"
            f'2. O nome deve ser o de uma bebida, alimento, poção ou frasco exclusivo do tema "{tema}".\n'
            f"3. A descrição DEVE explicar de forma cômica como consumi-lo multiplica por {mult:g}x a VELOCIDADE DE BATER NA PEDRA durante {dur} segundos, com um efeito colateral engraçado. Máximo 2 frases curtas.\n\n"
            'Retorne APENAS JSON válido com as chaves "nome" e "descricao".'
        )

    if tipo == "artefato":
        raridade = ctx.raridade or 1
        numero = ctx.numero or 1
        arquetipo = ARQUETIPOS_ARTEFATO.get(numero, "Relíquia arqueológica")
        nome_raridade = RARIDADES.get(raridade, "comum")
        return _cabecalho(tema) + (
            f"1. O artefato escavado é o #{numero} do museu e corresponde visualmente a: \"{arquetipo}\". "
            f'Você DEVE fundir a ideia de "{arquetipo}" com a arqueologia e mitologia do universo "{tema}".\n'
            f"2. Raridade: {nome_raridade} ({raridade} de 5).\n"
            f'3. O nome DEVE ter no máximo 4 palavras, refletindo o arquétipo e o tema "{tema}".\n'
            f'4. A descrição deve descrevê-lo como uma relíquia histórica bizarra encontrada dentro das pedras de "{tema}". Máximo 2 frases curtas.\n\n'
            'Retorne APENAS JSON válido com as chaves "nome" e "descricao".'
        )

    # epilogo
    est = ctx.estatisticas or {}
    resumo = ", ".join(f"{k}: {v}" for k, v in est.items()) or "sem estatísticas"
    return _cabecalho(tema) + (
        f'1. O jogador completou o museu com todas as 8 relíquias do universo "{tema}".\n'
        f"2. Estatísticas da partida: {resumo}.\n"
        f'3. Escreva um epílogo épico e engraçado de no máximo 3 frases, exaltando a exploração do universo "{tema}".\n\n'
        'Retorne APENAS JSON válido com as chaves "titulo" e "texto".'
    )


# Chaves obrigatórias de cada tipo, usadas para validar a resposta do modelo
CHAVES_ESPERADAS: dict[str, dict] = {
    "universo": {"picareta": ("nome", "descricao"), "buff": ("nome", "descricao")},
    "picareta": {"_": ("nome", "descricao")},
    "buff": {"_": ("nome", "descricao")},
    "artefato": {"_": ("nome", "descricao")},
    "epilogo": {"_": ("titulo", "texto")},
}
