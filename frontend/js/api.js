/**
 * Cliente da API do grupo (FastAPI). Único ponto do jogo que faz requisições de IA.
 * Se a API estiver inacessível, devolve um texto local marcado como fonte "offline"
 * para o jogo nunca travar.
 */
window.IAClient = (function () {
  const cfg = window.CC_CONFIG;
  const ouvintes = [];

  function notificar(evento) {
    ouvintes.forEach(fn => fn(evento));
  }

  function fallbackLocal(tipo, tema, ctx) {
    const t = tema.charAt(0) + tema.slice(1).toLowerCase();
    const item = {
      picareta: { nome: `Picareta Genérica Nv.${ctx.nivel || 1}`, descricao: `A API está offline, então ela é só uma picareta comum de ${t}. Ainda quebra pedras.` },
      buff: { nome: `Lanche de ${t}`, descricao: `Acelera a picareta em ${ctx.multiplicador || 2}x por ${ctx.duracao || 30}s. Sem lore: API offline.` },
      artefato: { nome: `Artefato #${ctx.numero || '?'}`, descricao: `Um objeto de ${t} ainda não catalogado. Conecte a API para gerar sua lore.` },
      epilogo: { titulo: 'Museu completo', texto: `Você catalogou o universo ${t}. (Epílogo local: API offline.)` },
    };
    const conteudo = tipo === 'universo' ? { picareta: item.picareta, buff: item.buff } : item[tipo];
    return { tipo, tema, conteudo, fonte: 'offline', modelo: 'local', latencia_ms: 0 };
  }

  async function gerarTexto(tipo, tema, contexto = {}) {
    const inicio = performance.now();
    const url = `${cfg.API_BASE_URL}/v1/ia-generativa/texto`;
    notificar({ estado: 'pendente', tipo });
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': cfg.API_KEY },
        body: JSON.stringify({ tipo, tema, contexto }),
        signal: AbortSignal.timeout(cfg.TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const dados = await res.json();
      const ms = Math.round(performance.now() - inicio);
      console.info(`[IA] POST /v1/ia-generativa/texto tipo=${tipo} → 200 fonte=${dados.fonte} (${ms}ms)`, dados);
      notificar({ estado: 'ok', tipo, status: res.status, fonte: dados.fonte, ms });
      return dados;
    } catch (err) {
      console.warn(`[IA] Falha ao chamar a API (${err.message}). Usando fallback local.`);
      notificar({ estado: 'erro', tipo, erro: err.message });
      return fallbackLocal(tipo, tema, contexto);
    }
  }

  async function status() {
    try {
      const res = await fetch(`${cfg.API_BASE_URL}/v1/ia-generativa/status`, {
        headers: { 'X-API-Key': cfg.API_KEY },
        signal: AbortSignal.timeout(5000),
      });
      if (res.status === 401) return { api: true, autenticado: false };
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { api: true, autenticado: true, ...(await res.json()) };
    } catch {
      return { api: false };
    }
  }

  return { gerarTexto, status, aoMudar: fn => ouvintes.push(fn) };
})();
