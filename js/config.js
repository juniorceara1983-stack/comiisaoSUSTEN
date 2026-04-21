/* ============================================================
   SUSTEN – Configuração de Integração (Apps Script + Google Sheets)
   ------------------------------------------------------------
   Este arquivo DEVE ser carregado ANTES de js/api.js.
   Define `window.SUSTEN_CONFIG` com os valores padrão da
   implantação e permite sobrescrevê-los via localStorage
   (chave: 'susten.config') a partir da página de Configurações.
   ============================================================ */
(function () {
  'use strict';

  // ── Valores padrão da implantação atual ─────────────────────
  const DEFAULTS = {
    // URL pública do Web App (Implantação do Apps Script → /exec)
    appsScriptUrl: 'https://script.google.com/macros/s/AKfycbymPXrIhkkpVMoDhpYIAJBSnEpJ8r9M4BN8I3_SPSMQmCGy9u8DV_Jasf4DMBp6VvTL/exec',
    // ID do Google Sheets utilizado pelo backend
    spreadsheetId: '11iFIwuwR2R0XPiIdnN34FF2HZT7bHIlM3IlXi2NvTMU',
    // Token de segurança exigido pelo Apps Script (enviado em todas as
    // requisições como `auth_token`). Armazenado de forma ofuscada –
    // note que JS client-side NÃO é realmente secreto: qualquer pessoa
    // com DevTools consegue ler. A proteção efetiva é feita no backend
    // (Apps Script) via PropertiesService/validação server-side.
    authToken: (function () {
      // Partes em base64 concatenadas e decodificadas em runtime para
      // evitar que o valor apareça em buscas de texto simples no bundle.
      var p = ['ZG9nbW44', 'dzZAMjAy', 'NmNlYXJh', 'Mzg5MTgw', 'MTA='];
      try { return atob(p.join('')); } catch (_) { return ''; }
    })()
  };

  const STORAGE_KEY = 'susten.config';

  const _load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  };

  const _save = (cfg) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch (_) { /* storage indisponível – ignora */ }
  };

  // Merge defaults + overrides do usuário
  const stored = _load();
  const current = Object.assign({}, DEFAULTS, stored);

  window.SUSTEN_CONFIG = current;

  // API utilitária para atualizar a configuração em runtime
  window.SUSTEN_CONFIG_API = {
    get: () => Object.assign({}, window.SUSTEN_CONFIG),
    set: (patch) => {
      Object.assign(window.SUSTEN_CONFIG, patch || {});
      // Persiste apenas os campos reconhecidos (evita sujeira no storage)
      const toStore = {};
      Object.keys(DEFAULTS).forEach((k) => {
        if (window.SUSTEN_CONFIG[k] !== undefined) toStore[k] = window.SUSTEN_CONFIG[k];
      });
      _save(toStore);
      return window.SUSTEN_CONFIG;
    },
    reset: () => {
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
      Object.keys(window.SUSTEN_CONFIG).forEach((k) => delete window.SUSTEN_CONFIG[k]);
      Object.assign(window.SUSTEN_CONFIG, DEFAULTS);
      return window.SUSTEN_CONFIG;
    }
  };
})();
