/**
 * SUSTEN – Google Apps Script Backend
 * Sistema de Gestão de Sustentabilidade e Engajamento Paroquial
 *
 * CONFIGURAÇÃO:
 * 1. Crie um Google Sheets com as abas listadas em SHEETS.
 * 2. Copie este código em Extensões → Apps Script.
 * 3. Implante como Web App (acesso: Qualquer pessoa / organização).
 * 4. Cole a URL gerada nas Configurações do PWA.
 */

/* ── IDs das Planilhas (abas) ─────────────────────────────── */
const SHEETS = {
  FINANCEIRO:  'Financeiro',
  LANCAMENTOS: 'Lançamentos',
  METAS:       'Metas',
  VOLUNTARIOS: 'Voluntários',
  MEMBROS:     'Membros',
  DIZIMOS:     'Dízimos',
  CONFIG:      'Configurações',
  LOG:         'Log'
};

/* ── Acesso à planilha ativa ──────────────────────────────── */
const SS  = () => SpreadsheetApp.getActiveSpreadsheet();
const SH  = (nome) => SS().getSheetByName(nome) || SS().insertSheet(nome);

/* ══════════════════════════════════════════════════════════
   ENTRY POINTS (Web App)
   ══════════════════════════════════════════════════════════ */

/**
 * GET – Leitura de dados
 */
function doGet(e) {
  const action = e.parameter.action || '';
  let resultado;

  try {
    switch (action) {
      case 'getFinanceiro':   resultado = getFinanceiro();   break;
      case 'getLancamentos':  resultado = getLancamentos();  break;
      case 'getMetas':        resultado = getMetas();        break;
      case 'getVoluntarios':  resultado = getVoluntarios();  break;
      case 'getMembros':      resultado = getMembros();      break;
      case 'getConfig':       resultado = getConfig();       break;
      case 'getRelatorio':    resultado = getRelatorio(e.parameter); break;
      default:
        resultado = { erro: 'Ação desconhecida: ' + action };
    }
  } catch (err) {
    resultado = { erro: err.message };
    registrarLog('ERRO GET', action, err.message);
  }

  return resposta(resultado);
}

/**
 * POST – Escrita de dados
 */
function doPost(e) {
  const payload = JSON.parse(e.postData.contents || '{}');
  const action  = payload.action || '';
  let resultado;

  try {
    switch (action) {
      case 'addLancamento':     resultado = addLancamento(payload);    break;
      case 'deleteLancamento':  resultado = deleteLancamento(payload.id); break;
      case 'addMeta':           resultado = addMeta(payload);          break;
      case 'updateMeta':        resultado = updateMeta(payload);       break;
      case 'deleteMeta':        resultado = deleteMeta(payload.id);    break;
      case 'addVoluntario':     resultado = addVoluntario(payload);    break;
      case 'updateVoluntario':  resultado = updateVoluntario(payload); break;
      case 'deleteVoluntario':  resultado = deleteVoluntario(payload.id); break;
      case 'addMembro':         resultado = addMembro(payload);        break;
      case 'updateMembro':      resultado = updateMembro(payload);     break;
      case 'deleteMembro':      resultado = deleteMembro(payload.id);  break;
      case 'registrarDizimo':   resultado = registrarDizimo(payload);  break;
      case 'saveConfig':        resultado = saveConfig(payload);       break;
      default:
        resultado = { erro: 'Ação desconhecida: ' + action };
    }
  } catch (err) {
    resultado = { erro: err.message };
    registrarLog('ERRO POST', action, err.message);
  }

  return resposta(resultado);
}

