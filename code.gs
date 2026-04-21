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
  USUARIOS:    'Usuários',
  RECADOS:     'Recados',
  CONFIG:      'Configurações',
  LOG:         'Log',
  // Novas abas pastorais (Doc. 106 CNBB / cân. 537, 1283, 1284, 1287)
  FUNDO_CARITATIVO:      'Fundo_Caritativo',       // Dimensão Caritativa
  METAS_EVANGELIZACAO:   'Metas_Evangelizacao',    // Dimensão Missionária
  CONSELHO_ECONOMICO:    'Conselho_Economico',     // Governança / CAE
  MANUTENCAO_PATRIMONIAL:'Manutencao_Patrimonial', // Cuidado da Casa Comum
  INVENTARIO:            'Inventario',             // Inventário de bens
  PRESTACAO_CONTAS:      'Prestacao_Contas'        // Balancetes publicados
};

/* ── Categorias de partilha "ad extra" (Dimensão Missionária) ── */
const CATEGORIAS_PARTILHA_AD_EXTRA = [
  'Partilha Diocesana',
  'Campanha da Evangelização',
  'Campanha da Fraternidade',
  'Campanha Missionária',
  'Óbolo de São Pedro',
  'Santa Infância'
];

const MAX_NOVIDADES_PAINEL_FIEL = 6;
const PROGRESSO_MANUTENCAO_PADRAO = {
  concluida: 100,
  'em-andamento': 65,
  planejada: 35
};
const ACOES_PERMITIDAS_FIEL = ['getSessaoUsuario', 'getFielPainel', 'getTransparenciaPublica'];
const ACOES_PUBLICAS = ['getTransparenciaPublica', 'getParoquiasFiel', 'getFielPainelPublico', 'loginFiel', 'loginUnificado'];

/* ── Token de segurança (não comite segredos reais neste arquivo) ──
   Valor real deve ser definido em Script Properties (chave: AUTH_TOKEN).
   O fallback abaixo é usado apenas se a propriedade não existir. */
const AUTH_TOKEN_FALLBACK = 'dogmn8w6@2026ceara38918010';
function _tokenEsperado_() {
  try {
    var p = PropertiesService.getScriptProperties().getProperty('AUTH_TOKEN');
    if (p) return String(p);
  } catch (_) {}
  return AUTH_TOKEN_FALLBACK;
}
function _extrairToken_(e, payload) {
  var t = '';
  try {
    if (payload && payload.auth_token) t = String(payload.auth_token);
    if (!t && e && e.parameter && e.parameter.auth_token) t = String(e.parameter.auth_token);
  } catch (_) {}
  return t;
}
function _validarToken_(e, payload) {
  return _extrairToken_(e, payload) === _tokenEsperado_();
}
const CATEGORIA_DIZIMISTA = 'Dizimista';
const CATEGORIA_NAO_DIZIMISTA = 'Não Dizimista';
const MS_POR_DIA = 86400000;

/* ── Acesso à planilha ativa ──────────────────────────────── */
/**
 * ID da planilha Google Sheets utilizada pelo SUSTEN.
 * Permite que este Apps Script rode como projeto autônomo
 * (standalone), abrindo a planilha por ID. Se o script estiver
 * vinculado ("container-bound") à própria planilha, o uso de
 * getActiveSpreadsheet() é preservado como fallback.
 */
const SPREADSHEET_ID = '11iFIwuwR2R0XPiIdnN34FF2HZT7bHIlM3IlXi2NvTMU';

const SS  = () => {
  try {
    const ativo = SpreadsheetApp.getActiveSpreadsheet();
    if (ativo) return ativo;
  } catch (_) { /* script standalone – sem planilha ativa */ }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
};
const SH  = (nome) => SS().getSheetByName(nome) || SS().insertSheet(nome);
let CONTEXTO_USUARIO_ATUAL = null;

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
    // Validação do auth_token para todas as ações (exceto as 100% públicas de leitura pública)
    if (!_validarToken_(e, e.parameter) && action !== 'getTransparenciaPublica') {
      return resposta({ erro: 'Token de autenticação inválido ou ausente.' });
    }
    _prepararContexto('GET', action, e.parameter || {});
    switch (action) {
      case 'getSessaoUsuario': resultado = getSessaoUsuario(); break;
      case 'getFinanceiro':   resultado = getFinanceiro();   break;
      case 'getLancamentos':  resultado = getLancamentos();  break;
      case 'getMetas':        resultado = getMetas();        break;
      case 'getVoluntarios':  resultado = getVoluntarios();  break;
      case 'getMembros':      resultado = getMembros();      break;
      case 'getConfig':       resultado = getConfig();       break;
      case 'getRelatorio':    resultado = getRelatorio(e.parameter); break;
      // Novos endpoints pastorais
      case 'getFundoCaritativo':      resultado = getFundoCaritativo();     break;
      case 'getImpactoCaridade':      resultado = getImpactoCaridade();     break;
      case 'getMetasEvangelizacao':   resultado = getMetasEvangelizacao();  break;
      case 'getTermometroMissionario':resultado = getTermometroMissionario(); break;
      case 'getConselhoEconomico':    resultado = getConselhoEconomico();   break;
      case 'getManutencaoPatrimonial':resultado = getManutencaoPatrimonial(); break;
      case 'getInventario':           resultado = getInventario();          break;
      case 'getPrestacaoContas':      resultado = getPrestacaoContas();     break;
      case 'getRecados':              resultado = getRecados();             break;
      case 'getFielPainel':           resultado = getFielPainel();          break;
      case 'getParoquiasFiel':        resultado = getParoquiasFiel();       break;
      case 'getFielPainelPublico':    resultado = getFielPainelPublico(e.parameter || {}); break;
      // Endpoint público (sem dados sensíveis) – cân. 1287 §2
      case 'getTransparenciaPublica': resultado = getTransparenciaPublica(); break;
      default:
        resultado = { erro: 'Ação desconhecida: ' + action };
    }
  } catch (err) {
    resultado = { erro: err.message };
    registrarLog('ERRO GET', action, err.message);
  } finally {
    _limparContexto();
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
    if (!_validarToken_(e, payload)) {
      return resposta({ erro: 'Token de autenticação inválido ou ausente.' });
    }
    _prepararContexto('POST', action, payload || {});
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
      // Fundo Caritativo (cân. 1267 §3 – ofertas para fim determinado)
      case 'addFundoCaritativo':    resultado = addFundoCaritativo(payload);    break;
      case 'updateFundoCaritativo': resultado = updateFundoCaritativo(payload); break;
      case 'deleteFundoCaritativo': resultado = deleteFundoCaritativo(payload.id); break;
      // Metas Evangelização
      case 'addMetaEvangelizacao':    resultado = addMetaEvangelizacao(payload);    break;
      case 'updateMetaEvangelizacao': resultado = updateMetaEvangelizacao(payload); break;
      case 'deleteMetaEvangelizacao': resultado = deleteMetaEvangelizacao(payload.id); break;
      // Conselho Econômico (cân. 537)
      case 'addConselhoEconomico':    resultado = addConselhoEconomico(payload);    break;
      case 'updateConselhoEconomico': resultado = updateConselhoEconomico(payload); break;
      case 'deleteConselhoEconomico': resultado = deleteConselhoEconomico(payload.id); break;
      // Manutenção Patrimonial (cân. 1284 §2, 1°)
      case 'addManutencaoPatrimonial':    resultado = addManutencaoPatrimonial(payload);    break;
      case 'updateManutencaoPatrimonial': resultado = updateManutencaoPatrimonial(payload); break;
      case 'deleteManutencaoPatrimonial': resultado = deleteManutencaoPatrimonial(payload.id); break;
      // Inventário (cân. 1283 2°)
      case 'addInventario':    resultado = addInventario(payload);    break;
      case 'updateInventario': resultado = updateInventario(payload); break;
      case 'deleteInventario': resultado = deleteInventario(payload.id); break;
      // Prestação de Contas (cân. 1284 §2, 8° / 1287)
      case 'publicarBalancete': resultado = publicarBalancete(payload); break;
      case 'addRecado': resultado = addRecado(payload); break;
      case 'loginFiel': resultado = loginFiel(payload); break;
      case 'loginUnificado': resultado = loginUnificado(payload); break;
      default:
        resultado = { erro: 'Ação desconhecida: ' + action };
    }
  } catch (err) {
    resultado = { erro: err.message };
    registrarLog('ERRO POST', action, err.message);
  } finally {
    _limparContexto();
  }

  return resposta(resultado);
}

