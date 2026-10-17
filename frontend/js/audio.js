/**
 * Efeitos sonoros 8-bit gerados com Web Audio API (sem arquivos de áudio).
 */
window.Sons = (function () {
  let ctx = null;
  let ligado = localStorage.getItem('cc_som') !== 'off';

  function audio() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function nota(freq, inicio, dur, vol = 0.06, tipo = 'square') {
    if (!ligado) return;
    const a = audio();
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = tipo;
    osc.frequency.value = freq;
    const t = a.currentTime + inicio;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(a.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  const seq = (freqs, passo, dur, vol) => freqs.forEach((f, i) => nota(f, i * passo, dur, vol));

  return {
    clique: () => nota(180 + Math.random() * 60, 0, 0.05, 0.04),
    compra: () => seq([392, 523, 659, 784], 0.07, 0.12),
    buffAparece: () => seq([880, 1175], 0.08, 0.1, 0.04),
    buff: () => seq([523, 659, 784, 1047, 1319], 0.05, 0.1),
    artefato: () => seq([659, 784, 988, 1319], 0.1, 0.2),
    vitoria: () => seq([523, 523, 784, 784, 880, 1047, 1319], 0.13, 0.25),
    erro: () => nota(110, 0, 0.2, 0.05, 'sawtooth'),
    alternar() {
      ligado = !ligado;
      localStorage.setItem('cc_som', ligado ? 'on' : 'off');
      return ligado;
    },
    get ligado() { return ligado; },
  };
})();
