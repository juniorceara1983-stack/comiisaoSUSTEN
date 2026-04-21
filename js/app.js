/* ============================================================
   SUSTEN – Main Application
   Sistema de Gestão de Sustentabilidade e Engajamento Paroquial
   ============================================================ */

'use strict';

/* ── Estado Global ─────────────────────────────────────────── */
const State = {
  currentPage:        'dashboard',
  financeiro:         null,
  lancamentos:        [],
  metas:              [],
  voluntarios:        [],
  membros:            [],
  paroquia:           null,
  // Novos módulos pastorais
  fundoCaritativo:        [],
  impactoCaridade:        null,
  metasEvangelizacao:     [],
  termometroMissionario:  null,
  conselhoEconomico:      [],
  manutencaoPatrimonial:  [],
  inventario:             [],
  prestacaoContas:        [],
  versiculoIdx:           0,
  filterLancamentos:  'todos',
  filterVoluntarios:  'todos',
  filterMembros:      'todos',
  selectedTemplate:   null,
  loading:            false
};

/* ── Utilitários ────────────────────────────────────────────── */
const $ = id => document.getElementById(id);

const fmt = {
  moeda: v  => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
  data:  d  => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR'),
  pct:   v  => Number(v).toFixed(1) + '%',
  mes:   () => new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
};

const toast = (msg, tipo = 'info', dur = 4000) => {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast ${tipo}`;
  const iconEl = document.createElement('span');
  iconEl.textContent = icons[tipo] || '';
  const msgEl = document.createElement('span');
  msgEl.textContent = msg;
  el.appendChild(iconEl);
  el.appendChild(msgEl);
  $('toast-container').appendChild(el);
  setTimeout(() => {
    el.style.animation = 'slideOutRight 0.3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }, dur);
};

const openModal = id => {
  $(id).classList.add('open');
  document.body.style.overflow = 'hidden';
};
const closeModal = id => {
  $(id).classList.remove('open');
  document.body.style.overflow = '';
};

const copyText = (txt, btn) => {
  navigator.clipboard.writeText(txt).then(() => {
    if (btn) { btn.textContent = '✓ Copiado!'; btn.classList.add('copied'); }
    toast('Copiado para a área de transferência!', 'success', 2000);
    setTimeout(() => {
      if (btn) { btn.textContent = 'Copiar'; btn.classList.remove('copied'); }
    }, 2000);
  }).catch(() => toast('Não foi possível copiar', 'error'));
};

const normalizarTexto = (v = '') => String(v)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase();

const CATEGORIA_DIZIMISTA = 'Dizimista';

/* ── Navegação ──────────────────────────────────────────────── */
const navigate = pageName => {
  if (State.currentPage === pageName) return;
  State.currentPage = pageName;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = $(`page-${pageName}`);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(i => {
    i.classList.toggle('active', i.dataset.page === pageName);
  });

  const titles = {
    dashboard:    ['Dashboard',          'Visão geral do sistema'],
    financeiro:   ['Financeiro',         'Receitas, despesas e transparência'],
    metas:        ['Termômetro de Metas','Acompanhe os projetos da paróquia'],
    dizimo:       ['Dízimo Digital',     'Minha Oferta de Gratidão'],
    voluntarios:  ['Banco de Voluntários','Talentos da comunidade'],
    comunicacao:  ['Comunicação',        'Mensagens via WhatsApp'],
    membros:      ['Membros',            'Gestão de dizimistas e paroquianos'],
    caridade:     ['Impacto da Caridade','Laudato Si\' / EG 198'],
    evangelizacao:['Evangelização',      'Termômetro Missionário (Doc. 105 CNBB)'],
    conselho:     ['Conselho Econômico', 'Atas e deliberações (cân. 537)'],
    patrimonio:   ['Patrimônio',         'Manutenção e inventário (cân. 1283-1284)'],
    transparencia:['Transparência Pública','Prestação de contas (cân. 1287)'],
    relatorios:   ['Relatórios',         'Exportar e analisar dados'],
    configuracoes:['Configurações',      'Preferências do sistema']
  };
  const [t, s] = titles[pageName] || ['', ''];
  const el = $('page-title-text');
  if (el) el.innerHTML = `${t}<span>${s}</span>`;

  // Fechar sidebar no mobile
  if (window.innerWidth <= 768) closeSidebar();

  // Renderizar conteúdo dinâmico da página
  renderPage(pageName);
};

/* ── Sidebar (mobile) ───────────────────────────────────────── */
const openSidebar = () => {
  $('sidebar').classList.add('open');
  $('sidebar-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
};
const closeSidebar = () => {
  $('sidebar').classList.remove('open');
  $('sidebar-overlay').classList.remove('open');
  document.body.style.overflow = '';
};

/* ── Render por Página ──────────────────────────────────────── */
const renderPage = page => {
  switch (page) {
    case 'dashboard':    renderDashboard();   break;
    case 'financeiro':   renderFinanceiro();  break;
    case 'metas':        renderMetas();       break;
    case 'dizimo':       renderDizimo();      break;
    case 'voluntarios':  renderVoluntarios(); break;
    case 'comunicacao':  renderComunicacao(); break;
    case 'membros':      renderMembros();     break;
    case 'caridade':     renderCaridade();    break;
    case 'evangelizacao':renderEvangelizacao();break;
    case 'conselho':     renderConselho();    break;
    case 'patrimonio':   renderPatrimonio();  break;
    case 'transparencia':renderTransparencia();break;
    case 'relatorios':   renderRelatorios();  break;
    case 'configuracoes':renderConfiguracoes();break;
  }
};

/* ══════════════════════════════════════════════════════════════
   DASHBOARD
   ══════════════════════════════════════════════════════════════ */
const renderDashboard = () => {
  const { financeiro: fin, lancamentos, metas, voluntarios, membros, paroquia } = State;
  if (!fin) return;

  const saldoPct  = Math.round((fin.saldo_mes / fin.receita_mes) * 100);
  const metaPct   = Math.round((fin.receita_mes / fin.meta_mensal) * 100);
  const lancamentos_hoje = lancamentos.filter(l => l.data === new Date().toISOString().split('T')[0]).length;

  const kpiHtml = `
    <div class="kpi-card purple">
      <span class="kpi-icon">💰</span>
      <div class="kpi-value text-success">${fmt.moeda(fin.receita_mes)}</div>
      <div class="kpi-label">Receita do Mês</div>
      <div class="kpi-trend text-success">▲ Meta ${fmt.pct(metaPct)}</div>
    </div>
    <div class="kpi-card red">
      <span class="kpi-icon">📤</span>
      <div class="kpi-value text-danger">${fmt.moeda(fin.despesa_mes)}</div>
      <div class="kpi-label">Despesas do Mês</div>
      <div class="kpi-trend text-muted">Mês atual</div>
    </div>
    <div class="kpi-card green">
      <span class="kpi-icon">🏦</span>
      <div class="kpi-value ${fin.saldo_mes >= 0 ? 'text-success' : 'text-danger'}">${fmt.moeda(fin.saldo_mes)}</div>
      <div class="kpi-label">Saldo do Mês</div>
      <div class="kpi-trend ${fin.saldo_mes >= 0 ? 'text-success' : 'text-danger'}">${saldoPct}% de margem</div>
    </div>
    <div class="kpi-card gold">
      <span class="kpi-icon">🙏</span>
      <div class="kpi-value text-accent">${fin.dizimistas_ativos}</div>
      <div class="kpi-label">Dizimistas Ativos</div>
      <div class="kpi-trend text-muted">${membros.length} membros total</div>
    </div>
    <div class="kpi-card blue">
      <span class="kpi-icon">🎯</span>
      <div class="kpi-value">${metas.filter(m => m.status === 'ativa').length}</div>
      <div class="kpi-label">Metas em Andamento</div>
      <div class="kpi-trend text-success">${metas.filter(m => m.status === 'concluida').length} concluídas</div>
    </div>
    <div class="kpi-card purple">
      <span class="kpi-icon">🤝</span>
      <div class="kpi-value">${voluntarios.length}</div>
      <div class="kpi-label">Voluntários Cadastrados</div>
      <div class="kpi-trend text-muted">Banco de talentos</div>
    </div>
  `;
  $('dashboard-kpis').innerHTML = kpiHtml;

  // Mini-chart de evolução no dashboard
  const hist = fin.historico_meses;
  Charts.renderLinha('chart-dashboard', hist.map(h => h.mes),
    [
      { label: 'Receitas', data: hist.map(h => h.receita) },
      { label: 'Despesas', data: hist.map(h => h.despesa) }
    ]
  );

  // Meta mensal progress
  const mp = Math.min(metaPct, 100);
  $('meta-mensal-bar').style.width = mp + '%';
  $('meta-mensal-pct').textContent = fmt.pct(mp);
  $('meta-mensal-valor').textContent = `${fmt.moeda(fin.receita_mes)} / ${fmt.moeda(fin.meta_mensal)}`;

  // Atividade recente
  const atv = lancamentos.slice(0, 5).map(l => `
    <div class="activity-item">
      <div class="activity-dot ${l.tipo === 'receita' ? 'green' : 'red'}"></div>
      <div class="activity-text">
        <strong>${l.descricao}</strong>
        <span class="${l.tipo === 'receita' ? 'text-success' : 'text-danger'} fw-bold">${l.tipo === 'receita' ? '+' : '-'}${fmt.moeda(l.valor)}</span>
      </div>
      <div class="activity-time">${fmt.data(l.data)}</div>
    </div>
  `).join('');
  $('atividade-recente').innerHTML = atv || '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">Sem lançamentos recentes</div></div>';
};

/* ══════════════════════════════════════════════════════════════
   FINANCEIRO
   ══════════════════════════════════════════════════════════════ */
const renderFinanceiro = () => {
  const { financeiro: fin, lancamentos } = State;
  if (!fin) return;

  // KPIs
  $('fin-receita-mes').textContent  = fmt.moeda(fin.receita_mes);
  $('fin-despesa-mes').textContent  = fmt.moeda(fin.despesa_mes);
  $('fin-saldo-mes').textContent    = fmt.moeda(fin.saldo_mes);
  $('fin-receita-ano').textContent  = fmt.moeda(fin.receita_ano);
  $('fin-despesa-ano').textContent  = fmt.moeda(fin.despesa_ano);
  $('fin-saldo-ano').textContent    = fmt.moeda(fin.saldo_ano);

  // Gráficos
  const hist = fin.historico_meses;
  Charts.renderBarras('chart-barras', hist.map(h => h.mes), hist.map(h => h.receita), hist.map(h => h.despesa));
  Charts.renderRosca('chart-rosca',
    fin.distribuicao.map(d => d.categoria),
    fin.distribuicao.map(d => d.valor),
    fin.distribuicao.map(d => d.cor)
  );
  Charts.renderLinha('chart-linha', hist.map(h => h.mes),
    [
      { label: 'Receitas', data: hist.map(h => h.receita) },
      { label: 'Despesas', data: hist.map(h => h.despesa) }
    ]
  );

  renderTabelaLancamentos();
};

const renderTabelaLancamentos = () => {
  const { lancamentos, filterLancamentos } = State;
  const filtered = filterLancamentos === 'todos'
    ? lancamentos
    : lancamentos.filter(l => l.tipo === filterLancamentos);

  const tbody = $('tbody-lancamentos');
  if (!tbody) return;

  tbody.innerHTML = filtered.map(l => `
    <tr>
      <td>${fmt.data(l.data)}</td>
      <td>${l.descricao}</td>
      <td><span class="badge ${l.tipo === 'receita' ? 'badge-green' : 'badge-red'}">${l.tipo === 'receita' ? '▲ Receita' : '▼ Despesa'}</span></td>
      <td><span class="badge badge-purple">${l.categoria}</span></td>
      <td class="${l.tipo === 'receita' ? 'text-success' : 'text-danger'} fw-bold">${l.tipo === 'receita' ? '+' : '-'}${fmt.moeda(l.valor)}</td>
      <td>${l.responsavel}</td>
      <td>
        <button class="btn btn-outline btn-sm btn-icon" onclick="excluirLancamento(${l.id})" title="Excluir">🗑️</button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">Nenhum lançamento encontrado</div></div></td></tr>`;
};