/* ── Resposta JSON com CORS ───────────────────────────────── */
function resposta(dados) {
  return ContentService
    .createTextOutput(JSON.stringify(dados))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ══════════════════════════════════════════════════════════
   FINANCEIRO
   ══════════════════════════════════════════════════════════ */

function getFinanceiro() {
  const lancamentos = getLancamentos();
  const agora = new Date();
  const mes = agora.getMonth() + 1;
  const ano = agora.getFullYear();

  const doMes  = lancamentos.filter(l => {
    const d = new Date(l.data);
    return d.getMonth() + 1 === mes && d.getFullYear() === ano;
  });
  const doAno  = lancamentos.filter(l => new Date(l.data).getFullYear() === ano);

  const somarTipo = (arr, tipo) => arr.filter(l => l.tipo === tipo).reduce((s, l) => s + Number(l.valor), 0);

  const receita_mes  = somarTipo(doMes, 'receita');
  const despesa_mes  = somarTipo(doMes, 'despesa');
  const receita_ano  = somarTipo(doAno, 'receita');
  const despesa_ano  = somarTipo(doAno, 'despesa');

  // Histórico dos últimos 6 meses
  const historico_meses = [];
  for (let i = 5; i >= 0; i--) {
    const d    = new Date(ano, mes - 1 - i, 1);
    const m    = d.getMonth() + 1;
    const a    = d.getFullYear();
    const mNome = d.toLocaleString('pt-BR', { month: 'short' });
    const do_mes = lancamentos.filter(l => {
      const ld = new Date(l.data);
      return ld.getMonth() + 1 === m && ld.getFullYear() === a;
    });
    historico_meses.push({
      mes:     mNome.charAt(0).toUpperCase() + mNome.slice(1, 3),
      receita: somarTipo(do_mes, 'receita'),
      despesa: somarTipo(do_mes, 'despesa')
    });
  }

  // Distribuição de despesas por categoria
  const despesas = doMes.filter(l => l.tipo === 'despesa');
  const categorias = {};
  despesas.forEach(l => {
    categorias[l.categoria] = (categorias[l.categoria] || 0) + Number(l.valor);
  });
  const cores = ['#6c3fc5','#f5a623','#27ae60','#2980b9','#e74c3c','#9b59b6'];
  const distribuicao = Object.entries(categorias).map(([cat, val], i) => ({
    categoria: cat, valor: val, cor: cores[i % cores.length]
  }));

  const membros         = getMembros();
  const dizimistas_ativos = membros.filter(m => m.categoria === 'Dizimista' && m.status === 'ativo').length;
  const config          = getConfig();

  return {
    receita_mes, despesa_mes,
    saldo_mes:    receita_mes - despesa_mes,
    receita_ano, despesa_ano,
    saldo_ano:    receita_ano - despesa_ano,
    dizimistas_ativos,
    meta_mensal:  Number(config.meta_mensal || 15000),
    historico_meses,
    distribuicao
  };
}

/* ══════════════════════════════════════════════════════════
   LANÇAMENTOS
   ══════════════════════════════════════════════════════════ */

function getLancamentos() {
  const sh  = SH(SHEETS.LANCAMENTOS);
  const rows = sh.getDataRange().getValues();
  if (rows.length <= 1) return [];

  const headers = rows[0];
  return rows.slice(1).map((row, i) => {
    const obj = {};
    headers.forEach((h, j) => { obj[h] = row[j]; });
    obj.id  = obj.id  || i + 1;
    obj.data = obj.data instanceof Date ? Utilities.formatDate(obj.data, Session.getScriptTimeZone(), 'yyyy-MM-dd') : obj.data;
    return obj;
  }).filter(r => r.descricao).reverse();
}

function addLancamento(data) {
  _garantirCabecalho(SHEETS.LANCAMENTOS,
    ['id','data','descricao','tipo','valor','categoria','responsavel']);

  const sh  = SH(SHEETS.LANCAMENTOS);
  const id  = Date.now();
  sh.appendRow([id, data.data, data.descricao, data.tipo,
                Number(data.valor), data.categoria, data.responsavel || '']);
  registrarLog('ADD', 'Lançamento', JSON.stringify(data));
  return { ok: true, id };
}

function deleteLancamento(id) {
  return _deletarPorId(SHEETS.LANCAMENTOS, id);
}

/* ══════════════════════════════════════════════════════════
   METAS
   ══════════════════════════════════════════════════════════ */

function getMetas() {
  return _lerAba(SHEETS.METAS);
}

function addMeta(data) {
  _garantirCabecalho(SHEETS.METAS,
    ['id','emoji','titulo','descricao','meta','arrecadado','status','prazo']);
  const sh = SH(SHEETS.METAS);
  const id = Date.now();
  sh.appendRow([id, data.emoji, data.titulo, data.descricao,
                Number(data.meta), Number(data.arrecadado || 0),
                data.status, data.prazo]);
  return { ok: true, id };
}

function updateMeta(data) {
  return _atualizarPorId(SHEETS.METAS, data);
}

function deleteMeta(id) {
  return _deletarPorId(SHEETS.METAS, id);
}

/* ══════════════════════════════════════════════════════════
   VOLUNTÁRIOS
   ══════════════════════════════════════════════════════════ */

function getVoluntarios() {
  const rows = _lerAba(SHEETS.VOLUNTARIOS);
  return rows.map(r => ({ ...r, tags: r.tags ? String(r.tags).split(',').map(t => t.trim()) : [] }));
}

function addVoluntario(data) {
  _garantirCabecalho(SHEETS.VOLUNTARIOS,
    ['id','nome','profissao','tags','telefone','disponibilidade']);
  const sh = SH(SHEETS.VOLUNTARIOS);
  const id = Date.now();
  sh.appendRow([id, data.nome, data.profissao,
                Array.isArray(data.tags) ? data.tags.join(',') : data.tags,
                data.telefone, data.disponibilidade]);
  return { ok: true, id };
}

function updateVoluntario(data) {
  return _atualizarPorId(SHEETS.VOLUNTARIOS, data);
}

function deleteVoluntario(id) {
  return _deletarPorId(SHEETS.VOLUNTARIOS, id);
}

/* ══════════════════════════════════════════════════════════
   MEMBROS / DIZIMISTAS
   ══════════════════════════════════════════════════════════ */

function getMembros() {
  return _lerAba(SHEETS.MEMBROS);
}

function addMembro(data) {
  _garantirCabecalho(SHEETS.MEMBROS,
    ['id','nome','telefone','categoria','status','ultimoDizimo','valor']);
  const sh = SH(SHEETS.MEMBROS);
  const id = Date.now();
  sh.appendRow([id, data.nome, data.telefone, data.categoria,
                data.status || 'ativo', '—', 0]);
  return { ok: true, id };
}

function updateMembro(data) {
  return _atualizarPorId(SHEETS.MEMBROS, data);
}

function deleteMembro(id) {
  return _deletarPorId(SHEETS.MEMBROS, id);
}

function registrarDizimo(payload) {
  const { nome, valor, data } = payload.data || payload;
  _garantirCabecalho(SHEETS.DIZIMOS,
    ['id','data','nome','valor','observacao']);
  const sh = SH(SHEETS.DIZIMOS);
  sh.appendRow([Date.now(), data, nome, Number(valor), payload.obs || '']);

  // Atualizar linha do membro correspondente
  const membros_sh = SH(SHEETS.MEMBROS);
  const rows = membros_sh.getDataRange().getValues();
  const headers = rows[0];
  const nomeIdx = headers.indexOf('nome');
  const ultIdx  = headers.indexOf('ultimoDizimo');
  const valIdx  = headers.indexOf('valor');

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][nomeIdx]).toLowerCase() === String(nome).toLowerCase()) {
      if (ultIdx !== -1) membros_sh.getRange(i + 1, ultIdx + 1).setValue(data);
      if (valIdx !== -1) membros_sh.getRange(i + 1, valIdx + 1).setValue(Number(valor));
      break;
    }
  }

  addLancamento({ data, descricao: `Dízimo – ${nome}`, tipo: 'receita', valor: Number(valor), categoria: 'Dízimo', responsavel: nome });
  return { ok: true };
}

