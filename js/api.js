/* ============================================================
   SUSTEN - API Layer (Google Apps Script Integration)
   ============================================================ */

const API = (() => {
  // ── Substitua pela URL do seu Web App do Google Apps Script ──
  const BASE_URL = window.SUSTEN_CONFIG?.appsScriptUrl || '';

  const _fetch = async (action, payload = {}) => {
    if (!BASE_URL) {
      console.warn('[API] Apps Script URL não configurada – usando dados demo.');
      return null;
    }
    try {
      const params = new URLSearchParams({ action, ...payload });
      const res = await fetch(`${BASE_URL}?${params}`, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('[API] Erro:', err.message);
      return null;
    }
  };

  const _post = async (action, body = {}) => {
    if (!BASE_URL) {
      console.warn('[API] Apps Script URL não configurada – usando dados demo.');
      return null;
    }
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('[API] Erro:', err.message);
      return null;
    }
  };

  // ── Financeiro ───────────────────────────────────────────────
  const getFinanceiro = ()          => _fetch('getFinanceiro');
  const getLancamentos = ()         => _fetch('getLancamentos');
  const addLancamento  = (data)     => _post('addLancamento', data);
  const deleteLancamento = (id)     => _post('deleteLancamento', { id });

  // ── Metas ─────────────────────────────────────────────────────
  const getMetas  = ()              => _fetch('getMetas');
  const addMeta   = (data)          => _post('addMeta', data);
  const updateMeta = (data)         => _post('updateMeta', data);
  const deleteMeta = (id)           => _post('deleteMeta', { id });

  // ── Voluntários ───────────────────────────────────────────────
  const getVoluntarios  = ()        => _fetch('getVoluntarios');
  const addVoluntario   = (data)    => _post('addVoluntario', data);
  const updateVoluntario = (data)   => _post('updateVoluntario', data);
  const deleteVoluntario = (id)     => _post('deleteVoluntario', { id });

  // ── Membros / Dizimistas ──────────────────────────────────────
  const getMembros = ()             => _fetch('getMembros');
  const addMembro  = (data)         => _post('addMembro', data);
  const updateMembro = (data)       => _post('updateMembro', data);
  const deleteMembro = (id)         => _post('deleteMembro', { id });
  const registrarDizimo = (data)    => _post('registrarDizimo', { data });

  // ── Relatórios ────────────────────────────────────────────────
  const getRelatorio = (tipo, mes, ano) =>
    _fetch('getRelatorio', { tipo, mes, ano });

  // ── Configurações ─────────────────────────────────────────────
  const getConfig = ()              => _fetch('getConfig');
  const saveConfig = (data)         => _post('saveConfig', data);

  // ── Fundo Caritativo (Dimensão Caritativa) ────────────────────
  const getFundoCaritativo    = ()       => _fetch('getFundoCaritativo');
  const getImpactoCaridade    = ()       => _fetch('getImpactoCaridade');
  const addFundoCaritativo    = (data)   => _post('addFundoCaritativo', data);
  const updateFundoCaritativo = (data)   => _post('updateFundoCaritativo', data);
  const deleteFundoCaritativo = (id)     => _post('deleteFundoCaritativo', { id });

  // ── Metas de Evangelização (Dimensão Missionária) ─────────────
  const getMetasEvangelizacao    = ()    => _fetch('getMetasEvangelizacao');
  const getTermometroMissionario = ()    => _fetch('getTermometroMissionario');
  const addMetaEvangelizacao    = (data) => _post('addMetaEvangelizacao', data);
  const updateMetaEvangelizacao = (data) => _post('updateMetaEvangelizacao', data);
  const deleteMetaEvangelizacao = (id)   => _post('deleteMetaEvangelizacao', { id });

  // ── Conselho Econômico (cân. 537) ─────────────────────────────
  const getConselhoEconomico    = ()     => _fetch('getConselhoEconomico');
  const addConselhoEconomico    = (data) => _post('addConselhoEconomico', data);
  const updateConselhoEconomico = (data) => _post('updateConselhoEconomico', data);
  const deleteConselhoEconomico = (id)   => _post('deleteConselhoEconomico', { id });

  // ── Manutenção Patrimonial (cân. 1284) ────────────────────────
  const getManutencaoPatrimonial    = ()     => _fetch('getManutencaoPatrimonial');
  const addManutencaoPatrimonial    = (data) => _post('addManutencaoPatrimonial', data);
  const updateManutencaoPatrimonial = (data) => _post('updateManutencaoPatrimonial', data);
  const deleteManutencaoPatrimonial = (id)   => _post('deleteManutencaoPatrimonial', { id });

  // ── Inventário (cân. 1283 2°) ─────────────────────────────────
  const getInventario    = ()     => _fetch('getInventario');
  const addInventario    = (data) => _post('addInventario', data);
  const updateInventario = (data) => _post('updateInventario', data);
  const deleteInventario = (id)   => _post('deleteInventario', { id });

  // ── Prestação de Contas (cân. 1287) ───────────────────────────
  const getPrestacaoContas   = ()     => _fetch('getPrestacaoContas');
  const publicarBalancete    = (data) => _post('publicarBalancete', data);
  const getTransparenciaPublica = () => _fetch('getTransparenciaPublica');

  return {
    getFinanceiro, getLancamentos, addLancamento, deleteLancamento,
    getMetas, addMeta, updateMeta, deleteMeta,
    getVoluntarios, addVoluntario, updateVoluntario, deleteVoluntario,
    getMembros, addMembro, updateMembro, deleteMembro, registrarDizimo,
    getRelatorio, getConfig, saveConfig,
    getFundoCaritativo, getImpactoCaridade,
    addFundoCaritativo, updateFundoCaritativo, deleteFundoCaritativo,
    getMetasEvangelizacao, getTermometroMissionario,
    addMetaEvangelizacao, updateMetaEvangelizacao, deleteMetaEvangelizacao,
    getConselhoEconomico, addConselhoEconomico, updateConselhoEconomico, deleteConselhoEconomico,
    getManutencaoPatrimonial, addManutencaoPatrimonial, updateManutencaoPatrimonial, deleteManutencaoPatrimonial,
    getInventario, addInventario, updateInventario, deleteInventario,
    getPrestacaoContas, publicarBalancete, getTransparenciaPublica
  };
})();


