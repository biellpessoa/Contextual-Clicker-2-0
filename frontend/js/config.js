/**
 * Configuração do front-end.
 *
 * O jogo NÃO chama o Ollama diretamente: todas as requisições de IA vão para o
 * back-end FastAPI do grupo, autenticadas com o header X-API-Key.
 *
 * A chave abaixo é apenas o valor de DESENVOLVIMENTO (igual ao .env.example).
 * Para usar outra sem editar o código: localStorage.setItem('cc_api_key', 'sua-chave')
 */
window.CC_CONFIG = (function () {
  const servidoPelaApi = location.protocol.startsWith('http') && location.pathname.startsWith('/jogo');
  const params = new URLSearchParams(location.search);

  return {
    API_BASE_URL: localStorage.getItem('cc_api_url') || (servidoPelaApi ? location.origin : 'http://127.0.0.1:8000'),
    API_KEY: localStorage.getItem('cc_api_key') || 'cc-dev-key-troque-me',
    TIMEOUT_MS: 90000,
    // ?demo=1 acelera a progressão (útil para gravar o vídeo de demonstração)
    FATOR_DEMO: params.get('demo') === '1' ? 4 : 1,
  };
})();