/* ══════════════════════════════════════════════════════════
   CONFIGURAÇÕES
   ══════════════════════════════════════════════════════════ */

function getConfig() {
  const sh = SH(SHEETS.CONFIG);
  const rows = sh.getDataRange().getValues();
  const config = {};
  rows.forEach(([chave, valor]) => { if (chave) config[chave] = valor; });
  return config;
}

function saveConfig(data) {
  const sh = SH(SHEETS.CONFIG);
  sh.clearContents();
  Object.entries(data).forEach(([k, v]) => {
    if (k !== 'action') sh.appendRow([k, v]);
  });
  return { ok: true };
}

/* ══════════════════════════════════════════════════════════
   RELATÓRIOS
   ══════════════════════════════════════════════════════════ */

function getRelatorio(params) {
  const { tipo, mes, ano } = params;
  const lancamentos = getLancamentos();
  let filtered = lancamentos;

  if (mes) filtered = filtered.filter(l => new Date(l.data).getMonth() + 1 === Number(mes));
  if (ano) filtered = filtered.filter(l => new Date(l.data).getFullYear() === Number(ano));

  switch (tipo) {
    case 'resumo': {
      const receitas = filtered.filter(l => l.tipo === 'receita').reduce((s, l) => s + Number(l.valor), 0);
      const despesas = filtered.filter(l => l.tipo === 'despesa').reduce((s, l) => s + Number(l.valor), 0);
      return { receitas, despesas, saldo: receitas - despesas, total: filtered.length };
    }
    default:
      return filtered;
  }
}

