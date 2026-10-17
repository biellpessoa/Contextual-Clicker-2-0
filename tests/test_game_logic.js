/**
 * Testes unitários das mecânicas centrais do Contextual Clicker.
 * Executar com: node --test tests/test_game_logic.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const GL = require('../frontend/js/game-logic.js');

test('Criação de estado inicial com tema normalizado', () => {
  const agora = 100000;
  const estado = GL.criarEstado('  cozinha italiana  ', agora);
  assert.equal(estado.tema, 'COZINHA ITALIANA');
  assert.equal(estado.pedras, 0);
  assert.equal(estado.totalMinerado, 0);
  assert.equal(estado.cliques, 0);
  assert.equal(estado.nivelPicareta, 1);
  assert.equal(estado.artefatos.length, 0);
  assert.equal(estado.finalizado, false);
});

test('Mecânica 1: Mineração por clique acumula pedras e cliques', () => {
  const agora = 100000;
  const estado = GL.criarEstado('Espaço', agora);
  const ganho1 = GL.minerar(estado, agora);
  assert.equal(ganho1, 1); // Picareta nível 1 tem poderClique = 1
  assert.equal(estado.pedras, 1);
  assert.equal(estado.totalMinerado, 1);
  assert.equal(estado.cliques, 1);

  const ganho2 = GL.minerar(estado, agora);
  assert.equal(ganho2, 1);
  assert.equal(estado.pedras, 2);
  assert.equal(estado.cliques, 2);
});

test('Mecânica 2: Aquisição e progressão de picaretas (upgrades)', () => {
  const agora = 100000;
  const estado = GL.criarEstado('Cozinha', agora);
  
  // Picareta 2 custa 15 pedras
  assert.equal(GL.podeComprarPicareta(estado), false);
  assert.equal(GL.comprarPicareta(estado), null);

  // Adicionar 15 pedras manualmente
  estado.pedras = 15;
  assert.equal(GL.podeComprarPicareta(estado), true);

  const comprada = GL.comprarPicareta(estado);
  assert.ok(comprada);
  assert.equal(comprada.nivel, 2);
  assert.equal(estado.nivelPicareta, 2);
  assert.equal(estado.pedras, 0); // Gastou 15
  assert.equal(GL.poderClique(estado, agora), 2); // Poder do nível 2
  assert.equal(GL.porSegundo(estado, agora), 0.5); // Produção ociosa do nível 2
});

test('Mecânica 3: Buffs consumíveis multiplicam a velocidade de mineração temporariamente', () => {
  const agora = 100000;
  const estado = GL.criarEstado('Cozinha', agora);
  
  // Prepara lore do buff (2x por 30s)
  estado.buffLore = {
    nome: 'Café Quente',
    descricao: 'Dá energia épica',
    fonte: 'llama3.2',
    multiplicador: 2,
    duracao: 30
  };

  assert.equal(GL.buffEstaAtivo(estado, agora), false);
  assert.equal(GL.multiplicadorAtual(estado, agora), 1);

  // Coleta o buff
  const buffAtivado = GL.coletarBuff(estado, agora);
  assert.ok(buffAtivado);
  assert.equal(estado.buffAtivo.nome, 'Café Quente');
  assert.equal(GL.buffEstaAtivo(estado, agora), true);
  assert.equal(GL.multiplicadorAtual(estado, agora), 2);
  assert.equal(GL.poderClique(estado, agora), 2); // 1 base * 2x buff

  // Avança o tempo dentro da duração (15 segundos depois)
  const duranteBuff = agora + 15000;
  assert.equal(GL.buffEstaAtivo(estado, duranteBuff), true);
  assert.equal(GL.tempoRestanteBuff(estado, duranteBuff), 15000);

  // Avança o tempo além da duração (31 segundos depois)
  const aposBuff = agora + 31000;
  assert.equal(GL.buffEstaAtivo(estado, aposBuff), false);
  assert.equal(GL.multiplicadorAtual(estado, aposBuff), 1);
});

test('Produção ociosa (Tick idle) gera pedras proporcionalmente ao tempo', () => {
  const agora = 100000;
  const estado = GL.criarEstado('Cozinha', agora);
  estado.nivelPicareta = 3; // Picareta nível 3 produz 2 pedras/segundo
  
  // 3 segundos decorridos (3000ms)
  const ganho = GL.tick(estado, 3000, agora + 3000);
  assert.equal(ganho, 6); // 2 * 3 = 6 pedras
  assert.equal(estado.pedras, 6);
  assert.equal(estado.totalMinerado, 6);
});

test('Objetivo e Museu: Desbloqueio progressivo de artefatos por pedras mineradas', () => {
  const agora = 100000;
  const estado = GL.criarEstado('Cozinha', agora);
  
  // 19 pedras mineradas (primeiro artefato requer 20)
  estado.totalMinerado = 19;
  assert.deepEqual(GL.verificarArtefatos(estado), []);
  assert.equal(GL.venceu(estado), false);

  // Atingiu 20 pedras
  estado.totalMinerado = 20;
  const novos1 = GL.verificarArtefatos(estado);
  assert.deepEqual(novos1, [0]);
  assert.equal(estado.artefatos.length, 1);
  assert.equal(estado.artefatos[0].indice, 0);

  // Não duplica ao verificar novamente
  assert.deepEqual(GL.verificarArtefatos(estado), []);

  // Simula minerar até o último artefato (3500 pedras)
  estado.totalMinerado = 3500;
  const restantes = GL.verificarArtefatos(estado);
  assert.equal(restantes.length, 7); // 8 no total
  assert.equal(estado.artefatos.length, 8);
  assert.equal(GL.venceu(estado), true);
});

test('Serialização e Desserialização preservam o progresso do jogo', () => {
  const agora = 100000;
  const estado = GL.criarEstado('Cozinha', agora);
  estado.pedras = 42;
  estado.totalMinerado = 150;
  estado.nivelPicareta = 3;
  estado.artefatos = [{ indice: 0, raridade: 1, nome: 'Garfo', descricao: 'Antigo', fonte: 'llama3.2' }];

  const json = GL.serializar(estado);
  const restaurado = GL.desserializar(json);
  assert.ok(restaurado);
  assert.equal(restaurado.pedras, 42);
  assert.equal(restaurado.totalMinerado, 150);
  assert.equal(restaurado.nivelPicareta, 3);
  assert.equal(restaurado.artefatos[0].nome, 'Garfo');
});