/* ── Resposta JSON com CORS ───────────────────────────────── */
function resposta(dados) {
  return ContentService
    .createTextOutput(JSON.stringify(dados))
    .setMimeType(ContentService.MimeType.JSON);
}

function _prepararContexto(metodo, action, payload) {
  const acoesPublicas = ACOES_PUBLICAS;
  if (acoesPublicas.indexOf(action) !== -1) return;

  const contexto = _resolverContextoUsuario(payload);
  if (!contexto.ok) throw new Error(contexto.erro || 'Usuário não autenticado.');
  if (!_temPermissaoParaAcao(contexto.perfil, action, metodo)) {
    throw new Error('Acesso negado para o perfil informado.');
  }
  CONTEXTO_USUARIO_ATUAL = contexto;
}

function _limparContexto() {
  CONTEXTO_USUARIO_ATUAL = null;
}

function _ctx() {
  return CONTEXTO_USUARIO_ATUAL;
}

function _emailLogado() {
  try {
    const active = Session.getActiveUser().getEmail();
    if (active) return String(active).trim().toLowerCase();
  } catch (_) {}
  try {
    const effective = Session.getEffectiveUser().getEmail();
    if (effective) return String(effective).trim().toLowerCase();
  } catch (_) {}
  return '';
}

function _emailDoPayload(payload) {
  if (!payload) return '';
  var e = payload.email || payload.user_email || '';
  return String(e || '').trim().toLowerCase();
}

function _resolverContextoUsuario(payload) {
  const headersUsuarios = ['id','email','nome','paroquia_id','perfil','ativo','telefone'];
  _garantirCabecalho(SHEETS.USUARIOS, headersUsuarios);
  // 1) tenta o e-mail do Google; 2) aceita e-mail do payload (sessão do PWA)
  let email = _emailLogado() || _emailDoPayload(payload);
  if (!email) return { ok: false, erro: 'Não foi possível identificar o e-mail do usuário.' };

  const usuarios = _lerAbaSemFiltro(SHEETS.USUARIOS);
  const usuario = usuarios.find(u => String(u.email || '').trim().toLowerCase() === email);
  if (!usuario) return { ok: false, erro: `Usuário não autorizado: ${email}` };
  if (String(usuario.ativo || 'true').toLowerCase() === 'false') {
    return { ok: false, erro: 'Usuário inativo.' };
  }
  return {
    ok: true,
    email: email,
    nome: usuario.nome || '',
    paroquia_id: String(usuario.paroquia_id || '').trim(),
    perfil: String(usuario.perfil || 'fiel').toLowerCase()
  };
}

function _temPermissaoParaAcao(perfil, action, metodo) {
  const perfilNorm = String(perfil || 'fiel').toLowerCase();
  if (perfilNorm === 'admin' || perfilNorm === 'coordenador' || perfilNorm === 'padre') return true;

  if (metodo === 'POST') return false;
  return ACOES_PERMITIDAS_FIEL.indexOf(action) !== -1;
}

function _deveFiltrarPorParoquia(nomeAba) {
  const semFiltro = [SHEETS.USUARIOS, SHEETS.LOG];
  return semFiltro.indexOf(nomeAba) === -1;
}

function _normalizarIdParoquia(valor) {
  return String(valor || '').trim().toLowerCase();
}

function _linhaDaParoquiaPermitida(row) {
  const ctx = _ctx();
  if (!ctx || !_normalizarIdParoquia(ctx.paroquia_id)) return true;
  return _normalizarIdParoquia(row.paroquia_id) === _normalizarIdParoquia(ctx.paroquia_id);
}

function _enriquecerComParoquia(data) {
  const ctx = _ctx();
  const clone = Object.assign({}, data || {});
  if (ctx && _normalizarIdParoquia(ctx.paroquia_id)) clone.paroquia_id = ctx.paroquia_id;
  return clone;
}

function _mascararMoeda(valor) {
  if (valor === null || valor === undefined || valor === '') return '—';
  return 'R$ •••••';
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
  _garantirCabecalho(SHEETS.LANCAMENTOS,
    ['id','data','descricao','tipo','valor','categoria','responsavel','paroquia_id']);
  const sh  = SH(SHEETS.LANCAMENTOS);
  const rows = sh.getDataRange().getValues();
  if (rows.length <= 1) return [];

  const headers = rows[0];
  const all = rows.slice(1).map((row, i) => {
    const obj = {};
    headers.forEach((h, j) => { obj[h] = row[j]; });
    obj.id  = obj.id  || i + 1;
    obj.data = obj.data instanceof Date ? Utilities.formatDate(obj.data, Session.getScriptTimeZone(), 'yyyy-MM-dd') : obj.data;
    return obj;
  }).filter(r => r.descricao).filter(_linhaDaParoquiaPermitida).reverse();
  return all;
}

function addLancamento(data) {
  _garantirCabecalho(SHEETS.LANCAMENTOS,
    ['id','data','descricao','tipo','valor','categoria','responsavel','paroquia_id']);

  const sh  = SH(SHEETS.LANCAMENTOS);
  const id  = Date.now();
  const linha = _enriquecerComParoquia(data);
  sh.appendRow([id, data.data, data.descricao, data.tipo,
                Number(data.valor), data.categoria, data.responsavel || '', linha.paroquia_id || '']);
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
    ['id','emoji','titulo','descricao','meta','arrecadado','status','prazo','paroquia_id']);
  const sh = SH(SHEETS.METAS);
  const id = Date.now();
  const linha = _enriquecerComParoquia(data);
  sh.appendRow([id, data.emoji, data.titulo, data.descricao,
                Number(data.meta), Number(data.arrecadado || 0),
                data.status, data.prazo, linha.paroquia_id || '']);
  return { ok: true, id };
}

function updateMeta(data) {
  return _atualizarPorId(SHEETS.METAS, _enriquecerComParoquia(data));
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
    ['id','nome','profissao','tags','telefone','disponibilidade','paroquia_id']);
  const sh = SH(SHEETS.VOLUNTARIOS);
  const id = Date.now();
  const linha = _enriquecerComParoquia(data);
  sh.appendRow([id, data.nome, data.profissao,
                Array.isArray(data.tags) ? data.tags.join(',') : data.tags,
                data.telefone, data.disponibilidade, linha.paroquia_id || '']);
  return { ok: true, id };
}