/* ══════════════════════════════════════════════════════════
   UTILITÁRIOS INTERNOS
   ══════════════════════════════════════════════════════════ */

function _lerAba(nomeAba) {
  const sh   = SH(nomeAba);
  const rows = sh.getDataRange().getValues();
  if (rows.length <= 1) return [];

  const headers = rows[0];
  return rows.slice(1).map((row, i) => {
    const obj = {};
    headers.forEach((h, j) => {
      obj[h] = row[j] instanceof Date
        ? Utilities.formatDate(row[j], Session.getScriptTimeZone(), 'yyyy-MM-dd')
        : row[j];
    });
    obj.id = obj.id || i + 1;
    return obj;
  }).filter(r => r[headers[1]] !== '' && r[headers[1]] !== undefined);
}

function _garantirCabecalho(nomeAba, cabecalho) {
  const sh   = SH(nomeAba);
  const rows = sh.getDataRange().getValues();
  if (rows.length === 0 || rows[0].join(',') !== cabecalho.join(',')) {
    if (rows.length === 0) sh.appendRow(cabecalho);
    else sh.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]);
  }
}

function _deletarPorId(nomeAba, id) {
  const sh   = SH(nomeAba);
  const rows = sh.getDataRange().getValues();
  const headers = rows[0];
  const idIdx   = headers.indexOf('id');

  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][idIdx]) === String(id)) {
      sh.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: false, erro: 'Registro não encontrado' };
}

function _atualizarPorId(nomeAba, data) {
  const sh   = SH(nomeAba);
  const rows = sh.getDataRange().getValues();
  const headers = rows[0];
  const idIdx   = headers.indexOf('id');

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idIdx]) === String(data.id)) {
      const novaLinha = headers.map(h => data[h] !== undefined ? data[h] : rows[i][headers.indexOf(h)]);
      sh.getRange(i + 1, 1, 1, headers.length).setValues([novaLinha]);
      return { ok: true };
    }
  }
  return { ok: false, erro: 'Registro não encontrado' };
}

function registrarLog(tipo, acao, detalhes) {
  try {
    const sh = SH(SHEETS.LOG);
    if (sh.getLastRow() === 0) sh.appendRow(['timestamp','tipo','acao','detalhes','usuario']);
    sh.appendRow([
      new Date().toISOString(), tipo, acao,
      String(detalhes).substring(0, 500),
      Session.getEffectiveUser().getEmail()
    ]);
  } catch (_) { /* ignora erros de log */ }
}

/* ══════════════════════════════════════════════════════════
   TRIGGERS AUTOMÁTICOS
   ══════════════════════════════════════════════════════════ */

/**
 * Instala os gatilhos automáticos.
 * Execute esta função UMA VEZ após implantar o Web App.
 */
function instalarGatilhos() {
  // Trigger diário às 8h para verificar dizimistas inativos
  ScriptApp.newTrigger('verificarDizimistasInativos')
    .timeBased().everyDays(7).atHour(8).create();
  Logger.log('Gatilhos instalados com sucesso!');
}

/**
 * Verificação semanal de dizimistas inativos (mais de 60 dias sem dízimo).
 * Os resultados ficam no Log para o coordenador agir.
 */
function verificarDizimistasInativos() {
  const membros = getMembros();
  const agora   = new Date();
  const inativos = membros.filter(m => {
    if (m.status !== 'ativo' || m.categoria !== 'Dizimista') return false;
    if (!m.ultimoDizimo || m.ultimoDizimo === '—') return true;
    const diff = (agora - new Date(m.ultimoDizimo)) / (1000 * 60 * 60 * 24);
    return diff > 60;
  });

  if (inativos.length > 0) {
    registrarLog('VERIFICAÇÃO', 'Dizimistas Inativos',
      `${inativos.length} dizimista(s) sem dízimo há mais de 60 dias: ${inativos.map(m => m.nome).join(', ')}`);
  }
  return { inativos: inativos.length, membros: inativos.map(m => m.nome) };
}
