# Relatório Técnico de Desenvolvimento — Checkpoint 5 (CP5)
## FIAP — 2TIAPY — Front-End & NLP / Chatbots e Agentes Virtuais

**Projeto:** Contextual Clicker  
**Integrantes do Grupo:**
- **Paulo Gabriel Pessoa da Silva** — RM: 566446
- **William Stahl Sanches Furquim Garcia** — RM: 562800

**Gênero:** Idle/Clicker e Sandbox Narrativo 1-Bit  
**Plataforma:** Web (Navegador HTML5) & Back-End (FastAPI)  
**Modalidade de IA Generativa:** Texto via Llama 3.2 (Ollama local com Fallback Procedural)  

---

# 1. Continuidade e Fidelidade à CP4

O MVP entregue neste Checkpoint 5 é a **continuidade direta e estrita** do conceito, mecânicas e mockups aprovados na CP4:
* **Mesmo Título e Premissa:** *Contextual Clicker*, onde o universo do jogo é proceduralmente moldado a partir de uma palavra-chave (*seed*) digitada pelo jogador no menu.
* **Mesma Estética:** Paleta monocromática 1-bit preto e branco, tipografia retro (*VT323*, *Share Tech Mono*, *Press Start 2P*) e efeito de scanlines CRT.
* **Telas do Mockup da CP4:**
  1. *Menu Principal:* Input de palavra-chave e botão de iniciar escavação.
  2. *Mina Ativa (Gameplay HUD):* Planeta interativo para clique, contador de pedras, lore da picareta e lore do buff.
  3. *Museu de Artefatos:* Grid de exposição dos artefatos desenterrados na mineração.
  4. *Tela de Vitória (Adição obrigatória de fim de sessão):* Epílogo dinâmico gerado pela IA e estatísticas finais.
* **Mecânicas da CP4 Implementadas:** Mineração por clique, aquisição progressiva de ferramentas (upgrades), consumíveis temporários (buffs de velocidade), desenterrar artefatos para o museu e condição de vitória.

---

# 2. Etapa 1 — Setup do Ambiente de Vibe Coding

* **Ferramenta de Vibe Coding:** Antigravity IDE (desenvolvimento orientado por agentes e prompts de alta precisão com execução local e inspeção de código).
* **Linguagens e Frameworks:**
  * **Front-End:** HTML5 Nativo, CSS3 puro e JavaScript moderno (ES6 Vanilla), sem frameworks externos pesados. Áudio sintetizado em tempo real com a **Web Audio API** nativa.
  * **Back-End:** Python 3.12 com **FastAPI**, **Uvicorn**, **Pydantic v2** e **HTTPX**.
  * **Motor de IA Generativa:** **Ollama** executando localmente o modelo de pesos abertos **Llama 3.2 (3B)** em `http://localhost:11434`.
  * **Testes Automatizados:** `pytest` para a API FastAPI e `node --test` para as mecânicas centrais do jogo.

---

# 3. Etapa 2 — Implementação do MVP Jogável

O MVP é 100% executável e jogável do início ao fim:
1. **Começo:** O jogador digita um tema no Menu Principal (ex: "Cozinha", "Espaço", "Fórmula 1", "Medieval").
2. **Meio:** O jogador clica no planeta para acumular pedras, compra upgrades de picareta que aumentam o dano por clique e a produção ociosa por segundo, coleta itens consumíveis (buffs) que surgem na tela multiplicando a velocidade, e desbloqueia artefatos arqueológicos em marcos progressivos de mineração.
3. **Fim:** Ao desenterrar os 8 artefatos do universo, a sessão é finalizada com uma tela de vitória épica contendo um **epílogo narrativo gerado pela IA** e o resumo das estatísticas do jogador.
4. **Integração Real de IA:** O Llama 3.2 gera em tempo de execução o nome e a descrição humorística da picareta, dos buffs, dos 8 artefatos e do epílogo, consumidos diretamente pelo jogo via requisições HTTP autenticadas.

---

## 3.1 Documentação da Modalidade 2 — Geração de Imagens (Pré-Produção / Assets Estáticos)

