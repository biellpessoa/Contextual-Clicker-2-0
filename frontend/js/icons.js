/**
 * Ícones 1-bit em pixel art desenhados como SVG (fallback quando não há
 * sprite em frontend/assets/img/). Cada "X" é um pixel branco.
 */
window.Icones = (function () {
  const MAPAS = {
    picareta: [
      '..XXXXXXXX..',
      '.XX......XX.',
      'XX...XX...XX',
      'X....XX....X',
      '.....XX.....',
      '.....XX.....',
      '.....XX.....',
      '.....XX.....',
      '.....XX.....',
      '.....XX.....',
      '....XXXX....',
      '....XXXX....',
    ],
    buff: [
      '....XXXX....',
      '.....XX.....',
      '.....XX.....',
      '....X..X....',
      '...X....X...',
      '..X......X..',
      '..XXXXXXXX..',
      '..XX.XXXXX..',
      '..XXXXX.XX..',
      '..XXXXXXXX..',
      '...XXXXXX...',
      '....XXXX....',
    ],
    artefato: [
      '............',
      '..XXXXXXXX..',
      '.X.X....X.X.',
      'XXXXXXXXXXXX',
      '.X..X..X..X.',
      '..X..XX..X..',
      '...X.XX.X...',
      '....X..X....',
      '.....XX.....',
      '............',
    ],
    cadeado: [
      '...XXXXXX...',
      '..X......X..',
      '..X......X..',
      '..X......X..',
      '.XXXXXXXXXX.',
      '.XXXXXXXXXX.',
      '.XXXX..XXXX.',
      '.XXXX..XXXX.',
      '.XXXXX.XXXX.',
      '.XXXXXXXXXX.',
    ],
  };

  function svg(nome, opacidade = 1) {
    const linhas = MAPAS[nome];
    const h = linhas.length;
    const w = linhas[0].length;
    let rects = '';
    linhas.forEach((linha, y) => {
      [...linha].forEach((c, x) => {
        if (c === 'X') rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
      });
    });
    return `<svg class="pixel-icon" viewBox="0 0 ${w} ${h}" fill="#fff" opacity="${opacidade}"
      shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${rects}</svg>`;
  }

  /* Sprites disponíveis em assets/img/ (listados em manifest.json) */
  let disponiveis = new Set();

  async function carregarManifesto() {
    try {
      const r = await fetch('assets/img/manifest.json', { cache: 'no-store' });
      if (r.ok) disponiveis = new Set(await r.json());
    } catch {
      /* aberto via file:// ou sem manifesto: usa só os ícones SVG */
    }
  }

  /**
   * Usa um sprite de assets/img/ se estiver no manifesto (JPG, PNG, WEBP);
   * se nenhum existir, desenha o ícone SVG. Retorna a origem usada.
   */
  function renderizar(container, nome, candidatos = []) {
    const extensoes = ['.jpg', '.jpeg', '.png', '.webp'];
    const bases = [...candidatos, nome].map(c => c.replace(/\.(png|jpe?g|webp)$/i, ''));

    let arquivo = null;
    for (const b of bases) {
      for (const ext of extensoes) {
        const tentativa = `${b}${ext}`;
        if (disponiveis.has(tentativa)) {
          arquivo = tentativa;
          break;
        }
      }
      if (arquivo) break;
    }

    if (!arquivo) {
      container.innerHTML = svg(nome);
      return 'svg';
    }
    container.innerHTML = '';
    const img = new Image();
    img.className = 'pixel-sprite';
    img.alt = nome;
    img.onerror = () => {
      container.innerHTML = svg(nome);
    };
    img.src = `assets/img/${arquivo}`;
    container.appendChild(img);
    return 'sprite';
  }

  return { svg, renderizar, carregarManifesto };
})();