window.excluirLancamento = id => {
  if (!confirm('Deseja excluir este lançamento?')) return;
  State.lancamentos = State.lancamentos.filter(l => l.id !== id);
  renderTabelaLancamentos();
  toast('Lançamento excluído!', 'success');
};

/* ── Formulário de Novo Lançamento ──────────────────────────── */
const salvarLancamento = async () => {
  const form = {
    descricao:   $('lanc-descricao').value.trim(),
    tipo:        $('lanc-tipo').value,
    valor:       parseFloat($('lanc-valor').value),
    categoria:   $('lanc-categoria').value,
    data:        $('lanc-data').value,
    responsavel: $('lanc-responsavel').value.trim()
  };
  if (!form.descricao || !form.valor || !form.data) {
    return toast('Preencha todos os campos obrigatórios.', 'warning');
  }
  form.id = Date.now();
  State.lancamentos.unshift(form);

  if (form.tipo === 'receita') State.financeiro.receita_mes += form.valor;
  else                         State.financeiro.despesa_mes += form.valor;
  State.financeiro.saldo_mes = State.financeiro.receita_mes - State.financeiro.despesa_mes;

  closeModal('modal-lancamento');
  renderFinanceiro();
  toast('Lançamento registrado com sucesso!', 'success');

  // Enviar ao Apps Script em background
  API.addLancamento(form).catch(() => {});
};

/* ══════════════════════════════════════════════════════════════
   METAS
   ══════════════════════════════════════════════════════════════ */
const renderMetas = () => {
  const { metas } = State;

  const grid = $('metas-grid');
  if (!grid) return;

  grid.innerHTML = metas.map(m => {
    const pct = Math.min(Math.round((m.arrecadado / m.meta) * 100), 100);
    const barClass = m.status === 'concluida' ? 'success' : m.status === 'urgente' ? 'danger' : '';
    const statusLabels = { ativa: 'Em Andamento', urgente: '🔴 Urgente', concluida: '✅ Concluída' };

    return `
      <div class="meta-card">
        <div class="meta-header">
          <div class="meta-emoji">${m.emoji}</div>
          <div class="meta-info">
            <div class="meta-title">${m.titulo}</div>
            <div class="meta-desc">${m.descricao}</div>
          </div>
          <span class="meta-status ${m.status}">${statusLabels[m.status]}</span>
        </div>
        <div class="progress-wrap">
          <div class="progress-label">
            <span>${fmt.pct(pct)} arrecadado</span>
            <span class="meta-amount">${fmt.moeda(m.arrecadado)}</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill ${barClass}" data-target="${pct}" style="width:0%"></div>
          </div>
        </div>
        <div class="meta-footer">
          <span>Meta: <strong>${fmt.moeda(m.meta)}</strong></span>
          <span>Prazo: ${fmt.data(m.prazo)}</span>
        </div>
        ${m.status !== 'concluida' ? `
        <div class="flex gap-1 mt-2">
          <button class="btn btn-accent btn-sm flex-1" onclick="contribuirMeta(${m.id})">💛 Contribuir</button>
          <button class="btn btn-outline btn-sm btn-icon" onclick="editarMeta(${m.id})" title="Editar">✏️</button>
          <button class="btn btn-outline btn-sm btn-icon" onclick="excluirMeta(${m.id})" title="Excluir">🗑️</button>
        </div>` : ''}
      </div>
    `;
  }).join('') || `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🎯</div><div class="empty-state-text">Nenhuma meta cadastrada</div></div>`;

  // Animar barras
  requestAnimationFrame(() => {
    document.querySelectorAll('.progress-bar-fill[data-target]').forEach(bar => {
      setTimeout(() => { bar.style.width = bar.dataset.target + '%'; }, 100);
    });
  });
};

window.contribuirMeta = id => {
  navigate('dizimo');
  setTimeout(() => toast('Escolha o valor e registre sua contribuição para esta meta!', 'info'), 300);
};

window.editarMeta = id => {
  const meta = State.metas.find(m => m.id === id);
  if (!meta) return;
  $('meta-titulo').value      = meta.titulo;
  $('meta-descricao').value   = meta.descricao;
  $('meta-valor-total').value = meta.meta;
  $('meta-prazo').value       = meta.prazo;
  $('meta-emoji').value       = meta.emoji;
  $('modal-meta').dataset.editId = id;
  openModal('modal-meta');
};

window.excluirMeta = id => {
  if (!confirm('Deseja excluir esta meta?')) return;
  State.metas = State.metas.filter(m => m.id !== id);
  renderMetas();
  toast('Meta excluída.', 'success');
};

const salvarMeta = async () => {
  const editId = parseInt($('modal-meta').dataset.editId || '0');
  const form = {
    emoji:      $('meta-emoji').value.trim() || '🎯',
    titulo:     $('meta-titulo').value.trim(),
    descricao:  $('meta-descricao').value.trim(),
    meta:       parseFloat($('meta-valor-total').value),
    arrecadado: parseFloat($('meta-arrecadado').value || '0'),
    prazo:      $('meta-prazo').value,
    status:     $('meta-status-sel').value
  };
  if (!form.titulo || !form.meta || !form.prazo) return toast('Preencha todos os campos obrigatórios.', 'warning');

  if (editId) {
    const idx = State.metas.findIndex(m => m.id === editId);
    if (idx !== -1) State.metas[idx] = { ...State.metas[idx], ...form };
  } else {
    form.id = Date.now();
    State.metas.push(form);
  }

  closeModal('modal-meta');
  delete $('modal-meta').dataset.editId;
  renderMetas();
  toast('Meta salva com sucesso!', 'success');
  API.addMeta(form).catch(() => {});
};

/* ══════════════════════════════════════════════════════════════
   DÍZIMO DIGITAL — Minha Oferta de Gratidão (Doc. 106 CNBB)
   ══════════════════════════════════════════════════════════════ */

