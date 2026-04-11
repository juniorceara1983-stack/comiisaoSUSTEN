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
  el.innerHTML = `<span>${icons[tipo]}</span><span>${msg}</span>`;
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
    dizimo:       ['Dízimo Digital',     'Registre e acompanhe contribuições'],
    voluntarios:  ['Banco de Voluntários','Talentos da comunidade'],
    comunicacao:  ['Comunicação',        'Mensagens via WhatsApp'],
    membros:      ['Membros',            'Gestão de dizimistas e paroquianos'],
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
   DÍZIMO DIGITAL
   ══════════════════════════════════════════════════════════════ */
const renderDizimo = () => {
  const { paroquia, membros } = State;
  if (!paroquia) return;

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
  const nome  = $('dizimo-nome').value.trim();
  const valor = parseFloat($('dizimo-valor').value);
  const data  = $('dizimo-data').value;
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
  renderDizimo();
  toast(`Dízimo de ${nome} registrado!`, 'success');
  API.registrarDizimo({ nome, valor, data }).catch(() => {});
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
    const matchFilter = filterMembros === 'todos' || m.status === filterMembros || m.categoria.toLowerCase() === filterMembros;
    return matchSearch && matchFilter;
  });

  const tbody = $('tbody-membros');
  if (!tbody) return;

  tbody.innerHTML = filtered.map(m => `
    <tr>
      <td>${m.nome}</td>
      <td><span class="badge ${m.categoria === 'Dizimista' ? 'badge-purple' : m.categoria === 'Colaborador' ? 'badge-blue' : 'badge-gold'}">${m.categoria}</span></td>
      <td><span class="badge ${m.status === 'ativo' ? 'badge-green' : 'badge-red'}">${m.status}</span></td>
      <td>${m.ultimoDizimo !== '—' ? fmt.data(m.ultimoDizimo) : '—'}</td>
      <td class="${m.valor > 0 ? 'text-accent fw-bold' : 'text-muted'}">${m.valor > 0 ? fmt.moeda(m.valor) : '—'}</td>
      <td>
        <button class="btn btn-whatsapp btn-sm btn-icon" onclick="enviarWhatsApp('${m.telefone}','agradecimento-dizimo','${m.nome}')" title="WhatsApp">💬</button>
        <button class="btn btn-outline btn-sm btn-icon" onclick="editarMembro(${m.id})" title="Editar">✏️</button>
        <button class="btn btn-outline btn-sm btn-icon" onclick="excluirMembro(${m.id})" title="Excluir">🗑️</button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">👥</div><div class="empty-state-text">Nenhum membro encontrado</div></div></td></tr>`;
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
    preview.innerHTML = txt
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
  toast('Configurações salvas!', 'success');
  API.saveConfig(p).catch(() => {});
};

/* ══════════════════════════════════════════════════════════════
   INICIALIZAÇÃO
   ══════════════════════════════════════════════════════════════ */
const carregarDados = async () => {
  // Tentar carregar do Apps Script; usar demo se não disponível
  const [fin, lanc, metas, vols, mems] = await Promise.all([
    API.getFinanceiro(),
    API.getLancamentos(),
    API.getMetas(),
    API.getVoluntarios(),
    API.getMembros()
  ]);

  State.financeiro   = fin    || DEMO_DATA.financeiro;
  State.lancamentos  = lanc   || DEMO_DATA.lancamentos;
  State.metas        = metas  || DEMO_DATA.metas;
  State.voluntarios  = vols   || DEMO_DATA.voluntarios;
  State.membros      = mems   || DEMO_DATA.membros;
  State.paroquia     = DEMO_DATA.paroquia;

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