function updateVoluntario(data) {
  return _atualizarPorId(SHEETS.VOLUNTARIOS, _enriquecerComParoquia(data));
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
    ['id','nome','telefone','categoria','status','ultimoDizimo','valor','paroquia_id']);
  const sh = SH(SHEETS.MEMBROS);
  const id = Date.now();
  const linha = _enriquecerComParoquia(data);
  sh.appendRow([id, data.nome, data.telefone, data.categoria,
                data.status || 'ativo', '—', 0, linha.paroquia_id || '']);
  return { ok: true, id };
}

function updateMembro(data) {
  return _atualizarPorId(SHEETS.MEMBROS, _enriquecerComParoquia(data));
}

function deleteMembro(id) {
  return _deletarPorId(SHEETS.MEMBROS, id);
}

function registrarDizimo(payload) {
  const { nome, valor, data, intencao } = payload.data || payload;
  const ctx = _ctx();
  _garantirCabecalho(SHEETS.DIZIMOS,
    ['id','data','nome','valor','intencao','observacao','paroquia_id']);
  const sh = SH(SHEETS.DIZIMOS);
  sh.appendRow([Date.now(), data, nome, Number(valor), intencao || '', payload.obs || '', ctx ? ctx.paroquia_id || '' : '']);

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
  if (rows.length === 0) return config;

  const hasHeaderV2 = String(rows[0][0]).toLowerCase() === 'paroquia_id' &&
                      String(rows[0][1]).toLowerCase() === 'chave';
  if (hasHeaderV2) {
    const ctx = _ctx();
    const paroquia = _normalizarIdParoquia(ctx ? ctx.paroquia_id : '');
    rows.slice(1).forEach(([paroquia_id, chave, valor]) => {
      if (!chave) return;
      if (!paroquia || _normalizarIdParoquia(paroquia_id) === paroquia) config[chave] = valor;
    });
    return config;
  }

  rows.forEach(([chave, valor]) => { if (chave) config[chave] = valor; });
  return config;
}

function saveConfig(data) {
  const sh = SH(SHEETS.CONFIG);
  const ctx = _ctx();
  const paroquia = ctx ? ctx.paroquia_id || '' : '';
  const rows = sh.getDataRange().getValues();
  const hasHeaderV2 = rows.length > 0 &&
    String(rows[0][0]).toLowerCase() === 'paroquia_id' &&
    String(rows[0][1]).toLowerCase() === 'chave';

  if (!hasHeaderV2) {
    sh.clearContents();
    sh.appendRow(['paroquia_id', 'chave', 'valor']);
  }

  const allRows = sh.getDataRange().getValues();
  for (let i = allRows.length; i >= 2; i--) {
    if (_normalizarIdParoquia(allRows[i - 1][0]) === _normalizarIdParoquia(paroquia)) {
      sh.deleteRow(i);
    }
  }

  Object.entries(data).forEach(([k, v]) => {
    if (k !== 'action') sh.appendRow([paroquia, k, v]);
  });
  return { ok: true };
}

function getSessaoUsuario() {
  const ctx = _ctx();
  if (!ctx) return { ok: false, erro: 'Sessão não inicializada.' };
  return {
    ok: true,
    usuario: {
      email: ctx.email,
      nome: ctx.nome,
      perfil: ctx.perfil
    }
  };
}

function getFielPainel() {
  const ctx = _ctx();
  if (!ctx) throw new Error('Sessão inválida.');

  const config = getConfig();
  const metas = getMetas();
  const manutencoes = getManutencaoPatrimonial();
  const financeiro = getFinanceiro();
  const recados = getRecados().filter(r => r.tipo === 'novidade' || r.tipo === 'comunicado');

  const metasReforma = metas.map(m => {
    const meta = Number(m.meta || 0);
    const arrecadado = Number(m.arrecadado || 0);
    const percentual = meta > 0 ? Math.min(100, Math.round((arrecadado / meta) * 100)) : 0;
    const statusMap = { ativa: 'Em andamento', urgente: 'Em andamento', concluida: 'Concluído' };
    return {
      id: m.id,
      titulo: m.titulo,
      descricao: m.descricao || '',
      percentual_conclusao: percentual,
      status: statusMap[String(m.status || '').toLowerCase()] || 'Status não definido',
      valor_mascarado: _mascararMoeda(meta)
    };
  });

  const totalDespesas = financeiro.distribuicao.reduce((s, d) => s + Number(d.valor || 0), 0);
  const distribuicaoGastos = financeiro.distribuicao.map(d => ({
    categoria: d.categoria,
    percentual: totalDespesas > 0 ? Number(((Number(d.valor || 0) / totalDespesas) * 100).toFixed(1)) : 0
  }));

  return {
    ok: true,
    usuario: {
      nome: ctx.nome,
      perfil: ctx.perfil
    },
    paroquia: {
      nome: config.nome || '',
      pix_tipo: config.pixTipo || '',
      pix_chave: config.pixChave || '',
      qr_code_pix: config.pixQrUrl || ''
    },
    novidades: recados.slice(0, MAX_NOVIDADES_PAINEL_FIEL).map(r => ({
      id: r.id,
      data: r.data,
      titulo: r.titulo,
      mensagem: r.mensagem,
      tipo: r.tipo
    })),
    status_reformas: [
      ...metasReforma,
      ...manutencoes.slice(0, 4).map(m => ({
        id: `mant-${m.id}`,
        titulo: m.bem,
        descricao: m.descricao || '',
        percentual_conclusao: PROGRESSO_MANUTENCAO_PADRAO[String(m.status || '').toLowerCase()] || 50,
        status: String(m.status || '').toLowerCase() === 'concluida' ? 'Concluído' : 'Em andamento',
        valor_mascarado: _mascararMoeda(m.custo_estimado)
      }))
    ].slice(0, 8),
    distribuicao_gastos: distribuicaoGastos
  };
}

