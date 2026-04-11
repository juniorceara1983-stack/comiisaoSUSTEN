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

  return {
    getFinanceiro, getLancamentos, addLancamento, deleteLancamento,
    getMetas, addMeta, updateMeta, deleteMeta,
    getVoluntarios, addVoluntario, updateVoluntario, deleteVoluntario,
    getMembros, addMembro, updateMembro, deleteMembro, registrarDizimo,
    getRelatorio, getConfig, saveConfig
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
      texto: `Olá, {NOME}! 🌻\n\nEstávamos com saudades de você por aqui! 😊\n\nNotamos que seu dízimo dos últimos meses ainda não foi registado. Sabemos que a vida é corrida, mas sua contribuição faz uma enorme diferença na nossa comunidade.\n\n💳 Se precisar de ajuda, entre em contato conosco.\n\n_Com carinho, Equipe Pastoral_`
    },
    {
      id: 'meta-atingida',
      titulo: '🎉 Meta Atingida – Comemore Conosco!',
      emoji: '🎉',
      texto: `🎉 *NOTÍCIA MARAVILHOSA!*\n\nOlá, {NOME}!\n\nA meta *"{META}"* foi atingida! 🙌 Isso só foi possível graças à generosidade de cada um de vocês.\n\nArrecadamos juntos *R$ {VALOR}*. Gloria a Deus!\n\n_Paróquia Nossa Senhora do Amparo_ ✝️`
    }
  ]
};
