/* ============================================================
   SUSTEN – Charts Module (Chart.js wrappers)
   ============================================================ */

const Charts = (() => {
  // Paleta padrão
  const COLORS = {
    purple:     '#6c3fc5',
    purpleLight:'#9b6de0',
    gold:       '#f5a623',
    green:      '#27ae60',
    red:        '#e74c3c',
    blue:       '#2980b9',
    text:       '#b0a0d0',
    grid:       'rgba(108,63,197,0.12)',
    receita:    'rgba(39,174,96,0.8)',
    despesa:    'rgba(231,76,60,0.8)'
  };

  const _defaultOpts = (dark = true) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: COLORS.text,
          font: { family: "'Nunito', sans-serif", size: 11, weight: '600' },
          padding: 16,
          boxWidth: 12, boxHeight: 12,
          borderRadius: 4
        }
      },
      tooltip: {
        backgroundColor: '#241545',
        borderColor: 'rgba(108,63,197,0.3)',
        borderWidth: 1,
        titleColor: '#f0eafa',
        bodyColor: '#b0a0d0',
        cornerRadius: 10,
        padding: 10,
        titleFont: { family: "'Nunito', sans-serif", weight: '700' },
        bodyFont:  { family: "'Nunito', sans-serif" }
      }
    }
  });

  const _scaleOpts = () => ({
    x: {
      ticks: { color: COLORS.text, font: { family: "'Nunito', sans-serif", size: 10 } },
      grid:  { color: COLORS.grid }
    },
    y: {
      ticks: {
        color: COLORS.text,
        font: { family: "'Nunito', sans-serif", size: 10 },
        callback: v => 'R$ ' + (v >= 1000 ? (v/1000).toFixed(1)+'k' : v)
      },
      grid: { color: COLORS.grid }
    }
  });

  // Armazena instâncias para destroy
  const _instances = {};

  const _destroy = id => {
    if (_instances[id]) { _instances[id].destroy(); delete _instances[id]; }
  };

  // ── Barras: Receita x Despesa mensal ──────────────────────────
  const renderBarras = (canvasId, labels, receitas, despesas) => {
    _destroy(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    _instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Receitas',
            data: receitas,
            backgroundColor: 'rgba(39,174,96,0.75)',
            borderColor:     'rgba(39,174,96,1)',
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false
          },
          {
            label: 'Despesas',
            data: despesas,
            backgroundColor: 'rgba(231,76,60,0.75)',
            borderColor:     'rgba(231,76,60,1)',
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false
          }
        ]
      },
      options: {
        ..._defaultOpts(),
        scales: _scaleOpts(),
        plugins: {
          ..._defaultOpts().plugins,
          legend: { ..._defaultOpts().plugins.legend, position: 'top' }
        }
      }
    });
  };

  // ── Rosca: Distribuição de despesas ──────────────────────────
  const renderRosca = (canvasId, labels, valores, cores) => {
    _destroy(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    _instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: valores,
          backgroundColor: cores,
          borderColor: '#1a0a2e',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        ..._defaultOpts(),
        cutout: '65%',
        plugins: {
          ..._defaultOpts().plugins,
          legend: {
            ..._defaultOpts().plugins.legend,
            position: 'right'
          }
        }
      }
    });
  };

  // ── Linha: Evolução mensal ────────────────────────────────────
  const renderLinha = (canvasId, labels, datasets) => {
    _destroy(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    const gradientReceita = ctx.createLinearGradient(0, 0, 0, 200);
    gradientReceita.addColorStop(0, 'rgba(39,174,96,0.4)');
    gradientReceita.addColorStop(1, 'rgba(39,174,96,0.01)');

    const gradientDespesa = ctx.createLinearGradient(0, 0, 0, 200);
    gradientDespesa.addColorStop(0, 'rgba(231,76,60,0.4)');
    gradientDespesa.addColorStop(1, 'rgba(231,76,60,0.01)');

    _instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: datasets.map((d, i) => ({
          ...d,
          backgroundColor: i === 0 ? gradientReceita : gradientDespesa,
          borderColor:     i === 0 ? COLORS.green : COLORS.red,
          pointBackgroundColor: i === 0 ? COLORS.green : COLORS.red,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2.5,
          fill: true,
          tension: 0.4
        }))
      },
      options: {
        ..._defaultOpts(),
        scales: _scaleOpts(),
        interaction: { mode: 'index', intersect: false },
        plugins: {
          ..._defaultOpts().plugins,
          legend: { ..._defaultOpts().plugins.legend, position: 'top' }
        }
      }
    });
  };

  // ── Gauge simplificado (progresso circular) ───────────────────
  const renderGauge = (canvasId, percent, cor = COLORS.purple) => {
    _destroy(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    _instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [percent, 100 - percent],
          backgroundColor: [cor, 'rgba(255,255,255,0.06)'],
          borderColor: ['transparent','transparent'],
          borderWidth: 0
        }]
      },
      options: {
        ..._defaultOpts(),
        cutout: '78%',
        rotation: -90,
        circumference: 180,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });
  };

  // ── Mini sparkline ────────────────────────────────────────────
  const renderSparkline = (canvasId, valores, cor = COLORS.purple) => {
    _destroy(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    _instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: valores.map((_,i) => i),
        datasets: [{
          data: valores,
          borderColor: cor,
          backgroundColor: `${cor}22`,
          borderWidth: 1.5,
          pointRadius: 0,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false }
        },
        animation: false
      }
    });
  };

  const destroyAll = () => Object.keys(_instances).forEach(_destroy);

  return { renderBarras, renderRosca, renderLinha, renderGauge, renderSparkline, destroyAll };
})();