function _normalizarWhatsApp55(valor) {
  const digits = String(valor || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55')) return digits;
  return '55' + digits;
}

function _normalizarNomeFiel(valor) {
  return String(valor || '').trim().toLowerCase();
}

function _normalizarTextoBasico(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function _ehCategoriaDizimista(categoria) {
  return String(categoria || '').toLowerCase() === String(CATEGORIA_DIZIMISTA).toLowerCase();
}

function _listarParoquiasFiel() {
  _garantirCabecalho(SHEETS.MEMBROS,
    ['id','nome','telefone','categoria','status','ultimoDizimo','valor','paroquia_id']);
  const membros = _lerAbaSemFiltro(SHEETS.MEMBROS);
  const ids = {};
  membros.forEach(m => {
    const id = String(m.paroquia_id || '').trim();
    if (!id) return;
    ids[id] = true;
  });
  return Object.keys(ids).map(id => ({ id: id, nome: id }));
}

function getParoquiasFiel() {
  return {
    ok: true,
    paroquias: _listarParoquiasFiel()
  };
}

function _autenticarFiel(payload) {
  _garantirCabecalho(SHEETS.MEMBROS,
    ['id','nome','telefone','categoria','status','ultimoDizimo','valor','paroquia_id']);
  const nome = String(payload.login || payload.nome || '').trim();
  const senha = _normalizarWhatsApp55(payload.senha || payload.whatsapp || payload.telefone || '');
  const paroquia_id = String(payload.paroquia_id || '').trim();
  if (!nome) return { ok: false, erro: 'Informe o nome para login.' };
  if (!paroquia_id) return { ok: false, erro: 'Selecione a paróquia.' };
  if (!senha || !senha.startsWith('55')) return { ok: false, erro: 'Informe um número de WhatsApp válido.' };

  const membros = _lerAbaSemFiltro(SHEETS.MEMBROS);
  const nomeNorm = _normalizarNomeFiel(nome);
  const encontrado = membros.find(m =>
    _normalizarNomeFiel(m.nome) === nomeNorm &&
    _normalizarWhatsApp55(m.telefone) === senha &&
    String(m.paroquia_id || '').trim() === paroquia_id
  );
  if (!encontrado) return { ok: false, erro: 'Login inválido para o fiel informado.' };
  return { ok: true, membro: encontrado, senha: senha, paroquia_id: paroquia_id, nome: nome };
}

function loginFiel(payload) {
  _garantirCabecalho(SHEETS.MEMBROS,
    ['id','nome','telefone','categoria','status','ultimoDizimo','valor','paroquia_id']);

  const nome = String(payload.login || payload.nome || '').trim();
  const telefone = _normalizarWhatsApp55(payload.senha || payload.whatsapp || payload.telefone || '');
  const paroquia_id = String(payload.paroquia_id || '').trim();
  const dizimista = _normalizarTextoBasico(payload.dizimista || '');
  if (!nome) return { ok: false, erro: 'Informe o nome para login.' };
  if (!paroquia_id) return { ok: false, erro: 'Selecione a paróquia.' };
  if (dizimista !== 'sim' && dizimista !== 'nao') return { ok: false, erro: 'Selecione se é dizimista.' };
  if (!telefone || !telefone.startsWith('55')) return { ok: false, erro: 'Informe um número de WhatsApp válido.' };

  const sh = SH(SHEETS.MEMBROS);
  const rows = sh.getDataRange().getValues();
  const headers = rows[0] || ['id','nome','telefone','categoria','status','ultimoDizimo','valor','paroquia_id'];
  const nomeIdx = headers.indexOf('nome');
  const telIdx = headers.indexOf('telefone');
  const parIdx = headers.indexOf('paroquia_id');
  const catIdx = headers.indexOf('categoria');
  const idIdx = headers.indexOf('id');

  let membro = null;
  for (let i = 1; i < rows.length; i++) {
    if (_normalizarNomeFiel(rows[i][nomeIdx]) === _normalizarNomeFiel(nome) &&
        _normalizarWhatsApp55(rows[i][telIdx]) === telefone &&
        String(rows[i][parIdx] || '').trim() === paroquia_id) {
      membro = {
        id: rows[i][idIdx],
        nome: rows[i][nomeIdx],
        telefone: _normalizarWhatsApp55(rows[i][telIdx]),
        categoria: rows[i][catIdx] || CATEGORIA_NAO_DIZIMISTA
      };
      break;
    }
  }

  if (!membro) {
    const id = Date.now();
    const categoria = dizimista === 'sim' ? CATEGORIA_DIZIMISTA : CATEGORIA_NAO_DIZIMISTA;
    sh.appendRow([id, nome, telefone, categoria, 'ativo', '—', 0, paroquia_id]);
    membro = { id: id, nome: nome, telefone: telefone, categoria: categoria };
    registrarLog('ADD', 'Fiel Cadastro', `id=${id} paroquia=${paroquia_id} categoria=${categoria}`);
  }

  return {
    ok: true,
    login: nome,
    senha: telefone,
    paroquia_id: paroquia_id,
    fiel: {
      id: membro.id,
      nome: membro.nome,
      telefone: membro.telefone,
      categoria: membro.categoria,
      dizimista: _ehCategoriaDizimista(membro.categoria)
    }
  };
}

/* ── Login Unificado (Fiel ou Coordenador) ─────────────────────
   Aceita sufixo mágico no nome para promover a coordenador na 1ª vez:
     "Junior Chaves dizimo@admin"  ou  "...dizimo@cooder"
   Após o primeiro login de coordenador, o e-mail fica registrado na
   aba Usuários e nos logins seguintes basta Nome + E-mail + Telefone. */
const SUFIXO_COORDENADOR_RE = /\s*dizimo@(admin|cooder)\s*$/i;

function loginUnificado(payload) {
  const headersUsuarios = ['id','email','nome','paroquia_id','perfil','ativo','telefone'];
  _garantirCabecalho(SHEETS.USUARIOS, headersUsuarios);
  _garantirCabecalho(SHEETS.MEMBROS,
    ['id','nome','telefone','categoria','status','ultimoDizimo','valor','paroquia_id']);

  const nomeBruto = String(payload.login || payload.nome || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const telefone = _normalizarWhatsApp55(payload.senha || payload.whatsapp || payload.telefone || '');
  const paroquia_id = String(payload.paroquia_id || '').trim();
  const dizimista = _normalizarTextoBasico(payload.dizimista || '');

  if (!nomeBruto) return { ok: false, erro: 'Informe o nome.' };
  if (!email || email.indexOf('@') === -1) return { ok: false, erro: 'Informe um e-mail válido.' };
  if (!telefone || !telefone.startsWith('55')) return { ok: false, erro: 'Informe um número de WhatsApp válido.' };

  const temSufixoCoord = SUFIXO_COORDENADOR_RE.test(nomeBruto);
  const nome = nomeBruto.replace(SUFIXO_COORDENADOR_RE, '').trim();

  const usuarios = _lerAbaSemFiltro(SHEETS.USUARIOS);
  const usuarioExistente = usuarios.find(u => String(u.email || '').trim().toLowerCase() === email);

  // 1) Já existe usuário (coordenador/admin) registrado com este e-mail
  if (usuarioExistente) {
    const perfil = String(usuarioExistente.perfil || 'fiel').toLowerCase();
    if (String(usuarioExistente.ativo || 'true').toLowerCase() === 'false') {
      return { ok: false, erro: 'Usuário inativo.' };
    }
    if (perfil === 'coordenador' || perfil === 'admin' || perfil === 'padre') {
      // Atualiza telefone/paroquia_id caso tenham mudado
      const atualizado = Object.assign({}, usuarioExistente, {
        nome: nome || usuarioExistente.nome,
        telefone: telefone,
        paroquia_id: paroquia_id || usuarioExistente.paroquia_id
      });
      _atualizarPorId(SHEETS.USUARIOS, atualizado);
      registrarLog('LOGIN', 'Coordenador', `email=${email}`);
      return {
        ok: true,
        perfil: perfil,
        email: email,
        nome: atualizado.nome,
        paroquia_id: atualizado.paroquia_id,
        telefone: telefone
      };
    }
    // Perfil fiel já existente via Usuários – trata como fiel mesmo assim
  }

  // 2) Primeiro login com sufixo mágico → cria coordenador
  if (temSufixoCoord) {
    if (!paroquia_id) return { ok: false, erro: 'Selecione a paróquia para cadastrar o coordenador.' };
    const id = Date.now();
    const sh = SH(SHEETS.USUARIOS);
    sh.appendRow([id, email, nome, paroquia_id, 'coordenador', 'true', telefone]);
    registrarLog('ADD', 'Coordenador', `id=${id} email=${email} paroquia=${paroquia_id}`);
    return {
      ok: true,
      perfil: 'coordenador',
      email: email,
      nome: nome,
      paroquia_id: paroquia_id,
      telefone: telefone,
      primeiro_acesso: true
    };
  }

  // 3) Caso contrário, fluxo de Fiel (cadastra/valida em Membros)
  if (!paroquia_id) return { ok: false, erro: 'Selecione a paróquia.' };
  if (dizimista !== 'sim' && dizimista !== 'nao') return { ok: false, erro: 'Selecione se é dizimista.' };

  const resFiel = loginFiel({
    login: nome,
    senha: telefone,
    paroquia_id: paroquia_id,
    dizimista: dizimista
  });
  if (!resFiel || !resFiel.ok) return resFiel || { ok: false, erro: 'Falha ao autenticar fiel.' };

  return {
    ok: true,
    perfil: 'fiel',
    email: email,
    nome: nome,
    paroquia_id: paroquia_id,
    telefone: telefone,
    fiel: resFiel.fiel || null
  };
}

function _configPorParoquia(paroquiaId) {
  const sh = SH(SHEETS.CONFIG);
  const rows = sh.getDataRange().getValues();
  const cfg = {};
  if (rows.length === 0) return cfg;

  const isV2 = String(rows[0][0]).toLowerCase() === 'paroquia_id' &&
               String(rows[0][1]).toLowerCase() === 'chave';
  if (!isV2) {
    rows.forEach(([k, v]) => { if (k) cfg[k] = v; });
    return cfg;
  }

  rows.slice(1).forEach(([paroquia_id, chave, valor]) => {
    if (!chave) return;
    if (String(paroquia_id || '').trim() === String(paroquiaId || '').trim()) cfg[chave] = valor;
  });
  return cfg;
}

function _conteudoPastoralDiario() {
  const data = new Date();
  const inicioAno = new Date(data.getFullYear(), 0, 1);
  const diaAno = Math.floor((data.getTime() - inicioAno.getTime()) / MS_POR_DIA) + 1;

  const liturgias = [
    { referencia: 'Jo 13,34', titulo: 'Mandamento do Amor', mensagem: 'Amai-vos uns aos outros como eu vos amei.' },
    { referencia: 'Mt 5,9', titulo: 'Bem-aventurados os pacificadores', mensagem: 'Promova reconciliação e paz em sua casa e comunidade.' },
    { referencia: 'Lc 1,38', titulo: 'Eis aqui a serva do Senhor', mensagem: 'Disponha seu coração para servir com fé e generosidade.' },
    { referencia: 'Sl 23', titulo: 'O Senhor é meu pastor', mensagem: 'Confie no cuidado de Deus para cada necessidade.' }
  ];
  const santos = [
    { nome: 'São José', exemplo: 'Fidelidade e silêncio orante.' },
    { nome: 'Nossa Senhora Aparecida', exemplo: 'Confiança e intercessão materna.' },
    { nome: 'São Francisco de Assis', exemplo: 'Simplicidade e cuidado com os pobres.' },
    { nome: 'Santa Teresinha', exemplo: 'Santidade nas pequenas atitudes diárias.' }
  ];
  const quizzes = [
    { pergunta: 'Qual atitude melhor expressa a vida comunitária cristã?', opcoes: ['Partilhar', 'Isolar-se', 'Julgar'], resposta: 0 },
    { pergunta: 'O dízimo está ligado principalmente a quê?', opcoes: ['Gratidão', 'Obrigação financeira', 'Prestígio'], resposta: 0 },
    { pergunta: 'Qual valor fortalece a pastoral?', opcoes: ['Competição', 'Serviço', 'Indiferença'], resposta: 1 }
  ];

  return {
    liturgia_diaria: liturgias[diaAno % liturgias.length],
    santo_do_dia: santos[diaAno % santos.length],
    quiz: quizzes[diaAno % quizzes.length]
  };
}

function getFielPainelPublico(params) {
  const auth = _autenticarFiel(params || {});
  if (!auth.ok) return auth;

  const paroquiaId = auth.paroquia_id;
  const config = _configPorParoquia(paroquiaId);
  const metas = _lerAbaSemFiltro(SHEETS.METAS).filter(m => String(m.paroquia_id || '').trim() === paroquiaId);
  const manutencoesBase = getManutencaoPatrimonial();
  const manutencoes = Array.isArray(manutencoesBase)
    ? manutencoesBase.filter(m => String(m.paroquia_id || '').trim() === paroquiaId)
    : [];
  const recados = _lerAbaSemFiltro(SHEETS.RECADOS).filter(r => {
    const destino = _normalizarIdParoquia(r.paroquia_destino);
    const origem = _normalizarIdParoquia(r.paroquia_origem);
    const atual = _normalizarIdParoquia(paroquiaId);
    return (r.tipo === 'novidade' || r.tipo === 'comunicado') && (destino === 'geral' || destino === atual || origem === atual);
  });
  const lancamentosMes = _lerAbaSemFiltro(SHEETS.LANCAMENTOS).filter(l => {
    if (String(l.paroquia_id || '').trim() !== paroquiaId) return false;
    if (String(l.tipo || '').toLowerCase() !== 'despesa') return false;
    const d = new Date(l.data);
    const hoje = new Date();
    return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
  });

  const totalDespesas = lancamentosMes.reduce((s, l) => s + Number(l.valor || 0), 0);
  const porCategoria = {};
  lancamentosMes.forEach(l => {
    const c = l.categoria || 'Outros';
    porCategoria[c] = (porCategoria[c] || 0) + Number(l.valor || 0);
  });
  const distribuicaoGastos = Object.keys(porCategoria).map(categoria => ({
    categoria: categoria,
    percentual: totalDespesas > 0 ? Number(((porCategoria[categoria] / totalDespesas) * 100).toFixed(1)) : 0
  }));

  const metasReforma = metas.map(m => {
    const meta = Number(m.meta || 0);
    const arrecadado = Number(m.arrecadado || 0);
    const percentual = meta > 0 ? Math.min(100, Math.round((arrecadado / meta) * 100)) : 0;
    return {
      id: m.id,
      titulo: m.titulo || 'Projeto',
      descricao: m.descricao || '',
      percentual_conclusao: percentual,
      status: percentual >= 100 ? 'Concluído' : 'Em andamento'
    };
  });

  return {
    ok: true,
    usuario: {
      nome: auth.membro.nome,
      perfil: 'fiel',
      categoria: auth.membro.categoria
    },
    paroquia: {
      id: paroquiaId,
      nome: config.nome || paroquiaId,
      pix_tipo: config.pixTipo || '',
      pix_chave: config.pixChave || '',
      qr_code_pix: config.pixQrUrl || ''
    },
    novidades: recados.slice(0, MAX_NOVIDADES_PAINEL_FIEL).map(r => ({
      id: r.id,
      data: r.data,
      titulo: r.titulo || 'Comunicado',
      mensagem: r.mensagem || '',
      tipo: r.tipo
    })),
    status_reformas: [
      ...metasReforma,
      ...manutencoes.slice(0, 4).map(m => ({
        id: `mant-${m.id}`,
        titulo: m.bem,
        descricao: m.descricao || '',
        percentual_conclusao: PROGRESSO_MANUTENCAO_PADRAO[String(m.status || '').toLowerCase()] || 50,
        status: String(m.status || '').toLowerCase() === 'concluida' ? 'Concluído' : 'Em andamento'
      }))
    ].slice(0, 8),
    distribuicao_gastos: distribuicaoGastos,
    ..._conteudoPastoralDiario()
  };
}

const _CABECALHO_RECADOS = ['id','data','autor_email','autor_nome','paroquia_origem','paroquia_destino','tipo','titulo','mensagem','status'];

function getRecados() {
  _garantirCabecalho(SHEETS.RECADOS, _CABECALHO_RECADOS);
  const ctx = _ctx();
  const rows = _lerAbaSemFiltro(SHEETS.RECADOS);
  if (!ctx || !ctx.paroquia_id) return rows;
  const minhaParoquia = _normalizarIdParoquia(ctx.paroquia_id);
  return rows.filter(r => {
    const destino = _normalizarIdParoquia(r.paroquia_destino);
    return destino === 'geral' || destino === minhaParoquia || _normalizarIdParoquia(r.paroquia_origem) === minhaParoquia;
  });
}

function addRecado(data) {
  _garantirCabecalho(SHEETS.RECADOS, _CABECALHO_RECADOS);
  const ctx = _ctx();
  if (!ctx) throw new Error('Sessão inválida para publicar recado.');
  const sh = SH(SHEETS.RECADOS);
  const id = Date.now();
  sh.appendRow([
    id,
    new Date().toISOString(),
    ctx.email,
    ctx.nome || '',
    ctx.paroquia_id || '',
    String(data.paroquia_destino || 'geral').trim(),
    String(data.tipo || 'comunicado').trim().toLowerCase(),
    data.titulo || '',
    data.mensagem || '',
    'nao_lido'
  ]);
  return { ok: true, id };
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
  const rows = _lerAbaSemFiltro(nomeAba);
  if (!_deveFiltrarPorParoquia(nomeAba)) return rows;
  return rows.filter(_linhaDaParoquiaPermitida);
}

function _lerAbaSemFiltro(nomeAba) {
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
  if (rows.length <= 1) return { ok: false, erro: 'Registro não encontrado' };
  const headers = rows[0];
  const idIdx   = headers.indexOf('id');
  const paroquiaIdx = headers.indexOf('paroquia_id');
  const ctx = _ctx();

  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][idIdx]) === String(id)) {
      if (paroquiaIdx !== -1 && ctx && _normalizarIdParoquia(ctx.paroquia_id) &&
          _normalizarIdParoquia(rows[i][paroquiaIdx]) !== _normalizarIdParoquia(ctx.paroquia_id)) {
        return { ok: false, erro: 'Acesso negado para excluir registro de outra paróquia.' };
      }
      sh.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: false, erro: 'Registro não encontrado' };
}

