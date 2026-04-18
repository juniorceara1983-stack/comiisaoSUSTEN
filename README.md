# ✝️ SUSTEN – Sistema de Gestão de Sustentabilidade Paroquial

> Uma plataforma digital moderna para administração paroquial – finanças transparentes, voluntários, comunicação via WhatsApp e muito mais.

[![PWA Ready](https://img.shields.io/badge/PWA-Ready-6c3fc5?style=flat-square&logo=pwa)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![Google Apps Script](https://img.shields.io/badge/Backend-Google%20Apps%20Script-4285F4?style=flat-square&logo=google)](https://developers.google.com/apps-script)
[![License: MIT](https://img.shields.io/badge/License-MIT-f5a623?style=flat-square)](LICENSE)
[![Zero Cost](https://img.shields.io/badge/Custo%20Operacional-Zero-27ae60?style=flat-square)](https://github.com)

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Módulos](#módulos)
- [Estrutura de Ficheiros](#estrutura-de-ficheiros)
- [Instalação e Configuração](#instalação-e-configuração)
- [Funcionalidades Detalhadas](#funcionalidades-detalhadas)
- [Melhorias Sugeridas](#melhorias-sugeridas)
- [Contribuição](#contribuição)

---

## 🌟 Visão Geral

O **SUSTEN** é uma aplicação web progressiva (PWA) de custo operacional **zero**, desenhada para transformar a gestão administrativa e comunicacional de paróquias. Elimina a necessidade de softwares proprietários caros, utilizando apenas:

- 🌐 **GitHub Pages** – Hospedagem gratuita do frontend
- 📊 **Google Sheets** – Banco de dados seguro e acessível
- ⚙️ **Google Apps Script** – Backend serverless gratuito
- 💬 **WhatsApp** – Comunicação direta sem custos adicionais

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERFACE (Frontend)                      │
│  PWA – GitHub Pages (index.html + CSS + JS)                 │
│  • Funciona offline com Service Worker                       │
│  • Instalável no telemóvel (sem loja de apps)               │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS (fetch/REST)
┌────────────────────▼────────────────────────────────────────┐
│                PROCESSAMENTO (Backend)                       │
│  Google Apps Script (code.gs)                               │
│  • doGet()  – Leitura de dados (JSON)                       │
│  • doPost() – Escrita e atualização                         │
│  • Triggers automáticos (verificação semanal)               │
└────────────────────┬────────────────────────────────────────┘
                     │ Spreadsheet API
┌────────────────────▼────────────────────────────────────────┐
│                  DADOS (Database)                            │
│  Google Sheets (acesso restrito ao administrador)           │
│  Abas: Lançamentos | Metas | Voluntários | Membros |        │
│        Dízimos | Configurações | Log |                      │
│        Fundo_Caritativo | Metas_Evangelizacao |             │
│        Conselho_Economico | Manutencao_Patrimonial |        │
│        Inventario | Prestacao_Contas                        │
└─────────────────────────────────────────────────────────────┘
```

---

## ✝️ Fundamentação Documental

O sistema é estruturado em torno das **4 dimensões do dízimo** (Doc. 106 CNBB) e das obrigações canônicas da administração paroquial:

| Documento | Como o sistema responde |
|---|---|
| **Doc. 106 CNBB – "O Dízimo na Comunidade de Fé"** | Dimensões Religiosa, Eclesial, Missionária e Caritativa estruturam toda a navegação. |
| **Doc. 105 CNBB – Diretrizes Gerais da Ação Evangelizadora** | Aba `Metas_Evangelizacao` com indicadores não-financeiros (catequizandos, batizados, famílias visitadas). |
| **Carta Encíclica *Laudato Si'*** | Dashboard "Impacto da Caridade" + cronograma de manutenção patrimonial. |
| **Exortação *Evangelii Gaudium* (n. 198)** | KPI "% da receita destinado aos pobres" com meta sugerida de ≥10%. |
| **Código de Direito Canônico (cân. 537)** | Aba `Conselho_Economico` com atas, pautas, deliberações e assinatura digital (SHA-256). |
| **Cân. 1283 2°** | Aba `Inventario` para bens móveis e imóveis. |
| **Cân. 1284 §2, 1°** | Aba `Manutencao_Patrimonial` + alertas semanais para revisões próximas. |
| **Cân. 1287 §2** | Portal Público de Transparência (rota sem login, dados consolidados anônimos). |
| **Cân. 1267 §3** | Fundo Caritativo separado contabilmente da conta geral. |

---

## 📦 Módulos

### 💰 A. Financeiro e Transparência (Portal da Partilha)
- **Dashboard financeiro** com KPIs em tempo real (receita, despesa, saldo)
- **Gráficos interativos** (barras, rosca, linha) com Chart.js
- **Tabela de lançamentos** filtrável por tipo e categoria
- **Distribuição de despesas** por categoria com gráfico de rosca
- **Exportação CSV** compatível com Excel / Google Sheets

### 🎯 B. Termômetro de Metas
- **Cards de projetos** com barra de progresso animada
- **Status visual**: Em Andamento / Urgente / Concluída
- **Gestão completa**: criar, editar, excluir metas
- **Integração com Dízimo**: link direto para contribuição

### 🙏 C. Dízimo Digital
- **Dados PIX** com QR Code e botão de cópia
- **Registro manual** de contribuições com um clique
- **Lista de dizimistas** com último dízimo e valores
- **Disparo automático** de agradecimento via WhatsApp

### 🤝 D. Banco de Voluntários (Sustentabilidade Humana)
- **Fichas de talentos** com profissão, habilidades e disponibilidade
- **Busca e filtros** por área (Jurídico, Saúde, Educação, etc.)
- **Contato direto** via WhatsApp com template pré-formatado
- **Economia paroquial**: reduz custos ao acionar a própria comunidade

### 💬 E. Comunicação (WhatsApp Integrado)
- **5 templates prontos**: Boas-vindas, Agradecimento, Aviso, Lembrete, Meta Atingida
- **Preview em tempo real** da mensagem formatada
- **Variáveis dinâmicas**: nome, valor, data, evento, local
- **Envio em massa**: enviar para todos os membros com um clique
- **Gatilho automático**: boas-vindas ao cadastrar novo membro

### 👥 F. Gestão de Membros
- **Cadastro completo** com categoria e status
- **Filtros** por status (Ativo/Inativo) e categoria
- **Histórico de dízimos** e valores por membro
- **Ações rápidas**: editar, excluir, enviar WhatsApp

### 📊 G. Relatórios
- **Exportação CSV** de todas as entidades
- **Filtros por período** (mês/ano)
- **Compatível** com Excel e Google Sheets

---

## 📁 Estrutura de Ficheiros

```
comiisaoSUSTEN/
│
├── index.html          # SPA Principal (toda a UI)
├── manifest.json       # Manifesto PWA
├── sw.js               # Service Worker (cache offline)
├── code.gs             # Backend Google Apps Script
│
├── css/
│   └── style.css       # Estilos (tema litúrgico púrpura/dourado)
│
└── js/
    ├── app.js          # Lógica principal + estado + navegação
    ├── api.js          # Camada de comunicação com Apps Script + dados demo
    └── charts.js       # Wrappers Chart.js (barras, rosca, linha, gauge)
```

---

## 🚀 Instalação e Configuração

### 1. Publicar o Frontend (GitHub Pages)

1. Faça fork/clone deste repositório
2. Vá em **Settings → Pages → Source: main branch / root**
3. Acesse: `https://seu-usuario.github.io/comiisaoSUSTEN/`

> O sistema funciona imediatamente em **modo demonstração** com dados de exemplo!

---

### 2. Configurar o Backend (Google Apps Script)

#### Criar o Google Sheets

1. Acesse [sheets.google.com](https://sheets.google.com) e crie uma nova planilha
2. Nomeie as abas exatamente: `Lançamentos`, `Metas`, `Voluntários`, `Membros`, `Dízimos`, `Configurações`, `Log`

#### Publicar o Apps Script

1. Abra a planilha → **Extensões → Apps Script**
2. Copie todo o conteúdo do arquivo `code.gs` e cole no editor
3. Clique em **Implantar → Nova Implantação**
4. Tipo: **Web App**
5. Executar como: **Eu mesmo**
6. Acesso: **Qualquer pessoa** (ou "Usuários da organização" para maior segurança)
7. Copie a **URL do Web App** gerada

#### Instalar Gatilhos Automáticos

Na janela do Apps Script, execute a função `instalarGatilhos()` uma única vez.

#### Conectar ao Frontend

1. Abra o sistema no navegador
2. Vá em **Configurações ⚙️**
3. Cole a URL do Web App no campo correspondente
4. Clique em **Salvar Configurações**
5. Clique em **🔄 Atualizar** no topo para carregar os dados reais

---

## ✨ Funcionalidades Detalhadas

### Segurança e LGPD
- Dados armazenados exclusivamente na conta Google da paróquia
- Acesso à planilha restrito ao administrador
- Usuários do PWA veem apenas o que o app exibe
- Sem coleta de dados por terceiros

### Modo Offline (PWA)
- Service Worker faz cache dos assets estáticos
- Interface funciona mesmo sem internet
- Sincronização automática ao recuperar conexão

### Responsividade
- Design mobile-first (funciona perfeitamente no telemóvel)
- Sidebar recolhível em ecrãs pequenos
- Instalável como app nativo via "Adicionar à tela inicial"

---

## 💡 Melhorias Sugeridas (Roadmap)

Com base em análise de sistemas financeiros paroquiais:

| Prioridade | Funcionalidade |
|-----------|----------------|
| 🔴 Alta | **Autenticação Google OAuth** – login seguro para o coordenador |
| 🔴 Alta | **QR Code real para PIX** – geração automática via API |
| 🟡 Média | **Dashboard público** – portal de transparência para os fiéis |
| 🟡 Média | **Notificações push** – alertas de metas atingidas e dízimos |
| 🟡 Média | **Relatórios PDF** – geração automática via Apps Script |
| 🟢 Baixa | **Multi-paróquia** – suporte a mais de uma comunidade |
| 🟢 Baixa | **App nativo (React Native / Capacitor)** – para publicar nas lojas |
| 🟢 Baixa | **Integração PIX oficial** – via Banco Central API (Open Finance) |

---

## 🤝 Contribuição

Contribuições são bem-vindas! Para colaborar:

1. Faça um fork do projeto
2. Crie uma branch: `git checkout -b feature/minha-funcionalidade`
3. Commit suas mudanças: `git commit -m 'feat: adiciona funcionalidade X'`
4. Push: `git push origin feature/minha-funcionalidade`
5. Abra um **Pull Request**

---

## 📄 Licença

MIT © 2026 – Comissão de Sustentabilidade

---

> *"Cada um contribua segundo propôs no seu coração; não com tristeza, ou por necessidade; porque Deus ama ao que dá com alegria."* – 2 Coríntios 9:7