/** Sorteia um versículo (rotação determinística pelo dia + clique) */
const renderVersiculo = () => {
  const lista = (DEMO_DATA.versiculos || []);
  if (!lista.length) return;
  const v = lista[State.versiculoIdx % lista.length];
  const txt = $('versiculo-texto');
  const ref = $('versiculo-ref');
  if (txt) txt.textContent = '"' + v.texto + '"';
  if (ref) ref.textContent = '— ' + v.ref;
};

const renderDizimo = () => {
  const { paroquia, membros } = State;
  if (!paroquia) return;

  // Versículo do dia (índice estável por dia)
  const dia = new Date();
  State.versiculoIdx = (dia.getFullYear() * 1000 + dia.getMonth() * 31 + dia.getDate())
                       % (DEMO_DATA.versiculos?.length || 1);
  renderVersiculo();

  $('pix-chave-val').textContent   = paroquia.pixChave;
  $('pix-tipo-val').textContent    = paroquia.pixTipo;
  $('pix-nome-val').textContent    = paroquia.pixNome;
  $('pix-banco-val').textContent   = paroquia.pixBanco;
  $('pix-chave-copy').dataset.val  = paroquia.pixChave;

  // Renderizar tabela de dizimistas recentes
  const tbody = $('tbody-dizimistas');
  if (tbody) {
    tbody.innerHTML = membros.filter(m => m.categoria === 'Dizimista' || m.categoria === 'Colaborador').map(m => `
      <tr>
        <td>${m.nome}</td>
        <td><span class="badge ${m.categoria === 'Dizimista' ? 'badge-purple' : 'badge-blue'}">${m.categoria}</span></td>
        <td class="${m.status === 'ativo' ? 'text-success' : 'text-danger'}">${m.status}</td>
        <td>${m.ultimoDizimo !== '—' ? fmt.data(m.ultimoDizimo) : '—'}</td>
        <td class="fw-bold text-accent">${m.valor > 0 ? fmt.moeda(m.valor) : '—'}</td>
        <td>
          <button class="btn btn-whatsapp btn-sm btn-icon" onclick="enviarWhatsApp('${m.telefone}','agradecimento-dizimo','${m.nome}')" title="WhatsApp">💬</button>
        </td>
      </tr>
    `).join('');
  }
};

const salvarDizimo = () => {
  const nome     = $('dizimo-nome').value.trim();
  const valor    = parseFloat($('dizimo-valor').value);
  const data     = $('dizimo-data').value;
  const intencao = $('dizimo-intencao')?.value.trim() || '';
  if (!nome || !valor || !data) return toast('Preencha todos os campos.', 'warning');

  const membro = State.membros.find(m => m.nome.toLowerCase() === nome.toLowerCase());
  if (membro) {
    membro.ultimoDizimo = data;
    membro.valor        = valor;
  }
  State.financeiro.receita_mes  += valor;
  State.financeiro.saldo_mes    = State.financeiro.receita_mes - State.financeiro.despesa_mes;
  State.lancamentos.unshift({ id: Date.now(), data, descricao: `Dízimo – ${nome}`, tipo: 'receita', valor, categoria: 'Dízimo', responsavel: nome });

  closeModal('modal-dizimo-reg');
  if ($('dizimo-intencao')) $('dizimo-intencao').value = '';
  renderDizimo();

  // Mensagem pastoral rotativa de agradecimento
  const ag = (DEMO_DATA.mensagensAgradecimento || []);
  if (ag.length) {
    const msg = ag[Math.floor(Math.random() * ag.length)];
    toast(`Dízimo de ${nome} registrado! ${msg.texto} ${msg.versiculo}`, 'success', 6000);
  } else {
    toast(`Dízimo de ${nome} registrado!`, 'success');
  }

  if (intencao) {
    toast('🙏 Intenção de oração registrada com sigilo pastoral.', 'info', 4500);
  }

  API.registrarDizimo({ nome, valor, data, intencao }).catch(() => {});
};

/* ══════════════════════════════════════════════════════════════
   VOLUNTÁRIOS
   ══════════════════════════════════════════════════════════════ */
const renderVoluntarios = () => {
  const { voluntarios, filterVoluntarios } = State;
  const search = ($('vol-search')?.value || '').toLowerCase();

  const filtered = voluntarios.filter(v => {
    const matchSearch = !search || v.nome.toLowerCase().includes(search) || v.profissao.toLowerCase().includes(search) || v.tags.some(t => t.toLowerCase().includes(search));
    const matchFilter = filterVoluntarios === 'todos' || v.tags.some(t => t.toLowerCase() === filterVoluntarios);
    return matchSearch && matchFilter;
  });

  const grid = $('vol-grid');
  if (!grid) return;

  grid.innerHTML = filtered.map(v => `
    <div class="vol-card" onclick="verVoluntario(${v.id})">
      <div class="vol-header">
        <div class="vol-avatar">${v.foto}</div>
        <div>
          <div class="vol-name">${v.nome}</div>
          <div class="vol-profession">${v.profissao}</div>
        </div>
      </div>
      <div class="vol-tags">${v.tags.map(t => `<span class="vol-tag">${t}</span>`).join('')}</div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.75rem">🕐 ${v.disponibilidade}</div>
      <div class="vol-actions">
        <button class="btn btn-whatsapp btn-sm flex-1" onclick="event.stopPropagation();enviarWhatsApp('${v.telefone}','aviso-evento','${v.nome}')">💬 WhatsApp</button>
        <button class="btn btn-outline btn-sm btn-icon" onclick="event.stopPropagation();editarVoluntario(${v.id})" title="Editar">✏️</button>
        <button class="btn btn-outline btn-sm btn-icon" onclick="event.stopPropagation();excluirVoluntario(${v.id})" title="Excluir">🗑️</button>
      </div>
    </div>
  `).join('') || `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🤝</div><div class="empty-state-text">Nenhum voluntário encontrado</div></div>`;

  $('vol-count').textContent = `${filtered.length} voluntário${filtered.length !== 1 ? 's' : ''}`;
};

window.verVoluntario = id => {
  const v = State.voluntarios.find(x => x.id === id);
  if (!v) return;
  toast(`${v.foto} ${v.nome} – ${v.profissao} | ${v.disponibilidade}`, 'info', 3000);
};

window.editarVoluntario = id => {
  const v = State.voluntarios.find(x => x.id === id);
  if (!v) return;
  $('vol-nome').value          = v.nome;
  $('vol-profissao').value     = v.profissao;
  $('vol-tags-input').value    = v.tags.join(', ');
  $('vol-telefone').value      = v.telefone;
  $('vol-disponibilidade').value = v.disponibilidade;
  $('modal-voluntario').dataset.editId = id;
  openModal('modal-voluntario');
};

window.excluirVoluntario = id => {
  if (!confirm('Remover este voluntário?')) return;
  State.voluntarios = State.voluntarios.filter(v => v.id !== id);
  renderVoluntarios();
  toast('Voluntário removido.', 'success');
};

const salvarVoluntario = () => {
  const editId = parseInt($('modal-voluntario').dataset.editId || '0');
  const form = {
    nome:          $('vol-nome').value.trim(),
    profissao:     $('vol-profissao').value.trim(),
    tags:          $('vol-tags-input').value.split(',').map(t => t.trim()).filter(Boolean),
    telefone:      $('vol-telefone').value.replace(/\D/g,''),
    disponibilidade: $('vol-disponibilidade').value.trim(),
    foto:          '👤'
  };
  if (!form.nome || !form.profissao) return toast('Nome e profissão são obrigatórios.', 'warning');

  if (editId) {
    const idx = State.voluntarios.findIndex(v => v.id === editId);
    if (idx !== -1) State.voluntarios[idx] = { ...State.voluntarios[idx], ...form };
  } else {
    form.id = Date.now();
    State.voluntarios.push(form);
  }
  closeModal('modal-voluntario');
  delete $('modal-voluntario').dataset.editId;
  renderVoluntarios();
  toast('Voluntário salvo!', 'success');
  API.addVoluntario(form).catch(() => {});
};

/* ══════════════════════════════════════════════════════════════
   MEMBROS
   ══════════════════════════════════════════════════════════════ */