Seguindo o planejamento aprovado na CP4, os elementos visuais do jogo foram gerados por IA generativa em etapa de pré-produção offline utilizando o **Bing Image Creator (motor DALL-E 3)**. Foram geradas e integradas **16 imagens em formato JPG**, organizadas em três categorias:

### A. Tabela de Prompts e Arquétipos Visuais Gerados (16 Imagens)

| Arquivo Gerado | Categoria / Arquétipo | Prompt Utilizado no Bing Image Creator (DALL-E 3) |
| :--- | :--- | :--- |
| `picareta-1.jpg` | Picareta Nv. 1 (Rústica / Improvisada) | `1-bit pixel art, strictly black and white only, retro 8-bit game asset, a crude rustic makeshift improvised mining pickaxe tied with ropes, pure white background, minimal shading, clean silhouette.` |
| `picareta-2.jpg` | Picareta Nv. 2 (Pedra / Reforçada) | `1-bit pixel art, strictly black and white only, retro 8-bit game asset, a sturdy reinforced stone mining pickaxe, pure white background, minimal shading, clean silhouette.` |
| `picareta-3.jpg` | Picareta Nv. 3 (Ferro / Maquinada) | `1-bit pixel art, strictly black and white only, retro 8-bit game asset, an iron machined heavy mining pickaxe, pure white background, minimal shading, clean silhouette.` |
| `picareta-4.jpg` | Picareta Nv. 4 (Brocas / Engrenagens) | `1-bit pixel art, strictly black and white only, retro 8-bit game asset, a mechanical steampunk pickaxe with drill bits and gears, pure white background, minimal shading, clean silhouette.` |
| `picareta-5.jpg` | Picareta Nv. 5 (Laser / Cristalina) | `1-bit pixel art, strictly black and white only, retro 8-bit game asset, a crystalline laser futuristic high-tech pickaxe, pure white background, minimal shading, clean silhouette.` |
| `picareta-6.jpg` | Picareta Nv. 6 (Energia / Plasma) | `1-bit pixel art, strictly black and white only, retro 8-bit game asset, an energy plasma glowing sci-fi mining pickaxe, pure white background, minimal shading, clean silhouette.` |
| `picareta-7.jpg` | Picareta Nv. 7 (Cósmica Lendária) | `1-bit pixel art, strictly black and white only, retro 8-bit game asset, a legendary cosmic ultimate divine pickaxe with orbiting stars, pure white background, minimal shading, clean silhouette.` |
| `buff.jpg` | Buff Consumível (Aura de Velocidade) | `1-bit pixel art, strictly black and white only, retro 8-bit game asset, a magical swirling energy potion flask bottle with steam, pure white background, minimal shading, clean silhouette.` |
| `artefato-1.jpg` | Artefato #01 (Fóssil / Osso) | `1-bit pixel art, strictly black and white only, retro 8-bit game asset, an ancient petrified bone fossil relic, pure white background, minimal shading, clean silhouette.` |
| `artefato-2.jpg` | Artefato #02 (Cristal / Geodo) | `1-bit pixel art, strictly black and white only, retro 8-bit game asset, a shiny geometric crystal geode mineral, pure white background, minimal shading, clean silhouette.` |
| `artefato-3.jpg` | Artefato #03 (Chave Fóssil) | `1-bit pixel art, strictly black and white only, retro 8-bit game asset, an ancient mysterious fossilized key tool, pure white background, minimal shading, clean silhouette.` |
| `artefato-4.jpg` | Artefato #04 (Amuleto Ancestral) | `1-bit pixel art, strictly black and white only, retro 8-bit game asset, an ancient tribal mystical amulet pendant, pure white background, minimal shading, clean silhouette.` |
| `artefato-5.jpg` | Artefato #05 (Relíquia Arqueológica) | `1-bit pixel art, strictly black and white only, retro 8-bit game asset, a glowing ornate archaeological ancient urn relic, pure white background, minimal shading, clean silhouette.` |
| `artefato-6.jpg` | Artefato #06 (Crânio Enigmático) | `1-bit pixel art, strictly black and white only, retro 8-bit game asset, an enigmatic alien fossil skull device, pure white background, minimal shading, clean silhouette.` |
| `artefato-7.jpg` | Artefato #07 (Disco Cósmico) | `1-bit pixel art, strictly black and white only, retro 8-bit game asset, a dark matter cosmic disc artifact with runes, pure white background, minimal shading, clean silhouette.` |
| `artefato-8.jpg` | Artefato #08 (Núcleo Celestial) | `1-bit pixel art, strictly black and white only, retro 8-bit game asset, a legendary celestial star core celestial artifact, pure white background, minimal shading, clean silhouette.` |