function _atualizarPorId(nomeAba, data) {
  const sh   = SH(nomeAba);
  const rows = sh.getDataRange().getValues();
  if (rows.length <= 1) return { ok: false, erro: 'Registro não encontrado' };
  const headers = rows[0];
  const idIdx   = headers.indexOf('id');
  const paroquiaIdx = headers.indexOf('paroquia_id');
  const ctx = _ctx();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idIdx]) === String(data.id)) {
      if (paroquiaIdx !== -1 && ctx && _normalizarIdParoquia(ctx.paroquia_id) &&
          _normalizarIdParoquia(rows[i][paroquiaIdx]) !== _normalizarIdParoquia(ctx.paroquia_id)) {
        return { ok: false, erro: 'Acesso negado para atualizar registro de outra paróquia.' };
      }
      const novaLinha = headers.map(h => data[h] !== undefined ? data[h] : rows[i][headers.indexOf(h)]);
      if (paroquiaIdx !== -1 && ctx && _normalizarIdParoquia(ctx.paroquia_id)) {
        novaLinha[paroquiaIdx] = ctx.paroquia_id;
      }
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
  // Trigger semanal para verificar dizimistas inativos
  ScriptApp.newTrigger('verificarDizimistasInativos')
    .timeBased().everyDays(7).atHour(8).create();
  // Trigger semanal para verificar manutenções patrimoniais próximas (cân. 1284)
  ScriptApp.newTrigger('verificarManutencoesProximas')
    .timeBased().everyDays(7).atHour(8).create();
  // Backup semanal (cân. 1284 §2, 8°)
  ScriptApp.newTrigger('backupSemanal')
    .timeBased().everyDays(7).atHour(2).create();
  Logger.log('Gatilhos instalados com sucesso!');
}