const renderMembros = () => {
  const { membros, filterMembros } = State;
  const search = ($('mem-search')?.value || '').toLowerCase();

  const filtered = membros.filter(m => {
    const matchSearch = !search || m.nome.toLowerCase().includes(search);
    const matchFilter = filterMembros === 'todos' ||
      m.status === filterMembros ||
      normalizarTexto(m.categoria) === normalizarTexto(filterMembros);
    return matchSearch && matchFilter;
  });

  const tbody = $('tbody-membros');
  if (!tbody) return;

  tbody.innerHTML = filtered.map(m => `
    <tr>
      <td>${m.nome}</td>
      <td><span class="badge ${m.categoria === CATEGORIA_DIZIMISTA ? 'badge-purple' : m.categoria === 'Colaborador' ? 'badge-blue' : 'badge-gold'}">${m.categoria}</span></td>
      <td><span class="badge ${m.status === 'ativo' ? 'badge-green' : 'badge-red'}">${m.status}</span></td>
      <td>${m.ultimoDizimo !== '—' ? fmt.data(m.ultimoDizimo) : '—'}</td>
      <td class="${m.valor > 0 ? 'text-accent fw-bold' : 'text-muted'}">${m.valor > 0 ? fmt.moeda(m.valor) : '—'}</td>
      <td>
        <button class="btn btn-whatsapp btn-sm btn-icon" onclick="enviarWhatsApp('${m.telefone}','agradecimento-dizimo','${m.nome}')" title="WhatsApp">💬</button>
        ${normalizarTexto(m.categoria) === 'nao dizimista' ? `<button class="btn btn-primary btn-sm" onclick="marcarComoDizimista(${m.id})" title="Converter para dizimista">✅ Dizimista</button>` : ''}
        <button class="btn btn-outline btn-sm btn-icon" onclick="editarMembro(${m.id})" title="Editar">✏️</button>
        <button class="btn btn-outline btn-sm btn-icon" onclick="excluirMembro(${m.id})" title="Excluir">🗑️</button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">👥</div><div class="empty-state-text">Nenhum membro encontrado</div></div></td></tr>`;
};

window.marcarComoDizimista = id => {
  const idx = State.membros.findIndex(m => m.id === id);
  if (idx === -1) return;
  State.membros[idx].categoria = CATEGORIA_DIZIMISTA;
  renderMembros();
  toast('Fiel convertido para dizimista.', 'success');
  API.updateMembro(State.membros[idx]).catch(() => toast('Não foi possível atualizar no servidor agora.', 'warning'));
};

window.editarMembro = id => {
  const m = State.membros.find(x => x.id === id);
  if (!m) return;
  $('mem-nome').value       = m.nome;
  $('mem-telefone').value   = m.telefone;
  $('mem-categoria').value  = m.categoria;
  $('mem-status').value     = m.status;
  $('modal-membro').dataset.editId = id;
  openModal('modal-membro');
};

window.excluirMembro = id => {
  if (!confirm('Remover este membro?')) return;
  State.membros = State.membros.filter(m => m.id !== id);
  renderMembros();
  toast('Membro removido.', 'success');
};

const salvarMembro = () => {
  const editId = parseInt($('modal-membro').dataset.editId || '0');
  const form = {
    nome:      $('mem-nome').value.trim(),
    telefone:  $('mem-telefone').value.replace(/\D/g,''),
    categoria: $('mem-categoria').value,
    status:    $('mem-status').value,
    ultimoDizimo: '—', valor: 0
  };
  if (!form.nome) return toast('Nome é obrigatório.', 'warning');

  if (editId) {
    const idx = State.membros.findIndex(m => m.id === editId);
    if (idx !== -1) State.membros[idx] = { ...State.membros[idx], ...form };
  } else {
    form.id = Date.now();
    State.membros.push(form);
    if (form.telefone) {
      setTimeout(() => enviarWhatsApp(form.telefone, 'boas-vindas', form.nome), 500);
    }
  }
  closeModal('modal-membro');
  delete $('modal-membro').dataset.editId;
  renderMembros();
  toast('Membro salvo!', 'success');
  API.addMembro(form).catch(() => {});
};

/* ══════════════════════════════════════════════════════════════
   COMUNICAÇÃO / WHATSAPP
   ══════════════════════════════════════════════════════════════ */
const renderComunicacao = () => {
  const templates = DEMO_DATA.whatsappTemplates;

  const list = $('template-list');
  if (list) {
    list.innerHTML = templates.map(t => `
      <div class="template-card" data-id="${t.id}" onclick="selecionarTemplate('${t.id}')">
        <div class="template-title">${t.titulo}</div>
        <div class="template-preview">${t.texto.replace(/\n/g,' ').substring(0,90)}…</div>
      </div>
    `).join('');
  }

  // Preencher select de membros
  const sel = $('wa-destinatario');
  if (sel) {
    sel.innerHTML = `<option value="">-- Selecione um membro --</option>` +
      State.membros.map(m => `<option value="${m.telefone}" data-nome="${m.nome}">${m.nome}</option>`).join('');
  }
};

window.selecionarTemplate = id => {
  const tmpl = DEMO_DATA.whatsappTemplates.find(t => t.id === id);
  if (!tmpl) return;
  State.selectedTemplate = tmpl;

  document.querySelectorAll('.template-card').forEach(c => c.classList.toggle('selected', c.dataset.id === id));
  atualizarPreviewWA();
};

const atualizarPreviewWA = () => {
  const tmpl = State.selectedTemplate;
  if (!tmpl) return;
  const sel   = $('wa-destinatario');
  const nome  = sel?.selectedOptions[0]?.dataset.nome || '{NOME}';
  const valor = $('wa-valor')?.value || '{VALOR}';
  const mes   = fmt.mes();
  const evento= $('wa-evento')?.value || '{EVENTO}';
  const data  = $('wa-data-evento')?.value ? fmt.data($('wa-data-evento').value) : '{DATA}';
  const hora  = $('wa-hora')?.value || '{HORA}';
  const local = $('wa-local')?.value || '{LOCAL}';
  const meta  = $('wa-meta-nome')?.value || '{META}';

  let txt = tmpl.texto
    .replace(/{NOME}/g, nome)
    .replace(/{VALOR}/g, valor)
    .replace(/{MES}/g, mes)
    .replace(/{EVENTO}/g, evento)
    .replace(/{DATA}/g, data)
    .replace(/{HORA}/g, hora)
    .replace(/{LOCAL}/g, local)
    .replace(/{META}/g, meta);

  const preview = $('wa-preview-text');
  if (preview) {
    const escaped = txt
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    preview.innerHTML = escaped
      .replace(/\n/g, '<br>')
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>');
  }

  const now = new Date();
  const hora_atual = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
  const time = $('wa-preview-time');
  if (time) time.textContent = hora_atual + ' ✓✓';

  $('wa-preview-bubble')?.classList.remove('hidden');
};

window.enviarWhatsApp = (telefone, templateId, nome) => {
  if (!telefone) return toast('Telefone não cadastrado.', 'warning');
  const tmpl = DEMO_DATA.whatsappTemplates.find(t => t.id === templateId);
  const txt  = tmpl ? tmpl.texto.replace(/{NOME}/g, nome) : `Olá, ${nome}!`;
  const url  = `https://wa.me/${telefone}?text=${encodeURIComponent(txt)}`;
  window.open(url, '_blank', 'noopener');
  toast(`Abrindo WhatsApp para ${nome}…`, 'success', 2500);
};

const enviarMensagem = () => {
  const sel     = $('wa-destinatario');
  const telefone= sel?.value;
  const nome    = sel?.selectedOptions[0]?.dataset.nome || '';
  const preview = $('wa-preview-text');
  if (!telefone) return toast('Selecione um destinatário.', 'warning');
  if (!State.selectedTemplate) return toast('Selecione um modelo de mensagem.', 'warning');

  const txt = preview?.innerText || '';
  const url = `https://wa.me/${telefone}?text=${encodeURIComponent(txt)}`;
  window.open(url, '_blank', 'noopener');
  toast(`WhatsApp aberto para ${nome}!`, 'success');
};

const enviarParaTodos = () => {
  if (!State.selectedTemplate) return toast('Selecione um modelo de mensagem.', 'warning');
  if (!confirm(`Enviar para TODOS os ${State.membros.length} membros?`)) return;

  let i = 0;
  State.membros.forEach((m, idx) => {
    if (!m.telefone) return;
    setTimeout(() => {
      const txt = State.selectedTemplate.texto.replace(/{NOME}/g, m.nome);
      window.open(`https://wa.me/${m.telefone}?text=${encodeURIComponent(txt)}`, '_blank', 'noopener');
    }, idx * 800);
    i++;
  });
  toast(`${i} conversas abertas no WhatsApp!`, 'success');
};

/* ══════════════════════════════════════════════════════════════
   RELATÓRIOS
   ══════════════════════════════════════════════════════════════ */
const renderRelatorios = () => {
  // Conteúdo estático renderizado no HTML
};

const exportarRelatorio = tipo => {
  const relatorios = {
    financeiro:  () => exportCSV(State.lancamentos, 'relatorio-financeiro'),
    voluntarios: () => exportCSV(State.voluntarios, 'banco-voluntarios'),
    membros:     () => exportCSV(State.membros, 'lista-membros'),
    metas:       () => exportCSV(State.metas, 'metas-projetos')
  };
  relatorios[tipo]?.();
};

const exportCSV = (data, filename) => {
  if (!data.length) return toast('Sem dados para exportar.', 'warning');
  const keys = Object.keys(data[0]).filter(k => k !== 'foto');
  const header = keys.join(';') + '\n';
  const rows   = data.map(row => keys.map(k => `"${String(row[k] ?? '').replace(/"/g,'""')}"`).join(';')).join('\n');
  const blob   = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href = url; a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click(); URL.revokeObjectURL(url);
  toast('Relatório exportado!', 'success');
};

/* ══════════════════════════════════════════════════════════════
   CONFIGURAÇÕES
   ══════════════════════════════════════════════════════════════ */
const renderConfiguracoes = () => {
  const p = State.paroquia;
  if (!p) return;
  const fields = ['cfg-nome','cfg-endereco','cfg-telefone','cfg-pix-chave','cfg-pix-tipo','cfg-pix-nome','cfg-pix-banco','cfg-whatsapp'];
  const vals   = [p.nome, p.endereco, p.telefone, p.pixChave, p.pixTipo, p.pixNome, p.pixBanco, p.whatsappAdmin];
  fields.forEach((id, i) => { const el = $(id); if (el) el.value = vals[i] || ''; });
  // URL do Web App (Apps Script) – lida da configuração global
  const urlEl = $('cfg-apps-script-url');
  if (urlEl) urlEl.value = (window.SUSTEN_CONFIG && window.SUSTEN_CONFIG.appsScriptUrl) || '';
};

const salvarConfiguracoes = async () => {
  const p = State.paroquia;
  p.nome          = $('cfg-nome').value.trim();
  p.endereco      = $('cfg-endereco').value.trim();
  p.telefone      = $('cfg-telefone').value.trim();
  p.pixChave      = $('cfg-pix-chave').value.trim();
  p.pixTipo       = $('cfg-pix-tipo').value.trim();
  p.pixNome       = $('cfg-pix-nome').value.trim();
  p.pixBanco      = $('cfg-pix-banco').value.trim();
  p.whatsappAdmin = $('cfg-whatsapp').value.replace(/\D/g,'');
  // Persiste a URL do Web App para uso imediato pela camada API
  const urlEl = $('cfg-apps-script-url');
  if (urlEl && window.SUSTEN_CONFIG_API) {
    window.SUSTEN_CONFIG_API.set({ appsScriptUrl: urlEl.value.trim() });
  }
  toast('Configurações salvas!', 'success');
  API.saveConfig(p).catch(() => {});
};

/* ══════════════════════════════════════════════════════════════
   CARIDADE — Dashboard "Impacto Laudato Si'" (EG 198, cân. 1267 §3)
   ══════════════════════════════════════════════════════════════ */
const _CORES_CARIDADE = ['#f5a623','#e74c3c','#27ae60','#2980b9','#9b6de0','#7f8c8d'];

const renderCaridade = () => {
  const imp = State.impactoCaridade;
  const fundo = State.fundoCaritativo || [];
  if (!imp) return;

  $('car-familias-mes').textContent = imp.familias_mes;
  $('car-familias-ano').textContent = imp.familias_ano;
  $('car-kg-alimentos').textContent = (Number(imp.kg_alimentos_ano) || 0).toLocaleString('pt-BR') + ' kg';
  $('car-total-ano').textContent    = fmt.moeda(imp.total_caridade_ano);
  $('car-pct-pobres').textContent   = fmt.pct(imp.pct_pobres);
  const meta = Number(imp.meta_pct_pobres || 10);
  const elMeta = $('car-pct-meta');
  if (elMeta) {
    const ok = imp.pct_pobres >= meta;
    elMeta.textContent = `Meta EG 198: ≥${meta}% — ${ok ? '✅ Atingida' : '⚠️ Abaixo'}`;
    elMeta.className   = 'kpi-trend ' + (ok ? 'text-success' : 'text-danger');
  }

  // Distribuição
  if (imp.distribuicao && imp.distribuicao.length) {
    Charts.renderRosca('chart-caridade',
      imp.distribuicao.map(d => d.categoria),
      imp.distribuicao.map(d => d.valor),
      imp.distribuicao.map((_, i) => _CORES_CARIDADE[i % _CORES_CARIDADE.length])
    );
  }

  // Gauge meta % aos pobres
  const gauge = Math.min(Math.round((imp.pct_pobres / Math.max(meta, 1)) * 100), 100);
  Charts.renderGauge('gauge-caridade', gauge, gauge >= 100 ? '#27ae60' : '#f5a623');
  const gLabel = $('gauge-caridade-label');
  if (gLabel) gLabel.textContent = fmt.pct(imp.pct_pobres);

  // Tabela
  const tbody = $('tbody-caritativo');
  if (tbody) {
    tbody.innerHTML = fundo.map(f => `
      <tr>
        <td>${fmt.data(f.data)}</td>
        <td><span class="badge ${f.tipo === 'Saída' ? 'badge-red' : 'badge-green'}">${f.tipo}</span></td>
        <td>${escapeHtml(f.origem_destino)}</td>
        <td><span class="badge badge-purple">${escapeHtml(f.categoria)}</span></td>
        <td>${f.familias_atendidas || 0}</td>
        <td>${(Number(f.quilos_alimentos) || 0).toLocaleString('pt-BR')}</td>
        <td class="fw-bold ${f.tipo === 'Saída' ? 'text-danger' : 'text-success'}">${fmt.moeda(f.valor)}</td>
        <td>${escapeHtml(f.responsavel_pastoral_social || '—')}</td>
        <td><button class="btn btn-outline btn-sm btn-icon" onclick="excluirCaritativo(${f.id})" title="Excluir">🗑️</button></td>
      </tr>
    `).join('') || `<tr><td colspan="9"><div class="empty-state"><div class="empty-state-icon">💛</div><div class="empty-state-text">Nenhum lançamento no Fundo Caritativo</div></div></td></tr>`;
  }
};

window.excluirCaritativo = id => {
  if (!confirm('Excluir este lançamento do Fundo Caritativo?')) return;
  State.fundoCaritativo = State.fundoCaritativo.filter(f => f.id !== id);
  renderCaridade();
  API.deleteFundoCaritativo(id).catch(() => {});
  toast('Lançamento removido.', 'success');
};

const salvarCaritativo = async () => {
  const form = {
    data:           $('car-data').value,
    tipo:           $('car-tipo').value,
    origem_destino: $('car-origem-destino').value.trim(),
    categoria:      $('car-categoria').value,
    valor:          parseFloat($('car-valor').value || '0'),
    familias_atendidas: parseInt($('car-familias').value || '0'),
    quilos_alimentos:   parseFloat($('car-kg').value || '0'),
    responsavel_pastoral_social: $('car-resp').value.trim(),
    observacao_confidencial:     $('car-obs').value.trim()
  };
  if (!form.data || !form.origem_destino) return toast('Data e origem/destino são obrigatórios.', 'warning');
  form.id = Date.now();

  // Atualiza estado local (mascarando observação para exibição)
  State.fundoCaritativo.unshift({ ...form, observacao_confidencial: _mascararLocal(form.observacao_confidencial) });

  // Recalcula impacto local (estimativa rápida; backend recalcula com precisão)
  const imp = State.impactoCaridade;
  if (imp && form.tipo === 'Saída') {
    imp.familias_mes        += form.familias_atendidas;
    imp.familias_ano        += form.familias_atendidas;
    imp.kg_alimentos_ano    += form.quilos_alimentos;
    imp.total_caridade_ano  += form.valor;
    imp.pct_pobres = imp.receita_ano > 0
      ? Number(((imp.total_caridade_ano / imp.receita_ano) * 100).toFixed(2))
      : 0;
  }

  closeModal('modal-caritativo');
  ['car-origem-destino','car-valor','car-familias','car-kg','car-resp','car-obs'].forEach(id => { const el = $(id); if (el) el.value = id.endsWith('familias') || id.endsWith('kg') || id.endsWith('valor') ? '0' : ''; });
  renderCaridade();
  toast('Lançamento caritativo registrado!', 'success');
  API.addFundoCaritativo(form).catch(() => {});
};

const _mascararLocal = (s) => {
  if (!s) return '';
  if (s.length <= 4) return '***';
  return s.substring(0, 2) + '***' + s.substring(s.length - 2);
};

/* ══════════════════════════════════════════════════════════════
   EVANGELIZAÇÃO — Termômetro Missionário (Doc. 105 CNBB / EG)
   ══════════════════════════════════════════════════════════════ */
const renderEvangelizacao = () => {
  const t = State.termometroMissionario;
  const metas = State.metasEvangelizacao || [];
  if (!t) return;

  $('miss-partilha-valor').textContent = fmt.moeda(t.partilha_ad_extra);
  $('miss-pct-partilha').textContent   = fmt.pct(t.pct_partilha);
  $('miss-num-metas').textContent      = metas.length;

  const meta = Number(t.meta_pct_partilha || 5);
  const elMeta = $('miss-pct-meta');
  if (elMeta) {
    const ok = t.pct_partilha >= meta;
    elMeta.textContent = `Meta diocesana: ≥${meta}% — ${ok ? '✅' : '⚠️'}`;
    elMeta.className   = 'kpi-trend ' + (ok ? 'text-success' : 'text-danger');
  }

  // Gauge
  const gauge = Math.min(Math.round((t.pct_partilha / Math.max(meta, 1)) * 100), 100);
  Charts.renderGauge('gauge-missionario', gauge, gauge >= 100 ? '#27ae60' : '#6c3fc5');
  const gLabel = $('gauge-missionario-label');
  if (gLabel) gLabel.textContent = fmt.pct(t.pct_partilha);

  // Categorias ad extra
  const cats = $('categorias-ad-extra');
  if (cats) {
    cats.innerHTML = (t.categorias_ad_extra || []).map(c =>
      `<span class="badge badge-purple">${escapeHtml(c)}</span>`).join('');
  }

  // Metas evangelizadoras (cards-progresso)
  const grid = $('metas-evang-grid');
  if (grid) {
    grid.innerHTML = metas.map(m => {
      const pct = Math.min(Math.round((Number(m.realizado) / Math.max(Number(m.meta_numerica), 1)) * 100), 100);
      const barClass = pct >= 100 ? 'success' : pct >= 50 ? '' : 'danger';
      return `
        <div class="meta-card">
          <div class="meta-header">
            <div class="meta-emoji">🌱</div>
            <div class="meta-info">
              <div class="meta-title">${escapeHtml(m.titulo)}</div>
              <div class="meta-desc">${escapeHtml(m.descricao || '')}</div>
            </div>
            <span class="meta-status ativa">${escapeHtml(m.indicador)}</span>
          </div>
          <div class="progress-wrap">
            <div class="progress-label">
              <span>${m.realizado} / ${m.meta_numerica}</span>
              <span class="meta-amount">${fmt.pct(pct)}</span>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill ${barClass}" style="width:${pct}%"></div>
            </div>
          </div>
          <div class="meta-footer">
            <span>Período: <strong>${escapeHtml(m.periodo || '—')}</strong></span>
            <span>Resp.: ${escapeHtml(m.responsavel_pastoral || '—')}</span>
          </div>
          <div class="flex gap-1 mt-2">
            <button class="btn btn-outline btn-sm btn-icon" onclick="excluirMetaEvang(${m.id})" title="Excluir">🗑️</button>
          </div>
        </div>`;
    }).join('') || `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🌍</div><div class="empty-state-text">Nenhuma meta missionária cadastrada</div></div>`;
  }
};

window.excluirMetaEvang = id => {
  if (!confirm('Excluir esta meta missionária?')) return;
  State.metasEvangelizacao = State.metasEvangelizacao.filter(m => m.id !== id);
  renderEvangelizacao();
  API.deleteMetaEvangelizacao(id).catch(() => {});
  toast('Meta excluída.', 'success');
};

const salvarMetaEvang = async () => {
  const form = {
    titulo:        $('evang-titulo').value.trim(),
    descricao:     $('evang-descricao').value.trim(),
    indicador:     $('evang-indicador').value,
    meta_numerica: parseInt($('evang-meta-num').value || '0'),
    realizado:     parseInt($('evang-realizado').value || '0'),
    periodo:       $('evang-periodo').value.trim(),
    responsavel_pastoral: $('evang-resp').value.trim()
  };
  if (!form.titulo || !form.meta_numerica) return toast('Título e meta numérica são obrigatórios.', 'warning');
  form.id = Date.now();
  State.metasEvangelizacao.push(form);
  closeModal('modal-meta-evang');
  ['evang-titulo','evang-descricao','evang-meta-num','evang-realizado','evang-periodo','evang-resp'].forEach(id => { const el = $(id); if (el) el.value = ''; });
  renderEvangelizacao();
  toast('Meta evangelizadora registrada!', 'success');
  API.addMetaEvangelizacao(form).catch(() => {});
};

/* ══════════════════════════════════════════════════════════════
   CONSELHO ECONÔMICO — atas (cân. 537)
   ══════════════════════════════════════════════════════════════ */
const renderConselho = () => {
  const lista = State.conselhoEconomico || [];
  const tbody = $('tbody-conselho');
  if (!tbody) return;
  tbody.innerHTML = lista.map(a => `
    <tr>
      <td>${fmt.data(a.data)}</td>
      <td><span class="badge badge-blue">${escapeHtml(a.tipo)}</span></td>
      <td>${escapeHtml(a.pauta || '')}</td>
      <td>${escapeHtml(a.participantes || '')}</td>
      <td>${escapeHtml(a.deliberacoes || '')}</td>
      <td><code class="hash-badge" title="SHA-256 da ata">${escapeHtml(String(a.assinatura_hash || '').substring(0, 12))}…</code></td>
      <td><button class="btn btn-outline btn-sm btn-icon" onclick="excluirAta(${a.id})" title="Excluir">🗑️</button></td>
    </tr>
  `).join('') || `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">⚖️</div><div class="empty-state-text">Nenhuma ata registrada — o CAE é exigido pelo cân. 537.</div></div></td></tr>`;
};

window.excluirAta = id => {
  if (!confirm('Excluir esta ata do Conselho Econômico?')) return;
  State.conselhoEconomico = State.conselhoEconomico.filter(a => a.id !== id);
  renderConselho();
  API.deleteConselhoEconomico(id).catch(() => {});
};

/** Calcula SHA-256 hex no browser (Web Crypto). Usado para a assinatura local. */
const _sha256Hex = async (texto) => {
  if (!window.crypto || !window.crypto.subtle) return 'no-crypto';
  const enc = new TextEncoder().encode(texto);
  const buf = await window.crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
};

const salvarAtaConselho = async () => {
  const form = {
    data:          $('cons-data').value,
    tipo:          $('cons-tipo').value,
    pauta:         $('cons-pauta').value.trim(),
    participantes: $('cons-participantes').value.trim(),
    deliberacoes:  $('cons-deliberacoes').value.trim(),
    anexo_url:     $('cons-anexo').value.trim()
  };
  if (!form.data || !form.pauta) return toast('Data e pauta são obrigatórios.', 'warning');
  form.id = Date.now();
  const conteudo = `${form.id}|${form.data}|${form.tipo}|${form.pauta}|${form.deliberacoes}|${new Date().toISOString()}`;
  form.assinatura_hash = await _sha256Hex(conteudo);

  State.conselhoEconomico.unshift(form);
  closeModal('modal-conselho');
  ['cons-pauta','cons-participantes','cons-deliberacoes','cons-anexo'].forEach(id => { const el = $(id); if (el) el.value = ''; });
  renderConselho();
  toast('Ata salva com assinatura digital (SHA-256).', 'success');
  API.addConselhoEconomico(form).catch(() => {});
};

/* ══════════════════════════════════════════════════════════════
   PATRIMÔNIO — Manutenção (cân. 1284) + Inventário (cân. 1283)
   ══════════════════════════════════════════════════════════════ */
const renderPatrimonio = () => {
  const itens = State.manutencaoPatrimonial || [];
  const tbody = $('tbody-manutencao');
  if (tbody) {
    tbody.innerHTML = itens.map(i => {
      const cls = i.atrasada ? 'badge-red' : i.alerta ? 'badge-gold' : i.status === 'concluida' ? 'badge-green' : 'badge-blue';
      const lbl = i.atrasada ? '⚠️ Atrasada' : i.alerta ? '⏰ Próximos 30d' : (i.status || 'planejada');
      return `
        <tr>
          <td>${escapeHtml(i.bem)}</td>
          <td>${escapeHtml(i.descricao || '')}</td>
          <td>${i.ultima_revisao ? fmt.data(i.ultima_revisao) : '—'}</td>
          <td>${i.proxima_revisao ? fmt.data(i.proxima_revisao) : '—'}</td>
          <td>${fmt.moeda(i.custo_estimado || 0)}</td>
          <td><span class="badge ${cls}">${lbl}</span></td>
          <td><button class="btn btn-outline btn-sm btn-icon" onclick="excluirManutencao(${i.id})" title="Excluir">🗑️</button></td>
        </tr>`;
    }).join('') || `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">🛠️</div><div class="empty-state-text">Nenhum item de manutenção</div></div></td></tr>`;
  }

  const inv = State.inventario || [];
  const tbody2 = $('tbody-inventario');
  if (tbody2) {
    tbody2.innerHTML = inv.map(b => `
      <tr>
        <td><span class="badge badge-purple">${escapeHtml(b.tipo)}</span></td>
        <td>${escapeHtml(b.descricao)}</td>
        <td>${b.data_aquisicao ? fmt.data(b.data_aquisicao) : '—'}</td>
        <td>${fmt.moeda(b.valor || 0)}</td>
        <td>${escapeHtml(b.estado_conservacao || '—')}</td>
        <td>${escapeHtml(b.localizacao || '—')}</td>
        <td><button class="btn btn-outline btn-sm btn-icon" onclick="excluirInventario(${b.id})" title="Excluir">🗑️</button></td>
      </tr>
    `).join('') || `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">📦</div><div class="empty-state-text">Inventário vazio (cân. 1283 2° exige inventário de bens)</div></div></td></tr>`;
  }
};

window.excluirManutencao = id => {
  if (!confirm('Excluir este item de manutenção?')) return;
  State.manutencaoPatrimonial = State.manutencaoPatrimonial.filter(i => i.id !== id);
  renderPatrimonio();
  API.deleteManutencaoPatrimonial(id).catch(() => {});
};

window.excluirInventario = id => {
  if (!confirm('Excluir este bem do inventário?')) return;
  State.inventario = State.inventario.filter(b => b.id !== id);
  renderPatrimonio();
  API.deleteInventario(id).catch(() => {});
};

const salvarManutencao = () => {
  const form = {
    bem:             $('mant-bem').value,
    descricao:       $('mant-descricao').value.trim(),
    ultima_revisao:  $('mant-ultima').value,
    proxima_revisao: $('mant-proxima').value,
    custo_estimado:  parseFloat($('mant-custo').value || '0'),
    status:          $('mant-status').value
  };
  if (!form.bem || !form.descricao || !form.proxima_revisao) {
    return toast('Bem, descrição e próxima revisão são obrigatórios.', 'warning');
  }
  form.id = Date.now();
  // Cálculo local de alerta/atraso para exibição imediata
  const diff = (new Date(form.proxima_revisao) - new Date()) / (1000 * 60 * 60 * 24);
  form.atrasada = diff < 0;
  form.alerta   = diff >= 0 && diff <= 30;
  State.manutencaoPatrimonial.unshift(form);
  closeModal('modal-manutencao');
  ['mant-descricao','mant-ultima','mant-proxima','mant-custo'].forEach(id => { const el = $(id); if (el) el.value = ''; });
  renderPatrimonio();
  toast('Item de manutenção salvo!', 'success');
  API.addManutencaoPatrimonial(form).catch(() => {});
};

const salvarInventario = () => {
  const form = {
    tipo:               $('inv-tipo').value,
    descricao:          $('inv-descricao').value.trim(),
    data_aquisicao:     $('inv-aquisicao').value,
    valor:              parseFloat($('inv-valor').value || '0'),
    estado_conservacao: $('inv-estado').value,
    localizacao:        $('inv-localizacao').value.trim()
  };
  if (!form.descricao) return toast('Descrição é obrigatória.', 'warning');
  form.id = Date.now();
  State.inventario.unshift(form);
  closeModal('modal-inventario');
  ['inv-descricao','inv-aquisicao','inv-valor','inv-localizacao'].forEach(id => { const el = $(id); if (el) el.value = id === 'inv-valor' ? '0' : ''; });
  renderPatrimonio();
  toast('Bem registrado no inventário!', 'success');
  API.addInventario(form).catch(() => {});
};

/* ══════════════════════════════════════════════════════════════
   TRANSPARÊNCIA PÚBLICA — cân. 1287 §2
   ══════════════════════════════════════════════════════════════ */
const renderTransparencia = () => {
  const fin = State.financeiro;
  const imp = State.impactoCaridade;
  const t   = State.termometroMissionario;
  const balancetes = State.prestacaoContas || [];
  if (!fin || !imp || !t) return;

  $('tp-receita-ano').textContent = fmt.moeda(fin.receita_ano);
  $('tp-despesa-ano').textContent = fmt.moeda(fin.despesa_ano);
  $('tp-saldo-ano').textContent   = fmt.moeda(fin.saldo_ano);
  $('tp-pct-pobres').textContent  = fmt.pct(imp.pct_pobres);
  $('tp-pct-partilha').textContent = fmt.pct(t.pct_partilha);
  $('tp-kg-alimentos').textContent = (Number(imp.kg_alimentos_ano) || 0).toLocaleString('pt-BR') + ' kg';

  const hist = fin.historico_meses || [];
  Charts.renderBarras('chart-tp-barras', hist.map(h => h.mes), hist.map(h => h.receita), hist.map(h => h.despesa));
  Charts.renderRosca('chart-tp-rosca',
    fin.distribuicao.map(d => d.categoria),
    fin.distribuicao.map(d => d.valor),
    fin.distribuicao.map(d => d.cor)
  );

  const tbody = $('tbody-balancetes');
  if (tbody) {
    tbody.innerHTML = balancetes.filter(b => b.publicado === true || b.publicado === 'true').map(b => `
      <tr>
        <td><strong>${escapeHtml(b.periodo)}</strong></td>
        <td class="text-success">${fmt.moeda(b.receita)}</td>
        <td class="text-danger">${fmt.moeda(b.despesa)}</td>
        <td class="fw-bold ${b.saldo >= 0 ? 'text-success' : 'text-danger'}">${fmt.moeda(b.saldo)}</td>
        <td>${b.data_publicacao ? new Date(b.data_publicacao).toLocaleDateString('pt-BR') : '—'}</td>
      </tr>
    `).join('') || `<tr><td colspan="5"><div class="empty-state"><div class="empty-state-icon">📑</div><div class="empty-state-text">Nenhum balancete publicado ainda</div></div></td></tr>`;
  }

  const grid = $('tp-metas-missionarias');
  if (grid) {
    grid.innerHTML = (t.metas || []).map(m => {
      const pct = Math.min(Math.round((Number(m.realizado) / Math.max(Number(m.meta_numerica), 1)) * 100), 100);
      return `
        <div class="meta-card">
          <div class="meta-header">
            <div class="meta-emoji">🌱</div>
            <div class="meta-info">
              <div class="meta-title">${escapeHtml(m.titulo)}</div>
              <div class="meta-desc">${escapeHtml(m.indicador)}</div>
            </div>
          </div>
          <div class="progress-wrap">
            <div class="progress-label">
              <span>${m.realizado} / ${m.meta_numerica}</span>
              <span class="meta-amount">${fmt.pct(pct)}</span>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width:${pct}%"></div>
            </div>
          </div>
          <div class="meta-footer"><span>Período: ${escapeHtml(m.periodo || '—')}</span></div>
        </div>`;
    }).join('') || `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🌍</div><div class="empty-state-text">Sem metas missionárias publicadas</div></div>`;
  }
};

/* ══════════════════════════════════════════════════════════════
   TEMPO LITÚRGICO — banda no topo
   ══════════════════════════════════════════════════════════════ */
const _diasDePascoa = (ano) => {
  // Algoritmo de Meeus/Jones/Butcher para Páscoa Gregoriana
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const L = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * L) / 451);
  const mes = Math.floor((h + L - 7 * m + 114) / 31);
  const dia = ((h + L - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
};

const detectarTempoLiturgico = (hoje = new Date()) => {
  const ano    = hoje.getFullYear();
  const pascoa = _diasDePascoa(ano);
  const daysSinceEpoch = (d) => Math.floor(d.getTime() / 86400000);
  const t = daysSinceEpoch(hoje);

  // Quarta-feira de Cinzas = Páscoa - 46 dias
  const cinzas = daysSinceEpoch(pascoa) - 46;
  // Tríduo Pascal: quinta-feira santa - sábado santo
  const tridouIni = daysSinceEpoch(pascoa) - 3;
  // Pentecostes = Páscoa + 49 dias
  const pentecostes = daysSinceEpoch(pascoa) + 49;
  // Advento: começa no 4º domingo antes de 25/dez
  const natal = daysSinceEpoch(new Date(ano, 11, 25));
  const dDoNatal = new Date(ano, 11, 25).getDay(); // 0=dom..6=sáb
  // Advento: começa no 4º domingo antes de 25/dez. Calcula-se em dias
  // contados a partir de 25/dez subtraindo: 28 dias se 25/dez for domingo
  // (4 semanas exatas), ou (21 + diaDaSemana) caso contrário (3 semanas
  // completas mais o número de dias necessários para chegar ao domingo
  // anterior).
  const adventoIni = natal - (dDoNatal === 0 ? 28 : (21 + dDoNatal));
  // Natal: 25/dez até 6/jan (Epifania) ou Batismo do Senhor
  const epifania = daysSinceEpoch(new Date(ano + 1, 0, 6));

  if (t >= adventoIni && t < natal) return { nome: 'Advento', cor: '#6c3fc5' };
  if (t >= natal || t <= daysSinceEpoch(new Date(ano, 0, 13))) return { nome: 'Natal', cor: '#f5a623' };
  if (t >= cinzas && t < tridouIni) return { nome: 'Quaresma', cor: '#9b59b6' };
  if (t >= tridouIni && t < daysSinceEpoch(pascoa)) return { nome: 'Tríduo Pascal', cor: '#7f1d1d' };
  if (t >= daysSinceEpoch(pascoa) && t <= pentecostes) return { nome: 'Páscoa', cor: '#27ae60' };
  return { nome: 'Tempo Comum', cor: '#27ae60' };
};

const aplicarBandaLiturgica = () => {
  const el = $('liturgical-band');
  if (!el) return;
  const t = detectarTempoLiturgico();
  el.textContent = '✝️ ' + t.nome;
  el.style.background = t.cor;
};

/* ══════════════════════════════════════════════════════════════
   ESCAPE HTML – proteção contra XSS em conteúdo dinâmico
   ══════════════════════════════════════════════════════════════ */
const escapeHtml = (s) => {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const carregarDados = async () => {
  // Tentar carregar do Apps Script; usar demo se não disponível
  const respostas = await Promise.all([
    API.getFinanceiro(),
    API.getLancamentos(),
    API.getMetas(),
    API.getVoluntarios(),
    API.getMembros(),
    API.getFundoCaritativo().catch(() => null),
    API.getImpactoCaridade().catch(() => null),
    API.getMetasEvangelizacao().catch(() => null),
    API.getTermometroMissionario().catch(() => null),
    API.getConselhoEconomico().catch(() => null),
    API.getManutencaoPatrimonial().catch(() => null),
    API.getInventario().catch(() => null),
    API.getPrestacaoContas().catch(() => null)
  ]);

  // Se o backend responder que a sessão não está autorizada
  // (p.ex. o usuário existe no localStorage com perfil admin
  // mas não está/não está mais cadastrado na aba Usuários),
  // limpa a sessão e volta para o login em vez de seguir
  // carregando o painel com erros.
  const naoAutorizado = respostas.some(r => r && typeof r === 'object' && r.erro
    && /não autorizado|Acesso negado|Usuário inativo|Token de autenticação/i.test(String(r.erro)));
  if (naoAutorizado) {
    try { localStorage.removeItem('susten_sessao'); } catch (_) {}
    try { localStorage.removeItem('susten_fiel_auth'); } catch (_) {}
    toast('Sessão expirada ou usuário não autorizado. Faça login novamente.', 'warning', 4000);
    setTimeout(() => location.replace('login.html'), 800);
    return;
  }

  // Respostas com { erro: ... } são tratadas como ausência de dados (usa demo)
  const limpo = respostas.map(r => (r && typeof r === 'object' && r.erro) ? null : r);
  const [fin, lanc, metas, vols, mems, fundo, imp, metasEv, term, cae, mant, inv, prest] = limpo;

  State.financeiro             = fin     || DEMO_DATA.financeiro;
  State.lancamentos            = lanc    || DEMO_DATA.lancamentos;
  State.metas                  = metas   || DEMO_DATA.metas;
  State.voluntarios            = vols    || DEMO_DATA.voluntarios;
  State.membros                = mems    || DEMO_DATA.membros;
  State.paroquia               = DEMO_DATA.paroquia;
  State.fundoCaritativo        = fundo   || DEMO_DATA.fundoCaritativo       || [];
  State.impactoCaridade        = imp     || DEMO_DATA.impactoCaridade       || null;
  State.metasEvangelizacao     = metasEv || DEMO_DATA.metasEvangelizacao    || [];
  State.termometroMissionario  = term    || DEMO_DATA.termometroMissionario || null;
  State.conselhoEconomico      = cae     || DEMO_DATA.conselhoEconomico     || [];
  State.manutencaoPatrimonial  = mant    || DEMO_DATA.manutencaoPatrimonial || [];
  State.inventario             = inv     || DEMO_DATA.inventario            || [];
  State.prestacaoContas        = prest   || DEMO_DATA.prestacaoContas       || [];

  if (!fin) toast('Modo demonstração ativo – dados de exemplo carregados.', 'info', 5000);
};

const bindEvents = () => {
  // Navegação sidebar
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.page));
  });

  // Sidebar mobile
  $('topbar-toggle')?.addEventListener('click', openSidebar);
  $('sidebar-overlay')?.addEventListener('click', closeSidebar);

  // Modais – fechar
  document.querySelectorAll('.modal-close, [data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) closeModal(modal.id);
    });
  });
  document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', e => { if (e.target === el) closeModal(el.id); });
  });

  // Botões abrir modais
  $('btn-novo-lancamento')?.addEventListener('click', () => {
    $('lanc-data').value = new Date().toISOString().split('T')[0];
    openModal('modal-lancamento');
  });
  $('btn-salvar-lancamento')?.addEventListener('click', salvarLancamento);

  $('btn-nova-meta')?.addEventListener('click', () => {
    $('modal-meta').removeAttribute('data-edit-id');
    ['meta-titulo','meta-descricao','meta-valor-total','meta-arrecadado','meta-prazo'].forEach(id => { const el = $(id); if (el) el.value = ''; });
    $('meta-emoji').value = '🎯';
    $('meta-status-sel').value = 'ativa';
    openModal('modal-meta');
  });
  $('btn-salvar-meta')?.addEventListener('click', salvarMeta);

  $('btn-novo-voluntario')?.addEventListener('click', () => {
    $('modal-voluntario').removeAttribute('data-edit-id');
    ['vol-nome','vol-profissao','vol-tags-input','vol-telefone','vol-disponibilidade'].forEach(id => { const el = $(id); if (el) el.value = ''; });
    openModal('modal-voluntario');
  });
  $('btn-salvar-voluntario')?.addEventListener('click', salvarVoluntario);

  $('btn-novo-membro')?.addEventListener('click', () => {
    $('modal-membro').removeAttribute('data-edit-id');
    ['mem-nome','mem-telefone'].forEach(id => { const el = $(id); if (el) el.value = ''; });
    openModal('modal-membro');
  });
  $('btn-salvar-membro')?.addEventListener('click', salvarMembro);

  $('btn-registrar-dizimo')?.addEventListener('click', () => {
    $('dizimo-data').value = new Date().toISOString().split('T')[0];
    openModal('modal-dizimo-reg');
  });
  $('btn-salvar-dizimo')?.addEventListener('click', salvarDizimo);

  $('btn-enviar-wa')?.addEventListener('click', enviarMensagem);
  $('btn-enviar-todos')?.addEventListener('click', enviarParaTodos);

  $('btn-salvar-config')?.addEventListener('click', salvarConfiguracoes);

  // ─── Pastoral: Caridade ──────────────────────────────────────
  $('btn-novo-caritativo')?.addEventListener('click', () => {
    $('car-data').value = new Date().toISOString().split('T')[0];
    openModal('modal-caritativo');
  });
  $('btn-salvar-caritativo')?.addEventListener('click', salvarCaritativo);

  // ─── Pastoral: Evangelização ─────────────────────────────────
  $('btn-nova-meta-evang')?.addEventListener('click', () => {
    ['evang-titulo','evang-descricao','evang-meta-num','evang-realizado','evang-periodo','evang-resp'].forEach(id => { const el = $(id); if (el) el.value = ''; });
    $('evang-realizado').value = '0';
    $('evang-periodo').value = String(new Date().getFullYear());
    openModal('modal-meta-evang');
  });
  $('btn-salvar-evang')?.addEventListener('click', salvarMetaEvang);

  // ─── Pastoral: Conselho Econômico ────────────────────────────
  $('btn-nova-ata')?.addEventListener('click', () => {
    $('cons-data').value = new Date().toISOString().split('T')[0];
    openModal('modal-conselho');
  });
  $('btn-salvar-conselho')?.addEventListener('click', salvarAtaConselho);

  // ─── Pastoral: Patrimônio ────────────────────────────────────
  $('btn-novo-manutencao')?.addEventListener('click', () => {
    ['mant-descricao','mant-ultima','mant-proxima','mant-custo'].forEach(id => { const el = $(id); if (el) el.value = ''; });
    openModal('modal-manutencao');
  });
  $('btn-salvar-manutencao')?.addEventListener('click', salvarManutencao);

  $('btn-novo-inventario')?.addEventListener('click', () => {
    ['inv-descricao','inv-aquisicao','inv-valor','inv-localizacao'].forEach(id => { const el = $(id); if (el) el.value = ''; });
    openModal('modal-inventario');
  });
  $('btn-salvar-inventario')?.addEventListener('click', salvarInventario);

  // ─── Versículo rotativo (Dimensão Religiosa) ─────────────────
  $('versiculo-trocar')?.addEventListener('click', () => {
    const total = (DEMO_DATA.versiculos || []).length;
    if (!total) return;
    State.versiculoIdx = (State.versiculoIdx + 1) % total;
    renderVersiculo();
  });

  // Filtros de lançamentos
  document.querySelectorAll('.filter-lancamentos').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-lancamentos').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.filterLancamentos = btn.dataset.filter;
      renderTabelaLancamentos();
    });
  });

  // Filtros de voluntários
  document.querySelectorAll('.filter-voluntarios').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-voluntarios').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.filterVoluntarios = btn.dataset.filter;
      renderVoluntarios();
    });
  });
  $('vol-search')?.addEventListener('input', renderVoluntarios);

  // Filtros de membros
  document.querySelectorAll('.filter-membros').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-membros').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.filterMembros = btn.dataset.filter;
      renderMembros();
    });
  });
  $('mem-search')?.addEventListener('input', renderMembros);

  // Copiar PIX
  $('pix-chave-copy')?.addEventListener('click', e => {
    copyText(e.currentTarget.dataset.val, e.currentTarget);
  });

  // WhatsApp preview dinâmico
  ['wa-destinatario','wa-valor','wa-evento','wa-data-evento','wa-hora','wa-local','wa-meta-nome'].forEach(id => {
    $(id)?.addEventListener('change', atualizarPreviewWA);
    $(id)?.addEventListener('input',  atualizarPreviewWA);
  });

  // Botões de relatório
  document.querySelectorAll('[data-export]').forEach(btn => {
    btn.addEventListener('click', () => exportarRelatorio(btn.dataset.export));
  });

  // Topbar: botão de atualizar dados
  $('btn-switch-to-fiel')?.addEventListener('click', () => {
    location.replace('Fiel.html');
  });

  // Topbar: botão de atualizar dados
  $('btn-refresh')?.addEventListener('click', async () => {
    toast('Atualizando dados…', 'info', 2000);
    await carregarDados();
    renderPage(State.currentPage);
    toast('Dados atualizados!', 'success');
  });

  // Notificações
  $('btn-notif')?.addEventListener('click', () => toast('Sem novas notificações.', 'info', 2000));
};

// ── Bootstrap ──────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  await carregarDados();
  bindEvents();
  aplicarBandaLiturgica();

  // Ocultar tela de loading
  setTimeout(() => {
    $('loading-screen')?.classList.add('fade-out');
    setTimeout(() => { const ls = $('loading-screen'); if (ls) ls.style.display = 'none'; }, 500);
  }, 2200);

  // Navegar para dashboard após loading
  setTimeout(() => navigate('dashboard'), 2300);

  // Registrar Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
});
