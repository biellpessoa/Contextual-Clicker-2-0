/**
 * CONTEXTUAL CLICKER — controlador da interface.
 * Liga a lógica pura (GameLogic) ao DOM e à API de IA (IAClient).
 */
(function () {
  'use strict';

  const GL = window.GameLogic;
  const API = window.IAClient;
  const Sons = window.Sons;
  const Icones = window.Icones;
  const CFG = window.CC_CONFIG;

  const SAVE_KEY = 'cc_save_v1';
  const $ = id => document.getElementById(id);

  const screens = {
    menu: $('screen-menu'),
    game: $('screen-game'),
    museum: $('screen-museum'),
    victory: $('screen-victory'),
  };

  let estado = null;
  let telaAtual = 'menu';
  let ultimoTick = Date.now();
  let ultimoSave = 0;
  let proximoSpawn = 0;
  let buffNaTela = false;
  let buffSomeEm = 0;
  let buffEstavaAtivo = false;
  const pendentes = new Set();

  /* ═══════════════ utilidades de UI ═══════════════ */

  function setText(el, valor) {
    const v = String(valor);
    if (el.textContent !== v) el.textContent = v;
  }

  function rotuloFonte(fonte, curto = false) {
    if (fonte === 'llama3.2') return { texto: curto ? 'LLAMA 3.2' : 'LORE GERADA POR LLAMA 3.2', classe: '' };
    if (fonte === 'fallback') return { texto: curto ? 'FALLBACK' : 'FALLBACK (OLLAMA OFFLINE)', classe: 'tag-fallback' };
    return { texto: curto ? 'OFFLINE' : 'FALLBACK LOCAL (API OFFLINE)', classe: 'tag-fallback' };
  }

  function setTag(el, fonte, curto = false) {
    el.classList.remove('hidden');
    if (!fonte) {
      el.textContent = curto ? 'GERANDO...' : 'GERANDO COM LLAMA 3.2...';
      el.className = 'tag tag-loading';
      return;
    }
    const r = rotuloFonte(fonte, curto);
    el.textContent = r.texto;
    el.className = `tag ${r.classe}`;
  }

  /** Escreve a lore com efeito de "digitação" (texto sempre via textContent: nunca HTML da IA). */
  function setLore(el, texto, digitando = false) {
    el.classList.remove('loading-text', 'typing');
    const id = (el._tid = (el._tid || 0) + 1);
    if (!digitando) {
      el.textContent = texto;
      return;
    }
    el.classList.add('typing');
    let i = 0;
    const passo = () => {
      if (el._tid !== id) return;
      i += 2;
      el.textContent = texto.slice(0, i);
      if (i < texto.length) setTimeout(passo, 16);
      else el.classList.remove('typing');
    };
    passo();
  }

  function setCarregando(el, texto) {
    el._tid = (el._tid || 0) + 1;
    el.textContent = texto;
    el.classList.remove('typing');
    el.classList.add('loading-text');
  }

  function flash(el) {
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }

  function toast(titulo, sub = '') {
    const box = $('toasts');
    while (box.children.length >= 3) box.firstChild.remove();
    const t = document.createElement('div');
    t.className = 'toast';
    const s = document.createElement('strong');
    s.textContent = titulo;
    t.appendChild(s);
    if (sub) t.appendChild(document.createTextNode(sub));
    box.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  function atualizarBotoesSom() {
    const txt = `[ SOM: ${Sons.ligado ? 'ON' : 'OFF'} ]`;
    $('btn-sound').textContent = txt;
    $('btn-sound-menu').textContent = txt;
  }

  /* ═══════════════ navegação e save ═══════════════ */

  function goTo(id) {
    telaAtual = id;
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[id].classList.add('active');
    if (id === 'museum') renderMuseu();
    if (id === 'menu') {
      salvar();
      atualizarMenu();
    }
  }

  function salvar() {
    if (!estado) return;
    localStorage.setItem(SAVE_KEY, GL.serializar(estado));
    ultimoSave = Date.now();
  }

  function carregarSave() {
    const txt = localStorage.getItem(SAVE_KEY);
    return txt ? GL.desserializar(txt) : null;
  }

  function atualizarMenu() {
    const save = estado || carregarSave();
    const podeContinuar = save && !save.finalizado;
    $('btn-continue').classList.toggle('hidden', !podeContinuar);
    if (podeContinuar) $('continue-theme').textContent = save.tema;
  }

  /* ═══════════════ status da IA ═══════════════ */

  async function verificarStatus() {
    const s = await API.status();
    const ind = $('ai-indicator');
    const menu = $('menu-status');
    let texto;
    let online = false;
    if (!s.api) texto = 'API OFFLINE — FALLBACK LOCAL';
    else if (!s.autenticado) texto = 'API: X-API-KEY INVÁLIDA';
    else if (s.ollama_online && s.modelo_instalado) {
      texto = `IA: ${s.modelo.toUpperCase()} ONLINE`;
      online = true;
    } else if (s.ollama_online) texto = `IA: MODELO ${s.modelo.toUpperCase()} NÃO INSTALADO`;
    else texto = 'IA: OLLAMA OFFLINE — FALLBACK';

    ind.textContent = `${online ? '●' : '○'} ${texto}`;
    ind.classList.toggle('online', online);
    menu.textContent = `> ${s.api ? 'API FASTAPI CONECTADA' : 'API FASTAPI NÃO ENCONTRADA'} · ${texto}`;
  }

  API.aoMudar(ev => {
    const log = $('api-log');
    const fila = pendentes.size > 1 ? ` (+${pendentes.size - 1} na fila)` : '';
    if (ev.estado === 'pendente') {
      log.textContent = `> POST /v1/ia-generativa/texto [${ev.tipo}] ... aguardando IA${fila}`;
    } else if (ev.estado === 'ok') {
      log.textContent = `> POST /v1/ia-generativa/texto [${ev.tipo}] ${ev.status} · ${ev.fonte} · ${(ev.ms / 1000).toFixed(1)}s`;
      const ind = $('ai-indicator');
      if (ev.fonte === 'llama3.2' && !ind.classList.contains('online')) {
        ind.textContent = '● IA: LLAMA3.2 ONLINE';
        ind.classList.add('online');
      }
    } else {
      log.textContent = `> API OFFLINE (${ev.erro}) · usando fallback local`;
    }
  });

  /* ═══════════════ chamadas de IA (via API do grupo) ═══════════════ */

  async function requisitar(chave, tipo, contexto) {
    pendentes.add(chave);
    try {
      return await API.gerarTexto(tipo, estado.tema, contexto);
    } finally {
      pendentes.delete(chave);
    }
  }

  async function pedirUniverso() {
    const e = estado;
    const r = await requisitar('universo', 'universo', {});
    if (e !== estado) return;
    if (!estado.picareta && estado.nivelPicareta === 1) {
      estado.picareta = { ...r.conteudo.picareta, fonte: r.fonte };
      renderPicareta(true);
      flash($('pick-box'));
    }
    if (!estado.buffLore) {
      // o buff do prompt original da CP4 é sempre 2x / 30s
      estado.buffLore = { ...r.conteudo.buff, fonte: r.fonte, multiplicador: 2, duracao: 30 };
    }
    salvar();
  }

  async function pedirPicareta(nivel) {
    const e = estado;
    const tier = GL.PICARETAS[nivel - 1];
    const r = await requisitar(`picareta-${nivel}`, 'picareta', {
      nivel, poder_clique: tier.poderClique, por_segundo: tier.porSegundo,
    });
    if (e !== estado || estado.nivelPicareta !== nivel) return;
    estado.picareta = { ...r.conteudo, fonte: r.fonte };
    renderPicareta(true);
    flash($('pick-box'));
    salvar();
  }

  async function pedirBuff() {
    if (pendentes.has('buff')) return;
    const e = estado;
    const tipo = GL.sortearTipoBuff();
    const r = await requisitar('buff', 'buff', { multiplicador: tipo.multiplicador, duracao: tipo.duracao });
    if (e !== estado) return;
    estado.buffLore = { ...r.conteudo, fonte: r.fonte, ...tipo };
    salvar();
  }

  async function pedirArtefato(indice) {
    const e = estado;
    const art = estado.artefatos.find(a => a.indice === indice);
    const r = await requisitar(`artefato-${indice}`, 'artefato', { raridade: art.raridade, numero: indice + 1 });
    if (e !== estado) return;
    Object.assign(art, { nome: r.conteudo.nome, descricao: r.conteudo.descricao, fonte: r.fonte });
    if (telaAtual === 'museum') renderMuseu();
    salvar();
  }

  async function pedirEpilogo() {
    const e = estado;
    const tier = GL.picaretaAtual(estado);
    const r = await requisitar('epilogo', 'epilogo', {
      estatisticas: {
        tempo: GL.formatarTempo(estado.tempoJogadoMs),
        cliques: estado.cliques,
        pedras_totais: Math.floor(estado.totalMinerado),
        nivel_picareta: tier.nivel,
        buffs_coletados: estado.buffsColetados,
      },
    });
    if (e !== estado) return;
    $('epilogue-title').textContent = r.conteudo.titulo;
    setTag($('epilogue-tag'), r.fonte);
    setLore($('epilogue-text'), r.conteudo.texto, true);
  }

  /** Ao continuar um save, refaz pedidos que estavam em andamento quando a página fechou. */
  function recuperarPendentes() {
    if (!estado.picareta) {
      if (estado.nivelPicareta === 1) pedirUniverso();
      else pedirPicareta(estado.nivelPicareta);
    }
    if (!estado.buffLore && estado.picareta) pedirBuff();
    estado.artefatos.filter(a => !a.nome).forEach(a => pedirArtefato(a.indice));
  }

  /* ═══════════════ renderização ═══════════════ */

  function renderPicareta(digitando = false) {
    const tier = GL.picaretaAtual(estado);
    setText($('pick-level'), `NÍVEL ${tier.nivel}/${GL.PICARETAS.length}`);
    setText($('pick-stats'), `+${tier.poderClique} / CLIQUE · ${tier.porSegundo} / SEG`);
    const origem = Icones.renderizar($('pick-img'), 'picareta', [`picareta-${tier.nivel}.png`]);
    setText($('pick-caption'), origem === 'sprite' ? 'SPRITE IA (CP4)' : 'PIXEL ART 1-BIT');

    if (!estado.picareta) {
      setText($('pick-name'), `Forjando picareta Nv.${tier.nivel}...`);
      setTag($('pick-tag'), null);
      setCarregando($('pick-desc'), 'O Llama 3.2 está forjando sua picareta com materiais do tema. Continue minerando!');
      return;
    }
    setText($('pick-name'), estado.picareta.nome);
    setTag($('pick-tag'), estado.picareta.fonte);
    setLore($('pick-desc'), estado.picareta.descricao, digitando);
  }

  function renderBuff(digitando = false) {
    const agora = Date.now();
    const origem = Icones.renderizar($('buff-img'), 'buff');
    setText($('buff-caption'), origem === 'sprite' ? 'SPRITE IA (CP4)' : 'PIXEL ART 1-BIT');

    if (GL.buffEstaAtivo(estado, agora)) {
      const b = estado.buffAtivo;
      setText($('buff-name'), b.nome);
      setTag($('buff-tag'), b.fonte);
      setLore($('buff-desc'), b.descricao, digitando);
    } else {
      setText($('buff-name'), 'Nenhum buff ativo');
      $('buff-tag').classList.add('hidden');
      setLore($('buff-desc'), estado.buffLore
        ? 'Um consumível deste universo já foi gerado pela IA e vai aparecer na tela em breve. Clique nele!'
        : 'Fique de olho: consumíveis do universo aparecem na tela de tempos em tempos. Clique neles para acelerar a mineração!');
      setText($('buff-timer'), '');
      $('buff-fill').style.width = '0%';
    }
  }

  function renderHUD(agora) {
    const prox = GL.proximaPicareta(estado);
    const buffAtivo = GL.buffEstaAtivo(estado, agora);
    const ps = GL.porSegundo(estado, agora);

    setText($('mine-count'), GL.formatarNumero(estado.pedras));
    setText($('rate-click'), GL.formatarNumero(GL.poderClique(estado, agora)));
    setText($('rate-second'), ps < 10 ? ps.toFixed(1) : GL.formatarNumero(ps));
    setText($('hud-time'), GL.formatarTempo(estado.tempoJogadoMs));

    $('rate-mult').classList.toggle('hidden', !buffAtivo);
    $('planet-btn').classList.toggle('buffed', buffAtivo);
    if (buffAtivo) {
      setText($('rate-mult'), `BUFF x${estado.buffAtivo.multiplicador}`);
      const rest = GL.tempoRestanteBuff(estado, agora);
      setText($('buff-timer'), `${Math.ceil(rest / 1000)}s RESTANTES`);
      $('buff-fill').style.width = `${(rest / (estado.buffAtivo.duracao * 1000)) * 100}%`;
    }

    const btn = $('btn-upgrade');
    if (!prox) {
      setText($('upgrade-label'), '[ PICARETA MÁXIMA FORJADA ]');
      btn.disabled = true;
      btn.classList.remove('ready');
      $('upgrade-fill').style.width = '100%';
    } else {
      const pode = GL.podeComprarPicareta(estado);
      setText($('upgrade-label'), `[ FORJAR PICARETA NV.${prox.nivel} — ${GL.formatarNumero(prox.custo)} PEDRAS ]`);
      btn.disabled = !pode;
      btn.classList.toggle('ready', pode);
      $('upgrade-fill').style.width = `${Math.min(1, estado.pedras / prox.custo) * 100}%`;
    }

    setText($('artifact-count'), `${estado.artefatos.length}/${GL.ARTEFATOS.length}`);
    const p = GL.progressoProximoArtefato(estado);
    if (p) {
      $('artifact-fill').style.width = `${p.progresso * 100}%`;
      setText($('artifact-text'), `${GL.formatarNumero(estado.totalMinerado)} / ${GL.formatarNumero(p.limiar)}`);
    } else {
      $('artifact-fill').style.width = '100%';
      setText($('artifact-text'), 'COMPLETO');
    }
  }

  function renderMuseu() {
    if (!estado) return;
    $('museum-theme').textContent = estado.tema;
    const grid = $('museum-grid');
    grid.innerHTML = '';

    GL.ARTEFATOS.forEach((cfg, i) => {
      const art = estado.artefatos.find(a => a.indice === i);
      const card = document.createElement('article');
      card.className = 'artifact-card' + (art ? '' : ' locked');
      card.innerHTML = `
        <div class="artifact-img"><div class="img-slot"></div></div>
        <div class="artifact-body">
          <div class="artifact-name"></div>
          <div class="artifact-desc"></div>
          <div class="artifact-meta">
            <div class="rarity-bar">${[1, 2, 3, 4, 5].map(n =>
              `<div class="rarity-pip${n <= cfg.raridade ? ' filled' : ''}"></div>`).join('')}</div>
            <span class="tag hidden"></span>
          </div>
        </div>`;
      const slot = card.querySelector('.img-slot');
      const nome = card.querySelector('.artifact-name');
      const desc = card.querySelector('.artifact-desc');
      const tag = card.querySelector('.tag');
      const num = `#${String(i + 1).padStart(2, '0')}`;

      if (!art) {
        slot.innerHTML = Icones.svg('cadeado', 0.45);
        nome.textContent = `${num} ??? BLOQUEADO`;
        desc.textContent = `Minere ${GL.formatarNumero(cfg.limiar)} pedras no total para desenterrar este artefato.`;
      } else if (!art.nome) {
        Icones.renderizar(slot, 'artefato', [`artefato-${i + 1}.png`]);
        nome.textContent = `${num} Catalogando...`;
        desc.textContent = 'O Llama 3.2 está escrevendo a lore deste artefato...';
        desc.classList.add('loading-text');
        setTag(tag, null, true);
      } else {
        Icones.renderizar(slot, 'artefato', [`artefato-${i + 1}.png`]);
        nome.textContent = `${num} ${art.nome}`;
        nome.title = art.nome;
        desc.textContent = art.descricao;
        desc.title = art.descricao;
        setTag(tag, art.fonte, true);
      }
      grid.appendChild(card);
    });
  }

  /* ═══════════════ mecânicas ═══════════════ */

  function efeitosClique(x, y, ganho) {
    const shell = $('game-shell').getBoundingClientRect();
    const planet = $('planet-btn');
    const pr = planet.getBoundingClientRect();

    const burst = document.createElement('div');
    burst.className = 'click-burst';
    burst.style.left = `${x - pr.left - 10}px`;
    burst.style.top = `${y - pr.top - 10}px`;
    planet.appendChild(burst);
    burst.addEventListener('animationend', () => burst.remove());

    const num = document.createElement('div');
    num.className = 'float-num';
    num.textContent = `+${GL.formatarNumero(ganho)}`;
    num.style.left = `${x - shell.left + (Math.random() * 30 - 15)}px`;
    num.style.top = `${y - shell.top - 20}px`;
    $('game-shell').appendChild(num);
    num.addEventListener('animationend', () => num.remove());

    for (let i = 0; i < 4; i++) {
      const d = document.createElement('div');
      d.className = 'debris';
      d.style.left = `${x - shell.left}px`;
      d.style.top = `${y - shell.top}px`;
      d.style.setProperty('--dx', `${Math.random() * 80 - 40}px`);
      d.style.setProperty('--dy', `${Math.random() * 60 - 10}px`);
      $('game-shell').appendChild(d);
      d.addEventListener('animationend', () => d.remove());
    }

    planet.style.transform = `scale(0.96) rotate(${Math.random() * 4 - 2}deg)`;
    setTimeout(() => { planet.style.transform = ''; }, 90);

    const contador = $('mine-count');
    contador.classList.remove('bump');
    void contador.offsetWidth;
    contador.classList.add('bump');
  }

  /* Mecânica 1: mineração por clique */
  function minerar(x, y) {
    if (!estado || estado.finalizado) return;
    const ganho = GL.minerar(estado, Date.now());
    Sons.clique();
    efeitosClique(x, y, ganho);
    if (estado.cliques === 1) $('planet-label').style.opacity = '0';
    aposGanho();
  }

  function minerarPeloCentro() {
    const r = $('planet-btn').getBoundingClientRect();
    minerar(r.left + r.width / 2, r.top + r.height / 2);
  }

  /* Mecânica 2: aquisição progressiva de picaretas temáticas */
  function forjar() {
    if (!estado || estado.finalizado) return;
    const prox = GL.comprarPicareta(estado);
    if (!prox) {
      Sons.erro();
      return;
    }
    Sons.compra();
    toast(`PICARETA NV.${prox.nivel} FORJADA`, `+${prox.poderClique} / CLIQUE · ${prox.porSegundo} / SEG`);
    renderPicareta();
    pedirPicareta(prox.nivel);
    salvar();
  }

  /* Mecânica 3: buffs consumíveis */
  function gerenciarBuffs(agora) {
    const ativo = GL.buffEstaAtivo(estado, agora);
    if (ativo !== buffEstavaAtivo) {
      buffEstavaAtivo = ativo;
      renderBuff();
    }
    const drop = $('buff-drop');
    if (!buffNaTela && !ativo && estado.buffLore && telaAtual === 'game' && agora >= proximoSpawn) {
      mostrarBuffNaTela(agora);
    } else if (buffNaTela) {
      if (agora >= buffSomeEm) {
        esconderBuffDaTela();
        proximoSpawn = GL.proximoSpawnBuff(agora);
      } else if (agora >= buffSomeEm - 2500) {
        drop.classList.add('leaving');
      }
    }
  }

  function mostrarBuffNaTela(agora) {
    const drop = $('buff-drop');
    $('buff-drop-icon').innerHTML = Icones.svg('buff');
    $('buff-drop-name').textContent = estado.buffLore.nome;
    drop.style.left = `${5 + Math.random() * 70}%`;
    drop.style.top = `${15 + Math.random() * 60}%`;
    drop.classList.remove('hidden', 'leaving');
    buffNaTela = true;
    buffSomeEm = agora + GL.BUFF_TEMPO_NA_TELA_MS;
    Sons.buffAparece();
  }

  function esconderBuffDaTela() {
    $('buff-drop').classList.add('hidden');
    buffNaTela = false;
  }

  function coletarBuff() {
    const agora = Date.now();
    const buff = GL.coletarBuff(estado, agora);
    esconderBuffDaTela();
    if (!buff) return;
    Sons.buff();
    toast(buff.nome.toUpperCase(), `VELOCIDADE x${buff.multiplicador} POR ${buff.duracao}s`);
    buffEstavaAtivo = true;
    renderBuff(true);
    flash($('buff-box'));
    proximoSpawn = GL.proximoSpawnBuff(buff.expiraEm);
    pedirBuff(); // já gera a lore do próximo consumível em segundo plano
    salvar();
  }

  /* Objetivo: artefatos do museu e condição de fim de sessão */
  function aposGanho() {
    const novos = GL.verificarArtefatos(estado);
    novos.forEach(i => {
      Sons.artefato();
      toast('ARTEFATO DESENTERRADO!', `#${String(i + 1).padStart(2, '0')} · VEJA NO MUSEU`);
      pedirArtefato(i);
    });
    if (novos.length && GL.venceu(estado) && !estado.finalizado) finalizar();
  }

  function finalizar() {
    estado.finalizado = true;
    esconderBuffDaTela();
    salvar();
    Sons.vitoria();
    renderVitoria();
    setTimeout(() => goTo('victory'), 1200);
    pedirEpilogo();
  }

  function renderVitoria() {
    $('victory-theme').textContent = estado.tema;
    $('epilogue-title').textContent = 'Escrevendo epílogo...';
    setTag($('epilogue-tag'), null);
    setCarregando($('epilogue-text'), 'O Llama 3.2 está escrevendo o final da sua história...');
    const stats = [
      ['TEMPO', GL.formatarTempo(estado.tempoJogadoMs)],
      ['CLIQUES', GL.formatarNumero(estado.cliques)],
      ['PEDRAS TOTAIS', GL.formatarNumero(estado.totalMinerado)],
      ['PICARETA', `NV.${estado.nivelPicareta}`],
      ['BUFFS', estado.buffsColetados],
    ];
    const box = $('victory-stats');
    box.innerHTML = '';
    stats.forEach(([rotulo, valor]) => {
      const c = document.createElement('div');
      c.className = 'stat-card';
      const s = document.createElement('strong');
      s.textContent = valor;
      c.append(s, rotulo);
      box.appendChild(c);
    });
  }

  /* ═══════════════ ciclo de vida da partida ═══════════════ */

  function iniciarSessao() {
    $('hud-theme').textContent = estado.tema;
    $('museum-theme').textContent = estado.tema;
    $('planet-label').style.opacity = estado.cliques > 0 ? '0' : '1';
    esconderBuffDaTela();
    buffEstavaAtivo = GL.buffEstaAtivo(estado, Date.now());
    proximoSpawn = GL.proximoSpawnBuff(Date.now());
    ultimoTick = Date.now();
    renderPicareta();
    renderBuff();
    goTo('game');
    verificarStatus();
  }

  function novoJogo(tema) {
    estado = GL.criarEstado(tema, Date.now(), { fatorDemo: CFG.FATOR_DEMO });
    salvar();
    iniciarSessao();
    pedirUniverso();
  }

  function continuar() {
    const save = estado && !estado.finalizado ? estado : carregarSave();
    if (!save) return;
    estado = save;
    estado.fatorDemo = CFG.FATOR_DEMO;
    iniciarSessao();
    recuperarPendentes();
  }

  function loop() {
    const agora = Date.now();
    const dt = agora - ultimoTick;
    ultimoTick = agora;
    if (estado && !estado.finalizado && (telaAtual === 'game' || telaAtual === 'museum')) {
      GL.tick(estado, dt, agora);
      aposGanho();
      if (!estado.finalizado) gerenciarBuffs(agora);
      if (agora - ultimoSave > 5000) salvar();
    }
    if (estado && telaAtual === 'game') renderHUD(agora);
    requestAnimationFrame(loop);
  }

  /* ═══════════════ eventos ═══════════════ */

  $('menu-form').addEventListener('submit', e => {
    e.preventDefault();
    const input = $('theme-input');
    const tema = input.value.trim();
    if (!tema) {
      $('menu-error').classList.remove('hidden');
      input.classList.remove('shake');
      void input.offsetWidth;
      input.classList.add('shake');
      Sons.erro();
      input.focus();
      return;
    }
    $('menu-error').classList.add('hidden');
    Sons.compra();
    novoJogo(tema);
  });

  $('btn-continue').addEventListener('click', continuar);
  $('btn-menu').addEventListener('click', () => goTo('menu'));
  $('btn-museum').addEventListener('click', () => goTo('museum'));
  $('btn-back-mine').addEventListener('click', () => goTo(estado && estado.finalizado ? 'victory' : 'game'));
  $('btn-upgrade').addEventListener('click', forjar);
  $('buff-drop').addEventListener('click', coletarBuff);
  $('planet-btn').addEventListener('click', e => {
    // clique por teclado (Enter) chega com coordenadas 0,0
    if (e.detail === 0) minerarPeloCentro();
    else minerar(e.clientX, e.clientY);
  });
  $('btn-victory-museum').addEventListener('click', () => goTo('museum'));
  $('btn-victory-new').addEventListener('click', () => {
    localStorage.removeItem(SAVE_KEY);
    estado = null;
    $('theme-input').value = '';
    goTo('menu');
    $('theme-input').focus();
  });

  [$('btn-sound'), $('btn-sound-menu')].forEach(b => b.addEventListener('click', () => {
    Sons.alternar();
    atualizarBotoesSom();
  }));

  document.addEventListener('keydown', e => {
    if (telaAtual === 'game') {
      if (e.key === ' ') {
        e.preventDefault();
        if (!e.repeat) minerarPeloCentro(); // segurar espaço não vale como autoclicker
      } else if (e.key === 'u' || e.key === 'U') forjar();
      else if (e.key === 'm' || e.key === 'M') goTo('museum');
      else if (e.key === 'Escape') goTo('menu');
    } else if (telaAtual === 'museum' && (e.key === 'Escape' || e.key === 'm' || e.key === 'M')) {
      goTo(estado && estado.finalizado ? 'victory' : 'game');
    }
  });

  document.addEventListener('visibilitychange', salvar);
  window.addEventListener('beforeunload', salvar);

  /* ═══════════════ init ═══════════════ */
  atualizarBotoesSom();
  atualizarMenu();
  verificarStatus();
  Icones.carregarManifesto();
  $('theme-input').focus();
  requestAnimationFrame(loop);
})();