/**
 * Verifica manutenções patrimoniais com data próxima (≤30 dias) ou atrasadas.
 * Registra no Log para o coordenador agir.
 */
function verificarManutencoesProximas() {
  const itens = getManutencaoPatrimonial();
  const proximas = itens.filter(i => i.alerta || i.atrasada);
  if (proximas.length > 0) {
    registrarLog('VERIFICAÇÃO', 'Manutenção Patrimonial',
      `${proximas.length} item(ns) com manutenção próxima/atrasada: ${proximas.map(i => i.bem).join(', ')}`);
  }
  return { total: proximas.length, itens: proximas.map(i => i.bem) };
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

/* ══════════════════════════════════════════════════════════
   FUNDO CARITATIVO – Dimensão Caritativa (EG 198)
   Cân. 1267 §3: as ofertas para um fim determinado só podem
   ser usadas para esse fim.
   ══════════════════════════════════════════════════════════ */

const _CABECALHO_CARITATIVO = ['id','data','tipo','origem_destino','categoria',
  'familias_atendidas','quilos_alimentos','valor','responsavel_pastoral_social',
  'observacao_confidencial','paroquia_id'];

function getFundoCaritativo() {
  _garantirCabecalho(SHEETS.FUNDO_CARITATIVO, _CABECALHO_CARITATIVO);
  const rows = _lerAba(SHEETS.FUNDO_CARITATIVO);
  // Mascara observação confidencial – só visível ao próprio responsável/pároco
  return rows.map(r => ({
    ...r,
    observacao_confidencial: _mascararConfidencial(r.observacao_confidencial)
  }));
}

function addFundoCaritativo(data) {
  _garantirCabecalho(SHEETS.FUNDO_CARITATIVO, _CABECALHO_CARITATIVO);
  const sh = SH(SHEETS.FUNDO_CARITATIVO);
  const id = Date.now();
  const linha = _enriquecerComParoquia(data);
  sh.appendRow([id, data.data, data.tipo, data.origem_destino || '',
                data.categoria || 'Outros',
                Number(data.familias_atendidas || 0),
                Number(data.quilos_alimentos || 0),
                Number(data.valor || 0),
                data.responsavel_pastoral_social || '',
                data.observacao_confidencial || '',
                linha.paroquia_id || '']);
  registrarLog('ADD', 'Fundo Caritativo', `id=${id} cat=${data.categoria}`);
  return { ok: true, id };
}

function updateFundoCaritativo(data) {
  return _atualizarPorId(SHEETS.FUNDO_CARITATIVO, _enriquecerComParoquia(data));
}

function deleteFundoCaritativo(id) {
  return _deletarPorId(SHEETS.FUNDO_CARITATIVO, id);
}

/**
 * Dashboard "Impacto da Caridade" – Laudato Si' nn. 137-162 / EG 198.
 * Retorna agregados anônimos sobre obras de misericórdia.
 */
function getImpactoCaridade() {
  _garantirCabecalho(SHEETS.FUNDO_CARITATIVO, _CABECALHO_CARITATIVO);
  const rows = _lerAba(SHEETS.FUNDO_CARITATIVO);
  const agora = new Date();
  const ano   = agora.getFullYear();
  const mes   = agora.getMonth() + 1;

  const doAno = rows.filter(r => r.data && new Date(r.data).getFullYear() === ano);
  const doMes = doAno.filter(r => new Date(r.data).getMonth() + 1 === mes);

  const sum = (arr, campo) => arr.reduce((s, r) => s + Number(r[campo] || 0), 0);

  const familias_mes  = sum(doMes.filter(r => r.tipo === 'Saída'), 'familias_atendidas');
  const familias_ano  = sum(doAno.filter(r => r.tipo === 'Saída'), 'familias_atendidas');
  const kg_alimentos_ano = sum(doAno, 'quilos_alimentos');
  const total_caridade_ano = sum(doAno.filter(r => r.tipo === 'Saída'), 'valor');

  // % da receita total destinada aos pobres (referência EG 198: ≥10%)
  const fin = getFinanceiro();
  const receita_ano = Number(fin.receita_ano || 0);
  const pct_pobres = receita_ano > 0 ? (total_caridade_ano / receita_ano) * 100 : 0;
  const config = getConfig();
  const meta_pct_pobres = Number(config.meta_pct_pobres || 10);

  // Distribuição por categoria
  const porCategoria = {};
  doAno.filter(r => r.tipo === 'Saída').forEach(r => {
    const c = r.categoria || 'Outros';
    porCategoria[c] = (porCategoria[c] || 0) + Number(r.valor || 0);
  });

  return {
    familias_mes,
    familias_ano,
    kg_alimentos_ano,
    total_caridade_ano,
    receita_ano,
    pct_pobres: Number(pct_pobres.toFixed(2)),
    meta_pct_pobres,
    distribuicao: Object.entries(porCategoria).map(([cat, val]) => ({ categoria: cat, valor: val }))
  };
}

/* ══════════════════════════════════════════════════════════
   METAS DE EVANGELIZAÇÃO – Dimensão Missionária
   Doc. 105 CNBB / Evangelii Gaudium
   ══════════════════════════════════════════════════════════ */

const _CABECALHO_EVANG = ['id','titulo','descricao','indicador','meta_numerica',
  'realizado','periodo','responsavel_pastoral','paroquia_id'];

function getMetasEvangelizacao() {
  _garantirCabecalho(SHEETS.METAS_EVANGELIZACAO, _CABECALHO_EVANG);
  return _lerAba(SHEETS.METAS_EVANGELIZACAO);
}

function addMetaEvangelizacao(data) {
  _garantirCabecalho(SHEETS.METAS_EVANGELIZACAO, _CABECALHO_EVANG);
  const sh = SH(SHEETS.METAS_EVANGELIZACAO);
  const id = Date.now();
  const linha = _enriquecerComParoquia(data);
  sh.appendRow([id, data.titulo, data.descricao || '', data.indicador,
                Number(data.meta_numerica || 0), Number(data.realizado || 0),
                data.periodo || '', data.responsavel_pastoral || '', linha.paroquia_id || '']);
  return { ok: true, id };
}

function updateMetaEvangelizacao(data) {
  return _atualizarPorId(SHEETS.METAS_EVANGELIZACAO, _enriquecerComParoquia(data));
}

function deleteMetaEvangelizacao(id) {
  return _deletarPorId(SHEETS.METAS_EVANGELIZACAO, id);
}

/**
 * Termômetro Missionário: agrega metas e calcula partilha "ad extra".
 */
function getTermometroMissionario() {
  const metas = getMetasEvangelizacao();
  const lancamentos = getLancamentos();
  const ano = new Date().getFullYear();

  const doAno = lancamentos.filter(l => l.data && new Date(l.data).getFullYear() === ano);
  const receita_ano = doAno.filter(l => l.tipo === 'receita').reduce((s, l) => s + Number(l.valor || 0), 0);
  const partilha_ad_extra = doAno.filter(l =>
    CATEGORIAS_PARTILHA_AD_EXTRA.indexOf(l.categoria) !== -1
  ).reduce((s, l) => s + Number(l.valor || 0), 0);

  const pct_partilha = receita_ano > 0 ? (partilha_ad_extra / receita_ano) * 100 : 0;
  const config = getConfig();
  const meta_pct_partilha = Number(config.meta_pct_partilha || 5);

  return {
    metas,
    receita_ano,
    partilha_ad_extra,
    pct_partilha: Number(pct_partilha.toFixed(2)),
    meta_pct_partilha,
    categorias_ad_extra: CATEGORIAS_PARTILHA_AD_EXTRA
  };
}

/* ══════════════════════════════════════════════════════════
   CONSELHO ECONÔMICO – Cân. 537 / 1284 §2, 7°
   ══════════════════════════════════════════════════════════ */

const _CABECALHO_CONSELHO = ['id','data','tipo','pauta','participantes',
  'deliberacoes','anexo_url','assinatura_hash','paroquia_id'];

function getConselhoEconomico() {
  _garantirCabecalho(SHEETS.CONSELHO_ECONOMICO, _CABECALHO_CONSELHO);
  return _lerAba(SHEETS.CONSELHO_ECONOMICO);
}

function addConselhoEconomico(data) {
  _garantirCabecalho(SHEETS.CONSELHO_ECONOMICO, _CABECALHO_CONSELHO);
  const sh = SH(SHEETS.CONSELHO_ECONOMICO);
  const id = Date.now();
  const linha = _enriquecerComParoquia(data);
  // Assinatura digital interna (auditável): hash SHA-256 do conteúdo da ata
  // + timestamp + e-mail do usuário que registrou. O e-mail é parte
  // intencional do hash para fins de rastreio canônico (cân. 1284 §2, 7°);
  // qualquer alteração subsequente por outro usuário gera novo hash, o que
  // torna evidente a quebra de integridade da ata original.
  const conteudo = `${id}|${data.data}|${data.tipo}|${data.pauta}|${data.deliberacoes}|${new Date().toISOString()}|${Session.getEffectiveUser().getEmail()}`;
  const hash = _sha256(conteudo);
  sh.appendRow([id, data.data, data.tipo || 'Reunião',
                data.pauta || '', data.participantes || '',
                data.deliberacoes || '', data.anexo_url || '', hash, linha.paroquia_id || '']);
  registrarLog('ADD', 'Conselho Econômico', `id=${id} hash=${hash.substring(0,12)}`);
  return { ok: true, id, assinatura_hash: hash };
}

function updateConselhoEconomico(data) {
  return _atualizarPorId(SHEETS.CONSELHO_ECONOMICO, _enriquecerComParoquia(data));
}

function deleteConselhoEconomico(id) {
  return _deletarPorId(SHEETS.CONSELHO_ECONOMICO, id);
}

/* ══════════════════════════════════════════════════════════
   MANUTENÇÃO PATRIMONIAL – Cân. 1284 §2, 1° ("bom pai de família")
   ══════════════════════════════════════════════════════════ */

const _CABECALHO_MANUTENCAO = ['id','bem','descricao','ultima_revisao',
  'proxima_revisao','custo_estimado','status','paroquia_id'];

function getManutencaoPatrimonial() {
  _garantirCabecalho(SHEETS.MANUTENCAO_PATRIMONIAL, _CABECALHO_MANUTENCAO);
  const rows = _lerAba(SHEETS.MANUTENCAO_PATRIMONIAL);
  // Marcar alertas (próximos 30 dias) e atrasados
  const agora = new Date();
  return rows.map(r => {
    let alerta = false, atrasada = false;
    if (r.proxima_revisao) {
      const prox = new Date(r.proxima_revisao);
      const diff = (prox - agora) / (1000 * 60 * 60 * 24);
      atrasada = diff < 0;
      alerta   = diff >= 0 && diff <= 30;
    }
    return { ...r, alerta, atrasada };
  });
}

function addManutencaoPatrimonial(data) {
  _garantirCabecalho(SHEETS.MANUTENCAO_PATRIMONIAL, _CABECALHO_MANUTENCAO);
  const sh = SH(SHEETS.MANUTENCAO_PATRIMONIAL);
  const id = Date.now();
  const linha = _enriquecerComParoquia(data);
  sh.appendRow([id, data.bem, data.descricao || '',
                data.ultima_revisao || '', data.proxima_revisao || '',
                Number(data.custo_estimado || 0), data.status || 'planejada', linha.paroquia_id || '']);
  return { ok: true, id };
}

function updateManutencaoPatrimonial(data) {
  return _atualizarPorId(SHEETS.MANUTENCAO_PATRIMONIAL, _enriquecerComParoquia(data));
}

function deleteManutencaoPatrimonial(id) {
  return _deletarPorId(SHEETS.MANUTENCAO_PATRIMONIAL, id);
}

/* ══════════════════════════════════════════════════════════
   INVENTÁRIO DE BENS – Cân. 1283 2°
   ══════════════════════════════════════════════════════════ */

const _CABECALHO_INVENTARIO = ['id','tipo','descricao','data_aquisicao',
  'valor','estado_conservacao','localizacao','paroquia_id'];

function getInventario() {
  _garantirCabecalho(SHEETS.INVENTARIO, _CABECALHO_INVENTARIO);
  return _lerAba(SHEETS.INVENTARIO);
}

function addInventario(data) {
  _garantirCabecalho(SHEETS.INVENTARIO, _CABECALHO_INVENTARIO);
  const sh = SH(SHEETS.INVENTARIO);
  const id = Date.now();
  const linha = _enriquecerComParoquia(data);
  sh.appendRow([id, data.tipo || 'Móvel', data.descricao || '',
                data.data_aquisicao || '', Number(data.valor || 0),
                data.estado_conservacao || 'Bom', data.localizacao || '', linha.paroquia_id || '']);
  return { ok: true, id };
}

function updateInventario(data) {
  return _atualizarPorId(SHEETS.INVENTARIO, _enriquecerComParoquia(data));
}

function deleteInventario(id) {
  return _deletarPorId(SHEETS.INVENTARIO, id);
}

/* ══════════════════════════════════════════════════════════
   PRESTAÇÃO DE CONTAS PÚBLICA – Cân. 1287 §2
   ══════════════════════════════════════════════════════════ */

const _CABECALHO_PRESTACAO = ['id','periodo','receita','despesa','saldo','publicado','data_publicacao','paroquia_id'];

function getPrestacaoContas() {
  _garantirCabecalho(SHEETS.PRESTACAO_CONTAS, _CABECALHO_PRESTACAO);
  return _lerAba(SHEETS.PRESTACAO_CONTAS);
}

function publicarBalancete(data) {
  _garantirCabecalho(SHEETS.PRESTACAO_CONTAS, _CABECALHO_PRESTACAO);
  const sh = SH(SHEETS.PRESTACAO_CONTAS);
  const id = Date.now();
  const linha = _enriquecerComParoquia(data);
  sh.appendRow([id, data.periodo,
                Number(data.receita || 0), Number(data.despesa || 0),
                Number(data.receita || 0) - Number(data.despesa || 0),
                true, new Date().toISOString(), linha.paroquia_id || '']);
  registrarLog('PUBLICAR', 'Balancete', `periodo=${data.periodo}`);
  return { ok: true, id };
}

/**
 * Endpoint público: dados consolidados, anônimos.
 * Atende cân. 1287 §2 (prestação de contas aos fiéis).
 * NUNCA inclui nomes de dizimistas, telefones ou observações confidenciais.
 */
function getTransparenciaPublica() {
  const fin = getFinanceiro();
  const impacto = getImpactoCaridade();
  const missionario = getTermometroMissionario();
  const balancetes = getPrestacaoContas().filter(b => b.publicado === true || b.publicado === 'true');
  const config = getConfig();

  return {
    paroquia: {
      nome: config.nome || ''
    },
    financeiro: {
      receita_mes: fin.receita_mes,
      despesa_mes: fin.despesa_mes,
      saldo_mes:   fin.saldo_mes,
      receita_ano: fin.receita_ano,
      despesa_ano: fin.despesa_ano,
      saldo_ano:   fin.saldo_ano,
      historico_meses: fin.historico_meses,
      distribuicao:    fin.distribuicao
    },
    impacto_caridade: {
      familias_ano:       impacto.familias_ano,
      kg_alimentos_ano:   impacto.kg_alimentos_ano,
      total_caridade_ano: impacto.total_caridade_ano,
      pct_pobres:         impacto.pct_pobres,
      meta_pct_pobres:    impacto.meta_pct_pobres
    },
    missionario: {
      partilha_ad_extra: missionario.partilha_ad_extra,
      pct_partilha:      missionario.pct_partilha,
      meta_pct_partilha: missionario.meta_pct_partilha,
      metas: missionario.metas.map(m => ({
        titulo: m.titulo, indicador: m.indicador,
        meta_numerica: m.meta_numerica, realizado: m.realizado, periodo: m.periodo
      }))
    },
    balancetes_publicados: balancetes.map(b => ({
      periodo: b.periodo, receita: b.receita, despesa: b.despesa,
      saldo: b.saldo, data_publicacao: b.data_publicacao
    }))
  };
}

/* ══════════════════════════════════════════════════════════
   UTILITÁRIOS PASTORAIS
   ══════════════════════════════════════════════════════════ */

/**
 * Mascara observação confidencial (LGPD + segredo pastoral).
 * Mantém apenas iniciais.
 */
function _mascararConfidencial(texto) {
  if (!texto) return '';
  const s = String(texto);
  if (s.length <= 4) return '***';
  return s.substring(0, 2) + '***' + s.substring(s.length - 2);
}

/**
 * SHA-256 hex – usado para assinatura digital interna das atas do CAE.
 */
function _sha256(texto) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(texto),
    Utilities.Charset.UTF_8
  );
  return bytes.map(b => {
    const v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

/* ══════════════════════════════════════════════════════════
   BACKUP AUTOMÁTICO – Cân. 1284 §2, 8° (boa conservação dos registros)
   ══════════════════════════════════════════════════════════ */

/**
 * Cria cópia datada da planilha numa pasta dedicada (ID configurável).
 * Configure 'backup_folder_id' em Configurações para ativar.
 */
function backupSemanal() {
  try {
    const config = getConfig();
    const folderId = config.backup_folder_id;
    if (!folderId) {
      registrarLog('BACKUP', 'Pasta não configurada', 'Defina backup_folder_id em Configurações');
      return { ok: false, erro: 'backup_folder_id não configurado' };
    }
    const ss = SS();
    const nome = `${ss.getName()} – Backup ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')}`;
    const folder = DriveApp.getFolderById(folderId);
    const copia = DriveApp.getFileById(ss.getId()).makeCopy(nome, folder);
    registrarLog('BACKUP', 'OK', `id=${copia.getId()}`);
    return { ok: true, id: copia.getId() };
  } catch (err) {
    registrarLog('ERRO BACKUP', 'backupSemanal', err.message);
    return { ok: false, erro: err.message };
  }
}