### B. Pipeline de Pós-Processamento e Forçamento da Paleta 1-Bit

Como os modelos de difusão comerciais (DALL-E 3) frequentemente introduzem suavização de bordas (*anti-aliasing*), tons residuais de cinza e fundo branco opaco, desenvolvemos um pipeline técnico de pós-processamento de duas etapas:
1. **Recorte e Isolamento:** Cada sprite foi centralizado e salvo na pasta `frontend/assets/img/` com nomenclatura padronizada, sendo registrado no arquivo [manifest.json](file:///c:/Users/biel6/OneDrive/Desktop/Contextual%20Clicker/frontend/assets/img/manifest.json).
2. **Pipeline de Filtro e Blend Mode em Tempo de Execução (CSS):** Para eliminar a necessidade de recortar pixels manualmente em softwares de edição e garantir máxima performance no navegador, aplicamos a seguinte composição no seletor `.pixel-sprite`:
   ```css
   .pixel-sprite {
     object-fit: contain;
     image-rendering: pixelated;
     filter: invert(1) grayscale(1) contrast(5);
     mix-blend-mode: screen;
   }
   ```
   * `invert(1)`: Inverte o fundo branco original para preto absoluto (`#000000`) e os traços pretos para branco puro (`#ffffff`).
   * `grayscale(1) contrast(5)`: Força o limiar (*threshold*) matemático, eliminando quaisquer pixels intermediários de cinza ou artefatos de compressão JPEG, resultando em arte estritamente 1-bit.
   * `mix-blend-mode: screen`: Torna o fundo preto 100% transparente sobre o tema escuro do jogo, preservando os traços brancos da pixel art como se fossem vetores luminosos.

---

## 3.2 Alinhamento com a Especificação de Front-End — Por que as Imagens são Assets Estáticos?

A especificação da disciplina de **Front-End** define explicitamente:
> *"Implementar apenas a linha correspondente à modalidade de IA generativa efetivamente utilizada no MVP:*  
> *Modalidade: Texto ➔ Endpoint FastAPI: POST /v1/ia-generativa/texto ➔ Jogo e painel enviam contexto e recebem o texto gerado."*

Existe uma clara e justificada divisão entre as modalidades:
* **Modalidade Consumida via API em Tempo de Execução (Front-End & NLP):** O **TEXTO** (lore das picaretas, buffs, 8 artefatos e epílogo via Llama 3.2). Como o texto depende da palavra-chave digitada pelo jogador no menu (ex.: "Cozinha", "Escola", "Espaço"), ele **precisa** ser gerado dinamicamente em tempo de execução e consumir o endpoint `/v1/ia-generativa/texto` do back-end FastAPI com autenticação `X-API-Key`.
* **Modalidade de Pré-Produção Offline (NLP):** As **IMAGENS**. Elas representam a identidade visual e a interface do jogo (sprites de pixel art). Conforme documentado na CP4, fazer o front-end chamar APIs externas de difusão de imagens em tempo de execução para gerar sprites a cada clique seria tecnicamente inviável (latência de 15 a 30 segundos por imagem, alto custo financeiro e risco de inconsistência visual). Portanto, as imagens foram geradas offline na pré-produção e são servidas como assets estáticos locais, exatamente como preconiza a arquitetura de jogos e a rubrica da disciplina.

---

# 4. Etapa 3 — Diário de Vibe Coding

Esta seção documenta a condução do desenvolvimento guiado por prompts, registrando 5 decisões fundamentais de engenharia de software e arquitetura.

### Prompt-Chave 1: Arquitetura Desacoplada FastAPI (Router ➔ Provider)
* **O que foi pedido:**  
  *"Construa a estrutura da API em FastAPI desacoplando a chamada ao Ollama/Llama 3.2 através do padrão Router e Provider. O front-end não deve conhecer a porta 11434 do Ollama. Crie autenticação via header `X-API-Key` e habilite CORS e Swagger em `/docs`."*
* **O que a IA gerou:**  
  Um projeto FastAPI com `routers/ia_generativa.py`, `providers/ia_provider.py` e `core/security.py`. A rota `/v1/ia-generativa/texto` recebe um payload validado por Pydantic e injeta a dependência de segurança.
* **O que o grupo precisou ajustar/corrigir:**  
  A IA inicialmente utilizou uma verificação de chave sensível a timing attacks (`chave == config.api_key`). Corrigimos para `secrets.compare_digest` para garantir segurança criptográfica. Também injetamos `Settings` via `Depends(get_settings)` com wrapper sem argumentos nos testes para evitar erro 422 no TestClient.

---

### Prompt-Chave 2: Engenharia de Prompt e Tratamento Estrito de JSON
* **O que foi pedido:**  
  *"Crie o módulo de prompts para o Llama 3.2 garantindo que o modelo responda estritamente em JSON válido com as chaves esperadas (`nome` e `descricao`), mantendo o prompt testado na CP4 e reforçando a regra de que o item é uma Picareta que quebra pedras."*
* **O que a IA gerou:**  
  Funções em `app/prompts.py` montando os prompts para cada modalidade (`universo`, `picareta`, `buff`, `artefato`, `epilogo`) usando o parâmetro `format="json"` do Ollama.
* **O que o grupo precisou ajustar/corrigir:**  
  Modelos pequenos (3B) às vezes acentuam as chaves (`"descrição"` em vez de `"descricao"`) ou aninham o retorno dentro de outro objeto (`{"picareta": {"nome": ...}}`). Criamos uma função de sanitização `validar_conteudo()` com `unicodedata.normalize` para remover diacríticos das chaves e extrair o objeto correto de forma tolerante a falhas. Além disso, adicionamos uma regra explícita forçando o nome da picareta a começar com a palavra "Picareta".

---

### Prompt-Chave 3: Isolamento da Lógica Pura do Jogo e Testes Unitários
* **O que foi pedido:**  
  *"Separe toda a regra matemática do jogo (custos de upgrade, multiplicadores de buff, mineração por clique e produção ociosa) em um arquivo `game-logic.js` sem nenhuma dependência de DOM, permitindo que a lógica seja testada tanto no navegador quanto via Node.js."*
* **O que a IA gerou:**  
  Módulo no formato UMD exportando as funções puras de estado (`criarEstado`, `minerar`, `tick`, `comprarPicareta`, `coletarBuff`, `verificarArtefatos`).
* **O que o grupo precisou ajustar/corrigir:**  
  No cálculo do loop ocioso (`tick`), a IA não havia previsto que o jogador poderia alternar de aba no navegador, o que poderia gerar saltos temporais gigantescos ao retornar. Limitamos o `dtMs` máximo a 5000ms por frame para preservar a consistência da física do jogo. Criamos 7 testes unitários automatizados em `tests/test_game_logic.js` executados com `node --test`.

---

### Prompt-Chave 4: Mecânica de Spawning e Coleta de Buffs
* **O que foi pedido:**  
  *"Crie um elemento consumível que surja flutuando na tela em posições aleatórias após um intervalo de 18 a 35 segundos. Ao clicar nele, o jogador ativa o buff de velocidade gerado pela IA com efeito visual e sonoro."*
* **O que a IA gerou:**  
  Código de temporizador disparando o spawn de um botão `#buff-drop` com posições `top` e `left` em porcentagem.
* **O que o grupo precisou ajustar/corrigir:**  
  A IA fazia a requisição ao Llama 3.2 no exato momento em que o buff surgia, causando um atraso de alguns segundos antes que o jogador pudesse ver o item. Otimizamos a arquitetura: a lore do próximo buff é solicitada à IA em segundo plano (*pre-fetching*). Assim, quando o consumível surge na tela, sua lore já está pronta para consumo instantâneo. Adicionamos animação de piscar nos últimos 2,5 segundos antes do item desaparecer.

---

### Prompt-Chave 5: Resiliência em Tempo Real e Fallback Gracioso
* **O que foi pedido:**  
  *"Implemente um fallback procedural tanto no back-end quanto no front-end para que o jogo continue funcionando perfeitamente caso o Ollama caia durante a apresentação do trabalho. A interface deve sinalizar com clareza a origem dos textos."*
* **O que a IA gerou:**  
  Módulo `fallback_provider.py` no Python gerando nomes e descrições temáticas e marcação `fonte: "fallback"`.
* **O que o grupo precisou ajustar/corrigir:**  
  Na interface, criamos tags visuais distintas: `LORE GERADA POR LLAMA 3.2` com fundo branco sólido quando a IA responde, e `FALLBACK (OLLAMA OFFLINE)` com borda tracejada quando o gerador de contingência é acionado. Adicionamos também um indicador em tempo real no topo da tela (`● IA: LLAMA3.2 ONLINE`) e telemetria no console detalhando a latência de cada requisição.

---

### Explicação do Funcionamento do Código Principal (Texto Próprio do Grupo)

> "A arquitetura do Contextual Clicker foi desenhada sob o princípio do **desacoplamento total de responsabilidades**. No front-end, a lógica de negócio do jogo (`game-logic.js`) é uma máquina de estados pura e imutável por funções, onde o tempo é passado explicitamente como argumento, eliminando efeitos colaterais e permitindo testes unitários automatizados. O controlador (`main.js`) gerencia o loop de animação via `requestAnimationFrame` a 60 FPS, calculando a produção contínua de pedras por segundo e sincronizando o estado com o DOM.
>
> Quando o jogador submete um tema no menu, o front-end dispara uma chamada `POST /v1/ia-generativa/texto` enviando o tema e a chave de segurança no cabeçalho `X-API-Key`. No back-end, o FastAPI intercepta a requisição, valida a credencial via dependência de segurança e repassa a carga para o `IATextoProvider`. O provider monta o prompt estrito derivado da CP4, consulta o Ollama na porta local 11434 com `format="json"`, sanitiza eventuais alucinações de formato e devolve um JSON padronizado com tempo de resposta e identificação do modelo.
>
> Caso ocorra falha de rede ou o modelo demore mais de 60 segundos, o provider aciona o fallback procedural sem derrubar a requisição, garantindo que o jogador nunca presencie telas travadas ou falhas de execução. Toda a progressão do jogo é persistida em `localStorage`, permitindo fechar a aba e continuar a escavação de onde parou."

---

# 5. Etapa 4 — Diário de Mudanças em Relação à CP4

| Item Alterado | O que estava na CP4 | O que foi implementado | Justificativa Técnica Real |
| :--- | :--- | :--- | :--- |
| **Arquitetura de Chamada da IA** | Requisição direta via `fetch()` do front-end para a porta 11434 do Ollama (`localhost`). | Requisição do jogo para back-end próprio em **FastAPI** (`/v1/ia-generativa/texto`), que por sua vez se comunica com o Ollama internamente. | Elimina problemas de bloqueio de **CORS** nos navegadores modernos, protege chaves de API em variáveis de ambiente (`.env`), isola o provider do motor de IA e cumpre os requisitos de arquitetura da disciplina de Front-End. |
| **Geração de Conteúdo da Picareta** | Geração única da picareta inicial no momento do menu. | Geração dinâmica de **7 níveis de picaretas**, com nomes e descrições adaptados ao nível do upgrade. | Concede profundidade real de progressão (requisito de nota 10), transformando a ferramenta inicial em uma sequência de melhorias visíveis durante a gameplay. |
| **Geração do Museu e Artefatos** | 4 artefatos com textos pré-moldados no mockup estático. | **8 artefatos colecionáveis** gerados dinamicamente pelo Llama 3.2 em 5 níveis de raridade (comum a lendário). | O mockup continha apenas 4 cartões com texto de exemplo; expandimos para 8 artefatos desbloqueados por marcos de mineração contínua, criando uma curva de progressão completa com começo, meio e fim. |
| **Condição de Fim de Sessão** | Não havia tela de vitória nem encerramento de partida especificado. | **Tela de Vitória** com estatísticas da sessão e **Epílogo gerado por IA** ao completar os 8 artefatos do museu. | Requisito eliminatório obrigatório da CP5: o jogo precisa ter começo, meio e fim claramente definidos. |
| **Sprites e Imagens** | Geração offline no Bing Image Creator / DALL-E 3 inserida como imagem estática. | Conjunto de **16 assets gerados em JPG** via Bing/DALL-E 3 (`picareta-1` a `7`, `buff`, `artefato-1` a `8`) integrados via manifesto, com filtro CSS dinâmico (`invert(1) grayscale(1) contrast(5) mix-blend-mode: screen`) para converter fundo branco em transparência escura 1-bit. Os prompts da IA foram amarrados aos arquétipos visuais de cada arte. | Garante fidelidade visual completa com a estética monocromática do jogo sem bordas brancas indesejadas, unindo a geração de imagem (DALL-E 3) com a lore textual (Llama 3.2) de forma 100% coesa e documentada. |

---

# 6. Etapa 5 — Checklist de Testes Manuais

| ID | Mecânica / Cenário Testado | Procedimento Realizado | Resultado Esperado | Resultado Obtido | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **T01** | **Validação de Entrada de Tema** | Deixar campo de tema vazio no menu e clicar em Iniciar. | Campo pisca com animação de shake e exibe mensagem de erro; partida não inicia. | Input sacudiu e exibiu `> Digite um tema para gerar o universo.` | ✅ APROVADO |
| **T02** | **Inicialização de Partida & IA** | Digitar "Cozinha" e clicar em Iniciar Escavação. | Transição para a tela de mina, contador em 0 e requisição `POST /v1/ia-generativa/texto` enviada. | Jogo abriu, status mudou para `LORE GERADA POR LLAMA 3.2` em ~7s. | ✅ APROVADO |
| **T03** | **Mineração por Clique** | Clicar com o mouse no planeta ou pressionar a barra de espaço. | Planeta sofre pulso de escala e rotação, gera partículas e soma pedras ao contador. | Animação de impacto 1-bit disparada, som 8-bit executado e pedras incrementadas. | ✅ APROVADO |
| **T04** | **Upgrade de Picareta** | Acumular 15 pedras e clicar em `[ FORJAR PICARETA NV.2 ]`. | Deduz 15 pedras, eleva poder de clique para +2, inicia produção ociosa e solicita nova lore à IA. | Barra de progresso encheu, som de compra tocou e nova lore de Nv.2 foi exibida. | ✅ APROVADO |
| **T05** | **Buff Consumível Flutuante** | Aguardar spawn do buff na tela e clicar sobre ele. | Buff ativa temporariamente (30s), duplica dano de clique e exibe contador regressivo. | Badge de multiplicador ativou, planeta ficou com brilho pulsante e tempo correu normalmente. | ✅ APROVADO |
| **T06** | **Desbloqueio de Artefato no Museu** | Atingir marco de 20 pedras totais mineradas. | Notificação Toast de artefato encontrado; cartão no museu sai de bloqueado para catalogando. | Notificação exibida com som especial; lore do artefato #01 preenchida pelo Llama. | ✅ APROVADO |
| **T07** | **Persistência de Save** | Fechar a aba do navegador no nível 3 e reabrir. | Botão `[ CONTINUAR ]` habilitado no menu restaurando pedras, upgrades e artefatos. | Jogo retomou exatamente do estado anterior sem perda de progresso. | ✅ APROVADO |
| **T08** | **Autenticação da API (X-API-Key)** | Enviar requisição sem header `X-API-Key` no Swagger ou painel. | Servidor retorna código HTTP `401 Unauthorized`. | Resposta `401` com `detail: "API Key ausente ou inválida."` confirmada. | ✅ APROVADO |
| **T09** | **Fallback com Ollama Desligado** | Parar o serviço do Ollama e iniciar partida. | Jogo não trava; exibe lore temática gerada pelo fallback com tag `FALLBACK`. | Jogo iniciou instantaneamente; tag `FALLBACK (OLLAMA OFFLINE)` exibida. | ✅ APROVADO |
| **T10** | **Condição de Vitória & Epílogo** | Completar os 8 artefatos do museu (ou via modo `?demo=1`). | Transição para tela de vitória; epílogo final narrado pelo Llama 3.2 com estatísticas. | Tela de vitória ativada, som triunfal tocado e epílogo exibido com efeito de digitação. | ✅ APROVADO |

---

# 7. Roteiro Sugerido para o Vídeo de Demonstração (2 a 5 Minutos)

Para a gravação do vídeo exigido pelos professores, siga esta sequência cronológica:

* **0:00 - 0:45 | Apresentação e Arquitetura:**
  * Apresente os integrantes do grupo e a proposta do *Contextual Clicker*.
  * Mostre o terminal rodando o FastAPI (`uvicorn app.main:app --reload`) e o Ollama com `llama3.2`.
  * Abra o Swagger em `http://localhost:8000/docs` mostrando o endpoint `POST /v1/ia-generativa/texto` protegido por `X-API-Key`.
  * **Ponto-Chave para Front-End:** Explique que o back-end cobre a modalidade de **Texto** em tempo real via API (conforme a tabela de endpoints da disciplina), enquanto as **Imagens** foram pré-geradas offline como assets estáticos na pré-produção.
* **0:45 - 1:45 | Início da Partida & Geração em Tempo Real:**
  * Abra o jogo no navegador (`http://localhost:8000/jogo/`).
  * Digite um tema no menu (ex: "Escola", "Cozinha", "Espaço") e inicie a escavação.
  * Mostre a lore da picareta e do buff sendo gerada pelo Llama 3.2, destacando a tag `LORE GERADA POR LLAMA 3.2` e o log HTTP 200 no terminal.
  * **Ponto-Chave para NLP:** Aponte para a imagem da picareta e explique que foram geradas 16 artes em pixel art no Bing Image Creator (DALL-E 3) com prompt 1-bit, recortadas e tratadas via CSS (`invert(1)`, `contrast(5)` e `mix-blend-mode: screen`), e que a lore gerada pelo Llama 3.2 segue estritamente o arquétipo visual da imagem e o tema escolhido.
* **1:45 - 2:45 | Gameplay das Mecânicas Centrais:**
  * Mostre a mineração por clique no planeta e pelo teclado (barra de espaço).
  * Compre o upgrade da Picareta Nível 2 (tecla `U`), evidenciando o aumento do dano e a produção ociosa contínua.
  * Clique no buff consumível flutuante que surgiu na tela, demonstrando a multiplicação de velocidade e o timer regressivo.
* **2:45 - 3:45 | Museu de Artefatos & Desbloqueio:**
  * Acesse a tela do Museu (tecla `M`), demonstrando os 8 cartões com suas respectivas imagens e lores geradas pela IA.
  * Retorne à mina e mostre a notificação Toast de novos artefatos desenterrados.
* **3:45 - 4:30 | Painel de Testes, Fallback e Conclusão:**
  * Abra a página do Painel de Testes (`http://localhost:8000/painel`) para demonstrar o consumo isolado da API com medição de latência e teste de erro 401.
  * Mostre os testes automatizados rodando no terminal (`pytest` com 16 testes e `node --test` com 7 testes).
  * Conclua com a tela de vitória e o epílogo gerado pela IA.
