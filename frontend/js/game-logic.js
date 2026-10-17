/**
 * CONTEXTUAL CLICKER — Lógica pura do jogo (sem DOM).
 *
 * Mantida separada da interface para poder ser testada com `node --test`.
 * Todas as funções recebem o estado e o instante atual (`agora`, em ms),
 * o que torna o comportamento determinístico nos testes.
 */
(function (root, factory) {
  const mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.GameLogic = mod;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const VERSAO_SAVE = 1;

  /* Mecânica 2 — aquisição progressiva de picaretas temáticas */
  const PICARETAS = [
    { nivel: 1, custo: 0,    poderClique: 1,  porSegundo: 0 },
    { nivel: 2, custo: 15,   poderClique: 2,  porSegundo: 0.5 },
    { nivel: 3, custo: 60,   poderClique: 4,  porSegundo: 2 },
    { nivel: 4, custo: 200,  poderClique: 8,  porSegundo: 5 },
    { nivel: 5, custo: 500,  poderClique: 14, porSegundo: 10 },
    { nivel: 6, custo: 1100, poderClique: 24, porSegundo: 20 },
    { nivel: 7, custo: 2200, poderClique: 40, porSegundo: 35 },
  ];

  /* Objetivo — artefatos do museu desbloqueados pelo total minerado */
  const ARTEFATOS = [
    { limiar: 20,   raridade: 1 },
    { limiar: 60,   raridade: 1 },
    { limiar: 150,  raridade: 2 },
    { limiar: 350,  raridade: 2 },
    { limiar: 700,  raridade: 3 },
    { limiar: 1300, raridade: 3 },
    { limiar: 2200, raridade: 4 },
    { limiar: 3500, raridade: 5 },
  ];

  /* Mecânica 3 — buffs consumíveis que aceleram a mineração */
  const TIPOS_BUFF = [
    { multiplicador: 2, duracao: 30, peso: 3 },
    { multiplicador: 3, duracao: 20, peso: 1 },
  ];
  const BUFF_INTERVALO_MIN_MS = 18000;
  const BUFF_INTERVALO_MAX_MS = 35000;
  const BUFF_TEMPO_NA_TELA_MS = 9000;

  function criarEstado(tema, agora, opcoes = {}) {
    return {
      versao: VERSAO_SAVE,
      tema: String(tema || 'COZINHA').trim().toUpperCase().slice(0, 40) || 'COZINHA',
      pedras: 0,
      totalMinerado: 0,
      cliques: 0,
      nivelPicareta: 1,
      picareta: null,     // { nome, descricao, fonte } — lore gerada pela IA
      buffLore: null,     // lore do PRÓXIMO buff que vai aparecer na tela
      buffAtivo: null,    // { nome, descricao, fonte, multiplicador, expiraEm }
      buffsColetados: 0,
      artefatos: [],      // [{ indice, raridade, nome, descricao, fonte }]
      iniciadoEm: agora,
      tempoJogadoMs: 0,
      finalizado: false,
      fatorDemo: opcoes.fatorDemo || 1,
    };
  }

  function picaretaAtual(estado) {
    return PICARETAS[estado.nivelPicareta - 1];
  }

  function proximaPicareta(estado) {
    return PICARETAS[estado.nivelPicareta] || null;
  }

  function buffEstaAtivo(estado, agora) {
    return !!estado.buffAtivo && agora < estado.buffAtivo.expiraEm;
  }

  function multiplicadorAtual(estado, agora) {
    const buff = buffEstaAtivo(estado, agora) ? estado.buffAtivo.multiplicador : 1;
    return buff * (estado.fatorDemo || 1);
  }

  function poderClique(estado, agora) {
    return picaretaAtual(estado).poderClique * multiplicadorAtual(estado, agora);
  }

  function porSegundo(estado, agora) {
    return picaretaAtual(estado).porSegundo * multiplicadorAtual(estado, agora);
  }

  function adicionarPedras(estado, qtd) {
    estado.pedras += qtd;
    estado.totalMinerado += qtd;
  }

  /* Mecânica 1 — mineração por clique */
  function minerar(estado, agora) {
    if (estado.finalizado) return 0;
    const ganho = poderClique(estado, agora);
    estado.cliques += 1;
    adicionarPedras(estado, ganho);
    return ganho;
  }

  /* Mineração contínua (idle): chamada pelo loop do jogo */
  function tick(estado, dtMs, agora) {
    if (estado.finalizado || dtMs <= 0) return 0;
    const dt = Math.min(dtMs, 5000); // evita "salto" gigante se a aba ficou em segundo plano
    estado.tempoJogadoMs += dt;
    if (estado.buffAtivo && !buffEstaAtivo(estado, agora)) estado.buffAtivo = null;
    const ganho = porSegundo(estado, agora) * (dt / 1000);
    adicionarPedras(estado, ganho);
    return ganho;
  }

  function podeComprarPicareta(estado) {
    const prox = proximaPicareta(estado);
    return !!prox && !estado.finalizado && estado.pedras >= prox.custo;
  }

  function comprarPicareta(estado) {
    if (!podeComprarPicareta(estado)) return null;
    const prox = proximaPicareta(estado);
    estado.pedras -= prox.custo;
    estado.nivelPicareta = prox.nivel;
    estado.picareta = null; // a lore nova será pedida à IA
    return prox;
  }

  function sortearTipoBuff(rand = Math.random) {
    const total = TIPOS_BUFF.reduce((s, t) => s + t.peso, 0);
    let r = rand() * total;
    for (const t of TIPOS_BUFF) {
      if ((r -= t.peso) < 0) return { multiplicador: t.multiplicador, duracao: t.duracao };
    }
    const ultimo = TIPOS_BUFF[TIPOS_BUFF.length - 1];
    return { multiplicador: ultimo.multiplicador, duracao: ultimo.duracao };
  }

  function proximoSpawnBuff(agora, rand = Math.random) {
    return agora + BUFF_INTERVALO_MIN_MS + rand() * (BUFF_INTERVALO_MAX_MS - BUFF_INTERVALO_MIN_MS);
  }

  /** Consome o buff que está na tela (usa a lore pré-gerada em estado.buffLore). */
  function coletarBuff(estado, agora) {
    const lore = estado.buffLore;
    if (!lore || estado.finalizado) return null;
    estado.buffAtivo = {
      nome: lore.nome,
      descricao: lore.descricao,
      fonte: lore.fonte,
      multiplicador: lore.multiplicador,
      duracao: lore.duracao,
      expiraEm: agora + lore.duracao * 1000,
    };
    estado.buffLore = null; // a próxima lore será pedida à IA
    estado.buffsColetados += 1;
    return estado.buffAtivo;
  }

  function tempoRestanteBuff(estado, agora) {
    return buffEstaAtivo(estado, agora) ? estado.buffAtivo.expiraEm - agora : 0;
  }

  /** Retorna os índices dos artefatos recém-desbloqueados. */
  function verificarArtefatos(estado) {
    const novos = [];
    ARTEFATOS.forEach((a, indice) => {
      const jaTem = estado.artefatos.some(x => x.indice === indice);
      if (!jaTem && estado.totalMinerado >= a.limiar) {
        estado.artefatos.push({ indice, raridade: a.raridade, nome: null, descricao: null, fonte: null });
        novos.push(indice);
      }
    });
    return novos;
  }

  function progressoProximoArtefato(estado) {
    const indice = ARTEFATOS.findIndex((_, i) => !estado.artefatos.some(x => x.indice === i));
    if (indice === -1) return null;
    const anterior = indice === 0 ? 0 : ARTEFATOS[indice - 1].limiar;
    const alvo = ARTEFATOS[indice].limiar;
    const progresso = Math.max(0, Math.min(1, (estado.totalMinerado - anterior) / (alvo - anterior)));
    return { indice, limiar: alvo, progresso };
  }

  /* Condição de fim de sessão: museu completo */
  function venceu(estado) {
    return estado.artefatos.length >= ARTEFATOS.length;
  }

  function serializar(estado) {
    return JSON.stringify(estado);
  }

  function desserializar(texto) {
    try {
      const e = JSON.parse(texto);
      const valido =
        e && e.versao === VERSAO_SAVE && typeof e.tema === 'string' &&
        Number.isFinite(e.pedras) && Number.isFinite(e.totalMinerado) &&
        Number.isInteger(e.nivelPicareta) && e.nivelPicareta >= 1 &&
        e.nivelPicareta <= PICARETAS.length && Array.isArray(e.artefatos);
      return valido ? e : null;
    } catch {
      return null;
    }
  }

  function formatarNumero(n) {
    const v = Math.floor(n);
    if (v < 10000) return String(v);
    if (v < 1e6) return (v / 1000).toFixed(1).replace('.0', '') + 'K';
    return (v / 1e6).toFixed(2) + 'M';
  }

  function formatarTempo(ms) {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  return {
    PICARETAS, ARTEFATOS, TIPOS_BUFF, BUFF_TEMPO_NA_TELA_MS,
    criarEstado, picaretaAtual, proximaPicareta, multiplicadorAtual,
    poderClique, porSegundo, minerar, tick,
    podeComprarPicareta, comprarPicareta,
    sortearTipoBuff, proximoSpawnBuff, coletarBuff, buffEstaAtivo, tempoRestanteBuff,
    verificarArtefatos, progressoProximoArtefato, venceu,
    serializar, desserializar, formatarNumero, formatarTempo,
  };
});