/* ============================================================
   Dados DEMO (quando Apps Script não está configurado)
   ============================================================ */
const DEMO_DATA = {
  paroquia: {
    nome: 'Paróquia Nossa Senhora do Amparo',
    endereco: 'Rua das Flores, 123 – Centro',
    telefone: '(85) 99999-0000',
    whatsappAdmin: '5585999990000',
    pixChave: 'paroquia@exemplo.com.br',
    pixTipo: 'E-mail',
    pixNome: 'Paróquia N. Sra. do Amparo',
    pixBanco: 'Banco do Brasil'
  },
  financeiro: {
    receita_mes:    12450.00,
    despesa_mes:     8230.00,
    saldo_mes:       4220.00,
    receita_ano:   134800.00,
    despesa_ano:    98500.00,
    saldo_ano:      36300.00,
    dizimistas_ativos: 312,
    meta_mensal:    15000.00,
    historico_meses: [
      { mes: 'Jan', receita: 9800,  despesa: 7200 },
      { mes: 'Fev', receita: 10500, despesa: 7800 },
      { mes: 'Mar', receita: 11200, despesa: 8100 },
      { mes: 'Abr', receita: 12450, despesa: 8230 },
      { mes: 'Mai', receita: 13100, despesa: 9200 },
      { mes: 'Jun', receita: 11800, despesa: 8400 }
    ],
    distribuicao: [
      { categoria: 'Obras Sociais',    valor: 3200, cor: '#6c3fc5' },
      { categoria: 'Manutenção',       valor: 2100, cor: '#f5a623' },
      { categoria: 'Liturgia',         valor: 1500, cor: '#27ae60' },
      { categoria: 'Administrativo',   valor: 900,  cor: '#2980b9' },
      { categoria: 'Outros',           valor: 530,  cor: '#e74c3c' }
    ]
  },
  lancamentos: [
    { id: 1,  data: '2026-04-10', descricao: 'Dízimos – Missa Domingo',   tipo: 'receita',  valor: 2400.00, categoria: 'Dízimo',       responsavel: 'Pe. João' },
    { id: 2,  data: '2026-04-09', descricao: 'Conta de Luz – Abril',      tipo: 'despesa',  valor:  580.00, categoria: 'Utilidades',   responsavel: 'Secretaria' },
    { id: 3,  data: '2026-04-08', descricao: 'Doação Campanha Arrecadação',tipo: 'receita',  valor:  800.00, categoria: 'Doação',       responsavel: 'Comm. Social' },
    { id: 4,  data: '2026-04-07', descricao: 'Material de Limpeza',        tipo: 'despesa',  valor:  145.00, categoria: 'Manutenção',  responsavel: 'Zelador' },
    { id: 5,  data: '2026-04-06', descricao: 'Cesta Básica – Família Silva',tipo: 'despesa', valor:  250.00, categoria: 'Obras Sociais',responsavel: 'Pe. João' },
    { id: 6,  data: '2026-04-05', descricao: 'Coleta Especial – Páscoa',   tipo: 'receita',  valor: 3200.00, categoria: 'Coleta',      responsavel: 'Diácono Marcos' },
    { id: 7,  data: '2026-04-04', descricao: 'Reparo – Sistema de Som',    tipo: 'despesa',  valor:  380.00, categoria: 'Manutenção',  responsavel: 'Coord. Liturgia' },
    { id: 8,  data: '2026-04-03', descricao: 'Aluguel Salão Paroquial',    tipo: 'receita',  valor:  600.00, categoria: 'Aluguel',     responsavel: 'Secretaria' }
  ],
  metas: [
    { id: 1, emoji: '🔊', titulo: 'Sistema de Som',      descricao: 'Renovar todo o sistema de sonorização da nave principal',    meta: 8000,  arrecadado: 5400, status: 'ativa',    prazo: '2026-07-31', cor: 'purple' },
    { id: 2, emoji: '🎨', titulo: 'Reforma da Fachada',  descricao: 'Pintura e restauração da fachada histórica da Igreja',        meta: 15000, arrecadado: 2100, status: 'ativa',    prazo: '2026-12-31', cor: 'gold' },
    { id: 3, emoji: '💧', titulo: 'Cisternas Sociais',   descricao: 'Instalação de 3 cisternas para famílias em vulnerabilidade', meta: 4500,  arrecadado: 4500, status: 'concluida',prazo: '2026-03-31', cor: 'green' },
    { id: 4, emoji: '📚', titulo: 'Biblioteca Paroquial',descricao: 'Ampliação do acervo e mobiliário da sala de leitura',          meta: 3000,  arrecadado: 400,  status: 'urgente',  prazo: '2026-05-15', cor: 'red' },
    { id: 5, emoji: '⚡', titulo: 'Energia Solar',       descricao: 'Instalação de painéis solares para redução de custos',         meta: 22000, arrecadado: 6800, status: 'ativa',    prazo: '2026-11-30', cor: 'blue' }
  ],
  voluntarios: [
    { id: 1,  nome: 'Ana Lima',        profissao: 'Advogada',          tags: ['Jurídico','Contratos','LGPD'],       telefone: '(85) 98888-1111', disponibilidade: 'Fins de semana', foto: '👩‍⚖️' },
    { id: 2,  nome: 'Carlos Souza',    profissao: 'Eletricista',       tags: ['Elétrica','Instalações','Manutenção'],telefone: '(85) 97777-2222', disponibilidade: 'Sábados',        foto: '👨‍🔧' },
    { id: 3,  nome: 'Maria Santos',    profissao: 'Nutricionista',     tags: ['Alimentação','Eventos','Saúde'],      telefone: '(85) 96666-3333', disponibilidade: 'Flexível',       foto: '👩‍⚕️' },
    { id: 4,  nome: 'João Ferreira',   profissao: 'Contador',          tags: ['Contabilidade','Fiscal','Planilhas'], telefone: '(85) 95555-4444', disponibilidade: 'Terças/Quintas', foto: '👨‍💼' },
    { id: 5,  nome: 'Lúcia Oliveira',  profissao: 'Designer Gráfica',  tags: ['Design','Comunicação','Redes'],       telefone: '(85) 94444-5555', disponibilidade: 'Remoto',         foto: '👩‍🎨' },
    { id: 6,  nome: 'Pedro Alves',     profissao: 'Engenheiro Civil',  tags: ['Obras','Projetos','Orçamentos'],      telefone: '(85) 93333-6666', disponibilidade: 'Consultas',      foto: '👷' },
    { id: 7,  nome: 'Francisca Neto',  profissao: 'Professora',        tags: ['Catequese','Educação','Crianças'],    telefone: '(85) 92222-7777', disponibilidade: 'Sábados',        foto: '👩‍🏫' },
    { id: 8,  nome: 'Ricardo Moura',   profissao: 'Médico',            tags: ['Saúde','Pastoral','Idosos'],          telefone: '(85) 91111-8888', disponibilidade: 'Domingos',       foto: '👨‍⚕️' }
  ],
  membros: [
    { id: 1, nome: 'Ana Lima',       telefone: '5585988881111', categoria: 'Dizimista',  status: 'ativo',   ultimoDizimo: '2026-04-06', valor: 150 },
    { id: 2, nome: 'Carlos Souza',   telefone: '5585977772222', categoria: 'Colaborador',status: 'ativo',   ultimoDizimo: '2026-04-06', valor: 80  },
    { id: 3, nome: 'Maria Santos',   telefone: '5585966663333', categoria: 'Dizimista',  status: 'ativo',   ultimoDizimo: '2026-03-30', valor: 200 },
    { id: 4, nome: 'João Ferreira',  telefone: '5585955554444', categoria: 'Dizimista',  status: 'inativo', ultimoDizimo: '2026-02-05', valor: 100 },
    { id: 5, nome: 'Lúcia Oliveira', telefone: '5585944445555', categoria: 'Novo Membro',status: 'ativo',   ultimoDizimo: '—',          valor: 0   }
  ],
  whatsappTemplates: [
    {
      id: 'boas-vindas',
      titulo: '🙏 Boas-vindas ao Novo Membro',
      emoji: '🙏',
      texto: `Olá, {NOME}! 😊\n\nSejam muito bem-vindo(a) à *Paróquia Nossa Senhora do Amparo*! 🙏✝️\n\nÉ uma alegria ter você em nossa comunidade. Conte conosco para caminharmos juntos na fé.\n\nQualquer dúvida, estamos à disposição!\n_Equipe Pastoral_`
    },
    {
      id: 'agradecimento-dizimo',
      titulo: '💛 Agradecimento pelo Dízimo',
      emoji: '💛',
      texto: `Olá, {NOME}! 🌟\n\nGostaríamos de agradecer imensamente pelo seu dízimo de *R$ {VALOR}* referente ao mês de *{MES}*.\n\nSua contribuição é fundamental para sustentarmos nossa missão. *Que Deus abençoe abundantemente você e sua família!* 🙏\n\n_Paróquia Nossa Senhora do Amparo_`
    },
    {
      id: 'aviso-evento',
      titulo: '📢 Aviso de Evento/Atividade',
      emoji: '📢',
      texto: `📣 *AVISO PAROQUIAL*\n\nOlá, {NOME}!\n\nConvidamos você para *{EVENTO}*, que acontecerá no dia *{DATA}* às *{HORA}*.\n\n📍 Local: *{LOCAL}*\n\nConte com a sua presença! 🙏\n\n_Paróquia Nossa Senhora do Amparo_`
    },
    {
      id: 'dizimo-pendente',
      titulo: '💌 Lembrete Pastoral de Dízimo',
      emoji: '💌',
      texto: `Olá, {NOME}! 🌻\n\nEstávamos com saudades de você por aqui! 😊\n\nNotamos que seu dízimo dos últimos meses ainda não foi registrado. Sabemos que a vida é corrida, mas sua contribuição faz uma enorme diferença na nossa comunidade.\n\n💳 Se precisar de ajuda, entre em contato conosco.\n\n_Com carinho, Equipe Pastoral_`
    },
    {
      id: 'meta-atingida',
      titulo: '🎉 Meta Atingida – Comemore Conosco!',
      emoji: '🎉',
      texto: `🎉 *NOTÍCIA MARAVILHOSA!*\n\nOlá, {NOME}!\n\nA meta *"{META}"* foi atingida! 🙌 Isso só foi possível graças à generosidade de cada um de vocês.\n\nArrecadamos juntos *R$ {VALOR}*. Gloria a Deus!\n\n_Paróquia Nossa Senhora do Amparo_ ✝️`
    }
  ],

  /* ─── Versículos rotativos para o Dízimo Digital ────────────────
     Dimensão Religiosa do dízimo (Doc. 106 CNBB).            */
  versiculos: [
    { ref: '2Cor 9:7',   texto: 'Cada um contribua segundo propôs no seu coração; não com tristeza, ou por necessidade; porque Deus ama ao que dá com alegria.' },
    { ref: 'Mal 3:10',   texto: 'Trazei todos os dízimos à casa do tesouro... e provai-me nisto, diz o Senhor dos Exércitos.' },
    { ref: 'Lc 21:1-4',  texto: 'Esta pobre viúva deu mais do que todos; porque deu de sua pobreza, tudo o que tinha para o seu sustento.' },
    { ref: 'At 2:44-45', texto: 'Todos os que criam estavam juntos e tinham tudo em comum. Vendiam suas propriedades e bens, distribuindo-os entre todos, conforme cada um tinha necessidade.' },
    { ref: 'Pr 3:9',     texto: 'Honra ao Senhor com os teus bens, e com as primícias de toda a tua renda.' },
    { ref: 'Mt 6:21',    texto: 'Onde estiver o teu tesouro, aí estará também o teu coração.' }
  ],

  /* ─── Mensagens de agradecimento alternativas (rotação) ─────── */
  mensagensAgradecimento: [
    { texto: 'Que o Senhor multiplique os frutos da sua partilha. Sua oferta de gratidão sustenta a missão da nossa comunidade. 🙏', versiculo: '"Daí, e dar-se-vos-á" (Lc 6:38)' },
    { texto: 'Sua generosidade é semente do Reino. Que Deus abençoe sua família com paz e abundância. ✝️',                      versiculo: '"Deus ama a quem dá com alegria" (2Cor 9:7)' },
    { texto: 'Recebemos sua oferta com alegria. Em nome de toda a comunidade, agradecemos sua corresponsabilidade. 💛',         versiculo: '"Levai as cargas uns dos outros" (Gl 6:2)' },
    { texto: 'Que a partilha de seus bens seja também partilha de fé e esperança. Conte com nossa oração diária por você. 🙏',  versiculo: '"Onde estiver o teu tesouro, aí estará o teu coração" (Mt 6:21)' }
  ],

  /* ─── Fundo Caritativo (Dimensão Caritativa) – EG 198 ───────── */
  fundoCaritativo: [
    { id: 1, data: '2026-04-12', tipo: 'Saída',  origem_destino: 'Família assistida (Setor 3)', categoria: 'Alimentos',   familias_atendidas: 1, quilos_alimentos: 25, valor: 250, responsavel_pastoral_social: 'SSVP', observacao_confidencial: 'fa***ia' },
    { id: 2, data: '2026-04-08', tipo: 'Saída',  origem_destino: 'Conta de luz – idosa',        categoria: 'Energia',     familias_atendidas: 1, quilos_alimentos: 0,  valor: 180, responsavel_pastoral_social: 'Pastoral Social', observacao_confidencial: 'd.***os' },
    { id: 3, data: '2026-04-05', tipo: 'Entrada',origem_destino: 'Coleta Quaresmal',            categoria: 'Outros',      familias_atendidas: 0, quilos_alimentos: 0,  valor: 1800, responsavel_pastoral_social: 'Comissão', observacao_confidencial: '' },
    { id: 4, data: '2026-04-02', tipo: 'Saída',  origem_destino: 'Cesta básica – 5 famílias',   categoria: 'Alimentos',   familias_atendidas: 5, quilos_alimentos: 90, valor: 480, responsavel_pastoral_social: 'SSVP', observacao_confidencial: '5 ***es' },
    { id: 5, data: '2026-03-28', tipo: 'Saída',  origem_destino: 'Medicamento – paciente',      categoria: 'Medicamentos',familias_atendidas: 1, quilos_alimentos: 0,  valor: 120, responsavel_pastoral_social: 'Pastoral da Saúde', observacao_confidencial: 'pa***te' }
  ],

  impactoCaridade: {
    familias_mes:        7,
    familias_ano:        58,
    kg_alimentos_ano:    640,
    total_caridade_ano:  9800,
    receita_ano:         134800,
    pct_pobres:          7.27,
    meta_pct_pobres:     10,
    distribuicao: [
      { categoria: 'Alimentos',   valor: 5400 },
      { categoria: 'Energia',     valor: 1200 },
      { categoria: 'Medicamentos',valor: 980  },
      { categoria: 'Aluguel',     valor: 1500 },
      { categoria: 'Outros',      valor: 720  }
    ]
  },

  /* ─── Metas de Evangelização (Dimensão Missionária) ─────────── */
  metasEvangelizacao: [
    { id: 1, titulo: 'Novos Dizimistas',        descricao: 'Conquistar 30 novos dizimistas em 2026',    indicador: 'Novos dizimistas',   meta_numerica: 30, realizado: 12, periodo: '2026', responsavel_pastoral: 'Pastoral do Dízimo' },
    { id: 2, titulo: 'Famílias Visitadas',      descricao: 'Visitas pastorais nas casas do território', indicador: 'Famílias visitadas', meta_numerica: 200,realizado: 84, periodo: '2026', responsavel_pastoral: 'Pastoral Familiar' },
    { id: 3, titulo: 'Catequizandos',           descricao: 'Crianças e adolescentes na catequese',      indicador: 'Catequizandos',      meta_numerica: 150,realizado: 132,periodo: '2026', responsavel_pastoral: 'Coord. Catequese' },
    { id: 4, titulo: 'Crismandos 2026',         descricao: 'Jovens e adultos preparados para a Crisma', indicador: 'Crismandos',         meta_numerica: 40, realizado: 22, periodo: '2026', responsavel_pastoral: 'Pastoral da Juventude' },
    { id: 5, titulo: 'Batizados',               descricao: 'Batismos celebrados no ano',                indicador: 'Batizados',          meta_numerica: 60, realizado: 18, periodo: '2026', responsavel_pastoral: 'Secretaria Paroquial' }
  ],

  termometroMissionario: {
    receita_ano:        134800,
    partilha_ad_extra:  4200,
    pct_partilha:       3.12,
    meta_pct_partilha:  5,
    categorias_ad_extra: [
      'Partilha Diocesana','Campanha da Evangelização','Campanha da Fraternidade',
      'Campanha Missionária','Óbolo de São Pedro','Santa Infância'
    ]
  },

  /* ─── Conselho de Assuntos Econômicos (Cân. 537) ────────────── */
  conselhoEconomico: [
    { id: 1, data: '2026-04-10', tipo: 'Reunião', pauta: 'Análise do balancete de março; planejamento da Festa de São José.', participantes: 'Pe. João, José Silva (coord.), Maria Costa, Antônio Lima, Helena Souza', deliberacoes: 'Aprovado o balancete por unanimidade. Definida verba de R$ 1.500 para a festa.', anexo_url: '', assinatura_hash: 'a1b2c3d4e5f6…' },
    { id: 2, data: '2026-03-13', tipo: 'Reunião', pauta: 'Plano de manutenção do telhado; revisão do percentual destinado à caridade.', participantes: 'Pe. João, José Silva, Maria Costa, Helena Souza', deliberacoes: 'Orçamento aprovado em R$ 6.800. Reforço da meta de 10% para o Fundo Caritativo (EG 198).', anexo_url: '', assinatura_hash: '7f8e9d0c1b2a…' },
    { id: 3, data: '2026-02-08', tipo: 'Ata',     pauta: 'Aprovação do orçamento anual 2026.', participantes: 'Pe. João, todo o CAE', deliberacoes: 'Orçamento anual aprovado. Encaminhamento à Cúria Diocesana.', anexo_url: '', assinatura_hash: 'aa11bb22cc33…' }
  ],

  /* ─── Manutenção Patrimonial (Cân. 1284) ────────────────────── */
  manutencaoPatrimonial: [
    { id: 1, bem: 'Templo',           descricao: 'Pintura externa e impermeabilização',   ultima_revisao: '2024-08-10', proxima_revisao: '2026-08-10', custo_estimado: 12000, status: 'planejada', alerta: false, atrasada: false },
    { id: 2, bem: 'Salão Paroquial',  descricao: 'Revisão elétrica geral',                ultima_revisao: '2025-10-05', proxima_revisao: '2026-05-05', custo_estimado: 1800,  status: 'planejada', alerta: true,  atrasada: false },
    { id: 3, bem: 'Casa Paroquial',   descricao: 'Limpeza de calhas e revisão de telhado',ultima_revisao: '2025-09-20', proxima_revisao: '2026-04-10', custo_estimado: 600,   status: 'planejada', alerta: false, atrasada: true  },
    { id: 4, bem: 'Veículo Paroquial',descricao: 'Revisão preventiva 60.000 km',          ultima_revisao: '2026-01-15', proxima_revisao: '2026-07-15', custo_estimado: 1200,  status: 'planejada', alerta: false, atrasada: false },
    { id: 5, bem: 'Sistema de Som',   descricao: 'Calibração e verificação de cabos',     ultima_revisao: '2026-03-01', proxima_revisao: '2026-09-01', custo_estimado: 300,   status: 'concluida',alerta: false, atrasada: false }
  ],

  /* ─── Inventário de Bens (Cân. 1283 2°) ─────────────────────── */
  inventario: [
    { id: 1, tipo: 'Imóvel', descricao: 'Templo paroquial',              data_aquisicao: '1957-06-12', valor: 0,      estado_conservacao: 'Bom',     localizacao: 'Sede' },
    { id: 2, tipo: 'Imóvel', descricao: 'Casa Paroquial',                data_aquisicao: '1962-03-20', valor: 0,      estado_conservacao: 'Regular', localizacao: 'Sede' },
    { id: 3, tipo: 'Móvel',  descricao: 'Sistema de som principal',      data_aquisicao: '2022-11-05', valor: 8500,   estado_conservacao: 'Bom',     localizacao: 'Templo' },
    { id: 4, tipo: 'Móvel',  descricao: 'Veículo Fiat Strada',           data_aquisicao: '2021-07-15', valor: 65000,  estado_conservacao: 'Bom',     localizacao: 'Garagem' },
    { id: 5, tipo: 'Móvel',  descricao: 'Mesa e cadeiras do refeitório', data_aquisicao: '2019-04-02', valor: 3200,   estado_conservacao: 'Regular', localizacao: 'Salão Paroquial' }
  ],

  /* ─── Prestação de Contas pública (Cân. 1287 §2) ────────────── */
  prestacaoContas: [
    { id: 1, periodo: '2026-03', receita: 11200, despesa: 8100, saldo: 3100, publicado: true, data_publicacao: '2026-04-05T10:00:00Z' },
    { id: 2, periodo: '2026-02', receita: 10500, despesa: 7800, saldo: 2700, publicado: true, data_publicacao: '2026-03-04T10:00:00Z' },
    { id: 3, periodo: '2026-01', receita: 9800,  despesa: 7200, saldo: 2600, publicado: true, data_publicacao: '2026-02-03T10:00:00Z' }
  ]
};
