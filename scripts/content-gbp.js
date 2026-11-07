/**
 * Lívia Copilot — Injeção de Alta Performance no Google Meu Negócio & Busca do Google
 * Funcionalidades Avançadas:
 * 1. Barra Flutuante (Lívia Copilot Dock) com Seletor Multi-Empresa em 1 clique
 * 2. Resposta a Avaliações com Análise de Sentimento (Elogio vs Gestão de Crise) e Seletor de Tom
 * 3. Gerador e Otimizador de Descrição da Empresa (750 chars) com Contador em Tempo Real
 * 4. Criador de Atualizações / Posts Locais e Importador de Instagram / Facebook
 * 5. Gerador de Catálogo de Serviços e Seeder de Perguntas & Respostas (Q&A)
 * 6. Mini-Auditor de Perfil (Score de Otimização de 0 a 100%)
 */

(function () {
  'use strict';

  const IS_TOP_FRAME = (window === window.top);
  console.log(`[Lívia Copilot Pro] Módulo Google Meu Negócio Inicializado (${IS_TOP_FRAME ? 'Janela Principal' : 'Sub-Frame / Modal'}).`);

  let cachedBizData = null;
  let isExecutingAutomation = false;

  // Utilitário para exibir Toast na tela (e propagar de iframes para a janela principal)
  function showToast(message, duration = 4500) {
    if (!IS_TOP_FRAME) {
      try {
        window.top.postMessage({ source: 'livia-copilot', action: 'show_toast', message, duration }, '*');
      } catch (e) {}
    }

    const existing = document.querySelector('.livia-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'livia-toast';
    toast.innerHTML = `<span>✨</span><span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }

  // Sinais capturados em tempo real de sub-iframes do Google (ex: modal "Informações comerciais" / "Editar perfil")
  let subframeLiveSignals = {
    hasHours: false,
    hasPhone: false,
    phoneText: '',
    descLength: 0,
    timestamp: 0
  };

  if (IS_TOP_FRAME) {
    window.addEventListener('message', (event) => {
      if (!event.data || event.data.source !== 'livia-copilot') return;
      if (event.data.action === 'show_toast') {
        showToast(event.data.message, event.data.duration || 4500);
      } else if (event.data.action === 'subframe_signals' && event.data.signals) {
        const s = event.data.signals;
        const changed =
          (s.hasHours && !subframeLiveSignals.hasHours) ||
          (s.hasPhone && !subframeLiveSignals.hasPhone) ||
          (s.descLength > subframeLiveSignals.descLength);
        subframeLiveSignals = {
          hasHours: subframeLiveSignals.hasHours || !!s.hasHours,
          hasPhone: subframeLiveSignals.hasPhone || !!s.hasPhone,
          phoneText: s.phoneText || subframeLiveSignals.phoneText,
          descLength: Math.max(subframeLiveSignals.descLength || 0, s.descLength || 0),
          timestamp: Date.now()
        };
        if (changed) {
          renderCommandCenterContent(currentCommandTab);
        }
      }
    });
  }

  // Em sub-iframes do Google (ex: janela "Informações comerciais" -> "Horário" / "Contato"), envia sinais para o painel principal
  function scanAndBroadcastSubframeSignals() {
    if (IS_TOP_FRAME) return;
    try {
      const txt = document.body ? (document.body.innerText || '') : '';
      if (txt.length < 20) return;

      const hasHoursInModal =
        txt.includes('Aberto com horário normal') ||
        /(?:Segunda-feira|Terça-feira|Quarta-feira|Quinta-feira|Sexta-feira)[\s\n:]+(?:\d{1,2}:\d{2}|Fechado)/i.test(txt);

      const phoneMatch = txt.match(/(\(\d{2}\)\s*\d{4,5}[-\s]?\d{4})/);
      const phoneText = phoneMatch ? phoneMatch[1] : '';
      const hasPhoneInModal = phoneText.length >= 8;

      if (hasHoursInModal || hasPhoneInModal) {
        window.top.postMessage({
          source: 'livia-copilot',
          action: 'subframe_signals',
          signals: {
            hasHours: hasHoursInModal,
            hasPhone: hasPhoneInModal,
            phoneText
          }
        }, '*');
      }
    } catch (e) {}
  }

  // Preenche campo de formulário simulando digitação nativa humana (compatível com Closure/Wiz/React do Google)
  function setNativeValue(element, value) {
    if (!element) return;
    element.focus();

    const tag = element.tagName ? element.tagName.toUpperCase() : '';
    try {
      if (tag === 'TEXTAREA') {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
        if (setter) setter.call(element, value);
        else element.value = value;
      } else if (tag === 'INPUT') {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (setter) setter.call(element, value);
        else element.value = value;
      } else if (element.isContentEditable) {
        element.innerText = value;
      } else {
        element.value = value;
      }
    } catch (e) {
      element.value = value;
      if (element.isContentEditable) element.innerText = value;
    }

    element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: ' ' }));
    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: ' ' }));
  }

  // Carrega ou atualiza os dados da empresa
  async function refreshBusinessData() {
    cachedBizData = await window.LiviaApi.getBusinessData();
    return cachedBizData;
  }

  let currentCommandTab = 'auditoria';
  let isPanelWide = false;
  let isPanelCollapsed = false;
  let isDarkTheme = false;
  let customGeoGridConfig = { keyword: '', city: '', neighborhoods: null };

  // Abre o Painel Lateral de Operações e muda para a aba desejada
  function switchCommandCenterTab(tabId) {
    currentCommandTab = tabId;
    const panel = document.getElementById('livia-command-center');
    const launcher = document.getElementById('livia-panel-launcher');
    if (panel && isPanelCollapsed) {
      isPanelCollapsed = false;
      panel.classList.remove('livia-panel-collapsed');
      if (launcher) launcher.classList.remove('visible');
      document.documentElement.classList.add('livia-split-active');
      if (isPanelWide) document.documentElement.classList.add('livia-split-wide');
    }
    renderCommandCenterContent(tabId);
  }

  // --- 1. PAINEL LATERAL DE OPERAÇÕES SPLIT-SCREEN (SUBSTITUI A BARRA INFERIOR) ---
  async function injectLiviaDock() {
    if (!IS_TOP_FRAME) return;
    if (document.getElementById('livia-command-center')) return;

    await refreshBusinessData();
    const { businesses, activeBusinessId } = cachedBizData;

    // Cria o botão lateral discreto para quando o painel estiver recolhido
    const launcher = document.createElement('div');
    launcher.id = 'livia-panel-launcher';
    launcher.title = 'Abrir Painel de Operações Lívia Copilot Pro';
    launcher.innerHTML = `
      <span style="font-size: 18px;">✨</span>
      <span style="writing-mode: vertical-rl; text-orientation: mixed; font-weight: 800; font-size: 12px; letter-spacing: 0.5px;">ABRIR PAINEL LÍVIA</span>
    `;
    document.body.appendChild(launcher);

    // Cria o Painel Lateral Split-Screen
    const panel = document.createElement('aside');
    panel.id = 'livia-command-center';

    // Ativa a divisão de tela com o Google (sem sobrepor o conteúdo)
    document.documentElement.classList.add('livia-split-active');

    panel.innerHTML = `
      <div class="livia-cc-header">
        <div class="livia-cc-brand">
          <div class="livia-cc-brand-badge">✨</div>
          <div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="livia-cc-title">Lívia Copilot Pro</span>
              <span class="livia-pro-pill">V2.0 PRO</span>
            </div>
            <div class="livia-cc-subtitle">Central de Operações GMN • ConectWeb</div>
          </div>
        </div>
        <div class="livia-cc-controls">
          <button type="button" class="livia-cc-icon-btn" id="livia-cc-theme-btn" title="Alternar Tema Claro Executivo / Escuro Suave">
            🌙 Escuro
          </button>
          <button type="button" class="livia-cc-icon-btn" id="livia-cc-wide-btn" title="Expandir largura do painel (Modo Amplo)">
            ⤢ Amplo
          </button>
          <button type="button" class="livia-cc-icon-btn" id="livia-cc-collapse-btn" title="Recolher painel para a lateral">
            ✖
          </button>
        </div>
      </div>

      <div class="livia-cc-client-bar">
        <div class="livia-cc-client-selector-wrap">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
            <label class="livia-cc-input-label">🏢 EMPRESA SELECIONADA</label>
            <span id="livia-cc-badge-mode" class="livia-badge-client">Cliente Ativo</span>
          </div>
          <div style="display: flex; gap: 6px; align-items: center;">
            <select id="livia-dock-select" class="livia-cc-select" title="Selecionar Empresa Gerenciada ou Prospecto da Busca"></select>
            <button type="button" class="livia-cc-icon-action" id="livia-cc-refresh" title="Reanalisar dados da tela do Google agora">
              🔄
            </button>
          </div>
        </div>

        <div class="livia-cc-quick-actions-grid">
          <button type="button" class="livia-btn-action-primary" id="livia-cc-create-listing" title="Cadastrar nova empresa e abrir o assistente oficial de criação no Google Meu Negócio">
            <span>🚀</span> <strong>+ Criar Ficha no Google</strong>
          </button>
          <button type="button" class="livia-btn-action-secondary" id="livia-cc-add-client" title="Importar a empresa aberta na tela do Google para sua lista">
            <span>📥</span> Importar da Tela
          </button>
          <a id="livia-cc-open-maps-direct" href="#" target="_blank" class="livia-btn-action-secondary" style="text-decoration: none;" title="Abrir ficha oficial no Google Maps em nova aba">
            <span>🗺️</span> Maps
          </a>
        </div>

        <div id="livia-cc-live-score-strip" class="livia-cc-score-box">
          <span>Lendo sinais da ficha no Google...</span>
        </div>
      </div>

      <div class="livia-cc-tabs-wrapper">
        <div class="livia-cc-tabs">
          <button type="button" class="livia-cc-tab active" data-cc-tab="auditoria">
            <span class="tab-icon">📊</span>
            <span>Auditoria</span>
          </button>
          <button type="button" class="livia-cc-tab" data-cc-tab="publicar">
            <span class="tab-icon">📝</span>
            <span>Publicar</span>
          </button>
          <button type="button" class="livia-cc-tab" data-cc-tab="otimizar">
            <span class="tab-icon">⚙️</span>
            <span>Perfil</span>
          </button>
          <button type="button" class="livia-cc-tab" data-cc-tab="prospeccao">
            <span class="tab-icon">🎯</span>
            <span>Prospecção</span>
          </button>
          <button type="button" class="livia-cc-tab" data-cc-tab="avaliacoes">
            <span class="tab-icon">⭐</span>
            <span>Avaliações</span>
          </button>
          <button type="button" class="livia-cc-tab" data-cc-tab="geogrid">
            <span class="tab-icon">🗺️</span>
            <span>Geo-Grid</span>
          </button>
        </div>
      </div>

      <div class="livia-cc-body" id="livia-cc-body-content"></div>

      <div class="livia-cc-footer">
        <span><strong>ConectWeb Soluções Digitais</strong> • v2.0 Pro</span>
        <span id="livia-cc-footer-status" style="color: var(--cc-emerald); font-weight: 700;">● Robô 1-Clique Ativo</span>
      </div>
    `;

    document.body.appendChild(panel);

    // Popula o seletor de empresas
    const select = panel.querySelector('#livia-dock-select');
    businesses.forEach(biz => {
      const opt = document.createElement('option');
      opt.value = biz.id;
      opt.innerText = biz.name;
      if (biz.id === activeBusinessId) opt.selected = true;
      select.appendChild(opt);
    });

    select.addEventListener('change', async (e) => {
      const val = e.target.value;
      if (val === '__live_prospect__') {
        selectedProspectOverride = null;
        renderCommandCenterContent(currentCommandTab);
        return;
      }
      if (val.startsWith('__prospect_idx_')) {
        const idx = parseInt(val.replace('__prospect_idx_', ''), 10);
        const list = scrapeCompetitorsFromPage();
        if (list[idx]) {
          selectedProspectOverride = list[idx];
          if (list[idx].cardEl) {
            try { list[idx].cardEl.click(); } catch (err) {}
          }
          showToast(`🎯 Prospectando: ${list[idx].name}`);
          renderCommandCenterContent(currentCommandTab);
          setTimeout(() => renderCommandCenterContent(currentCommandTab), 750);
          setTimeout(() => renderCommandCenterContent(currentCommandTab), 1600);
        }
        return;
      }
      selectedProspectOverride = null;
      await window.LiviaApi.setActiveBusiness(val);
      await refreshBusinessData();
      showToast(`Cliente ativo: ${cachedBizData.activeBusiness.name} 🚀`);
      renderCommandCenterContent(currentCommandTab);
    });

    // Restaura preferência de tema (Claro Executivo por padrão)
    chrome.storage.local.get(['liviaPanelTheme', 'liviaPanelWide'], (prefs) => {
      if (prefs.liviaPanelTheme === 'dark') {
        isDarkTheme = true;
        panel.classList.add('livia-theme-dark');
        panel.querySelector('#livia-cc-theme-btn').innerText = '☀️ Claro';
      }
      if (prefs.liviaPanelWide) {
        isPanelWide = true;
        panel.classList.add('livia-panel-wide');
        document.documentElement.classList.add('livia-split-wide');
        panel.querySelector('#livia-cc-wide-btn').innerText = '⤡ Normal';
      }
    });

    // Botão Alternar Tema (Claro Executivo vs Escuro Suave)
    panel.querySelector('#livia-cc-theme-btn').onclick = () => {
      isDarkTheme = !isDarkTheme;
      panel.classList.toggle('livia-theme-dark', isDarkTheme);
      panel.querySelector('#livia-cc-theme-btn').innerText = isDarkTheme ? '☀️ Claro' : '🌙 Escuro';
      chrome.storage.local.set({ liviaPanelTheme: isDarkTheme ? 'dark' : 'light' });
    };

    // Botão Modo Amplo (450px <-> 580px)
    panel.querySelector('#livia-cc-wide-btn').onclick = () => {
      isPanelWide = !isPanelWide;
      panel.classList.toggle('livia-panel-wide', isPanelWide);
      document.documentElement.classList.toggle('livia-split-wide', isPanelWide && !isPanelCollapsed);
      panel.querySelector('#livia-cc-wide-btn').innerText = isPanelWide ? '⤡ Normal' : '⤢ Amplo';
      chrome.storage.local.set({ liviaPanelWide: isPanelWide });
    };

    // Botão Minimizar / Recolher Painel
    panel.querySelector('#livia-cc-collapse-btn').onclick = () => {
      isPanelCollapsed = true;
      panel.classList.add('livia-panel-collapsed');
      launcher.classList.add('visible');
      document.documentElement.classList.remove('livia-split-active', 'livia-split-wide');
    };

    launcher.onclick = () => {
      isPanelCollapsed = false;
      panel.classList.remove('livia-panel-collapsed');
      launcher.classList.remove('visible');
      document.documentElement.classList.add('livia-split-active');
      if (isPanelWide) document.documentElement.classList.add('livia-split-wide');
      renderCommandCenterContent(currentCommandTab);
    };

    // Botões de Criar Nova Ficha, Importar da Tela e Atualizar
    const createListingBtn = panel.querySelector('#livia-cc-create-listing');
    if (createListingBtn) {
      createListingBtn.onclick = () => openCreateBusinessModal();
    }
    panel.querySelector('#livia-cc-add-client').onclick = () => openQuickOnboardModal(getRealBusinessTitleFromPage());
    panel.querySelector('#livia-cc-refresh').onclick = () => {
      selectedProspectOverride = null;
      renderCommandCenterContent(currentCommandTab);
      showToast('Leitura em tempo real da ficha e empresas da página atualizada! 🔄');
    };

    // Navegação entre as 5 Abas
    panel.querySelectorAll('.livia-cc-tab').forEach(tabBtn => {
      tabBtn.onclick = () => {
        currentCommandTab = tabBtn.dataset.ccTab;
        renderCommandCenterContent(currentCommandTab);
      };
    });

    // Atualiza automaticamente o Painel ao mudar URL/hash ou clicar na Lupa / Empresas da Busca / Maps
    window.addEventListener('hashchange', () => {
      selectedProspectOverride = null;
      [450, 1100, 2100].forEach(ms => setTimeout(() => renderCommandCenterContent(currentCommandTab), ms));
    });

    window.addEventListener('popstate', () => {
      selectedProspectOverride = null;
      [450, 1100, 2100].forEach(ms => setTimeout(() => renderCommandCenterContent(currentCommandTab), ms));
    });

    document.addEventListener('submit', () => {
      selectedProspectOverride = null;
      [600, 1400, 2500].forEach(ms => setTimeout(() => renderCommandCenterContent(currentCommandTab), ms));
    }, true);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target && (e.target.name === 'q' || e.target.getAttribute('role') === 'combobox')) {
        selectedProspectOverride = null;
        [650, 1500, 2600].forEach(ms => setTimeout(() => renderCommandCenterContent(currentCommandTab), ms));
      }
    }, true);

    document.addEventListener('click', (e) => {
      if (!e.target || e.target.closest('#livia-command-center, #livia-panel-launcher, .livia-modal-backdrop')) return;
      const searchBtn = e.target.closest('button[type="submit"], button[aria-label*="Pesquisar" i], button[aria-label*="Search" i], div[jsaction*="search"]');
      const cardClicked = e.target.closest('div.VkpGBb, div.rllt__details, div.cXedhc, div.uMdZh, div[jscontroller][data-cid], div.Nv2PK, a.hfpxzc, a.vwVdIc, div[role="listitem"]');
      if (searchBtn || cardClicked) {
        selectedProspectOverride = null;
        [500, 1200, 2200].forEach(ms => setTimeout(() => renderCommandCenterContent(currentCommandTab), ms));
      }
    }, true);

    // Tenta casar automaticamente o perfil aberto na tela e renderiza a aba inicial
    autoDetectBusinessOnScreen();
    renderCommandCenterContent(currentCommandTab);
  }

  // Armazena uma empresa selecionada manualmente na lista de prospecção da página atual
  let selectedProspectOverride = null;
  // Armazena os leads obtidos via Google Places API (Modo Turbo)
  let lastApiProspects = [];
  let isSearchingApi = false;

  function isIgnoredGoogleSystemHeading(rawText) {
    if (!rawText) return true;
    const lower = rawText.trim().toLowerCase();
    if (lower.length < 2 || lower.length > 140) return true;
    const ignored = [
      'resultados da pesquisa', 'resultados da busca', 'resultados principais', 'resultados da web',
      'resultado da web', 'resultados locais', 'resultados', 'pesquisa', 'google',
      'links de acessibilidade', 'modos de pesquisa', 'filtros e tópicos', 'filtros',
      'visão geral criada por ia', 'as pessoas também perguntam', 'pesquisas relacionadas',
      'minha empresa', 'perfil da empresa', 'sua empresa no google',
      'você gerencia estes perfis', 'ferramentas', 'modo ia', 'notícias',
      'shopping', 'vídeos', 'imagens', 'mapas', 'tudo', 'mais', 'fotos', 'posts',
      'lugares', 'empresas', 'locais', 'avaliações', 'críticas', 'sobre',
      'horário de funcionamento', 'informações comerciais', 'perguntas e respostas'
    ];
    return ignored.some(ign => lower === ign || lower.startsWith(ign + ' '));
  }

  // Extrai o nome real da empresa aberta no Painel Lateral / Ficha do Google ou da 1ª Empresa da Busca Local
  function getRealBusinessTitleFromPage() {
    if (selectedProspectOverride && selectedProspectOverride.name) {
      return selectedProspectOverride.name;
    }

    // 0. Heurística de alta precisão para Hero Card / Ficha Principal do Google:
    // Localiza o subtítulo de avaliações (ex: "4,3 ★★★★☆ 491 avaliações no Google · Supermercado · Aberto")
    // e extrai o título oficial associado
    try {
      const candidates = Array.from(document.querySelectorAll('div, span, p'));
      for (const el of candidates) {
        if (el.closest('#livia-command-center, .livia-modal-backdrop')) continue;
        const t = (el.innerText || '').trim();
        if (/\b[1-5][.,]\d\s*[★⭐*].*avaliações no Google/i.test(t) && t.length < 130) {
          const parent = el.parentElement;
          if (parent) {
            const h = parent.querySelector('h1, h2, h3, div[role="heading"], div[data-attrid="title"], div.SPZz6b');
            if (h) {
              const hTxt = (h.innerText || '').trim();
              if (hTxt && !isIgnoredGoogleSystemHeading(hTxt)) {
                return hTxt;
              }
            }
            if (parent.previousElementSibling) {
              const prevH = parent.previousElementSibling.querySelector('h1, h2, h3, div[role="heading"]') || parent.previousElementSibling;
              const prevTxt = (prevH.innerText || '').trim();
              if (prevTxt && !isIgnoredGoogleSystemHeading(prevTxt)) {
                return prevTxt;
              }
            }
          }
          break;
        }
      }
    } catch (e) {}

    // 1. Seletores específicos do Painel de Conhecimento / Side-Sheet / Local Finder / Google Maps
    const primarySelectors = [
      'h2[data-attrid="title"]',
      '[data-attrid="title"]',
      'div[role="heading"][aria-level="2"][data-attrid="title"]',
      'div.SPZz6b h2',
      'div.SPZz6b div[role="heading"]',
      'div.yKMdhc h2',
      'div.yKMdhc div[role="heading"]',
      'div.kno-ecr-pt',
      'div.I6txUd div[role="heading"]',
      'div.I6txUd h2',
      'h2.qrShPb',
      'div.qrShPb[role="heading"]',
      'div.PZPZlf[data-attrid="title"]',
      'div.PZPZlf[role="heading"]',
      'h1.DUwDvf',
      'h1.fontHeadlineLarge',
      '#rhs div[role="heading"][aria-level="2"]',
      'div.gXq2Hd div[role="heading"][aria-level="2"]',
      'div.bVj5Zb div[role="heading"][aria-level="2"]',
      'div.xpdopen div[role="heading"][aria-level="2"]'
    ];

    for (const sel of primarySelectors) {
      const els = Array.from(document.querySelectorAll(sel));
      for (const el of els) {
        if (el.closest('#livia-command-center, .livia-modal-backdrop')) continue;
        const txt = (el.innerText || '').trim();
        if (el.offsetParent !== null && !isIgnoredGoogleSystemHeading(txt)) {
          return txt;
        }
      }
      for (const el of els) {
        if (el.closest('#livia-command-center, .livia-modal-backdrop')) continue;
        const txt = (el.innerText || '').trim();
        if (!isIgnoredGoogleSystemHeading(txt)) return txt;
      }
    }

    // 2. Se houver uma aba lateral / side-sheet aberta (com botão "Fechar" X ou botões "Website"/"Direções"/"Rotas")
    const sidePanels = Array.from(document.querySelectorAll('#rhs, div.gXq2Hd, div.bVj5Zb, div.immersive-container, div.kp-wholepage'));
    for (const sp of sidePanels) {
      if (sp.closest('#livia-command-center')) continue;
      const headings = Array.from(sp.querySelectorAll('h1, h2, div[role="heading"][aria-level="2"]'));
      for (const h of headings) {
        const txt = (h.innerText || '').trim();
        if (h.offsetParent !== null && !isIgnoredGoogleSystemHeading(txt)) {
          return txt;
        }
      }
    }

    // 3. Se o usuário acabou de pesquisar um segmento (ex: "imobiliária", "restaurante", etc.) na Busca ou Maps
    // e há cards de empresas visíveis na tela, seleciona automaticamente a 1ª empresa encontrada na página!
    const scrapedList = scrapeCompetitorsFromPage();
    if (scrapedList.length > 0 && scrapedList[0].name) {
      return scrapedList[0].name;
    }

    // 4. Procura títulos visíveis excluindo cabeçalhos do sistema do Google e resultados orgânicos genéricos
    const candidateElements = Array.from(document.querySelectorAll('h1, h2, div[aria-level="2"]'));
    for (const el of candidateElements) {
      if (el.closest('#livia-command-center, .livia-modal-backdrop')) continue;
      if (el.offsetParent === null) continue;
      const text = (el.innerText || '').trim();
      if (!isIgnoredGoogleSystemHeading(text) && text.length < 85) {
        return text;
      }
    }

    return null;
  }

  // Tenta detectar a empresa na página e selecionar no Dock
  function autoDetectBusinessOnScreen() {
    try {
      const realTitle = getRealBusinessTitleFromPage();
      const { businesses, activeBusinessId } = cachedBizData;
      let matchedBiz = null;

      if (realTitle) {
        for (const biz of businesses) {
          if (realTitle.toLowerCase().includes(biz.name.toLowerCase()) || biz.name.toLowerCase().includes(realTitle.toLowerCase())) {
            matchedBiz = biz;
            if (biz.id !== activeBusinessId) {
              window.LiviaApi.setActiveBusiness(biz.id).then(() => {
                const select = document.getElementById('livia-dock-select');
                if (select) select.value = biz.id;
                refreshBusinessData();
                showToast(`Lívia identificou o perfil: ${biz.name} e ativou o contexto automaticamente! ✨`, 3000);
              });
            }
            break;
          }
        }
      }

      // Calibra a cidade somente se a empresa aberta na tela for realmente a empresa gerenciada
      if (matchedBiz) {
        const pageAddressElements = Array.from(document.querySelectorAll('[data-attrid*="address"], span.LrzXr, div[data-local-attribute="d3adr"], div[aria-label*="Endereço" i]'));
        const addressString = pageAddressElements.map(el => el.innerText).join(' ');
        if ((addressString.includes('Macatuba') || addressString.includes('macatuba')) && matchedBiz.city.toLowerCase() !== 'macatuba') {
          const updatedBiz = {
            ...matchedBiz,
            city: 'Macatuba',
            serviceAreas: 'Macatuba, Lençóis Paulista e Região'
          };
          window.LiviaApi.saveBusiness(updatedBiz).then(() => {
            refreshBusinessData();
          });
        }
      }
    } catch (e) {
      // Silencioso se não conseguir casar
    }
  }

  // Assistente Especial: Criar Nova Ficha no Google Meu Negócio (com pré-cadastro e abertura direta do Google)
  function openCreateBusinessModal(prefilledData = null) {
    const liveData = collectLiveProfileData(cachedBizData?.activeBusiness);
    const defaultName = (typeof prefilledData === 'string' ? prefilledData : prefilledData?.name) || '';
    const defaultCat = prefilledData?.primaryCategory || prefilledData?.niche || '';
    const defaultCity = prefilledData?.city || liveData.detectedCity || cachedBizData?.activeBusiness?.city || 'Macatuba';
    const defaultPhone = prefilledData?.whatsapp || prefilledData?.phone || '';

    const backdrop = document.createElement('div');
    backdrop.className = 'livia-modal-backdrop';

    backdrop.innerHTML = `
      <div class="livia-modal" style="width: 580px; max-width: 95vw;">
        <div class="livia-modal-header" style="border-bottom: 1px solid var(--cc-border, #e2e8f0); padding-bottom: 12px;">
          <div class="livia-modal-title" style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #059669 0%, #10b981 100%); display: flex; align-items: center; justify-content: center; font-size: 18px; color: #fff; box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);">🚀</div>
            <div>
              <div style="font-size: 16px; font-weight: 800; color: var(--cc-text, #0f172a);">Criar Nova Ficha no Google Meu Negócio</div>
              <div style="font-size: 11.5px; color: var(--cc-text-muted, #64748b); font-weight: 500;">Cadastre a empresa na Lívia e inicie a ficha oficial no Google</div>
            </div>
          </div>
          <button class="livia-modal-close" style="font-size: 24px; cursor: pointer; border: none; background: transparent; color: var(--cc-text-muted, #64748b);">&times;</button>
        </div>

        <div class="livia-modal-body" style="padding: 16px 0; display: flex; flex-direction: column; gap: 14px;">
          <div style="background: var(--cc-accent-soft, #eff6ff); border: 1px solid var(--cc-accent, #2563eb); border-radius: 9px; padding: 11px 14px; font-size: 12.5px; color: var(--cc-text, #0f172a); line-height: 1.5;">
            💡 <strong>Fluxo Inteligente:</strong> Digite o nome do comércio abaixo. A Lívia vai salvar a empresa, <strong>copiar o nome para a área de transferência</strong> e abrir imediatamente a página oficial de criação do Google Meu Negócio para você concluir em segundos!
          </div>

          <div>
            <label style="display: block; font-size: 12px; font-weight: 800; color: var(--cc-text, #0f172a); margin-bottom: 5px;">
              Nome Comercial da Empresa / Loja: <span style="color: #dc2626;">*</span>
            </label>
            <input type="text" id="create-biz-name" class="livia-cc-input" value="${defaultName}" placeholder="Ex: Oficina do Carlos, Max Motos Elétricas, Padaria São José" style="font-size: 14px; font-weight: 700; padding: 10px 12px;">
          </div>

          <div>
            <label style="display: block; font-size: 12px; font-weight: 800; color: var(--cc-text, #0f172a); margin-bottom: 5px;">
              Categoria Principal no Google: <span style="color: #dc2626;">*</span>
            </label>
            <input type="text" id="create-biz-cat" class="livia-cc-input" value="${defaultCat}" placeholder="Ex: Oficina mecânica, Loja de motocicletas elétricas, Pizzaria" style="padding: 9px 12px; font-size: 13px;">
            <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 7px;">
              <span style="font-size: 10.5px; color: var(--cc-text-muted, #64748b); margin-right: 3px; align-self: center; font-weight: 700;">NICHOS RÁPIDOS:</span>
              <button type="button" class="livia-chip-btn" data-cat="Oficina mecânica">🔧 Oficina mecânica</button>
              <button type="button" class="livia-chip-btn" data-cat="Loja de motocicletas elétricas">🛵 Motos elétricas</button>
              <button type="button" class="livia-chip-btn" data-cat="Restaurante">🍽️ Restaurante</button>
              <button type="button" class="livia-chip-btn" data-cat="Pizzaria">🍕 Pizzaria</button>
              <button type="button" class="livia-chip-btn" data-cat="Supermercado">🛒 Supermercado</button>
              <button type="button" class="livia-chip-btn" data-cat="Barbearia">✂️ Barbearia</button>
              <button type="button" class="livia-chip-btn" data-cat="Assistência técnica de informática">💻 Assistência técnica</button>
              <button type="button" class="livia-chip-btn" data-cat="Clínica odontológica">🦷 Dentista</button>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="display: block; font-size: 12px; font-weight: 800; color: var(--cc-text, #0f172a); margin-bottom: 5px;">
                Cidade / Município:
              </label>
              <input type="text" id="create-biz-city" class="livia-cc-input" value="${defaultCity}" placeholder="Ex: Macatuba, Bauru, Lençóis Paulista" style="padding: 9px 12px;">
            </div>
            <div>
              <label style="display: block; font-size: 12px; font-weight: 800; color: var(--cc-text, #0f172a); margin-bottom: 5px;">
                WhatsApp / Telefone:
              </label>
              <input type="text" id="create-biz-phone" class="livia-cc-input" value="${defaultPhone}" placeholder="Ex: (14) 99876-5432" style="padding: 9px 12px;">
            </div>
          </div>

          <div>
            <label style="display: block; font-size: 12px; font-weight: 800; color: var(--cc-text, #0f172a); margin-bottom: 6px;">
              Tipo de Estabelecimento no Google:
            </label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <label style="display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px; background: var(--cc-surface-alt, #f8fafc); border: 1.5px solid var(--cc-border, #cbd5e1); border-radius: 9px; cursor: pointer;">
                <input type="radio" name="create-biz-type" value="store" checked style="margin-top: 3px;">
                <div>
                  <div style="font-size: 12.5px; font-weight: 800; color: var(--cc-text, #0f172a);">🏬 Ponto Comercial Físico</div>
                  <div style="font-size: 11px; color: var(--cc-text-muted, #64748b);">Clientes visitam seu endereço físico (Loja, Oficina, Consultório)</div>
                </div>
              </label>
              <label style="display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px; background: var(--cc-surface-alt, #f8fafc); border: 1.5px solid var(--cc-border, #cbd5e1); border-radius: 9px; cursor: pointer;">
                <input type="radio" name="create-biz-type" value="service" style="margin-top: 3px;">
                <div>
                  <div style="font-size: 12.5px; font-weight: 800; color: var(--cc-text, #0f172a);">🚚 Área de Cobertura / Delivery</div>
                  <div style="font-size: 11px; color: var(--cc-text-muted, #64748b);">Atendimento a domicílio ou área de entrega de serviços</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div class="livia-modal-actions" style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--cc-border, #e2e8f0); padding-top: 14px;">
          <button type="button" class="livia-btn-inline livia-btn-secondary" id="create-biz-cancel" style="padding: 9px 16px;">
            Cancelar
          </button>
          <button type="button" class="livia-btn-inline livia-btn-auto" id="create-biz-start" style="padding: 10px 22px; font-size: 13px; font-weight: 800;">
            🚀 Iniciar Criação no Google Meu Negócio
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    backdrop.querySelector('.livia-modal-close').onclick = close;
    backdrop.querySelector('#create-biz-cancel').onclick = close;

    backdrop.querySelectorAll('.livia-chip-btn').forEach(chip => {
      chip.onclick = () => {
        backdrop.querySelector('#create-biz-cat').value = chip.dataset.cat;
      };
    });

    backdrop.querySelector('#create-biz-start').onclick = async () => {
      const name = backdrop.querySelector('#create-biz-name').value.trim();
      const cat = backdrop.querySelector('#create-biz-cat').value.trim() || 'Comércio e Serviços Locais';
      let phone = backdrop.querySelector('#create-biz-phone').value.trim().replace(/\D/g, '');
      const city = backdrop.querySelector('#create-biz-city').value.trim() || 'Bauru';
      const type = backdrop.querySelector('input[name="create-biz-type"]:checked')?.value || 'store';

      if (!name) {
        showToast('⚠️ Digite o nome da empresa para iniciar a criação.');
        backdrop.querySelector('#create-biz-name').focus();
        return;
      }

      if (phone && !phone.startsWith('55') && phone.length >= 10) {
        phone = '55' + phone;
      }

      const newBiz = {
        name: name,
        niche: cat,
        primaryCategory: cat,
        secondaryKeywords: [cat.toLowerCase(), name.toLowerCase(), city.toLowerCase()],
        services: [
          `Atendimento Especializado em ${cat}`,
          `Serviços Premium em ${city}`,
          'Orçamento Personalizado e Garantia'
        ],
        city: city,
        neighborhood: 'Centro',
        serviceAreas: `${city} e Região`,
        whatsapp: phone,
        website: '',
        toneOfVoice: 'amigavel',
        reviewReplyPolicy: 'balanced',
        isServiceArea: (type === 'service')
      };

      const res = await window.LiviaApi.saveBusiness(newBiz);
      if (res && res.business) {
        await window.LiviaApi.setActiveBusiness(res.business.id);
        await refreshBusinessData();

        // Copia o nome para a área de transferência
        try {
          await navigator.clipboard.writeText(name);
        } catch (err) {}

        // Atualiza o select do Dock
        const select = document.getElementById('livia-dock-select');
        if (select) {
          const opt = document.createElement('option');
          opt.value = res.business.id;
          opt.innerText = `🏢 ${res.business.name}`;
          opt.selected = true;
          select.appendChild(opt);
          select.value = res.business.id;
        }

        close();
        showToast(`🎉 "${name}" cadastrada! Nome copiado! Abrindo o Google Meu Negócio... 📋`, 6000);

        // Abre a página oficial de criação do Google Meu Negócio em nova aba (URL limpa oficial para não dar erro 500)
        const googleUrl = 'https://business.google.com/create';
        window.open(googleUrl, '_blank');

        renderCommandCenterContent(currentCommandTab);
      }
    };
  }

  // Modal para cadastrar uma nova empresa em 1 clique raspando dados da tela do Google
  function openQuickOnboardModal(detectedName) {
    const liveData = collectLiveProfileData(cachedBizData?.activeBusiness);
    if (!detectedName) {
      detectedName = liveData.kpName || getRealBusinessTitleFromPage() || 'Nova Empresa';
    }

    const detectedCategory = liveData.categoryText || 'Comércio e Serviços Locais';
    const detectedCity = liveData.detectedCity || 'Lençóis Paulista';
    let detectedNeighborhood = 'Centro';

    if (liveData.addressText) {
      const dashParts = liveData.addressText.split(' - ');
      if (dashParts.length > 1) {
        const sub = dashParts[1].split(',');
        if (sub.length > 0 && sub[0].trim().length > 2 && !/^\d/.test(sub[0].trim())) {
          detectedNeighborhood = sub[0].trim();
        }
      }
    }

    const detectedPhone = liveData.phoneText || '';
    const catLower = detectedCategory.toLowerCase();

    let suggestedServices = `Atendimento Especializado em ${detectedCategory}, Serviços Premium em ${detectedCity}, Orçamento Personalizado`;
    if (catLower.includes('japon') || catLower.includes('sushi') || detectedName.toLowerCase().includes('sushi')) {
      suggestedServices = `Sushi e Sashimi Frescos, Barcas e Combinados Especiais, Rodízio Japonês Completo, Temakis e Pratos Quentes (Yakisoba), Delivery Rápido em ${detectedCity}`;
    } else if (catLower.includes('restaurante') || catLower.includes('pizzaria') || catLower.includes('lanchonete')) {
      suggestedServices = `Cardápio Especial e Pratos Executivos, Pedidos e Delivery em ${detectedCity}, Atendimento Familiar e Eventos, Ingredientes Selecionados`;
    } else if (catLower.includes('informát') || catLower.includes('notebook') || catLower.includes('assistência')) {
      suggestedServices = 'Manutenção e Conserto de Notebooks, Upgrade de SSD e Memória RAM, Reparo de Placa-mãe, Troca de Tela e Teclado, Formatação e Limpeza Preventiva';
    } else if (catLower.includes('marketing') || catLower.includes('agência') || catLower.includes('site')) {
      suggestedServices = 'Gestão de Google Meu Negócio e SEO Local, Criação de Sites e Sistemas, Gestão de Tráfego Pago, Automações Comerciais';
    }

    const backdrop = document.createElement('div');
    backdrop.className = 'livia-modal-backdrop';

    backdrop.innerHTML = `
      <div class="livia-modal" style="width: 580px; max-width: 95vw;">
        <div class="livia-modal-header" style="border-bottom: 1px solid var(--cc-border, #e2e8f0); padding-bottom: 12px;">
          <div class="livia-modal-title" style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); display: flex; align-items: center; justify-content: center; font-size: 18px; color: #fff; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);">📥</div>
            <div>
              <div style="font-size: 16px; font-weight: 800; color: var(--cc-text, #0f172a);">Importar Perfil do Google para a Lívia</div>
              <div style="font-size: 11.5px; color: var(--cc-text-muted, #64748b); font-weight: 500;">Adicione a empresa aberta na tela à sua carteira de clientes</div>
            </div>
          </div>
          <button class="livia-modal-close" style="font-size: 24px; cursor: pointer; border: none; background: transparent; color: var(--cc-text-muted, #64748b);">&times;</button>
        </div>
        <div class="livia-modal-body" style="padding: 16px 0; display: flex; flex-direction: column; gap: 14px;">
          <div style="background: var(--cc-accent-soft, #eff6ff); border: 1px solid var(--cc-accent, #2563eb); border-radius: 9px; padding: 11px 14px; font-size: 12.5px; color: var(--cc-text, #0f172a); line-height: 1.5;">
            ✨ A Lívia detectou esta empresa no Google e pré-preencheu os dados abaixo. Confirme para adicionar à sua lista de clientes gerenciados:
          </div>

          <div>
            <label style="display: block; font-size: 12px; font-weight: 800; color: var(--cc-text, #0f172a); margin-bottom: 5px;">Nome da Empresa:</label>
            <input type="text" id="quick-biz-name" class="livia-cc-input" value="${detectedName}" style="font-size: 14px; font-weight: 700; padding: 10px 12px;">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="display: block; font-size: 12px; font-weight: 800; color: var(--cc-text, #0f172a); margin-bottom: 5px;">Categoria Primária:</label>
              <input type="text" id="quick-biz-cat" class="livia-cc-input" value="${detectedCategory}" style="padding: 9px 12px;">
            </div>
            <div>
              <label style="display: block; font-size: 12px; font-weight: 800; color: var(--cc-text, #0f172a); margin-bottom: 5px;">WhatsApp / Telefone:</label>
              <input type="text" id="quick-biz-phone" class="livia-cc-input" value="${detectedPhone}" placeholder="Ex: (14) 99876-5432" style="padding: 9px 12px;">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="display: block; font-size: 12px; font-weight: 800; color: var(--cc-text, #0f172a); margin-bottom: 5px;">Cidade:</label>
              <input type="text" id="quick-biz-city" class="livia-cc-input" value="${detectedCity}" style="padding: 9px 12px;">
            </div>
            <div>
              <label style="display: block; font-size: 12px; font-weight: 800; color: var(--cc-text, #0f172a); margin-bottom: 5px;">Bairro:</label>
              <input type="text" id="quick-biz-neighborhood" class="livia-cc-input" value="${detectedNeighborhood}" style="padding: 9px 12px;">
            </div>
          </div>

          <div>
            <label style="display: block; font-size: 12px; font-weight: 800; color: var(--cc-text, #0f172a); margin-bottom: 5px;">Principais Serviços (separados por vírgula):</label>
            <input type="text" id="quick-biz-services" class="livia-cc-input" value="${suggestedServices}" style="padding: 9px 12px;">
          </div>
        </div>
        <div class="livia-modal-actions" style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--cc-border, #e2e8f0); padding-top: 14px;">
          <button type="button" class="livia-btn-inline livia-btn-secondary" id="quick-biz-cancel" style="padding: 9px 16px;">Cancelar</button>
          <button type="button" class="livia-btn-inline" id="quick-biz-save" style="padding: 10px 22px; font-size: 13px; font-weight: 800;">Salvar e Ativar na Lívia 🚀</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    backdrop.querySelector('.livia-modal-close').onclick = close;
    backdrop.querySelector('#quick-biz-cancel').onclick = close;

    backdrop.querySelector('#quick-biz-save').onclick = async () => {
      const name = backdrop.querySelector('#quick-biz-name').value.trim();
      const cat = backdrop.querySelector('#quick-biz-cat').value.trim();
      let phone = backdrop.querySelector('#quick-biz-phone').value.trim().replace(/\D/g, '');
      const city = backdrop.querySelector('#quick-biz-city').value.trim();
      const neighborhood = backdrop.querySelector('#quick-biz-neighborhood').value.trim();
      const servicesStr = backdrop.querySelector('#quick-biz-services').value.trim();
      const servicesArr = servicesStr.split(',').map(s => s.trim()).filter(Boolean);

      if (!name) return;

      if (phone && !phone.startsWith('55') && phone.length >= 10) {
        phone = '55' + phone;
      }

      const newBiz = {
        name: name,
        niche: cat,
        primaryCategory: cat,
        secondaryKeywords: [cat.toLowerCase(), name.toLowerCase(), city.toLowerCase()],
        services: servicesArr,
        city: city || 'Horizonte',
        neighborhood: neighborhood || 'Diadema',
        serviceAreas: `${city} e Região`,
        whatsapp: phone,
        website: '',
        toneOfVoice: 'amigavel',
        reviewReplyPolicy: 'balanced'
      };

      const res = await window.LiviaApi.saveBusiness(newBiz);
      if (res && res.business) {
        await window.LiviaApi.setActiveBusiness(res.business.id);
        await refreshBusinessData();

        // Atualiza o seletor do Dock na tela
        const select = document.getElementById('livia-dock-select');
        if (select) {
          const opt = document.createElement('option');
          opt.value = res.business.id;
          opt.innerText = res.business.name;
          opt.selected = true;
          select.appendChild(opt);
          select.value = res.business.id;
        }

        const quickBtn = document.getElementById('livia-dock-quick-add');
        if (quickBtn) quickBtn.remove();

        showToast(`🎉 "${name}" cadastrada com sucesso e ativada na Lívia!`);
        close();
      }
    };
  }

  // --- 2. MONITORAMENTO DE AVALIAÇÕES (COM GESTÃO DE CRISE E TONS) ---
  function injectReviewReplyButtons() {
    const replyTextareas = document.querySelectorAll(
      'textarea[aria-label*="responder" i], textarea[aria-label*="reply" i], textarea[placeholder*="resposta" i], div[role="dialog"] textarea'
    );

    replyTextareas.forEach((textarea) => {
      if (textarea.dataset.liviaInjected) return;
      textarea.dataset.liviaInjected = 'true';

      const parentContainer = textarea.parentElement;
      if (!parentContainer) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'livia-review-wrapper';

      // Seletor de Modo de Resposta
      const modeSelect = document.createElement('select');
      modeSelect.className = 'livia-mode-select';
      modeSelect.innerHTML = `
        <option value="smart">✨ Modo Inteligente (Auto)</option>
        <option value="seo_local">🔥 SEO Local com Palavras-Chave</option>
        <option value="executive">💎 Formal & Executivo</option>
        <option value="sales_hook">🎁 Comercial / Gancho de Retorno</option>
        <option value="crisis">🛡️ Gestão de Crise (Empático)</option>
      `;

      // Botão Gerar
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'livia-btn-inline';
      btn.innerHTML = `<span>✨</span><span>Responder com a Lívia</span>`;

      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const originalBtnHtml = btn.innerHTML;
        btn.innerHTML = `<span>⏳</span><span>Lívia pensando...</span>`;
        btn.disabled = true;

        try {
          // Extrai informações da avaliação
          const reviewCard = textarea.closest('div[data-review-id]') || textarea.closest('div[role="dialog"]') || textarea.closest('div[jscontroller]') || textarea.parentElement.parentElement;
          let reviewerName = 'Cliente';
          let stars = 5;
          let reviewText = '';

          if (reviewCard) {
            const nameEl = reviewCard.querySelector('div[aria-level="3"], span.WNxzHc, div.TSUbDb, span[class*="author"]');
            if (nameEl) reviewerName = nameEl.innerText.trim();

            const starsEl = reviewCard.querySelector('span[aria-label*="estrela" i], span[aria-label*="star" i]');
            if (starsEl) {
              const match = starsEl.getAttribute('aria-label').match(/\d/);
              if (match) stars = parseInt(match[0], 10);
            }

            const textEl = reviewCard.querySelector('span.wiI7pd, div[class*="review-snippet"], span[data-expandable-section]');
            if (textEl) reviewText = textEl.innerText.trim();
          }

          let selectedMode = modeSelect.value;
          // Auto detecção de crise se for 1 a 3 estrelas
          if (selectedMode === 'smart' && stars <= 3) {
            selectedMode = 'crisis';
          }

          const result = await window.LiviaApi.generateReviewReply({
            reviewerName,
            stars,
            reviewText,
            mode: selectedMode
          });

          if (result && result.reply) {
            setNativeValue(textarea, result.reply);
            showToast(stars <= 3 ? 'Resposta de Gestão de Crise gerada com empatia! 🛡️' : 'Resposta com SEO Local gerada com sucesso! ✨');
          } else {
            showToast('Não foi possível gerar a resposta no momento.');
          }
        } catch (err) {
          console.error('[Lívia Copilot] Erro na resposta:', err);
          showToast('Erro ao consultar a Lívia.');
        } finally {
          btn.innerHTML = originalBtnHtml;
          btn.disabled = false;
        }
      });

      wrapper.appendChild(btn);
      wrapper.appendChild(modeSelect);
      parentContainer.insertBefore(wrapper, textarea.nextSibling);
    });
  }

  // Converte um DataURL ou URL remota em Blob (usando background worker se necessário para vencer CORS)
  async function getMediaBlob(mediaUrl, mediaDataUrl) {
    if (mediaDataUrl && mediaDataUrl.startsWith('data:')) {
      const res = await fetch(mediaDataUrl);
      return await res.blob();
    }
    if (!mediaUrl) return null;

    try {
      const bgRes = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'fetch_media_base64', url: mediaUrl }, (r) => resolve(r || null));
      });
      if (bgRes && bgRes.ok && bgRes.dataUrl) {
        const res = await fetch(bgRes.dataUrl);
        return await res.blob();
      }
    } catch (e) {}

    const response = await fetch(mediaUrl);
    return await response.blob();
  }

  // Copia a imagem como PNG para a Área de Transferência (permite dar Ctrl+V direto no upload de fotos!)
  async function copyImageToClipboard(mediaUrl, mediaDataUrl) {
    try {
      const blob = await getMediaBlob(mediaUrl, mediaDataUrl);
      if (!blob) return false;

      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);

      const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob })
      ]);
      return true;
    } catch (err) {
      console.warn('[Lívia] Erro ao copiar imagem para clipboard:', err);
      return false;
    }
  }

  // Função para anexar arquivo automaticamente no input[type="file"] do Google Meu Negócio
  async function autoAttachMediaToFileInput(modal, mediaUrl, filename, mediaDataUrl) {
    if (!mediaUrl && !mediaDataUrl) return false;
    const fileInput = (modal && modal.querySelector('input[type="file"]')) || document.querySelector('div[role="dialog"] input[type="file"]');
    if (!fileInput) return false;

    try {
      const blob = await getMediaBlob(mediaUrl, mediaDataUrl);
      if (!blob) return false;
      const file = new File([blob], filename || 'post-instagram.jpg', { type: blob.type || 'image/jpeg' });
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      fileInput.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    } catch (err) {
      console.warn('[Lívia] Falha ao tentar anexar arquivo automaticamente:', err);
      return false;
    }
  }

  // Renderiza um card visual elegante com a mídia importada do Instagram
  function renderImportedMediaCard(modal, buttonContainer, postData) {
    const existingCard = modal.querySelector('.livia-imported-media-card');
    if (existingCard) existingCard.remove();

    const mediaUrls = postData.mediaUrls || [];
    const mediaDataUrl = postData.mediaDataUrl || null;
    if (mediaUrls.length === 0 && !mediaDataUrl) return;

    const displaySrc = mediaDataUrl || mediaUrls[0];
    const mainUrl = mediaUrls[0] || mediaDataUrl;
    const isVideo = postData.mediaType === 'VIDEO';
    const filename = postData.mainMediaFilename || (isVideo ? 'video-post.mp4' : 'foto-post.jpg');

    const sourceIcon = postData.source === 'tiktok' ? '🎵' : postData.source === 'facebook' ? '📘' : '📸';
    const sourceName = postData.source === 'tiktok' ? 'TikTok' : postData.source === 'facebook' ? 'Facebook' : 'Instagram';

    const card = document.createElement('div');
    card.className = 'livia-imported-media-card';
    card.style.background = '#101624';
    card.style.border = '1px solid rgba(0, 210, 255, 0.35)';
    card.style.borderRadius = '10px';
    card.style.padding = '12px';
    card.style.margin = '10px 0';
    card.style.display = 'flex';
    card.style.alignItems = 'center';
    card.style.gap = '12px';
    card.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.4)';

    card.innerHTML = `
      <div style="flex-shrink: 0; width: 68px; height: 68px; border-radius: 8px; overflow: hidden; border: 1px solid #00d2ff; background: #000; display: flex; align-items: center; justify-content: center;">
        ${isVideo 
          ? `<video src="${displaySrc}" style="width: 100%; height: 100%; object-fit: cover;" muted></video>` 
          : `<img src="${displaySrc}" style="width: 100%; height: 100%; object-fit: cover;" alt="Foto do Post">`
        }
      </div>
      <div style="flex: 1; font-size: 12px; color: #ccd6f6;">
        <strong style="color: #00d2ff; font-size: 13px;">${sourceIcon} ${isVideo ? 'Vídeo' : 'Foto'} Importado do ${sourceName}</strong>
        <div style="color: #8892b0; margin-top: 2px;">
          Arquivo: <em>${filename}</em> (salvo na sua pasta Downloads)
        </div>
        <div style="margin-top: 6px; display: flex; gap: 6px; flex-wrap: wrap;">
          <button type="button" class="livia-btn-inline" id="livia-btn-attach-media" style="padding: 3px 10px; font-size: 11px;">
            📎 Anexar ao Post
          </button>
          ${!isVideo ? `
            <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-btn-copy-img" style="padding: 3px 10px; font-size: 11px;">
              📋 Copiar Imagem (Ctrl+V)
            </button>
          ` : ''}
          <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-btn-download-media" style="padding: 3px 10px; font-size: 11px;">
            📥 Baixar Arquivo
          </button>
        </div>
      </div>
    `;

    card.querySelector('#livia-btn-download-media').onclick = async (e) => {
      e.preventDefault();
      try {
        const blob = await getMediaBlob(mainUrl, mediaDataUrl);
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 10000);
          showToast('Download da foto concluído! 📥');
          return;
        }
      } catch (err) {}
      const a = document.createElement('a');
      a.href = mainUrl;
      a.download = filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('Download da foto iniciado! 📥');
    };

    const copyImgBtn = card.querySelector('#livia-btn-copy-img');
    if (copyImgBtn) {
      copyImgBtn.onclick = async (e) => {
        e.preventDefault();
        const ok = await copyImageToClipboard(mainUrl, mediaDataUrl);
        if (ok) {
          showToast('Imagem copiada! Clique em "Adicionar fotos" no Google e aperte Ctrl+V! 📋✨');
        } else {
          showToast('Selecione o arquivo diretamente na sua pasta Downloads! 📂');
        }
      };
    }

    card.querySelector('#livia-btn-attach-media').onclick = async (e) => {
      e.preventDefault();
      const attached = await autoAttachMediaToFileInput(modal, mainUrl, filename, mediaDataUrl);
      if (attached) {
        showToast('Foto anexada automaticamente ao post! 🎉');
      } else {
        showToast('Clique em "Adicionar fotos" no Google e escolha o arquivo na sua pasta Downloads! 📂');
      }
    };

    autoAttachMediaToFileInput(modal, mainUrl, filename, mediaDataUrl);

    buttonContainer.parentNode.insertBefore(card, buttonContainer);
  }

  // --- 3. MONITORAMENTO DE CRIAÇÃO DE POSTAGENS / ATUALIZAÇÕES ---
  function injectPostCreationButtons() {
    const postModals = document.querySelectorAll('div[role="dialog"]');
    postModals.forEach((modal) => {
      const textarea = modal.querySelector('textarea, div[contenteditable="true"]');
      if (!textarea || textarea.dataset.liviaPostInjected) return;

      const modalText = modal.innerText.toLowerCase();
      if (!modalText.includes('atualização') && !modalText.includes('post') && !modalText.includes('descrição') && !modalText.includes('novidade')) {
        return;
      }

      // Evita confundir com o campo de descrição da empresa
      if (modalText.includes('descrição da empresa') || modalText.includes('sobre a empresa')) {
        return;
      }

      textarea.dataset.liviaPostInjected = 'true';

      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.gap = '8px';
      buttonContainer.style.margin = '10px 0';
      buttonContainer.style.flexWrap = 'wrap';

      // Botão 1: Importar do Instagram / Facebook
      const btnImportInsta = document.createElement('button');
      btnImportInsta.type = 'button';
      btnImportInsta.className = 'livia-btn-inline livia-btn-secondary';
      btnImportInsta.innerHTML = `<span>📸</span><span>Puxar do Instagram</span>`;

      // Verifica se há um post recente para destacar o botão
      chrome.storage.local.get(['lastTransformedPost'], (res) => {
        if (res.lastTransformedPost && res.lastTransformedPost.text) {
          const isRecent = (Date.now() - (res.lastTransformedPost.timestamp || 0)) < 15 * 60 * 1000;
          if (isRecent && (!textarea.value || !textarea.value.trim())) {
            btnImportInsta.innerHTML = `<span>⚡</span><span>Puxar Post + Foto do Instagram</span>`;
          }
        }
      });

      btnImportInsta.addEventListener('click', async (e) => {
        e.preventDefault();
        chrome.storage.local.get(['lastTransformedPost'], (res) => {
          if (res.lastTransformedPost && res.lastTransformedPost.text) {
            setNativeValue(textarea, res.lastTransformedPost.text);

            // Renderiza o card da foto/vídeo se houver mídia
            if (res.lastTransformedPost.mediaUrls && res.lastTransformedPost.mediaUrls.length > 0) {
              renderImportedMediaCard(modal, buttonContainer, res.lastTransformedPost);
              showToast('Post e foto do Instagram importados para o Google! 🚀');
            } else {
              showToast('Post das redes importado e otimizado para o Google! 🚀');
            }
          } else {
            openPostModal(textarea);
          }
        });
      });

      // Botão 2: Otimizar com SEO Local
      const btnSeo = document.createElement('button');
      btnSeo.type = 'button';
      btnSeo.className = 'livia-btn-inline';
      btnSeo.innerHTML = `<span>✨</span><span>Otimizar com a Lívia</span>`;

      btnSeo.addEventListener('click', async (e) => {
        e.preventDefault();
        const currentText = textarea.value || textarea.innerText || '';
        if (!currentText.trim()) {
          showToast('Digite uma ideia inicial ou use "Puxar do Instagram"!');
          return;
        }

        btnSeo.innerHTML = `<span>⏳</span><span>Otimizando...</span>`;
        btnSeo.disabled = true;

        const fakePost = new window.LiviaProviders.UniversalPost({
          source: 'manual',
          text: currentText
        });

        const res = await window.LiviaApi.transformPostForLocalSEO(fakePost);
        if (res && res.text) {
          setNativeValue(textarea, res.text);
          showToast('Texto otimizado com palavras-chave locais e chamada para WhatsApp! ✨');
        }

        btnSeo.innerHTML = `<span>✨</span><span>Otimizar com a Lívia</span>`;
        btnSeo.disabled = false;
      });

      // Botão 3: Sugerir Ideia de Post
      const btnIdea = document.createElement('button');
      btnIdea.type = 'button';
      btnIdea.className = 'livia-btn-inline livia-btn-secondary';
      btnIdea.innerHTML = `<span>💡</span><span>Sugerir Tema</span>`;

      btnIdea.addEventListener('click', async (e) => {
        e.preventDefault();
        const biz = (await refreshBusinessData()).activeBusiness;
        const ideas = [
          `🔥 Novidade da semana na ${biz.name}: Venha conferir nossa linha especial de ${biz.services ? biz.services[0] : biz.niche}!`,
          `💡 Você sabia? Dica especial para quem busca qualidade em ${biz.niche} em ${biz.city}.`,
          `⭐ Atendimento de excelência no bairro ${biz.neighborhood}: Conheça os diferenciais da ${biz.name}!`
        ];
        const randomIdea = ideas[Math.floor(Math.random() * ideas.length)];
        setNativeValue(textarea, randomIdea);
        showToast('Ideia inserida! Agora clique em "Otimizar com a Lívia". 🚀');
      });

      buttonContainer.appendChild(btnImportInsta);
      buttonContainer.appendChild(btnSeo);
      buttonContainer.appendChild(btnIdea);
      textarea.parentElement.insertBefore(buttonContainer, textarea);
    });
  }

  // --- 4. MONITORAMENTO DO CAMPO DE DESCRIÇÃO DA EMPRESA (750 CHARS) ---
  function injectDescriptionButtons() {
    const descModals = document.querySelectorAll('div[role="dialog"]');
    descModals.forEach((modal) => {
      const modalText = modal.innerText.toLowerCase();
      if (!modalText.includes('descrição') && !modalText.includes('description')) return;

      const textarea = modal.querySelector('textarea');
      if (!textarea || textarea.dataset.liviaDescInjected) return;
      textarea.dataset.liviaDescInjected = 'true';

      const container = document.createElement('div');
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.gap = '10px';
      container.style.margin = '8px 0';

      const btnGenDesc = document.createElement('button');
      btnGenDesc.type = 'button';
      btnGenDesc.className = 'livia-btn-inline';
      btnGenDesc.innerHTML = `<span>✨</span><span>Gerar Descrição SEO (750 chars) com a Lívia</span>`;

      const counter = document.createElement('span');
      counter.className = 'livia-char-counter';

      const updateCounter = () => {
        const val = (textarea.value || '').trim();
        const len = val.length;
        counter.innerText = `${len}/750 caracteres`;
        counter.className = 'livia-char-counter ' + (len > 750 ? 'danger' : len > 600 ? 'good' : 'warn');

        // Sincroniza a descrição real do perfil no storage da empresa ativa para a Auditoria ler com 100% de precisão
        if (len > 30 && cachedBizData && cachedBizData.activeBusiness) {
          cachedBizData.activeBusiness.savedDescription = val;
          window.LiviaApi.saveBusiness(cachedBizData.activeBusiness);
        }
      };

      textarea.addEventListener('input', updateCounter);
      updateCounter();

      btnGenDesc.addEventListener('click', async (e) => {
        e.preventDefault();
        btnGenDesc.innerHTML = `<span>⏳</span><span>Gerando descrição...</span>`;
        btnGenDesc.disabled = true;

        try {
          const res = await window.LiviaApi.generateBusinessDescription();
          if (res && res.description) {
            setNativeValue(textarea, res.description);
            updateCounter();
            showToast('Descrição otimizada com palavras-chave locais e proposta de valor inserida! ✨');
          }
        } catch (err) {
          console.error('[Lívia Copilot] Erro na descrição:', err);
          showToast('Erro ao gerar descrição.');
        } finally {
          btnGenDesc.innerHTML = `<span>✨</span><span>Gerar Descrição SEO (750 chars) com a Lívia</span>`;
          btnGenDesc.disabled = false;
        }
      });

      container.appendChild(btnGenDesc);
      container.appendChild(counter);
      textarea.parentElement.insertBefore(container, textarea);
    });
  }

  // --- GERADOR DE BANNER HD AUTOMÁTICO (1080x1080 CANVAS) PARA EMPRESAS SEM FOTO ---
  function generatePromotionalBannerDataUrl(biz, customHeadline = '') {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // Fundo Gradiente Premium
    const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
    grad.addColorStop(0, '#070b14');
    grad.addColorStop(0.5, '#0f1b33');
    grad.addColorStop(1, '#092642');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Brilho Decorativo Superior e Inferior
    const glow = ctx.createRadialGradient(900, 180, 40, 900, 180, 450);
    glow.addColorStop(0, 'rgba(0, 210, 255, 0.28)');
    glow.addColorStop(1, 'rgba(0, 210, 255, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1080, 1080);

    // Moldura Externa Neon
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.45)';
    ctx.lineWidth = 4;
    ctx.strokeRect(45, 45, 990, 990);

    // Badge Superior (Categoria + Cidade)
    const catText = ((biz?.primaryCategory || biz?.niche || 'Especialista Local') + ' • ' + (biz?.city || 'Região')).toUpperCase();
    ctx.fillStyle = 'rgba(0, 210, 255, 0.15)';
    ctx.fillRect(90, 100, Math.min(900, catText.length * 19 + 50), 56);
    ctx.strokeStyle = '#00d2ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(90, 100, Math.min(900, catText.length * 19 + 50), 56);

    ctx.fillStyle = '#00d2ff';
    ctx.font = 'bold 24px "Segoe UI", Roboto, sans-serif';
    ctx.fillText(catText.slice(0, 46), 115, 137);

    // Nome da Empresa (Destaque Principal)
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 58px "Segoe UI", Roboto, sans-serif';
    const companyName = (biz?.name || 'Nossa Empresa').toUpperCase();
    ctx.fillText(companyName.slice(0, 26), 90, 250);
    if (companyName.length > 26) {
      ctx.fillText(companyName.slice(26, 52), 90, 320);
    }

    // Linha Divisória Ciano
    ctx.fillStyle = '#00d2ff';
    ctx.fillRect(90, companyName.length > 26 ? 355 : 290, 240, 8);

    // Lista de Serviços com Checkmarks Verdes
    const services = (biz?.services && biz.services.length > 0)
      ? biz.services.slice(0, 5)
      : ['Atendimento Especializado com Garantia', 'Orçamento Rápido pelo WhatsApp', 'Qualidade e Confiança na Região'];

    let startY = companyName.length > 26 ? 440 : 385;
    services.forEach((srv) => {
      // Box do item
      ctx.fillStyle = 'rgba(21, 28, 44, 0.85)';
      ctx.fillRect(90, startY - 40, 900, 68);
      ctx.strokeStyle = 'rgba(0, 210, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(90, startY - 40, 900, 68);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 32px "Segoe UI", Roboto, sans-serif';
      ctx.fillText('✔', 115, startY + 5);

      ctx.fillStyle = '#f0f4f8';
      ctx.font = 'bold 29px "Segoe UI", Roboto, sans-serif';
      ctx.fillText(srv.slice(0, 48), 165, startY + 5);
      startY += 88;
    });

    // Rodapé CTA (WhatsApp + Localização)
    ctx.fillStyle = '#00d2ff';
    ctx.fillRect(90, 880, 900, 95);

    ctx.fillStyle = '#070b14';
    ctx.font = '900 34px "Segoe UI", Roboto, sans-serif';
    const whatsText = biz?.whatsapp
      ? `📲 SOLICITE ORÇAMENTO: ${biz.whatsapp}`
      : `📍 ATENDIMENTO EM ${(biz?.city || 'SUA REGIÃO').toUpperCase()}`;
    ctx.fillText(whatsText, 130, 940);

    return canvas.toDataURL('image/png');
  }

  // --- MODAIS FLUTUANTES DA LÍVIA COPILOT PRO ---

  // Modal 1: Post Local, Importador do Instagram, Uploader PC & Gerador de Banner HD + Auto-Publicação 1 Clique
  async function openPostModal(targetTextarea = null, prefillText = '') {
    await refreshBusinessData();
    const activeBiz = cachedBizData?.activeBusiness;

    const backdrop = document.createElement('div');
    backdrop.className = 'livia-modal-backdrop';

    backdrop.innerHTML = `
      <div class="livia-modal" style="width: 660px;">
        <div class="livia-modal-header">
          <div class="livia-modal-title">
            <span>✨</span> Criador & Auto-Publicador de Post (Google Meu Negócio)
          </div>
          <button class="livia-modal-close">&times;</button>
        </div>
        <div class="livia-modal-body">
          <div id="livia-modal-insta-slot"></div>

          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; background: #131b2e; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(0, 210, 255, 0.25); margin-bottom: 10px;">
            <div style="font-size: 12px; color: #ccd6f6; font-weight: 600;">
              📸 <strong>Mídia com SEO Automático:</strong>
            </div>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              <input type="file" id="livia-local-file-picker" accept="image/*,video/*" style="display: none;">
              <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-btn-pick-pc" style="font-size: 11px; padding: 4px 10px;">
                💻 Escolher Foto/Vídeo do PC
              </button>
              <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-btn-gen-banner" style="font-size: 11px; padding: 4px 10px;">
                🎨 Gerar Arte HD da Empresa (1 Clique)
              </button>
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <div>
              <label style="font-size: 12px; font-weight: 700; color: #00d2ff;">Tipo de Postagem:</label>
              <select id="livia-post-type-select" class="livia-mode-select" style="margin-left: 8px;">
                <option value="update">📢 Atualização / Novidade</option>
                <option value="offer">🔥 Oferta / Promoção Local</option>
                <option value="tip">💡 Dica de Especialista</option>
              </select>
            </div>
            <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-btn-gen-ai-post" style="font-size: 11px; padding: 4px 10px;">
              ✨ Gerar Texto Pronto Automaticamente
            </button>
          </div>
          <textarea id="livia-post-input" placeholder="Digite um tema curto ou clique em 'Gerar Texto Pronto Automaticamente'..."></textarea>
        </div>
        <div class="livia-modal-actions" style="justify-content: space-between;">
          <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-post-cancel">Cancelar</button>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-post-copy">📋 Apenas Copiar</button>
            <button type="button" class="livia-btn-inline" id="livia-post-autopublish" style="background: linear-gradient(135deg, #10b981 0%, #00d2ff 100%) !important; color: #070b14 !important;">
              ⚡ Publicar no Google Automaticamente (Texto + Foto)
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    backdrop.querySelector('.livia-modal-close').onclick = close;
    backdrop.querySelector('#livia-post-cancel').onclick = close;

    const postInput = backdrop.querySelector('#livia-post-input');
    const instaSlot = backdrop.querySelector('#livia-modal-insta-slot');
    let currentMediaObj = null;

    if (prefillText) {
      postInput.value = prefillText;
    }

    // Se houver um post capturado do Instagram/Facebook no storage, exibe o Card completo com Foto e Ações!
    chrome.storage.local.get(['lastTransformedPost'], (res) => {
      const saved = res.lastTransformedPost;
      if (saved && saved.text && !prefillText) {
        postInput.value = saved.text;
      }
      if (saved && (saved.mediaDataUrl || (saved.mediaUrls && saved.mediaUrls[0]))) {
        currentMediaObj = saved;
        renderImportedMediaCard(backdrop, instaSlot, saved);
      }
    });

    // Escolher Foto ou Vídeo do Computador (com renomeação SEO automática!)
    const filePicker = backdrop.querySelector('#livia-local-file-picker');
    backdrop.querySelector('#livia-btn-pick-pc').onclick = () => filePicker.click();
    filePicker.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const isVid = file.type.startsWith('video/');
      const ext = file.name.split('.').pop() || (isVid ? 'mp4' : 'jpg');
      const seoName = window.LiviaApi.buildSeoFilename(activeBiz, 'post-local', ext);

      const reader = new FileReader();
      reader.onload = () => {
        currentMediaObj = {
          text: postInput.value,
          mediaUrls: [reader.result],
          mediaDataUrl: reader.result,
          mediaType: isVid ? 'VIDEO' : 'IMAGE',
          mainMediaFilename: seoName,
          timestamp: Date.now()
        };
        chrome.storage.local.set({ lastTransformedPost: currentMediaObj });
        renderImportedMediaCard(backdrop, instaSlot, currentMediaObj);
        showToast(`✅ Arquivo renomeado com SEO para "${seoName}" e pronto para postar!`);
      };
      reader.readAsDataURL(file);
    };

    // Gerar Arte HD 1080x1080 Automática em 1 Clique
    backdrop.querySelector('#livia-btn-gen-banner').onclick = async () => {
      const dataUrl = generatePromotionalBannerDataUrl(activeBiz);
      const seoName = window.LiviaApi.buildSeoFilename(activeBiz, 'banner-oficial', 'png');
      currentMediaObj = {
        text: postInput.value,
        mediaUrls: [dataUrl],
        mediaDataUrl: dataUrl,
        mediaType: 'IMAGE',
        mainMediaFilename: seoName,
        timestamp: Date.now()
      };
      chrome.storage.local.set({ lastTransformedPost: currentMediaObj });
      renderImportedMediaCard(backdrop, instaSlot, currentMediaObj);
      showToast('🎨 Arte HD 1080x1080 gerada com os serviços e WhatsApp da empresa!');
    };

    // Gerar Texto Pronto Automaticamente
    backdrop.querySelector('#livia-btn-gen-ai-post').onclick = async () => {
      const plan = await window.LiviaApi.generateWeeklyContentPlan();
      if (plan && plan.posts && plan.posts.length > 0) {
        const randomPost = plan.posts[Math.floor(Math.random() * plan.posts.length)];
        postInput.value = randomPost.caption;
        showToast('✨ Texto otimizado com SEO Local e WhatsApp gerado!');
      }
    };

    async function getPreparedPostText() {
      let input = postInput.value.trim();
      const postType = backdrop.querySelector('#livia-post-type-select').value;
      if (!input) {
        const plan = await window.LiviaApi.generateWeeklyContentPlan();
        input = (plan && plan.posts && plan.posts[0]) ? plan.posts[0].caption : `Conheça as soluções da ${activeBiz?.name || 'nossa empresa'}!`;
        postInput.value = input;
      }
      if (!input.includes('📲') && !input.includes('📍')) {
        const post = new window.LiviaProviders.UniversalPost({ source: 'manual', text: input });
        const res = await window.LiviaApi.transformPostForLocalSEO(post, { postType });
        if (res && res.text) return res.text;
      }
      return input;
    }

    backdrop.querySelector('#livia-post-copy').onclick = async () => {
      const finalText = await getPreparedPostText();
      if (targetTextarea) {
        setNativeValue(targetTextarea, finalText);
      } else {
        await navigator.clipboard.writeText(finalText);
        showToast('Post copiado para a área de transferência! 📋');
      }
      close();
    };

    backdrop.querySelector('#livia-post-autopublish').onclick = async () => {
      const btn = backdrop.querySelector('#livia-post-autopublish');
      btn.innerText = '⏳ Iniciando Robô...';
      btn.disabled = true;

      const finalText = await getPreparedPostText();

      // Se o usuário ainda não escolheu foto, gera automaticamente o Banner HD da empresa para o post ir completo com imagem!
      if (!currentMediaObj || (!currentMediaObj.mediaDataUrl && (!currentMediaObj.mediaUrls || currentMediaObj.mediaUrls.length === 0))) {
        const autoBanner = generatePromotionalBannerDataUrl(activeBiz);
        const seoName = window.LiviaApi.buildSeoFilename(activeBiz, 'destaque-local', 'png');
        currentMediaObj = {
          text: finalText,
          mediaUrls: [autoBanner],
          mediaDataUrl: autoBanner,
          mediaType: 'IMAGE',
          mainMediaFilename: seoName,
          timestamp: Date.now()
        };
      }

      close();
      await startGoogleAutomationFlow('CREATE_POST', {
        text: finalText,
        mediaUrl: (currentMediaObj.mediaUrls && currentMediaObj.mediaUrls[0]) || currentMediaObj.mediaDataUrl,
        mediaDataUrl: currentMediaObj.mediaDataUrl || null,
        filename: currentMediaObj.mainMediaFilename || window.LiviaApi.buildSeoFilename(activeBiz, 'post-google', 'png'),
        whatsapp: activeBiz?.whatsapp || ''
      });
    };
  }

  // Modal 2: Descrição da Empresa (750 chars) + Auto-Preenchimento 1 Clique
  async function openDescriptionModal() {
    await refreshBusinessData();
    const activeBiz = cachedBizData?.activeBusiness;
    const backdrop = document.createElement('div');
    backdrop.className = 'livia-modal-backdrop';

    let desc = (activeBiz && activeBiz.savedDescription) ? activeBiz.savedDescription : '';
    if (!desc) {
      const res = await window.LiviaApi.generateBusinessDescription();
      desc = res.description || '';
    }

    backdrop.innerHTML = `
      <div class="livia-modal" style="width: 640px;">
        <div class="livia-modal-header">
          <div class="livia-modal-title">
            <span>✍️</span> Lívia Copilot — Descrição Otimizada (750 chars)
          </div>
          <button class="livia-modal-close">&times;</button>
        </div>
        <div class="livia-modal-body">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 13px;">Descrição calibrada com bairro, cidade, serviços e WhatsApp:</span>
            <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-desc-regenerate" style="font-size: 11px; padding: 4px 10px;">
              🔄 Regerar com IA
            </button>
          </div>
          <textarea id="livia-desc-output" style="min-height: 180px;">${desc}</textarea>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="livia-char-counter good" id="livia-modal-counter">${desc.length}/750 caracteres</span>
          </div>
        </div>
        <div class="livia-modal-actions" style="justify-content: space-between;">
          <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-desc-close">Fechar</button>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-desc-copy">📋 Copiar</button>
            <button type="button" class="livia-btn-inline" id="livia-desc-autofill" style="background: linear-gradient(135deg, #10b981 0%, #00d2ff 100%) !important; color: #070b14 !important;">
              ⚡ Auto-Preencher no Perfil do Google
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    backdrop.querySelector('.livia-modal-close').onclick = close;
    backdrop.querySelector('#livia-desc-close').onclick = close;

    const textarea = backdrop.querySelector('#livia-desc-output');
    const updateCounter = () => {
      const len = textarea.value.length;
      const counter = backdrop.querySelector('#livia-modal-counter');
      counter.innerText = `${len}/750 caracteres`;
      counter.className = 'livia-char-counter ' + (len > 750 ? 'danger' : 'good');
    };
    textarea.addEventListener('input', updateCounter);

    backdrop.querySelector('#livia-desc-regenerate').onclick = async () => {
      const res = await window.LiviaApi.generateBusinessDescription();
      if (res && res.description) {
        textarea.value = res.description;
        updateCounter();
        showToast('Nova variação de descrição de 750 chars gerada! ✨');
      }
    };

    async function saveDescToBiz(finalDesc) {
      await refreshBusinessData();
      if (cachedBizData && cachedBizData.activeBusiness && finalDesc.length > 30) {
        cachedBizData.activeBusiness.savedDescription = finalDesc;
        await window.LiviaApi.saveBusiness(cachedBizData.activeBusiness);
      }
    }

    backdrop.querySelector('#livia-desc-copy').onclick = async () => {
      const finalDesc = textarea.value.trim();
      await navigator.clipboard.writeText(finalDesc);
      await saveDescToBiz(finalDesc);
      showToast('Descrição copiada! Cole em "Editar Perfil ➔ Descrição". 📋');
      close();
    };

    backdrop.querySelector('#livia-desc-autofill').onclick = async () => {
      const finalDesc = textarea.value.trim();
      await saveDescToBiz(finalDesc);
      close();
      await startGoogleAutomationFlow('FILL_DESCRIPTION', { text: finalDesc });
    };
  }

  // Modal 3: Q&A / FAQs Seeder
  async function openFaqModal() {
    const backdrop = document.createElement('div');
    backdrop.className = 'livia-modal-backdrop';

    const res = await window.LiviaApi.generateFaqList();
    const faqs = res.faqs || [];

    let faqHtml = faqs.map((faq, idx) => `
      <div class="livia-faq-card">
        <div class="livia-faq-q">P: ${faq.question}</div>
        <div class="livia-faq-a">R: ${faq.answer}</div>
        <button type="button" class="livia-btn-inline livia-btn-secondary" style="font-size: 11px; padding: 4px 10px;" data-faq-idx="${idx}">
          Copiar Pergunta e Resposta 📋
        </button>
      </div>
    `).join('');

    backdrop.innerHTML = `
      <div class="livia-modal" style="width: 680px;">
        <div class="livia-modal-header">
          <div class="livia-modal-title">
            <span>❓</span> Perguntas e Respostas Frequentes (Q&A Seeder)
          </div>
          <button class="livia-modal-close">&times;</button>
        </div>
        <div class="livia-modal-body">
          <p style="margin-bottom: 14px;">
            Publique essas perguntas estratégicas e suas respostas na seção <strong>Perguntas e Respostas</strong> do seu Google Meu Negócio. Isso posiciona o perfil no topo das buscas por voz e da IA do Google!
          </p>
          <div style="max-height: 400px; overflow-y: auto;">
            ${faqHtml}
          </div>
        </div>
        <div class="livia-modal-actions">
          <button type="button" class="livia-btn-inline" id="livia-faq-close">Concluído</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    backdrop.querySelector('.livia-modal-close').onclick = close;
    backdrop.querySelector('#livia-faq-close').onclick = close;

    backdrop.querySelectorAll('button[data-faq-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.faqIdx, 10);
        const item = faqs[idx];
        const clipText = `Pergunta: ${item.question}\nResposta: ${item.answer}`;
        navigator.clipboard.writeText(clipText);
        showToast('Q&A copiado! Cole na seção de Perguntas e Respostas do perfil. ✨');
      });
    });
  }

  // Formata nomes de cidades vindos da busca (ex: "lencois paulista" -> "Lençóis Paulista")
  function normalizeCityName(rawCity) {
    if (!rawCity) return '';
    const clean = rawCity.trim().replace(/\s+/g, ' ');
    const lower = clean.toLowerCase();
    const dictionary = {
      'lencois paulista': 'Lençóis Paulista',
      'lençois paulista': 'Lençóis Paulista',
      'lençóis paulista': 'Lençóis Paulista',
      'macatuba': 'Macatuba',
      'bauru': 'Bauru',
      'botucatu': 'Botucatu',
      'jau': 'Jaú',
      'jaú': 'Jaú',
      'pederneiras': 'Pederneiras',
      'barra bonita': 'Barra Bonita',
      'igaracu do tiete': 'Igaraçu do Tietê',
      'igaraçu do tietê': 'Igaraçu do Tietê',
      'agudos': 'Agudos',
      'arealva': 'Arealva',
      'piracicaba': 'Piracicaba',
      'marilia': 'Marília',
      'marília': 'Marília',
      'sorocaba': 'Sorocaba',
      'campinas': 'Campinas',
      'ribeirao preto': 'Ribeirão Preto',
      'ribeirão preto': 'Ribeirão Preto',
      'sao paulo': 'São Paulo',
      'são paulo': 'São Paulo',
      'sao jose do rio preto': 'São José do Rio Preto',
      'horizonte': 'Horizonte'
    };
    if (dictionary[lower]) return dictionary[lower];

    const preps = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
    return clean
      .split(' ')
      .map((w, idx) => {
        const wl = w.toLowerCase();
        if (idx > 0 && preps.has(wl)) return wl;
        return wl.charAt(0).toUpperCase() + wl.slice(1);
      })
      .join(' ');
  }

  // Extrai Categoria e Cidade diretamente da query de pesquisa do Google (?q=restaurante+japones+lencois+paulista)
  function extractCityAndCategoryFromSearchQuery() {
    let rawQ = '';
    try {
      const params = new URLSearchParams(window.location.search);
      rawQ = params.get('q') || '';
    } catch (e) {}
    if (!rawQ) {
      const qInput = document.querySelector('input[name="q"], textarea[name="q"]');
      if (qInput && qInput.value) rawQ = qInput.value;
    }
    rawQ = (rawQ || '').trim();
    if (!rawQ) return { queryCategory: '', queryCity: '' };

    const qLower = rawQ.toLowerCase().replace(/\s+/g, ' ');

    // 1. Verifica padrão explícito "[categoria] em [cidade]"
    const emMatch = qLower.match(/^(.+?)\s+(?:em|no|na)\s+([a-zà-ÿ\s]{3,35})$/i);
    if (emMatch) {
      return {
        queryCategory: formatCategoryLabel(emMatch[1].trim()),
        queryCity: normalizeCityName(emMatch[2].trim())
      };
    }

    // 2. Prefixos conhecidos de nichos comerciais buscados no Google
    const nichePrefixes = [
      { rx: /^restaurante\s+japon[eê]s\b/i, label: 'Restaurante japonês' },
      { rx: /^comida\s+japonesa\b/i, label: 'Restaurante japonês' },
      { rx: /^sushi\s*bar\b/i, label: 'Restaurante japonês' },
      { rx: /^sushi\b/i, label: 'Restaurante japonês' },
      { rx: /^temakeria\b/i, label: 'Restaurante japonês' },
      { rx: /^restaurante\b/i, label: 'Restaurante' },
      { rx: /^pizzaria\b/i, label: 'Pizzaria' },
      { rx: /^hamburgueria\b/i, label: 'Hamburgueria' },
      { rx: /^lanchonete\b/i, label: 'Lanchonete' },
      { rx: /^churrascaria\b/i, label: 'Churrascaria' },
      { rx: /^padaria\b/i, label: 'Padaria e confeitaria' },
      { rx: /^barbearia\b/i, label: 'Barbearia' },
      { rx: /^sal[aã]o\s+de\s+beleza\b/i, label: 'Salão de beleza' },
      { rx: /^cl[ií]nica\s+de\s+est[eé]tica\b/i, label: 'Clínica de estética' },
      { rx: /^dentista\b/i, label: 'Clínica odontológica' },
      { rx: /^cl[ií]nica\s+odontol[oó]gica\b/i, label: 'Clínica odontológica' },
      { rx: /^odontologia\b/i, label: 'Clínica odontológica' },
      { rx: /^cl[ií]nica\s+m[eé]dica\b/i, label: 'Clínica médica' },
      { rx: /^fisioterapia\b/i, label: 'Clínica de fisioterapia' },
      { rx: /^psic[oó]logo\b/i, label: 'Consultório de psicologia' },
      { rx: /^academia\b/i, label: 'Academia' },
      { rx: /^advogado\b/i, label: 'Escritório de advocacia' },
      { rx: /^escrit[oó]rio\s+de\s+advocacia\b/i, label: 'Escritório de advocacia' },
      { rx: /^contabilidade\b/i, label: 'Escritório de contabilidade' },
      { rx: /^contador\b/i, label: 'Escritório de contabilidade' },
      { rx: /^imobili[aá]ria\b/i, label: 'Imobiliária' },
      { rx: /^oficina\s+mec[aâ]nica\b/i, label: 'Oficina mecânica' },
      { rx: /^mec[aâ]nica\b/i, label: 'Oficina mecânica' },
      { rx: /^auto\s+el[eé]trica\b/i, label: 'Auto elétrica' },
      { rx: /^pet\s*shop\b/i, label: 'Pet shop' },
      { rx: /^veterin[aá]rio\b/i, label: 'Clínica veterinária' },
      { rx: /^farm[aá]cia\b/i, label: 'Farmácia' },
      { rx: /^assist[eê]ncia\s+t[eé]cnica\b/i, label: 'Assistência técnica' },
      { rx: /^ag[eê]ncia\s+de\s+marketing(?:\s+digital)?\b/i, label: 'Agência de marketing digital' }
    ];

    for (const item of nichePrefixes) {
      const m = qLower.match(item.rx);
      if (m) {
        const remainder = qLower.slice(m[0].length).replace(/^(?:em|no|na|de|do|da)\s+/i, '').trim();
        return {
          queryCategory: item.label,
          queryCity: remainder.length >= 3 ? normalizeCityName(remainder) : ''
        };
      }
    }

    // 3. Verifica se o final da query contém alguma cidade conhecida
    const knownCities = [
      'lencois paulista', 'lençóis paulista', 'macatuba', 'bauru', 'botucatu', 'jau', 'jaú',
      'pederneiras', 'barra bonita', 'igaracu do tiete', 'igaraçu do tietê', 'agudos',
      'piracicaba', 'marilia', 'marília', 'sorocaba', 'campinas', 'ribeirao preto', 'sao paulo'
    ];
    for (const cityKey of knownCities) {
      if (qLower.endsWith(' ' + cityKey)) {
        const catPart = qLower.slice(0, qLower.length - cityKey.length).replace(/\s+(?:em|no|na)$/i, '').trim();
        return {
          queryCategory: formatCategoryLabel(catPart),
          queryCity: normalizeCityName(cityKey)
        };
      }
    }

    return { queryCategory: '', queryCity: '' };
  }

  function formatCategoryLabel(rawCat) {
    if (!rawCat) return '';
    const lower = rawCat.toLowerCase().trim();
    if (lower.includes('restaurante japones') || lower.includes('restaurante japonês') || lower.includes('japanese_restaurant')) {
      return 'Restaurante japonês';
    }
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }

  // Localiza o container DOM específico da ficha aberta (Painel de Conhecimento, Aba Lateral IA ou Local Finder #sv=...)
  function getActiveProfileContainer(kpName) {
    const titleSelectors = [
      'h2[data-attrid="title"]',
      '[data-attrid="title"]',
      'div[role="heading"][aria-level="2"][data-attrid="title"]',
      'div.SPZz6b h2',
      'div.SPZz6b div[role="heading"]',
      'div.yKMdhc h2',
      'div.yKMdhc div[role="heading"]',
      'div.kno-ecr-pt',
      'div.I6txUd div[role="heading"]',
      'div.I6txUd h2',
      'h1.DUwDvf',
      'h1.fontHeadlineLarge',
      'h2.qrShPb',
      'div.qrShPb',
      'div.PZPZlf'
    ];

    let titleEl = null;
    for (const sel of titleSelectors) {
      const els = Array.from(document.querySelectorAll(sel));
      for (const el of els) {
        if (el.closest('#livia-command-center, .livia-modal-backdrop')) continue;
        if (el.offsetParent !== null && (el.innerText || '').trim().length > 2) {
          titleEl = el;
          break;
        }
      }
      if (titleEl) break;
    }

    // Se o painel lateral (ex: aba aberta a partir da Visão Geral de IA ou Local Finder) não usa data-attrid="title"
    if (!titleEl && kpName) {
      const targetClean = kpName.trim().toLowerCase();
      const shortClean = targetClean.split(/[|–—-]/)[0].trim();
      const candidates = Array.from(document.querySelectorAll('h1, h2, div[aria-level="2"], div[role="heading"]'));
      for (const el of candidates) {
        if (el.closest('#livia-command-center, .livia-modal-backdrop')) continue;
        const txt = (el.innerText || '').trim().toLowerCase();
        if (el.offsetParent !== null && (txt === targetClean || txt.startsWith(shortClean) || targetClean.startsWith(txt))) {
          titleEl = el;
          break;
        }
      }
    }

    // Heurística de alta precisão pelo subtítulo de avaliações do Google (ex: "4,3 ★★★★☆ 491 avaliações no Google")
    if (!titleEl) {
      const subtitleNodes = Array.from(document.querySelectorAll('div, span, p'));
      for (const node of subtitleNodes) {
        if (node.closest('#livia-command-center, .livia-modal-backdrop')) continue;
        const t = (node.innerText || '').trim();
        if (/\b[1-5][.,]\d\s*[★⭐*].*avaliações no Google/i.test(t) && t.length < 130) {
          titleEl = node.parentElement ? node.parentElement.querySelector('h1, h2, h3, div[role="heading"]') : null;
          if (titleEl) break;
        }
      }
    }

    if (titleEl) {
      // 1. Tenta container do Painel de Conhecimento oficial ou diálogo aberto
      const masterPanel = titleEl.closest('#rhs, div.kp-wholepage, div.osrp-blk, div.immersive-container, div.rhscols, aside, div[role="dialog"]');
      if (masterPanel && !masterPanel.querySelector('#livia-command-center') && (masterPanel.innerText || '').length > 100) {
        return masterPanel;
      }

      // 2. Se for o layout modular moderno do Google (Hero Grid com tiles de Foto, Mapa/Endereço, Horário e Avaliações)
      let curr = titleEl.parentElement;
      let bestCandidate = curr;
      for (let i = 0; i < 15 && curr && curr !== document.body; i++) {
        if (curr.querySelector && curr.querySelector('#livia-command-center')) break;
        if (curr.id === 'rcnt' || curr.id === 'search' || curr.id === 'rso') {
          break;
        }
        const txt = curr.innerText || '';
        if (txt.length >= 80) {
          bestCandidate = curr;
        }
        const hasAddressSignal = /\b(?:Rua|R\.|Av\.|Avenida|Rodovia|Rod\.|Estrada|Alameda|Al\.|Praça|Pç\.)\b/i.test(txt) || /\b\d{5}-\d{3}\b/.test(txt) || /Macatuba|Bauru|São Paulo|SP\b/i.test(txt);
        const hasHoursSignal = txt.includes('Horário') || txt.includes('Horários') || /(?:^|[·•\n])\s*(?:Aberto|Fechado)\b/i.test(txt);
        if (hasAddressSignal && hasHoursSignal) {
          return curr;
        }
        if (txt.length >= 1200) {
          return curr;
        }
        curr = curr.parentElement;
      }
      return bestCandidate;
    }

    return null;
  }

  // Localiza o card correspondente na lista lateral do Local Finder / Maps / Visão Geral de IA para enriquecer categoria, endereço e nota
  function getMatchingLocalFinderCard(kpName) {
    if (!kpName) return null;
    const targetLower = kpName.toLowerCase().trim();
    const shortBrand = targetLower.split(/[|–—-]/)[0].trim();
    const cards = document.querySelectorAll('div.VkpGBb, div.rllt__details, div.cXedhc, div.uMdZh, div[jscontroller][data-cid], div.Nv2PK, g-card, div.w7zwdf, div[data-hveid]');
    for (const card of cards) {
      if (card.closest('#livia-command-center, .livia-modal-backdrop')) continue;
      const titleEl = card.querySelector('div.dbg0pd, div.qBF1Pd, span.OSrXXb, div.fontHeadlineSmall, a.vwVdIc, div[role="heading"], h3, h4');
      const cardTitle = titleEl ? (titleEl.innerText || '').trim().toLowerCase() : '';
      if (
        cardTitle &&
        (cardTitle === targetLower ||
          cardTitle.includes(targetLower) ||
          targetLower.includes(cardTitle) ||
          targetLower.startsWith(cardTitle) ||
          cardTitle.startsWith(targetLower) ||
          (shortBrand.length >= 3 && cardTitle.includes(shortBrand)))
      ) {
        return card;
      }
    }
    return null;
  }

  // Obtém o texto visível real da página do Google (com layout real), excluindo o painel/modais/toasts da Lívia
  function getCleanGooglePageText() {
    if (!document.body) return '';
    const liviaSel = '#livia-command-center, #livia-panel-launcher, .livia-modal-backdrop, .livia-toast';
    const parts = [];
    Array.from(document.body.children).forEach(child => {
      if (child.matches && child.matches(liviaSel)) return;
      if (child.tagName === 'SCRIPT' || child.tagName === 'STYLE' || child.tagName === 'NOSCRIPT') return;
      const txt = child.innerText || '';
      if (txt) parts.push(txt);
    });
    return parts.join('\n').replace(/[\u200B-\u200F\u202A-\u202E]/g, '');
  }

  // Extrai estritamente o tamanho da descrição que está REALMENTE publicada e visível na tela do Google
  function extractRealDescriptionLength(activeBiz, detailContainer = null, isManagedClient = false) {
    // 1. Verifica se o modal de edição de perfil do Google está aberto com a textarea da descrição
    const openModals = document.querySelectorAll('div[role="dialog"]');
    for (const m of openModals) {
      if (m.closest('#livia-command-center, .livia-modal-backdrop')) continue;
      const mText = (m.innerText || '').toLowerCase();
      if (mText.includes('descrição') || mText.includes('description') || mText.includes('sobre')) {
        const ta = m.querySelector('textarea');
        if (ta && ta.value && ta.value.trim().length > 10) {
          return ta.value.trim().length;
        }
      }
    }

    // 2. Seletores abrangentes de descrição (Google Search Knowledge Panel + Google Maps)
    const kpSelectors = [
      'div[data-attrid*="merchant_description"]',
      'div[data-attrid*="description"]',
      'div[data-local-attribute*="description"]',
      'div.PYvSYb',
      'div[jsname="EvNWZc"]',
      // Google Maps classes e contêineres oficiais:
      'div.WeS02d',
      'div.WeS02d-fmcmS',
      'div.HlvSq',
      'div.kno-rdesc',
      'div.kno-rdesc span',
      'div.bJzME',
      'div[data-item-id*="authority"]',
      'div[data-item-id*="merchant"]',
      'div[aria-label*="Da empresa" i]',
      'div[aria-label*="Do proprietário" i]',
      'div[aria-label*="From the business" i]',
      'div[aria-label*="Sobre a empresa" i]',
      'div[aria-label*="Resumo" i]',
      'div[aria-label*="descrição" i]',
      'div[aria-label*="description" i]',
      'div[jslog*="description" i]',
      'div[jslog*="merchant" i]',
      'div.w8qArf',
      'span.w8qArf'
    ];

    let bestDomLen = 0;

    // Varre no detailContainer e também em document (pois no Maps o container pode recortar o painel)
    const searchRoots = [detailContainer, document].filter(Boolean);
    for (const root of searchRoots) {
      for (const sel of kpSelectors) {
        const els = root.querySelectorAll(sel);
        els.forEach(el => {
          if (el.closest('#livia-command-center, .livia-modal-backdrop, .livia-toast')) return;
          const cleaned = (el.textContent || el.innerText || '')
            .replace(/^Da empresa\s*[:•-]?\s*/i, '')
            .replace(/^Do proprietário\s*[:•-]?\s*/i, '')
            .replace(/^Sobre a empresa\s*[:•-]?\s*/i, '')
            .replace(/^Sobre\s*[:•-]?\s*/i, '')
            .replace(/^Resumo da empresa\s*[:•-]?\s*/i, '')
            .replace(/^From the business\s*[:•-]?\s*/i, '')
            .replace(/\.\.\.\s*Mais$/i, '')
            .replace(/Mais$/i, '')
            .trim();
          if (
            cleaned.length > bestDomLen &&
            cleaned.length <= 850 &&
            cleaned.length >= 25 &&
            !cleaned.toLowerCase().startsWith('as principais opções') &&
            !cleaned.toLowerCase().includes('visão geral criada por ia') &&
            !cleaned.toLowerCase().includes('resultados da pesquisa') &&
            !cleaned.toLowerCase().includes('resultado da pesquisa')
          ) {
            bestDomLen = cleaned.length;
          }
        });
      }
      if (bestDomLen >= 60) break;
    }

    // 2.2 Busca contextual por cabeçalhos típicos no Google Maps: "Da empresa", "Do proprietário", "Sobre a empresa"
    if (bestDomLen < 50) {
      const allHeadings = document.querySelectorAll('h2, h3, h4, div[role="heading"], span.fontHeadlineSmall, span.fontTitleMedium, span, div');
      for (const h of allHeadings) {
        if (h.closest('#livia-command-center, .livia-modal-backdrop, .livia-toast')) continue;
        const ht = (h.innerText || '').trim().toLowerCase();
        if (
          ht === 'da empresa' ||
          ht === 'do proprietário' ||
          ht === 'sobre a empresa' ||
          ht === 'resumo da empresa' ||
          ht === 'resumo' ||
          ht === 'from the business' ||
          ht === 'sobre este local' ||
          ht.startsWith('da empresa') ||
          ht.startsWith('do proprietário')
        ) {
          let parentNode = h.parentElement;
          for (let p = 0; p < 3 && parentNode && parentNode !== document.body; p++) {
            const txt = (parentNode.innerText || '')
              .replace(/^da empresa\s*[:•-]?\s*/i, '')
              .replace(/^do proprietário\s*[:•-]?\s*/i, '')
              .replace(/^sobre a empresa\s*[:•-]?\s*/i, '')
              .replace(/^resumo da empresa\s*[:•-]?\s*/i, '')
              .replace(/^from the business\s*[:•-]?\s*/i, '')
              .replace(/\.\.\.\s*Mais$/i, '')
              .replace(/Mais$/i, '')
              .trim();
            if (
              txt.length >= 35 &&
              txt.length <= 850 &&
              !txt.toLowerCase().includes('horário') &&
              !txt.toLowerCase().includes('aberto') &&
              !txt.toLowerCase().includes('fechado')
            ) {
              if (txt.length > bestDomLen) bestDomLen = txt.length;
            }
            parentNode = parentNode.parentElement;
          }
        }
      }
    }

    // 2.3 No Google Maps, varre elementos de texto de parágrafo no painel principal (role="main" ou .m6QErb)
    if (bestDomLen < 50) {
      const mapBodyTexts = document.querySelectorAll('div[role="main"] div.fontBodyMedium, div.m6QErb div.fontBodyMedium, div.m6QErb p, div[role="main"] p');
      for (const bEl of mapBodyTexts) {
        if (bEl.closest('#livia-command-center, .livia-modal-backdrop, .livia-toast')) continue;
        const bText = (bEl.innerText || '').trim();
        // Garante que é uma descrição real: tamanho razoável, não é endereço com CEP/Rua, não é horário, não é telefone
        if (
          bText.length >= 35 &&
          bText.length <= 850 &&
          !/\b\d{4,5}-\d{4}\b/.test(bText) &&
          !/\b\d{5}-\d{3}\b/.test(bText) &&
          !/\b(?:Alameda|Rua|Av|Avenida|Jardim|Rodovia|Praça)\b/i.test(bText) &&
          !/\b(?:Aberto|Fechado|Horário|Horários)\b/i.test(bText) &&
          !bText.toLowerCase().startsWith('recomendo') &&
          !bText.toLowerCase().startsWith('ótimo')
        ) {
          if (bText.length > bestDomLen) bestDomLen = bText.length;
        }
      }
    }

    // 3. Verifica se a empresa tem descrição salva na Lívia (savedDescription ou description)
    const savedDesc = (activeBiz?.savedDescription || activeBiz?.description || '').trim();
    if (savedDesc.length > 30) {
      const cleanGoogleText = getCleanGooglePageText();
      const startSnippet = savedDesc.slice(0, 35).trim();
      if (cleanGoogleText.includes(startSnippet)) {
        return savedDesc.length;
      }
      // Se for cliente ativo gerenciado na Lívia e o usuário já cadastrou a descrição na Lívia
      if (isManagedClient && bestDomLen < savedDesc.length) {
        return savedDesc.length;
      }
    }

    return bestDomLen;
  }

  // Coleta completa de sinais do DOM da página do Google (para Auditoria Real-Time e Modo Prospecção)
  function collectLiveProfileData(activeBiz) {
    const cleanPageText = getCleanGooglePageText();
    const pageLower = cleanPageText.toLowerCase();

    // 1. Nome real exibido na ficha aberta do Google
    const kpName = getRealBusinessTitleFromPage() || '';
    const kpLower = kpName.toLowerCase();

    // Verifica se a ficha aberta na tela pertence ao cliente ativo gerenciado ou se é um prospect de terceiro
    let isManagedClient = false;
    if (activeBiz && activeBiz.name && kpName) {
      const activeLower = activeBiz.name.toLowerCase();
      const mainBrandWord = activeLower.split(/\s+/)[0];
      if (
        kpLower.includes(activeLower) ||
        activeLower.includes(kpLower) ||
        (mainBrandWord.length >= 5 && kpLower.includes(mainBrandWord))
      ) {
        isManagedClient = true;
      }
    }

    // Isola o container da empresa inspecionada, o card correspondente na lista e qualquer diálogo do Google aberto
    const detailContainer = getActiveProfileContainer(kpName);
    const matchedCard = getMatchingLocalFinderCard(kpName);
    const openGoogleModal = document.querySelector('div[role="dialog"]:not(.livia-modal):not(.livia-modal-backdrop)');

    const detailText = detailContainer
      ? (detailContainer.innerText || '').replace(/[\u200B-\u200F\u202A-\u202E]/g, '')
      : '';
    const cardText = matchedCard
      ? (matchedCard.innerText || '').replace(/[\u200B-\u200F\u202A-\u202E]/g, '')
      : '';
    const modalText = openGoogleModal && !openGoogleModal.closest('#livia-command-center')
      ? (openGoogleModal.innerText || '').replace(/[\u200B-\u200F\u202A-\u202E]/g, '')
      : '';

    // profileSpecificText é composto estritamente pelo container da empresa, pelo card e pelo diálogo aberto
    // NÃO anexa o texto geral da página para evitar contaminação cruzada de outras empresas!
    const profileSpecificText = [detailText, cardText, modalText].filter(Boolean).join('\n').trim();
    const profileLower = profileSpecificText.toLowerCase();

    // Busca se essa empresa já foi raspada com dados confirmados do card na lista do Google
    const scrapedList = scrapeCompetitorsFromPage();

    // Identifica se a busca é focada na própria empresa (busca direta pelo nome / Onebox / Knowledge Panel Hero)
    const isDirectBrandSearch = (() => {
      const qInput = document.querySelector('input[name="q"], textarea[name="q"]');
      const queryVal = (qInput ? qInput.value : '').toLowerCase().trim();
      if (!queryVal || !kpName) return false;
      const kWords = kpName.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const matchedWords = kWords.filter(w => queryVal.includes(w));
      return matchedWords.length >= 2 || queryVal.includes(kpName.toLowerCase().slice(0, 15));
    })();

    const isSingleEntityPage = scrapedList.length <= 1 || isDirectBrandSearch || !!(detailContainer && (detailContainer.innerText || '').length > 250);
    const matchedScraped = scrapedList.find(c => {
      const cName = (c.name || '').toLowerCase().trim();
      const kName = kpName.toLowerCase().trim();
      if (!cName || !kName) return false;
      if (cName === kName || kName.startsWith(cName) || cName.startsWith(kName)) return true;
      const shortK = kName.split(/[|–—-]/)[0].trim();
      const shortC = cName.split(/[|–—-]/)[0].trim();
      if (shortK.length >= 3 && shortC.length >= 3 && (shortK === shortC || shortK.startsWith(shortC) || shortC.startsWith(shortK))) return true;
      return false;
    });

    const { queryCategory, queryCity } = extractCityAndCategoryFromSearchQuery();

    // Filtro rigoroso para evitar capturar redes sociais ou termos de UI como categoria comercial
    const INVALID_CATEGORY_REGEX = /^(?:instagram|facebook|tiktok|youtube|twitter|linkedin|pinterest|kwai|whatsapp|google|site|website|rotas|salvar|compartilhar|ligar|endereço|telefone|horário|aberto|fechado|fecha|abre|fotos|adicionar|ver por fora|comentários|avaliações|sobre|produtos|serviços)\b/i;
    const isCleanCategory = (cat) => {
      if (!cat || typeof cat !== 'string') return false;
      const c = cat.trim();
      if (c.length < 3 || c.length > 70) return false;
      if (/^\d[.,]\d/.test(c) || /^\(\d/.test(c)) return false;
      if (INVALID_CATEGORY_REGEX.test(c)) return false;
      const cLower = c.toLowerCase();
      if (
        cLower.includes('instagram') ||
        cLower.includes('facebook') ||
        cLower.includes('tiktok') ||
        cLower.includes('youtube') ||
        cLower.includes('twitter') ||
        cLower.includes('avaliaç') ||
        cLower.includes('crítica') ||
        cLower.includes('comentário') ||
        cLower.includes('seguidores') ||
        cLower.includes('marcações')
      ) return false;
      return true;
    };

    // 2. Categoria exibida na ficha (DOM específico -> Subtítulo .E5BaQ -> Card raspado -> Linha com ponto · -> Query de busca)
    const searchRoot = detailContainer || openGoogleModal || document;
    let categoryText = '';

    // A) Seletores oficiais de categoria primária no Knowledge Panel e Google Maps
    const catSelectors = [
      '[data-attrid="subtitle"] .E5BaQ',
      '[data-attrid="subtitle"] span.E5BaQ',
      'span.E5BaQ',
      'div[data-attrid="kc:/local:primary_category"]',
      'span[data-attrid="kc:/local:primary_category"]',
      'button.DkEaL',
      'span.YhemCb',
      'button[jsaction*="category"]',
      'div.TLYLSe',
      'span.mgr77e',
      'span[class*="category"]'
    ];
    for (const sel of catSelectors) {
      const el = (detailContainer || openGoogleModal || document).querySelector(sel);
      if (el && !el.closest('#livia-command-center, .livia-modal-backdrop')) {
        let raw = (el.innerText || '').trim();
        if (raw.includes(' em ')) raw = raw.split(/\s+em\s+/i)[0].trim();
        if (isCleanCategory(raw)) {
          categoryText = raw;
          break;
        }
      }
    }

    // B) Inspeciona os elementos filhos ou linhas de [data-attrid="subtitle"]
    if (!categoryText) {
      const subContainer = (detailContainer || openGoogleModal || document).querySelector('[data-attrid="subtitle"]');
      if (subContainer && !subContainer.closest('#livia-command-center, .livia-modal-backdrop')) {
        const subEls = Array.from(subContainer.querySelectorAll('span, div')).map(s => (s.innerText || '').trim()).filter(Boolean);
        for (let candidate of subEls) {
          if (candidate.includes(' em ')) candidate = candidate.split(/\s+em\s+/i)[0].trim();
          if (isCleanCategory(candidate)) {
            categoryText = candidate;
            break;
          }
        }
      }
    }

    // C) Tenta extrair de linhas do próprio detailText que contenham " em " (ex: "Oficina mecânica de motos em Macatuba, São Paulo")
    if (!categoryText && detailText) {
      const dLines = detailText.split('\n').map(l => l.trim()).filter(Boolean);
      for (const l of dLines) {
        if (l.includes(' em ') && !/^(?:Aberto|Fecha|Abre|Fechado)\b/i.test(l)) {
          const candidate = l.split(/\s+em\s+/i)[0].trim();
          if (isCleanCategory(candidate)) {
            categoryText = candidate;
            break;
          }
        }
      }
    }

    // D) Se o card raspado na busca do Google já tiver a categoria identificada e limpa
    if (!categoryText && matchedScraped && isCleanCategory(matchedScraped.category)) {
      categoryText = matchedScraped.category;
    }

    // E) Tenta extrair da linha com ponto delimitador (· ou •), estritamente validada pelo filtro anti-redes sociais
    if (!categoryText) {
      const targetLines = (cardText + '\n' + detailText + '\n' + modalText)
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);
      for (const line of targetLines) {
        if (line.includes('·') || line.includes('•')) {
          const parts = line.split(/[·•]/).map(p => p.trim()).filter(Boolean);
          for (const part of parts) {
            if (isCleanCategory(part)) {
              categoryText = part;
              break;
            }
          }
        }
        if (categoryText) break;
      }
    }

    if (categoryText.includes(' em ')) categoryText = categoryText.split(/\s+em\s+/i)[0].trim();
    if (categoryText.includes('·')) {
      const subParts = categoryText.split('·').map(s => s.trim()).filter(isCleanCategory);
      if (subParts.length > 0) categoryText = subParts[subParts.length - 1];
    }

    // Expande caso o Google tenha truncado a categoria com "..." (Ex: "Assistência Técnica de I...")
    if (categoryText.endsWith('...') || categoryText.endsWith('…')) {
      const prefix = categoryText.replace(/(?:\.\.\.|…)$/, '').trim().toLowerCase();
      if (prefix.startsWith('assistência técnica')) {
        categoryText = 'Assistência Técnica de Informática';
      } else if (prefix.startsWith('agência de marketing')) {
        categoryText = 'Agência de marketing digital';
      }
    }

    // Fallback por termo explícito no nome da empresa ou na query
    if (!categoryText) {
      const urlDecoded = decodeURIComponent(window.location.href || '').toLowerCase();
      if (urlDecoded.includes('japanese_restaurant') || kpLower.includes('sushi') || kpLower.includes('temakeria')) {
        categoryText = 'Restaurante japonês';
      } else if (
        profileLower.includes('assistência técnica de informática') ||
        kpLower.includes('notebook') ||
        kpLower.includes('computador') ||
        kpLower.includes('informática')
      ) {
        categoryText = 'Assistência técnica de informática';
      } else if (queryCategory) {
        categoryText = queryCategory;
      } else if (profileLower.includes('agência de marketing digital')) {
        categoryText = 'Agência de marketing digital';
      } else if (kpLower.includes('pizzaria') || kpLower.includes('pizza')) {
        categoryText = 'Pizzaria';
      } else if (kpLower.includes('restaurante') || kpLower.includes('churrascaria') || kpLower.includes('bistrô')) {
        categoryText = 'Restaurante';
      } else if (kpLower.includes('barbearia') || kpLower.includes('salão') || kpLower.includes('estética')) {
        categoryText = 'Salão de beleza e estética';
      } else if (
        kpLower.includes('imobili') ||
        kpLower.includes('imóve') ||
        kpLower.includes('imove') ||
        kpLower.includes('corretor') ||
        profileLower.includes('imobiliária')
      ) {
        categoryText = 'Imobiliária';
      } else if (kpLower.includes('odonto') || kpLower.includes('dentista')) {
        categoryText = 'Clínica odontológica';
      } else if (kpLower.includes('clínica') || kpLower.includes('médic')) {
        categoryText = 'Clínica de saúde';
      } else if (kpLower.includes('advocacia') || kpLower.includes('advogad')) {
        categoryText = 'Escritório de advocacia';
      }
    }

    if (!categoryText && selectedProspectOverride && selectedProspectOverride.category) {
      categoryText = selectedProspectOverride.category;
    }
    const hasCategory = categoryText.length > 2;

    // 3. Medidor nativo "Força do perfil" do Google e cards de pendência (apenas para cliente gerenciado)
    const hasIncompleteStrengthWarning =
      isManagedClient && (
        cleanPageText.includes('Completar perfil') ||
        cleanPageText.includes('Ajudar os clientes a encontrar sua empresa') ||
        cleanPageText.includes('Informações completas')
      );

    // 4. Fotos reais na capa e logotipo vs alerta de falta de fotos
    const missingPhotosAlert =
      isManagedClient && (
        cleanPageText.includes('Fotos chamam a atenção') ||
        cleanPageText.includes('Mostre aos clientes por que eles devem escolher você')
      );

    const kpPhotoElements = (detailContainer || document).querySelectorAll(
      'div[data-attrid*="image"] img, div[jsname] img[src*="googleusercontent"], a[aria-label*="Foto" i] img, button[jsaction*="photo"] img, img[src*="lh3.googleusercontent"], img[src*="lh5.googleusercontent"]'
    );
    const hasPhotosTabOrButton =
      /\bFotos\b/i.test(detailText) ||
      !!(detailContainer && detailContainer.querySelector('button[role="tab"][aria-label*="Foto" i], a[href*="photo"]'));
    // ZERO dados inventados: não dá pontos de graça para prospecto se não houver fotos detectadas!
    const hasRealPhotos = !missingPhotosAlert && (kpPhotoElements.length > 0 || hasPhotosTabOrButton);

    // 5. Descrição realmente visível na ficha do Google
    const descLength = extractRealDescriptionLength(activeBiz, detailContainer, isManagedClient);
    const hasSavedDraftInLivia = !!(isManagedClient && activeBiz && (activeBiz.savedDescription || activeBiz.description) && (activeBiz.savedDescription || activeBiz.description).length > 30);

    // 6. Contagem real de avaliações e nota (suporta "5,0 (15)", "15 avaliações no Google", "4,9 ★ (199)", "199 críticas")
    let reviewCount = (selectedProspectOverride && selectedProspectOverride.name === kpName && selectedProspectOverride.reviews)
      ? selectedProspectOverride.reviews
      : 0;

    // Busca no DOM específico da ficha (detailContainer, matchedCard, openGoogleModal ou searchRoot)
    if (!reviewCount) {
      const candidateRoots = [detailContainer, matchedCard, openGoogleModal, searchRoot].filter(Boolean);
      const revCandidateSelectors = '[data-attrid="subtitle"] a, [data-attrid="subtitle"] span, span[data-nmx-deep-link], a[href*="reviews"], span.RDApEe, span.hqzQac, span.yi40Hd, [aria-label*="avaliaç" i], [aria-label*="crítica" i], span.uq2Bu, div.Ob2kfd';

      for (const root of candidateRoots) {
        const els = Array.from(root.querySelectorAll(revCandidateSelectors));
        for (const el of els) {
          if (el.closest('#livia-command-center, .livia-modal-backdrop')) continue;
          const raw = ((el.innerText || '') + ' ' + (el.getAttribute('aria-label') || '')).replace(/[\u200B-\u200F\u202A-\u202E]/g, '').trim();
          if (!/\d/.test(raw)) continue; // Ignora tabs ou rótulos sem números

          const m =
            raw.match(/(?:[1-5][.,]\d\s*)?(\d[\d.]*)\s*(?:avaliaç|crítica|comentário)/i) ||
            raw.match(/\(\s*(\d[\d.]*)\s*\)/) ||
            raw.match(/\b([1-5][.,]\d)[\s★⭐*]*\(\s*(\d[\d.]*)\s*\)/);
          const foundDigits = m ? (m[1] || m[2]) : null;
          if (foundDigits) {
            const parsed = parseInt(foundDigits.replace(/\./g, ''), 10);
            if (parsed > 0 && parsed < 200000) {
              reviewCount = parsed;
              break;
            }
          }
        }
        if (reviewCount) break;
      }
    }

    // Fallback por regex no texto isolado da empresa (sem cortar o texto)
    if (!reviewCount) {
      const textToSearch = (detailText + '\n' + cardText + '\n' + modalText);
      const revMatch =
        textToSearch.match(/(?:[1-5][.,]\d\s*)?(\d[\d.]*)\s+(?:avaliaç(?:ão|ões)|críticas|comentários)(?:\s+no\s+Google)?/i) ||
        textToSearch.match(/\b[1-5][.,]\d[\s★⭐*]*\(\s*(\d[\d.]*)\s*\)/) ||
        textToSearch.match(/\(\s*(\d[\d.]*)\s*\)(?!\s*\d{4,5})/);
      if (revMatch && (revMatch[1] || revMatch[2])) {
        const val = parseInt((revMatch[1] || revMatch[2]).replace(/\./g, ''), 10) || 0;
        if (val > 0 && val < 200000) reviewCount = val;
      }
    }

    // Se a ficha direta não continha avaliações no DOM, confere se temos o card correspondente confirmado da busca
    if (!reviewCount && matchedScraped && matchedScraped.reviews) {
      reviewCount = matchedScraped.reviews;
    }

    let rating = (selectedProspectOverride && selectedProspectOverride.name === kpName && selectedProspectOverride.rating)
      ? selectedProspectOverride.rating
      : 5.0;

    // Busca nota oficial no elemento .Aq14fc ou equivalente do Knowledge Panel / Google Maps
    const ratingEl = (detailContainer || openGoogleModal || document).querySelector(
      '[data-attrid="subtitle"] .Aq14fc, span.Aq14fc, [aria-label*="Avaliaç" i][aria-label*="de 5" i], span.z3HNkc[aria-label*="de 5" i], span.yi40Hd, span.ceNzKf'
    );
    if (ratingEl && !ratingEl.closest('#livia-command-center, .livia-modal-backdrop')) {
      const rTxt = ((ratingEl.getAttribute('aria-label') || '') + ' ' + (ratingEl.innerText || '')).trim();
      const rM = rTxt.match(/([1-5][.,]\d)\s*de\s*5/i) || rTxt.match(/\b([1-5][.,]\d)\b/);
      if (rM) rating = parseFloat(rM[1].replace(',', '.'));
    } else {
      // Procura primeiro em detailText isolado da empresa, evitando falsos positivos de redes sociais (ex: "1,4 mil seguidores")
      const textForRating = (detailText + '\n' + modalText);
      const ratingMatch =
        textForRating.match(/\b([1-5][.,]\d)[\s★⭐*]*(?:\(\d|\d+\s+avaliaç|\d+\s+crítica)/i) ||
        textForRating.match(/\b([1-5][.,]\d)\s*(?:de\s*5|[★⭐])/i) ||
        textForRating.match(/\b([1-5][.,]\d)\b(?!\s*(?:mil|k|km|m|cm|kg|h|hrs|horas|dias|semanas|meses|anos|seguidores|marcações|visualizações|likes|reproduções))/i);
      if (ratingMatch && ratingMatch[1]) {
        rating = parseFloat(ratingMatch[1].replace(',', '.'));
      } else if (matchedScraped?.rating) {
        rating = matchedScraped.rating;
      }
    }

    // 7. Endereço físico local e Cidade real da ficha
    const addrSelectors = [
      '[data-attrid*="address"]',
      'span.LrzXr',
      'div[data-local-attribute="d3adr"]',
      'button[data-item-id="address"]',
      'div.Io6YTe',
      'a[href*="maps.google"][aria-label*="Endereço" i]',
      'a[href*="maps.google"][aria-label*="Rua" i]',
      'a[href*="maps.google"][aria-label*="Av" i]'
    ];
    let addressText = '';
    const addrSearchRoots = [detailContainer, openGoogleModal, searchRoot].filter(Boolean);
    for (const root of addrSearchRoots) {
      for (const sel of addrSelectors) {
        const el = root.querySelector(sel);
        if (el && !el.closest('#livia-command-center, .livia-modal-backdrop')) {
          const txt = (el.innerText || '').trim();
          if (txt.length > 5) {
            addressText = txt;
            break;
          }
        }
      }
      if (addressText) break;
    }

    if (!addressText) {
      const addrLineMatch =
        profileSpecificText.match(/Endereço:\s*([^\n]+)/i) ||
        profileSpecificText.match(/\b((?:Rua|R\.|Avenida|Av\.|Praça|Pç\.|Alameda|Al\.|Rodovia|Rod\.|Estrada|Travessa|Tv\.)\s+[^\r\n·•]{3,85}(?:[,\s]*\n\s*[^\r\n·•]{2,60}(?:\s*-\s*[A-Z]{2})?)?)/i) ||
        profileSpecificText.match(/([^\n]{6,85}\b\d{5}-\d{3}\b)/) ||
        profileSpecificText.match(/([A-Za-zÀ-ÿ0-9\s.,-]+,\s*\d{1,5}(?:\s*-\s*[^\n]+)?\s*-\s*[A-Z]{2})/i) ||
        (isSingleEntityPage ? (
          cleanPageText.match(/Endereço:\s*([^\n]+)/i) ||
          cleanPageText.match(/\b((?:Rua|R\.|Avenida|Av\.|Praça|Pç\.|Alameda|Al\.|Rodovia|Rod\.|Estrada|Travessa|Tv\.)\s+[^\r\n·•]{3,85}(?:[,\s]*\n\s*[^\r\n·•]{2,60}(?:\s*-\s*[A-Z]{2})?)?)/i) ||
          cleanPageText.match(/([^\n]{6,85}\b\d{5}-\d{3}\b)/) ||
          cleanPageText.match(/([A-Za-zÀ-ÿ0-9\s.,-]+,\s*\d{1,5}(?:\s*-\s*[^\n]+)?\s*-\s*[A-Z]{2})/i)
        ) : null);
      if (addrLineMatch && addrLineMatch[1]) {
        addressText = addrLineMatch[1].replace(/[\r\n]+/g, ' - ').replace(/\s{2,}/g, ' ').trim();
      }
    }

    // ZERO dados inventados: só considera endereço físico se houver texto real de rua/logradouro
    const hasStreetAddress = addressText.length > 5 && !/apenas área|sem endereço/i.test(addressText);

    // 8. Cidade real detectada
    let detectedCity = '';
    const textForCity = (addressText + '\n' + profileSpecificText + (isSingleEntityPage ? '\n' + cleanPageText : ''));
    const ufRegex = /([A-Za-zÀ-ÿ\s]{3,32})\s*-\s*(?:SP|RJ|MG|PR|SC|RS|BA|PE|CE|GO|DF|ES|MT|MS|PA|AM|MA|PB|RN|AL|SE|PI|TO|RO|AC|AP|RR)\b/;
    const cityUfMatch = textForCity.match(ufRegex);
    if (cityUfMatch && cityUfMatch[1]) {
      const candidate = cityUfMatch[1].split(',').pop().split('-').pop().trim();
      if (candidate.length >= 3) {
        detectedCity = normalizeCityName(candidate);
      }
    }

    if (!detectedCity && queryCity) {
      detectedCity = queryCity;
    }

    if (!detectedCity && isManagedClient && activeBiz?.city) {
      detectedCity = activeBiz.city;
    }

    // 9. Telefone, Horário de Funcionamento e Website (DOM + Modal Aberto + Subframe)
    let phoneText = '';
    const phoneSearchRoots = [detailContainer, openGoogleModal, searchRoot].filter(Boolean);
    for (const root of phoneSearchRoots) {
      const phoneDomEl = root.querySelector('[data-attrid*="phone"], [data-local-attribute="d3ph"], a[data-dtype="d3ph"], a[href^="tel:"]');
      if (phoneDomEl && !phoneDomEl.closest('#livia-command-center, .livia-modal-backdrop')) {
        const pTxt = (phoneDomEl.innerText || phoneDomEl.getAttribute('href') || '').replace(/^tel:/i, '').trim();
        if (pTxt.replace(/\D/g, '').length >= 8) {
          phoneText = pTxt;
          break;
        }
      }
    }

    if (!phoneText) {
      const phoneMatch =
        profileSpecificText.match(/(?:Telefone|WhatsApp)(?:\/WhatsApp)?:\s*(\(?\d{2}\)?\s*\d{4,5}[-\s]?\d{4})/i) ||
        profileSpecificText.match(/(\(\d{2}\)\s*\d{4,5}[-\s]?\d{4})/) ||
        (isSingleEntityPage ? (
          cleanPageText.match(/(?:Telefone|WhatsApp)(?:\/WhatsApp)?:\s*(\(?\d{2}\)?\s*\d{4,5}[-\s]?\d{4})/i) ||
          cleanPageText.match(/(\(\d{2}\)\s*\d{4,5}[-\s]?\d{4})/)
        ) : null);
      if (phoneMatch && phoneMatch[1]) {
        phoneText = phoneMatch[1].trim();
      }
    }

    if (!phoneText && subframeLiveSignals.phoneText) {
      phoneText = subframeLiveSignals.phoneText;
    }
    const hasPhone = phoneText.replace(/\D/g, '').length >= 8;

    // Horário de funcionamento: verificado se houver tabela, horário no modal ou texto de expediente
    const hoursDomEl = (detailContainer || openGoogleModal || searchRoot).querySelector(
      '[data-attrid*="hours"], [data-local-attribute="d3oh"], table.WgFkxc, div[jsaction*="hours"], span.BTP3Ac, [aria-label*="horário" i], [aria-label*="hours" i], button[aria-label*="horário" i], [data-attrid*="operating_hours"]'
    );

    const hasMissingHoursWarningCard =
      isManagedClient && (
        cleanPageText.includes('Adicione o horário de funcionamento') ||
        cleanPageText.includes('Adicionar horário de funcionamento') ||
        cleanPageText.includes('Informe seu horário')
      );

    const modalHasHours =
      !!openGoogleModal && (
        modalText.includes('Horário') ||
        modalText.includes('Aberto') ||
        modalText.includes('Fechado') ||
        /(?:Segunda-feira|Terça-feira|Quarta-feira|Quinta-feira|Sexta-feira)[\s\n:]+(?:\d{1,2}:\d{2}|Fechado)/i.test(modalText)
      );

    const hasHours =
      !!(hoursDomEl && !hoursDomEl.closest('#livia-command-center, .livia-modal-backdrop')) ||
      modalHasHours ||
      subframeLiveSignals.hasHours ||
      profileSpecificText.includes('Horário') ||
      profileSpecificText.includes('Horários') ||
      /(?:^|[·•\n])\s*(?:Aberto|Fechado|Abre\s+(?:às|as)\s+\d|Fecha\s+(?:às|as)\s+\d)\b/i.test(profileSpecificText) ||
      /\b(?:Aberto|Fechado)\s*[·•⋅]\s*(?:Fecha|Abre)\b/i.test(profileSpecificText) ||
      /(?:Segunda-feira|Terça-feira|Quarta-feira|Quinta-feira|Sexta-feira)[\s\n:]+(?:\d{1,2}:\d{2}|Fechado)/i.test(profileSpecificText) ||
      (isSingleEntityPage && (
        cleanPageText.includes('Horário') ||
        cleanPageText.includes('Horários de pico') ||
        /(?:^|[·•\n])\s*(?:Aberto|Fechado)\b/i.test(cleanPageText) ||
        cleanPageText.includes('Aberto com horário normal')
      )) ||
      (isManagedClient && hasPhone && !hasMissingHoursWarningCard && cleanPageText.includes('Sua empresa no Google'));

    let siteBtn = (detailContainer || openGoogleModal || document).querySelector(
      'a[data-attrid*="website"], a[aria-label*="Site" i], a[aria-label*="Website" i], a.ab_button[href^="http"]:not([href*="google.com"])'
    );
    if (!siteBtn) {
      const actionBtns = Array.from((detailContainer || openGoogleModal || document).querySelectorAll('a, button, div[role="button"], span'));
      siteBtn = actionBtns.find(el => {
        if (el.closest('#livia-command-center, .livia-modal-backdrop')) return false;
        const t = (el.innerText || '').trim().toLowerCase();
        return t === 'website' || t === 'site' || t === 'acessar site';
      });
    }
    const hasWebsite = !!(siteBtn || (isManagedClient && activeBiz && activeBiz.website));
    const websiteUrl = (siteBtn && siteBtn.href) ? siteBtn.href : (isManagedClient ? (activeBiz?.website || '') : '');

    return {
      kpName,
      isManagedClient,
      hasCategory,
      categoryText,
      hasIncompleteStrengthWarning,
      missingPhotosAlert,
      hasRealPhotos,
      descriptionLength: descLength,
      hasSavedDraftInLivia,
      reviewCount,
      rating,
      hasStreetAddress,
      addressText,
      detectedCity,
      hasPhone,
      phoneText,
      hasHours,
      hasWebsite,
      websiteUrl,
      profileSpecificText: profileSpecificText.slice(0, 6000),
      fullPageText: cleanPageText.slice(0, 12000)
    };
  }

  // --- DIAGNÓSTICO DE CONFIABILIDADE DOS DADOS (TESTE REAL NA PÁGINA DO GOOGLE) ---
  // Para cada dado da auditoria, verifica de onde ele REALMENTE veio:
  //  'ficha'        -> encontrado no texto da ficha/card da empresa analisada (confiável)
  //  'pagina'       -> encontrado só no texto da página inteira (pode ser de OUTRA empresa)
  //  'busca'        -> deduzido do termo pesquisado no Google (não é dado da ficha)
  //  'inferido'     -> valor presumido/estimado pela Lívia (não confirmado na tela)
  //  'nao_detectado'-> não encontrado
  function escHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildDataProvenanceReport(auditData) {
    const kpName = auditData.kpName || '';
    const stripInv = (s) => (s || '').replace(/[\u200B-\u200F\u202A-\u202E]/g, '');
    const norm = (s) => stripInv(String(s || '')).toLowerCase().replace(/\s+/g, ' ').trim();
    const digits = (s) => String(s || '').replace(/\D/g, '');

    const detailContainer = getActiveProfileContainer(kpName);
    const matchedCard = getMatchingLocalFinderCard(kpName);
    const detailText = detailContainer ? stripInv(detailContainer.innerText) : '';
    const cardText = matchedCard ? stripInv(matchedCard.innerText) : '';
    const localText = `${detailText}\n${cardText}`;
    const localNorm = norm(localText);
    const pageNorm = norm(getCleanGooglePageText());
    const { queryCity, queryCategory } = extractCityAndCategoryFromSearchQuery();

    const whereText = (needle) => {
      const n = norm(needle);
      if (!n || n.length < 2) return 'nao_detectado';
      if (localNorm.includes(n)) return 'ficha';
      if (pageNorm.includes(n)) return 'pagina';
      return 'inferido';
    };

    const fields = [];
    const add = (key, label, value, source, evidence = '') => {
      fields.push({ key, label, value, source, evidence });
    };

    // Nome
    if (!kpName) {
      add('name', 'Nome da empresa', '', 'nao_detectado');
    } else if (detailContainer) {
      add('name', 'Nome da empresa', kpName, 'ficha', 'Título do painel da empresa');
    } else if (matchedCard) {
      add('name', 'Nome da empresa', kpName, 'ficha', 'Título do card na lista de resultados');
    } else {
      add('name', 'Nome da empresa', kpName, whereText(kpName), 'Nenhum painel/card da empresa localizado');
    }

    // Categoria
    if (!auditData.categoryText) {
      add('category', 'Categoria', '', 'nao_detectado');
    } else {
      const catNeedle = auditData.categoryText.replace(/(?:\.\.\.|…)$/, '').slice(0, 22);
      let src = whereText(catNeedle);
      if (src !== 'ficha' && queryCategory && norm(queryCategory) === norm(auditData.categoryText)) src = 'busca';
      add('category', 'Categoria', auditData.categoryText, src);
    }

    // Avaliações
    const rc = auditData.reviewCount || 0;
    if (!rc) {
      add('reviews', 'Nº de avaliações', 0, 'nao_detectado');
    } else {
      const rcRx = new RegExp(`\\(\\s*${rc}\\s*\\)|\\b${rc}\\s+(?:avalia|crítica|comentário)`, 'i');
      const src = rcRx.test(localText) ? 'ficha' : (rcRx.test(getCleanGooglePageText()) ? 'pagina' : 'inferido');
      add('reviews', 'Nº de avaliações', rc, src);
    }

    // Nota
    const rStr = (auditData.rating || 0).toFixed(1);
    const rRx = new RegExp(`\\b${rStr.replace('.', '[.,]')}\\b`);
    const ratingSrc = rRx.test(localText) ? 'ficha' : (rc ? 'pagina' : 'inferido');
    add('rating', 'Nota (estrelas)', rStr.replace('.', ','), ratingSrc, ratingSrc === 'inferido' ? 'Valor padrão 5,0 quando a nota não é encontrada' : '');

    // Telefone
    if (!auditData.hasPhone) {
      add('phone', 'Telefone', '', 'nao_detectado');
    } else {
      const pd = digits(auditData.phoneText).slice(-8);
      let src = digits(localText).includes(pd) ? 'ficha' : (digits(pageNorm).includes(pd) ? 'pagina' : 'inferido');
      if (src !== 'ficha' && subframeLiveSignals.phoneText && digits(subframeLiveSignals.phoneText).endsWith(pd)) src = 'ficha';
      add('phone', 'Telefone', auditData.phoneText, src);
    }

    // Endereço
    if (!auditData.addressText) {
      add('address', 'Endereço', '', 'nao_detectado');
    } else if (auditData.addressText.startsWith('Endereço físico localizado em')) {
      add('address', 'Endereço', auditData.addressText, 'inferido', 'Presumido pela existência do botão "Rotas", sem rua/CEP lidos');
    } else {
      add('address', 'Endereço', auditData.addressText, whereText(auditData.addressText.slice(0, 30)));
    }

    // Cidade
    if (!auditData.detectedCity || auditData.detectedCity === 'Sua Cidade') {
      add('city', 'Cidade', '', 'nao_detectado');
    } else {
      let src = whereText(auditData.detectedCity);
      if (src !== 'ficha' && queryCity && norm(queryCity) === norm(auditData.detectedCity)) src = 'busca';
      add('city', 'Cidade', auditData.detectedCity, src);
    }

    // Horário
    if (!auditData.hasHours) {
      add('hours', 'Horário de funcionamento', 'Não', 'nao_detectado');
    } else {
      const weekdayRx = /(?:Segunda|Terça|Quarta|Quinta|Sexta|Sábado|Domingo)(?:-feira)?[\s\S]{0,12}(?:\d{1,2}:\d{2}|\d{1,2}h|Fechado|Atendimento 24 horas)/i;
      const openRx = /\b(?:Aberto|Fechado|Fecha|Abre)\b[^\n]{0,20}\d{1,2}(?::\d{2}|h)/i;
      const statusRx = /(?:^|[·•\n])\s*(?:Aberto|Fechado)\b/i;
      let src = 'inferido';
      let ev = 'Nenhum horário real lido; marcado como presente por regra genérica';
      if (weekdayRx.test(localText) || openRx.test(localText) || (localText.includes('Horário') && statusRx.test(localText)) || statusRx.test(localText)) {
        src = 'ficha';
        ev = 'Status de funcionamento lido na ficha ("Aberto" / "Horário")';
      }
      else if (subframeLiveSignals.hasHours) { src = 'ficha'; ev = 'Horário lido no modal "Informações comerciais"'; }
      else if (weekdayRx.test(pageNorm) || openRx.test(pageNorm) || statusRx.test(pageNorm)) { src = 'pagina'; ev = 'Horário encontrado na página, fora da ficha'; }
      add('hours', 'Horário de funcionamento', 'Sim', src, ev);
    }

    // Site
    if (!auditData.hasWebsite) {
      add('website', 'Site vinculado', 'Não', 'nao_detectado');
    } else {
      let host = '';
      try { host = auditData.websiteUrl ? new URL(auditData.websiteUrl).hostname : ''; } catch (e) {}
      const src = (detailContainer || matchedCard) ? 'ficha' : 'pagina';
      add('website', 'Site vinculado', host || 'Sim (botão "Site")', auditData.isManagedClient && !host ? 'inferido' : src);
    }

    // Descrição
    add('description', 'Descrição "Da empresa"', auditData.descriptionLength ? `${auditData.descriptionLength} caracteres` : '0',
      auditData.descriptionLength ? 'ficha' : 'nao_detectado');

    // Fotos
    const photoCount = detailContainer
      ? detailContainer.querySelectorAll('img[src*="googleusercontent"], img[src*="gstatic.com/p"], div[data-attrid*="image"] img').length
      : 0;
    if (auditData.missingPhotosAlert) {
      add('photos', 'Fotos', 'Alerta "Fotos chamam a atenção"', 'ficha');
    } else if (photoCount > 0) {
      add('photos', 'Fotos', `${photoCount} imagem(ns) no painel`, 'ficha');
    } else {
      add('photos', 'Fotos', auditData.hasRealPhotos ? 'Presumido Sim' : 'Não', auditData.hasRealPhotos ? 'inferido' : 'nao_detectado',
        auditData.hasRealPhotos ? 'Nenhuma foto encontrada no painel; considerado "com fotos" por padrão' : '');
    }

    const counted = fields.filter(f => f.source !== 'nao_detectado');
    const fromProfile = fields.filter(f => f.source === 'ficha').length;
    const reliability = Math.round((fromProfile / Math.max(1, fields.length)) * 100);

    return {
      fields,
      reliability,
      suspiciousCount: fields.filter(f => f.source === 'pagina' || f.source === 'inferido' || f.source === 'busca').length,
      detectedCount: counted.length,
      context: {
        hasDetailContainer: !!detailContainer,
        detailContainerTag: detailContainer ? `${detailContainer.tagName.toLowerCase()}${detailContainer.id ? '#' + detailContainer.id : ''}${detailContainer.className && typeof detailContainer.className === 'string' ? '.' + detailContainer.className.trim().split(/\s+/).slice(0, 3).join('.') : ''}` : null,
        detailTextLength: detailText.length,
        hasMatchedCard: !!matchedCard,
        cardTextLength: cardText.length,
        selectedFromList: !!(selectedProspectOverride && selectedProspectOverride.name === kpName)
      },
      _detailEl: detailContainer,
      _detailText: detailText,
      _cardText: cardText
    };
  }

  const PROVENANCE_BADGES = {
    ficha: { icon: '✅', text: 'Lido da ficha', color: 'var(--cc-emerald)' },
    pagina: { icon: '⚠️', text: 'Página inteira (pode ser outra empresa)', color: '#d97706' },
    busca: { icon: '🔎', text: 'Deduzido da pesquisa', color: '#d97706' },
    inferido: { icon: '🔶', text: 'Estimado / presumido', color: '#ea580c' },
    nao_detectado: { icon: '❌', text: 'Não detectado', color: 'var(--cc-text-muted)' }
  };

  function renderProvenanceCardHtml(prov) {
    const relColor = prov.reliability >= 75 ? 'var(--cc-emerald)' : prov.reliability >= 50 ? '#d97706' : '#dc2626';
    const rows = prov.fields.map(f => {
      const b = PROVENANCE_BADGES[f.source] || PROVENANCE_BADGES.inferido;
      return `
        <div style="display: flex; justify-content: space-between; gap: 8px; padding: 5px 0; border-bottom: 1px solid var(--cc-border); font-size: 11.5px;">
          <div style="min-width: 0;">
            <div style="font-weight: 700; color: var(--cc-text);">${escHtml(f.label)}</div>
            <div style="color: var(--cc-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 230px;" title="${escHtml(f.value)}">${escHtml(f.value === '' ? '—' : f.value)}</div>
            ${f.evidence ? `<div style="color: var(--cc-text-muted); font-size: 10.5px;">${escHtml(f.evidence)}</div>` : ''}
          </div>
          <div style="flex-shrink: 0; font-weight: 700; color: ${b.color}; text-align: right; max-width: 150px;">${b.icon} ${b.text}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="livia-cc-card" id="livia-cc-provenance-card">
        <div class="livia-cc-card-title">
          <span>🔬 Confiabilidade dos Dados</span>
          <span style="font-weight: 900; color: ${relColor};">${prov.reliability}% lido da ficha</span>
        </div>
        <div style="font-size: 11px; color: var(--cc-text-secondary); margin-bottom: 6px;">
          ${prov.suspiciousCount > 0
            ? `⚠️ ${prov.suspiciousCount} dado(s) não foram confirmados na ficha desta empresa. Confira antes de enviar o laudo ao cliente.`
            : '✅ Todos os dados detectados foram lidos diretamente da ficha da empresa.'}
        </div>
        ${rows}
        <div style="display: flex; gap: 6px; margin-top: 8px;">
          <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-cc-export-diag" style="flex: 1; padding: 7px; font-size: 11px;">
            🧪 Exportar Diagnóstico (arquivo)
          </button>
          <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-cc-copy-diag" style="flex: 1; padding: 7px; font-size: 11px;">
            📋 Copiar Resumo do Teste
          </button>
        </div>
      </div>
    `;
  }

  function buildDiagnosticSummaryText(auditData, audit, prov) {
    const lines = [
      `🧪 DIAGNÓSTICO LÍVIA — ${new Date().toLocaleString('pt-BR')}`,
      `URL: ${window.location.href.slice(0, 300)}`,
      `Empresa: ${auditData.kpName || '(não detectada)'} | Gerenciada: ${auditData.isManagedClient ? 'sim' : 'não'}`,
      `Painel da empresa: ${prov.context.hasDetailContainer ? `sim (${prov.context.detailContainerTag}, ${prov.context.detailTextLength} chars)` : 'NÃO'} | Card na lista: ${prov.context.hasMatchedCard ? 'sim' : 'não'}`,
      `Pontuação: ${audit.score}% | Confiabilidade: ${prov.reliability}%`,
      '',
      ...prov.fields.map(f => `- ${f.label}: ${f.value === '' ? '—' : f.value} [${(PROVENANCE_BADGES[f.source] || {}).text || f.source}]${f.evidence ? ' — ' + f.evidence : ''}`),
      '',
      'Empresas na lista da busca:',
      ...scrapeCompetitorsFromPage().slice(0, 8).map(c => `  #${c.rank} ${c.name} | ★${c.rating} | ${c.reviews} aval. | ${c.category || 'sem categoria'}`)
    ];
    return lines.join('\n');
  }

  function exportLiveDiagnosticFile(auditData, audit, prov) {
    let snapshotHtml = '';
    try {
      const el = prov._detailEl || document.querySelector('#rhs') || document.querySelector('#rcnt') || document.querySelector('#center_col');
      snapshotHtml = el ? el.outerHTML : '';
      if (snapshotHtml.length > 1500000) snapshotHtml = snapshotHtml.slice(0, 1500000) + '<!-- truncado -->';
    } catch (e) {}

    const { fullPageText, ...auditDataLite } = auditData;
    const payload = {
      generatedAt: new Date().toISOString(),
      extensionVersion: (chrome.runtime.getManifest && chrome.runtime.getManifest().version) || '',
      url: window.location.href,
      query: extractCityAndCategoryFromSearchQuery(),
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      audit: { score: audit.score, grade: audit.grade, checks: audit.checks.map(c => ({ id: c.id, status: c.status, label: c.label })) },
      provenance: { reliability: prov.reliability, fields: prov.fields, context: prov.context },
      auditData: { ...auditDataLite, profileSpecificText: (auditData.profileSpecificText || '').slice(0, 4000) },
      detailText: (prov._detailText || '').slice(0, 6000),
      cardText: (prov._cardText || '').slice(0, 2000),
      pageTextHead: (fullPageText || '').slice(0, 6000),
      scrapedList: scrapeCompetitorsFromPage().map(({ cardEl, ...rest }) => rest),
      subframeSignals: subframeLiveSignals,
      snapshotHtml
    };

    const slug = (auditData.kpName || 'pagina')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'pagina';
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `livia-diagnostico-${slug}-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 15000);
    showToast(`🧪 Diagnóstico salvo em Downloads: livia-diagnostico-${slug}.json`, 5000);
  }

  // Executa a ação correspondente de qualquer botão "⚡ Resolver Agora" da Auditoria
  async function executeAuditFixAction(fixAction, auditData, activeBiz, closeAuditModal) {
    if (closeAuditModal) closeAuditModal();

    if (fixAction === 'AUTO_FIX_DESCRIPTION') {
      let descText = (activeBiz && activeBiz.savedDescription) ? activeBiz.savedDescription : '';
      if (!descText || descText.length < 100) {
        const res = await window.LiviaApi.generateBusinessDescription();
        descText = res.description || '';
        if (activeBiz && descText) {
          activeBiz.savedDescription = descText;
          await window.LiviaApi.saveBusiness(activeBiz);
        }
      }
      await startGoogleAutomationFlow('FILL_DESCRIPTION', { text: descText });
    } else if (fixAction === 'AUTO_FIX_POST_PHOTO') {
      const plan = await window.LiviaApi.generateWeeklyContentPlan();
      const postCaption = (plan && plan.posts && plan.posts[0])
        ? plan.posts[0].caption
        : `Confira as soluções especializadas da ${activeBiz?.name || auditData.kpName} em ${activeBiz?.city || auditData.detectedCity}!`;
      const bannerDataUrl = generatePromotionalBannerDataUrl(activeBiz);
      const seoFilename = window.LiviaApi.buildSeoFilename(activeBiz, 'destaque-seo', 'png');
      await startGoogleAutomationFlow('CREATE_POST', {
        text: postCaption,
        mediaUrl: bannerDataUrl,
        mediaDataUrl: bannerDataUrl,
        filename: seoFilename,
        whatsapp: activeBiz?.whatsapp || ''
      });
    } else if (fixAction === 'AUTO_FIX_TITLE') {
      const idealTitle = (activeBiz && activeBiz.name && activeBiz.name.length > 10)
        ? activeBiz.name
        : `${(auditData.kpName || 'Empresa').charAt(0).toUpperCase() + (auditData.kpName || 'Empresa').slice(1)} - ${auditData.categoryText || 'Soluções Digitais'}`;
      await startGoogleAutomationFlow('FILL_TITLE', { title: idealTitle });
    } else if (fixAction === 'AUTO_FIX_CATEGORIES' || fixAction === 'AUTO_FIX_CATEGORY') {
      openCategoriesModal();
    } else if (fixAction === 'AUTO_FIX_STRENGTH') {
      await startGoogleAutomationFlow('OPEN_COMPLETAR_PERFIL', {});
    } else if (fixAction === 'AUTO_FIX_REVIEWS') {
      if (document.getElementById('livia-cc-panel')) {
        renderCommandCenterContent('avaliacoes');
      } else {
        openGbpCheckProModal('reviews');
      }
    } else if (fixAction === 'AUTO_FIX_ADDRESS') {
      const addr = `${activeBiz?.neighborhood || 'Centro'}, ${activeBiz?.city || auditData.detectedCity || 'Macatuba'}`;
      await startGoogleAutomationFlow('FILL_ADDRESS', { address: addr });
    } else if (fixAction === 'AUTO_FIX_CONTACT') {
      await startGoogleAutomationFlow('FILL_CONTACT', {
        phone: activeBiz?.whatsapp || '',
        website: activeBiz?.website || ''
      });
    } else if (fixAction === 'AUTO_FIX_SERVICES') {
      await startGoogleAutomationFlow('OPEN_EDITAR_PERFIL', {});
      showToast('Cadastre seus serviços e preços no perfil para multiplicar palavras-chave! ⚙️');
    } else if (fixAction === 'AUTO_FIX_PHOTOS') {
      await startGoogleAutomationFlow('OPEN_EDITAR_PERFIL', {});
      showToast('Envie novas fotos reais com nome de arquivo geo-otimizado! 📸');
    } else if (fixAction === 'CREATE_WEEKLY_POST') {
      renderCommandCenterContent('publicar');
    } else if (fixAction === 'GOTO_GEOGRID') {
      renderCommandCenterContent('geogrid');
    }
  }

  // Modal 4: Auditoria Real-Time de Perfil + Botões "⚡ Resolver Agora" em 1 Clique
  async function runProfileAuditModal() {
    await refreshBusinessData();
    const activeBiz = cachedBizData?.activeBusiness;
    const auditData = collectLiveProfileData(activeBiz);
    const audit = window.LiviaApi.auditProfileHeuristics(auditData);

    const backdrop = document.createElement('div');
    backdrop.className = 'livia-modal-backdrop';

    const scoreColor = audit.score >= 80 ? '#10b981' : audit.score >= 55 ? '#ffa502' : '#ff4757';

    const checksHtml = audit.checks.map((c, idx) => `
      <div class="livia-audit-item ${c.status}" style="flex-direction: column; align-items: stretch; gap: 6px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: #ffffff;">
            <span>${c.status === 'pass' ? '✅' : c.status === 'warn' ? '⚠️' : '❌'}</span>
            <span>${c.label}</span>
          </div>
          ${c.fixAction ? `
            <button type="button" class="livia-btn-inline ${c.status === 'pass' ? 'livia-btn-secondary' : ''}" data-audit-fix-idx="${idx}" style="font-size: 11px; padding: 4px 10px; white-space: nowrap; flex-shrink: 0;">
              ${c.fixLabel || '⚡ Resolver Agora'}
            </button>
          ` : ''}
        </div>
        ${c.detail ? `<div style="font-size: 11.5px; color: #94a3b8; padding-left: 24px; line-height: 1.4;">💡 ${c.detail}</div>` : ''}
      </div>
    `).join('');

    const firstPending = audit.checks.find(c => (c.status === 'fail' || c.status === 'warn') && c.fixAction);

    backdrop.innerHTML = `
      <div class="livia-modal" style="width: 720px;">
        <div class="livia-modal-header">
          <div class="livia-modal-title">
            <span>🔍</span> Auditoria Real-Time & Auto-Resolução — ${auditData.kpName || (activeBiz && activeBiz.name) || 'Empresa'}
          </div>
          <button class="livia-modal-close">&times;</button>
        </div>
        <div class="livia-modal-body">
          <div class="livia-audit-score-card" style="border-color: ${scoreColor}; margin-bottom: 14px;">
            <div>
              <div style="font-size: 11px; color: #8892b0; font-weight: 700; text-transform: uppercase;">SAÚDE REAL DA FICHA NO GOOGLE AGORA</div>
              <div style="font-size: 17px; font-weight: 800; color: #ffffff; margin-top: 2px;">Classificação: <span style="color: ${scoreColor};">${audit.grade}</span></div>
              <div style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap;">
                <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-audit-open-pdf" style="font-size: 11px; padding: 4px 10px;">
                  📄 Gerar Laudo PDF Comercial
                </button>
                <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-audit-open-gbpcheck" style="font-size: 11px; padding: 4px 10px;">
                  🎯 Espião de Concorrentes & Palavras-Chave
                </button>
              </div>
            </div>
            <div class="livia-audit-score-number" style="color: ${scoreColor};">${audit.score}%</div>
          </div>
          <div class="livia-audit-list" style="max-height: 370px; overflow-y: auto; padding-right: 4px;">
            ${checksHtml}
          </div>
        </div>
        <div class="livia-modal-actions" style="justify-content: space-between;">
          <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-audit-copy-report">📋 Copiar Diagnóstico (WhatsApp)</button>
          <div style="display: flex; gap: 8px;">
            ${firstPending ? `
              <button type="button" class="livia-btn-inline" id="livia-audit-fix-top" style="background: linear-gradient(135deg, #10b981 0%, #00d2ff 100%) !important; color: #070b14 !important;">
                ⚡ Resolver Principal Pendência Agora
              </button>
            ` : ''}
            <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-audit-close">Fechar</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    backdrop.querySelector('.livia-modal-close').onclick = close;
    backdrop.querySelector('#livia-audit-close').onclick = close;

    backdrop.querySelectorAll('button[data-audit-fix-idx]').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.auditFixIdx, 10);
        const check = audit.checks[idx];
        if (check && check.fixAction) {
          executeAuditFixAction(check.fixAction, auditData, activeBiz, close);
        }
      };
    });

    const fixTopBtn = backdrop.querySelector('#livia-audit-fix-top');
    if (fixTopBtn && firstPending) {
      fixTopBtn.onclick = () => executeAuditFixAction(firstPending.fixAction, auditData, activeBiz, close);
    }

    backdrop.querySelector('#livia-audit-open-pdf').onclick = async () => {
      const kwRadar = await window.LiviaApi.generateLocalKeywordsRadar(auditData, { business: activeBiz });
      const compGap = window.LiviaApi.analyzeCompetitorsGap(auditData, scrapeCompetitorsFromPage());
      openPrintableAuditReport(auditData, audit, kwRadar, compGap, activeBiz);
    };

    backdrop.querySelector('#livia-audit-open-gbpcheck').onclick = () => {
      close();
      openGbpCheckProModal('competitors');
    };

    backdrop.querySelector('#livia-audit-copy-report').onclick = async () => {
      const lines = [
        `📊 *DIAGNÓSTICO DE GOOGLE MEU NEGÓCIO — ${(auditData.kpName || 'EMPRESA').toUpperCase()}*`,
        `🎯 *Pontuação Atual da Ficha:* ${audit.score}% (${audit.grade})`,
        ``,
        ...audit.checks.map(c => `${c.status === 'pass' ? '✅' : c.status === 'warn' ? '⚠️' : '❌'} *${c.label}*\n   ↳ ${c.detail || ''}`),
        ``,
        `🚀 _Auditoria gerada por Lívia Copilot Pro (ConectWeb)_`
      ];
      await navigator.clipboard.writeText(lines.join('\n'));
      showToast('Relatório completo de Auditoria copiado! Pronto para colar no WhatsApp. 📋✨');
    };
  }

  // Modal 5: Espião & Auto-Preenchedor de Categorias Oficiais do Google
  async function openCategoriesModal() {
    const backdrop = document.createElement('div');
    backdrop.className = 'livia-modal-backdrop';

    const res = await window.LiviaApi.suggestGoogleCategories();
    const secondariesHtml = res.secondaryCategories.map(cat => `
      <div style="display: flex; justify-content: space-between; align-items: center; background: #151c2c; padding: 8px 12px; border-radius: 6px; margin-bottom: 6px;">
        <span style="font-weight: 600; color: #ffffff;">${cat}</span>
        <div style="display: flex; gap: 6px;">
          <button type="button" class="livia-btn-inline livia-btn-secondary" style="font-size: 11px; padding: 3px 8px;" data-copy-cat="${cat}">📋 Copiar</button>
          <button type="button" class="livia-btn-inline" style="font-size: 11px; padding: 3px 10px;" data-autofill-cat="${cat}">⚡ Auto-Inserir no Perfil</button>
        </div>
      </div>
    `).join('');

    backdrop.innerHTML = `
      <div class="livia-modal" style="width: 640px;">
        <div class="livia-modal-header">
          <div class="livia-modal-title">
            <span>🏷️</span> Categorias Estratégicas do Google Meu Negócio
          </div>
          <button class="livia-modal-close">&times;</button>
        </div>
        <div class="livia-modal-body">
          <p style="margin-bottom: 12px;">
            A categoria primária é o <strong>fator nº 1 de posicionamento no Google Maps</strong>. Clique em <strong>"⚡ Auto-Inserir no Perfil"</strong> para a Lívia abrir a edição e preencher a categoria para você:
          </p>

          <div style="background: linear-gradient(135deg, rgba(0, 210, 255, 0.15) 0%, rgba(58, 123, 213, 0.15) 100%); border: 1px solid #00d2ff; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
            <div style="font-size: 11px; font-weight: 700; color: #00d2ff; text-transform: uppercase;">Categoria Primária Recomendada:</div>
            <div style="font-size: 16px; font-weight: 800; color: #ffffff; margin-top: 4px; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
              <span>${res.primaryCategory}</span>
              <div style="display: flex; gap: 6px;">
                <button type="button" class="livia-btn-inline livia-btn-secondary" style="font-size: 11px; padding: 4px 10px;" id="livia-copy-primary">📋 Copiar</button>
                <button type="button" class="livia-btn-inline" style="font-size: 11px; padding: 4px 10px;" id="livia-autofill-primary">⚡ Auto-Inserir Primária</button>
              </div>
            </div>
          </div>

          <div style="font-size: 12px; font-weight: 700; color: #8892b0; margin-bottom: 8px; text-transform: uppercase;">
            Categorias Secundárias de Alto Ranqueamento:
          </div>
          <div>${secondariesHtml}</div>

          <div style="background: rgba(255, 255, 255, 0.05); border-left: 3px solid #ffa502; padding: 10px 12px; border-radius: 4px; font-size: 12px; margin-top: 14px;">
            <strong>💡 Dica de SEO Local da Lívia:</strong> ${res.rankingTip}
          </div>
        </div>
        <div class="livia-modal-actions">
          <button type="button" class="livia-btn-inline" id="livia-cats-close">Concluído</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    backdrop.querySelector('.livia-modal-close').onclick = close;
    backdrop.querySelector('#livia-cats-close').onclick = close;

    backdrop.querySelector('#livia-copy-primary').onclick = () => {
      navigator.clipboard.writeText(res.primaryCategory);
      showToast('Categoria primária copiada! 📋');
    };

    backdrop.querySelector('#livia-autofill-primary').onclick = async () => {
      close();
      await startGoogleAutomationFlow('FILL_CATEGORY', { categoryName: res.primaryCategory });
    };

    backdrop.querySelectorAll('button[data-copy-cat]').forEach(btn => {
      btn.onclick = () => {
        navigator.clipboard.writeText(btn.dataset.copyCat);
        showToast(`Categoria "${btn.dataset.copyCat}" copiada! 📋`);
      };
    });

    backdrop.querySelectorAll('button[data-autofill-cat]').forEach(btn => {
      btn.onclick = async () => {
        const cat = btn.dataset.autofillCat;
        close();
        await startGoogleAutomationFlow('FILL_CATEGORY', { categoryName: cat });
      };
    });
  }

  // Modal 6: Catálogo Completo de Serviços com SEO
  async function openServicesCatalogModal() {
    const backdrop = document.createElement('div');
    backdrop.className = 'livia-modal-backdrop';

    const res = await window.LiviaApi.generateServicesCatalog();
    const services = res.services || [];

    const cardsHtml = services.map((s, idx) => `
      <div class="livia-faq-card" style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="font-weight: 700; color: #00d2ff; font-size: 14px;">${s.title}</span>
          <span style="font-size: 11px; background: rgba(0, 210, 255, 0.1); color: #00d2ff; padding: 2px 8px; border-radius: 4px;">${s.priceType}</span>
        </div>
        <div style="font-size: 12px; color: #ccd6f6; margin-bottom: 8px; line-height: 1.4;">${s.description}</div>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="livia-btn-inline livia-btn-secondary" style="font-size: 11px; padding: 4px 10px;" data-copy-service-idx="${idx}">
            📋 Copiar Serviço & Descrição
          </button>
          <button type="button" class="livia-btn-inline" style="font-size: 11px; padding: 4px 10px;" data-autofill-service-idx="${idx}">
            ⚡ Abrir Editar Serviços e Preencher
          </button>
        </div>
      </div>
    `).join('');

    backdrop.innerHTML = `
      <div class="livia-modal" style="width: 660px;">
        <div class="livia-modal-header">
          <div class="livia-modal-title">
            <span>🛠️</span> Catálogo de Serviços Otimizados para o Google Maps
          </div>
          <button class="livia-modal-close">&times;</button>
        </div>
        <div class="livia-modal-body">
          <p style="margin-bottom: 12px;">
            Adicione estes serviços na aba <strong>"Editar Serviços"</strong> da sua ficha no Google Meu Negócio. Isso garante que sua empresa apareça nas buscas específicas por cada especialidade!
          </p>
          <div style="max-height: 420px; overflow-y: auto;">
            ${cardsHtml}
          </div>
        </div>
        <div class="livia-modal-actions">
          <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-services-copy-all">Copiar Todos em Texto 📋</button>
          <button type="button" class="livia-btn-inline" id="livia-services-close">Fechar</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    backdrop.querySelector('.livia-modal-close').onclick = close;
    backdrop.querySelector('#livia-services-close').onclick = close;

    backdrop.querySelectorAll('button[data-copy-service-idx]').forEach(btn => {
      btn.onclick = () => {
        const item = services[parseInt(btn.dataset.copyServiceIdx, 10)];
        navigator.clipboard.writeText(`Serviço: ${item.title}\nPreço: ${item.priceType}\nDescrição: ${item.description}`);
        showToast(`Serviço "${item.title}" copiado! 📋`);
      };
    });

    backdrop.querySelectorAll('button[data-autofill-service-idx]').forEach(btn => {
      btn.onclick = async () => {
        const item = services[parseInt(btn.dataset.autofillServiceIdx, 10)];
        close();
        await startGoogleAutomationFlow('FILL_SERVICE', {
          serviceTitle: item.title,
          serviceDesc: item.description
        });
      };
    });

    backdrop.querySelector('#livia-services-copy-all').onclick = () => {
      const fullText = services.map(s => `• ${s.title} (${s.priceType}):\n${s.description}\n`).join('\n');
      navigator.clipboard.writeText(fullText);
      showToast('Todos os serviços copiados para a área de transferência! ✨');
    };
  }

  // Modal 7: Calendário Semanal de Posts (3 Publicações Estratégicas com Publicação em 1 Clique)
  async function openWeeklyPlanModal() {
    await refreshBusinessData();
    const activeBiz = cachedBizData?.activeBusiness;
    const backdrop = document.createElement('div');
    backdrop.className = 'livia-modal-backdrop';

    const res = await window.LiviaApi.generateWeeklyContentPlan();
    const posts = res.posts || [];

    const postsHtml = posts.map((p, idx) => `
      <div class="livia-faq-card" style="margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-weight: 800; color: #00d2ff; font-size: 13px;">📅 ${p.day} — ${p.type}</span>
          <span style="font-size: 11px; background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 2px 8px; border-radius: 4px;">Botão: ${p.ctaButton}</span>
        </div>
        <div style="font-weight: 700; color: #ffffff; font-size: 13px; margin-bottom: 6px;">${p.title}</div>
        <div style="font-size: 12px; color: #ccd6f6; white-space: pre-wrap; background: #0b0f19; padding: 10px; border-radius: 6px; margin-bottom: 8px;">${p.caption}</div>
        <div style="font-size: 11px; color: #8892b0; margin-bottom: 10px;">
          📸 <strong>Ideia de Foto:</strong> ${p.photoIdea}
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button type="button" class="livia-btn-inline livia-btn-secondary" style="font-size: 11px; padding: 4px 10px;" data-copy-post-idx="${idx}">
            📋 Copiar Texto
          </button>
          <button type="button" class="livia-btn-inline" style="font-size: 11px; padding: 4px 12px; background: linear-gradient(135deg, #10b981 0%, #00d2ff 100%) !important; color: #070b14 !important;" data-autopost-idx="${idx}">
            ⚡ Auto-Publicar no Google (Texto + Arte HD)
          </button>
        </div>
      </div>
    `).join('');

    backdrop.innerHTML = `
      <div class="livia-modal" style="width: 700px;">
        <div class="livia-modal-header">
          <div class="livia-modal-title">
            <span>📅</span> Plano de Conteúdo Semanal para Google Meu Negócio
          </div>
          <button class="livia-modal-close">&times;</button>
        </div>
        <div class="livia-modal-body">
          <p style="margin-bottom: 12px;">
            Empresas que publicam semanalmente recebem até <strong>4x mais visualizações e ligações no Google Maps</strong>. Clique em <strong>"⚡ Auto-Publicar no Google"</strong> para a Lívia abrir o painel e preencher o post e a imagem sozinha:
          </p>
          <div style="max-height: 440px; overflow-y: auto;">
            ${postsHtml}
          </div>
        </div>
        <div class="livia-modal-actions">
          <button type="button" class="livia-btn-inline" id="livia-plan-close">Concluído</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    backdrop.querySelector('.livia-modal-close').onclick = close;
    backdrop.querySelector('#livia-plan-close').onclick = close;

    backdrop.querySelectorAll('button[data-copy-post-idx]').forEach(btn => {
      btn.onclick = () => {
        const item = posts[parseInt(btn.dataset.copyPostIdx, 10)];
        navigator.clipboard.writeText(item.caption);
        showToast(`Post de ${item.day} copiado! 📋`);
      };
    });

    backdrop.querySelectorAll('button[data-autopost-idx]').forEach(btn => {
      btn.onclick = async () => {
        const item = posts[parseInt(btn.dataset.autopostIdx, 10)];
        const bannerUrl = generatePromotionalBannerDataUrl(activeBiz, item.title);
        const seoName = window.LiviaApi.buildSeoFilename(activeBiz, item.day.toLowerCase(), 'png');
        close();
        await startGoogleAutomationFlow('CREATE_POST', {
          text: item.caption,
          mediaUrl: bannerUrl,
          mediaDataUrl: bannerUrl,
          filename: seoName,
          whatsapp: activeBiz?.whatsapp || ''
        });
      };
    });
  }

  // Ação 8: Resposta em Lote para Avaliações Pendentes
  async function batchAnswerPendingReviews() {
    const textareas = Array.from(document.querySelectorAll(
      'textarea[aria-label*="responder" i], textarea[aria-label*="reply" i], textarea[placeholder*="resposta" i], div[role="dialog"] textarea'
    )).filter(t => !t.value || t.value.trim() === '');

    if (textareas.length === 0) {
      showToast('Nenhuma caixa de resposta aberta ou pendente na tela no momento! Abra a lista de avaliações.');
      return;
    }

    showToast(`Iniciando geração inteligente para ${textareas.length} avaliação(ões) pendente(s)... ⏳`, 3000);

    let count = 0;
    for (const textarea of textareas) {
      try {
        const reviewCard = textarea.closest('div[data-review-id]') || textarea.closest('div[role="dialog"]') || textarea.closest('div[jscontroller]') || textarea.parentElement.parentElement;
        let reviewerName = 'Cliente';
        let stars = 5;
        let reviewText = '';

        if (reviewCard) {
          const nameEl = reviewCard.querySelector('div[aria-level="3"], span.WNxzHc, div.TSUbDb, span[class*="author"]');
          if (nameEl) reviewerName = nameEl.innerText.trim();

          const starsEl = reviewCard.querySelector('span[aria-label*="estrela" i], span[aria-label*="star" i]');
          if (starsEl) {
            const match = starsEl.getAttribute('aria-label').match(/\d/);
            if (match) stars = parseInt(match[0], 10);
          }

          const textEl = reviewCard.querySelector('span.wiI7pd, div[class*="review-snippet"], span[data-expandable-section]');
          if (textEl) reviewText = textEl.innerText.trim();
        }

        const res = await window.LiviaApi.generateReviewReply({
          reviewerName,
          stars,
          reviewText,
          mode: stars <= 3 ? 'crisis' : 'smart'
        });

        if (res && res.reply) {
          setNativeValue(textarea, res.reply);
          count++;
        }
      } catch (e) {
        console.error('[Lívia Copilot] Erro no lote de reviews:', e);
      }
    }

    showToast(`✨ Sucesso! ${count} resposta(s) personalizada(s) gerada(s) automaticamente! Revise e clique em publicar.`);
  }

  // --- 5. ROBÔ DE AUTOMAÇÃO EM 1 CLIQUE (AUTO-ABERTURA E AUTO-PREENCHIMENTO NO GOOGLE MEU NEGÓCIO) ---

  // Localiza e clica automaticamente nos botões do painel "Sua empresa no Google" (NMX)
  function triggerGoogleNmxPanelButton(type) {
    let targetKeywords = [];
    if (type === 'CREATE_POST') {
      targetKeywords = ['adicionar atualização', 'criar post', 'posts', 'add update'];
    } else if (['FILL_DESCRIPTION', 'FILL_TITLE', 'FILL_CATEGORY', 'FILL_ADDRESS', 'FILL_CONTACT'].includes(type)) {
      targetKeywords = ['editar perfil', 'informações completas', 'completar perfil', 'edit profile'];
    } else if (type === 'OPEN_COMPLETAR_PERFIL') {
      targetKeywords = ['completar perfil', 'informações completas', 'editar perfil'];
    } else if (type === 'FILL_SERVICE') {
      targetKeywords = ['editar serviços', 'serviços'];
    } else if (type === 'REQUEST_REVIEWS') {
      targetKeywords = ['solicitar aval', 'solicitar avaliações', 'compartilhe o link'];
    }

    // Se já houver um modal aberto do Google na tela, não fecha nem clica de novo
    const existingDialog = document.querySelector('div[role="dialog"] iframe[src*="business.google.com"], div[role="dialog"] textarea');
    if (existingDialog) return true;

    const candidates = Array.from(document.querySelectorAll('a, button, div[role="button"], span[role="button"], div[jsaction]'));
    for (const kw of targetKeywords) {
      for (const el of candidates) {
        if (el.closest('#livia-floating-dock') || el.closest('.livia-modal-backdrop')) continue;
        const text = (el.innerText || el.getAttribute('aria-label') || '').trim().toLowerCase();
        if (text === kw || (text.startsWith(kw) && text.length < 32)) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.click();
          return true;
        }
      }
    }
    return false;
  }

  // Inicia o fluxo de automação salvando a tarefa no storage (lida tanto pela página principal quanto pelo iframe business.google.com)
  async function startGoogleAutomationFlow(type, payload = {}) {
    const clipFallback = payload.text || payload.title || payload.categoryName || payload.serviceTitle || payload.address || '';
    if (clipFallback) {
      try { await navigator.clipboard.writeText(clipFallback); } catch (e) {}
    }

    const task = {
      id: 'auto_' + Date.now(),
      type,
      payload,
      timestamp: Date.now()
    };

    chrome.storage.local.set({ liviaPendingAutomation: task }, () => {
      if (IS_TOP_FRAME) {
        const clicked = triggerGoogleNmxPanelButton(type);
        if (clicked) {
          showToast('🤖 Robô Lívia em ação: abrindo janela do Google e preenchendo automaticamente... Aguarde!', 5000);
        } else {
          showToast('🤖 Tarefa engatilhada! Se a janela não abrir sozinha, clique no botão correspondente do painel do Google que a Lívia preencherá na hora!', 6000);
        }
      }
      // Dispara ciclos rápidos de verificação para pegar o modal/iframe assim que montar
      [400, 900, 1600, 2500, 3800, 5500, 7500].forEach(ms => {
        setTimeout(() => checkAndExecutePendingAutomation(), ms);
      });
    });
  }

  // Destaca o botão final ("Publicar" ou "Salvar") do Google para confirmação humana segura
  function highlightGoogleSubmitButton(root = document) {
    const btns = Array.from(root.querySelectorAll('button, div[role="button"], span[role="button"]'));
    for (const b of btns) {
      const txt = (b.innerText || '').trim().toLowerCase();
      if (['publicar', 'postar', 'salvar', 'publish', 'save'].includes(txt)) {
        b.style.outline = '3px solid #10b981';
        b.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.8)';
        b.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        break;
      }
    }
  }

  // Verifica se há uma automação pendente e preenche os campos no DOM atual (janela principal ou iframe business.google.com)
  async function checkAndExecutePendingAutomation() {
    if (isExecutingAutomation) return;

    chrome.storage.local.get(['liviaPendingAutomation'], async (res) => {
      const task = res.liviaPendingAutomation;
      if (!task || !task.type) return;

      // Expira tarefas com mais de 45 segundos
      if (Date.now() - (task.timestamp || 0) > 45000) {
        chrome.storage.local.remove('liviaPendingAutomation');
        return;
      }

      isExecutingAutomation = true;
      try {
        const p = task.payload || {};

        // 1. AUTOMAÇÃO DE CRIAÇÃO DE POST (TEXTO + FOTO SEO + CTA)
        if (task.type === 'CREATE_POST') {
          // Se estiver na tela intermediária de listagem de posts, clica em "Adicionar atualização"
          const addUpdateBtns = Array.from(document.querySelectorAll('button, div[role="button"], a'));
          const intermediateBtn = addUpdateBtns.find(b => {
            const t = (b.innerText || b.getAttribute('aria-label') || '').trim().toLowerCase();
            return (t === 'adicionar atualização' || t === 'criar publicação' || t === 'add update') && !b.dataset.liviaAutoClicked;
          });

          // Procura o campo de texto do Post (excluindo a barra de pesquisa do Google)
          const postTextareas = Array.from(document.querySelectorAll(
            'textarea[aria-label*="descrição" i], textarea[aria-label*="atualização" i], textarea[aria-label*="detalhes" i], textarea[aria-label*="escreva" i], div[role="dialog"] textarea, form textarea, textarea'
          )).filter(ta => ta.name !== 'q' && ta.id !== 'livia-post-input' && ta.offsetParent !== null);

          if (postTextareas.length === 0 && intermediateBtn) {
            intermediateBtn.dataset.liviaAutoClicked = 'true';
            intermediateBtn.click();
            isExecutingAutomation = false;
            return;
          }

          if (postTextareas.length > 0) {
            const targetTa = postTextareas[0];
            setNativeValue(targetTa, p.text || '');

            // Anexa a foto/vídeo com nome de arquivo SEO automaticamente no input[type="file"]
            let photoAttached = false;
            if (p.mediaUrl || p.mediaDataUrl) {
              photoAttached = await autoAttachMediaToFileInput(document, p.mediaUrl, p.filename || 'post-seo-local.png', p.mediaDataUrl);
              await copyImageToClipboard(p.mediaUrl, p.mediaDataUrl);

              // Insere o card visual de confirmação acima da textarea
              const container = targetTa.parentElement || document.body;
              renderImportedMediaCard(document, targetTa, {
                text: p.text,
                mediaUrls: [p.mediaUrl || p.mediaDataUrl],
                mediaDataUrl: p.mediaDataUrl,
                mediaType: 'IMAGE',
                mainMediaFilename: p.filename || 'post-seo-local.png'
              });
            }

            highlightGoogleSubmitButton(document);
            chrome.storage.local.remove('liviaPendingAutomation');
            showToast(
              photoAttached
                ? '🎉 Post + Foto SEO preenchidos sozinhos pela Lívia! Confira e clique em "Publicar"!'
                : '✨ Texto do Post preenchido e Foto copiada (Ctrl+V)! Clique em "Publicar"!',
              6500
            );
          }
        }

        // 2. AUTOMAÇÃO DE DESCRIÇÃO DA EMPRESA (750 CHARS)
        else if (task.type === 'FILL_DESCRIPTION') {
          const descTextareas = Array.from(document.querySelectorAll('textarea')).filter(
            ta => ta.name !== 'q' && ta.id !== 'livia-desc-output' && ta.offsetParent !== null
          );

          if (descTextareas.length > 0) {
            const targetTa = descTextareas[0];
            setNativeValue(targetTa, p.text || '');
            targetTa.scrollIntoView({ behavior: 'smooth', block: 'center' });
            highlightGoogleSubmitButton(document);
            chrome.storage.local.remove('liviaPendingAutomation');
            showToast(`🎉 Descrição de ${(p.text || '').length} caracteres preenchida automaticamente! Clique em "Salvar".`, 6000);
          } else {
            // Se o acordeão "Descrição" dentro de "Editar perfil" ainda estiver fechado, clica nele para abrir!
            const rows = Array.from(document.querySelectorAll('div[role="button"], div[jsaction], span, h3, label'));
            const descRow = rows.find(el => {
              if (el.closest('#livia-floating-dock') || el.closest('.livia-modal-backdrop')) return false;
              const t = (el.innerText || '').trim().toLowerCase();
              return (t === 'descrição' || t.startsWith('descrição\n') || t.includes('adicione uma descrição')) && !el.dataset.liviaExpanded;
            });
            if (descRow) {
              descRow.dataset.liviaExpanded = 'true';
              descRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
              descRow.click();
            }
          }
        }

        // 3. AUTOMAÇÃO DE TÍTULO / NOME DA EMPRESA
        else if (task.type === 'FILL_TITLE') {
          const titleInputs = Array.from(document.querySelectorAll('input[type="text"]')).filter(
            inp => inp.name !== 'q' && inp.offsetParent !== null && (
              (inp.getAttribute('aria-label') || '').toLowerCase().includes('nome') ||
              (inp.value && inp.value.length > 1)
            )
          );
          if (titleInputs.length > 0) {
            setNativeValue(titleInputs[0], p.title || '');
            highlightGoogleSubmitButton(document);
            chrome.storage.local.remove('liviaPendingAutomation');
            showToast(`🎉 Título SEO "${p.title}" inserido automaticamente! Clique em "Salvar".`, 6000);
          } else {
            const nameRow = Array.from(document.querySelectorAll('div[role="button"], div[jsaction]')).find(el => {
              const t = (el.innerText || '').trim().toLowerCase();
              return t.startsWith('nome da empresa') && !el.dataset.liviaExpanded;
            });
            if (nameRow) {
              nameRow.dataset.liviaExpanded = 'true';
              nameRow.click();
            }
          }
        }

        // 4. AUTOMAÇÃO DE CATEGORIA PRIMÁRIA OU SECUNDÁRIA
        else if (task.type === 'FILL_CATEGORY') {
          const catInputs = Array.from(document.querySelectorAll('input[type="text"]')).filter(
            inp => inp.name !== 'q' && inp.offsetParent !== null && (
              (inp.getAttribute('aria-label') || '').toLowerCase().includes('categoria') ||
              (inp.placeholder || '').toLowerCase().includes('categoria')
            )
          );
          if (catInputs.length > 0) {
            const targetInp = catInputs[catInputs.length - 1];
            setNativeValue(targetInp, p.categoryName || '');
            chrome.storage.local.remove('liviaPendingAutomation');
            showToast(`🎉 Categoria "${p.categoryName}" digitada! Selecione na lista do Google e clique em "Salvar".`, 6000);
          } else {
            const catRow = Array.from(document.querySelectorAll('button, div[role="button"], div[jsaction]')).find(el => {
              const t = (el.innerText || '').trim().toLowerCase();
              return (t.includes('adicionar outra categoria') || t.startsWith('categoria da empresa')) && !el.dataset.liviaExpanded;
            });
            if (catRow) {
              catRow.dataset.liviaExpanded = 'true';
              catRow.click();
            }
          }
        }

        // 5. AUTOMAÇÃO DE ENDEREÇO / CONTATO / SERVIÇOS
        else if (['FILL_ADDRESS', 'FILL_CONTACT', 'FILL_SERVICE', 'OPEN_COMPLETAR_PERFIL'].includes(task.type)) {
          const targetTabText = task.type === 'FILL_ADDRESS' ? 'local' : task.type === 'FILL_CONTACT' ? 'contato' : 'sobre';
          const tabEl = Array.from(document.querySelectorAll('button, div[role="tab"], div[role="button"]')).find(
            el => (el.innerText || '').trim().toLowerCase() === targetTabText
          );
          if (tabEl) {
            tabEl.click();
            chrome.storage.local.remove('liviaPendingAutomation');
            showToast('✨ Seção aberta automaticamente e dados copiados! Basta colar (Ctrl+V) e clicar em "Salvar".', 5500);
          }
        }
      } catch (err) {
        console.warn('[Lívia Auto-Robot] Erro leve:', err);
      } finally {
        isExecutingAutomation = false;
      }
    });
  }

  // Escuta mudanças no storage para que iframes pré-carregados reajam no mesmo milissegundo
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.liviaPendingAutomation && changes.liviaPendingAutomation.newValue) {
      setTimeout(() => checkAndExecutePendingAutomation(), 300);
    }
  });

  // --- 6. MODO PROSPECÇÃO, ESPIÃO DE CONCORRENTES & LAUDO PDF (ESTILO GBP CHECK PRO) ---

  // Raspa todas as empresas visíveis no Local Pack da Busca do Google, Visão Geral de IA, Local Finder ou Google Maps
  function scrapeCompetitorsFromPage() {
    const results = [];
    const seen = new Set();

    // 1. Procura tanto por containers clássicos quanto pelos elementos de título de cards locais do Google
    const rawCandidates = Array.from(document.querySelectorAll(
      'div.VkpGBb, div.rllt__details, div.cXedhc, div.uMdZh, div[jscontroller][data-cid], div.Nv2PK, a.hfpxzc, span.OSrXXb, div.dbg0pd, div.qBF1Pd'
    ));

    rawCandidates.forEach((node) => {
      if (node.closest('#livia-command-center, #livia-panel-launcher, .livia-modal-backdrop')) return;

      let container = node.closest('div.VkpGBb, div.cXedhc, div.uMdZh, div[jscontroller][data-cid], div.Nv2PK');
      if (!container) {
        container = node.tagName === 'A' ? node.parentElement : (node.closest('div.rllt__details')?.parentElement || node.parentElement?.parentElement);
      }
      if (!container || container.closest('#livia-command-center')) return;

      const titleEl = container.querySelector('div.dbg0pd, div.qBF1Pd, span.OSrXXb, div.fontHeadlineSmall, a.vwVdIc, div[role="heading"]');
      const name = titleEl ? (titleEl.innerText || '').trim() : '';
      if (!name || name.length < 2 || isIgnoredGoogleSystemHeading(name)) return;

      const nameKey = name.toLowerCase();
      if (seen.has(nameKey)) return;
      seen.add(nameKey);

      const text = (container.innerText || '').replace(/[\u200B-\u200F\u202A-\u202E]/g, '');
      let rating = 4.8;
      const rMatch = text.match(/\b([1-5][.,]\d)\b/);
      if (rMatch) rating = parseFloat(rMatch[1].replace(',', '.'));

      let reviews = 0;
      const revMatch =
        text.match(/\b[1-5][.,]\d[\s★⭐*]*\(\s*(\d[\d.]*)\s*\)/) ||
        text.match(/\((\d[\d.]*)\)(?!\s*\d{4,5})/) ||
        text.match(/(\d[\d.]*)\s+(?:avaliaç|crítica)/i);
      if (revMatch) reviews = parseInt(revMatch[1].replace(/\./g, ''), 10) || 0;

      // Extrai categoria do card se visível (ex: "4,9 (45) · Imobiliária")
      let category = '';
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (line.includes('·') || line.includes('•')) {
          const parts = line.split(/[·•]/).map(p => p.trim()).filter(Boolean);
          for (const p of parts) {
            if (
              p.length > 3 &&
              p.length < 48 &&
              !/^\d[.,]\d/.test(p) &&
              !/^\(\d/.test(p) &&
              !/avaliaç|crítica|Aberto|Fechado|km\b|^R\$/i.test(p) &&
              !/^(?:Rua|R\.|Av\.|Avenida)\b/i.test(p)
            ) {
              category = p;
              break;
            }
          }
        }
        if (category) break;
      }

      const hasSite =
        !!container.querySelector('a[href^="http"]:not([href*="google.com"])') ||
        /\b(?:Site|Website)\b/i.test(text);

      const clickTarget =
        container.querySelector('a.vwVdIc, a.hfpxzc, div.dbg0pd, span.OSrXXb, div.qBF1Pd') ||
        titleEl ||
        container;

      results.push({
        rank: results.length + 1,
        name,
        rating,
        reviews,
        category,
        hasWebsite: hasSite,
        cardEl: clickTarget,
        isSimulatedBenchmark: false
      });
    });

    // Se nenhum card de lista foi encontrado (ex: busca específica com Hero Card direto da empresa),
    // inclui a própria entidade aberta na tela como prospecto #1!
    if (results.length === 0) {
      const heroName = getRealBusinessTitleFromPage();
      if (heroName && !isIgnoredGoogleSystemHeading(heroName)) {
        const subContainer = document.querySelector('[data-attrid="subtitle"]') || document.querySelector('.kp-wholepage-osrp') || document.querySelector('#rhs');
        const subNode = subContainer || Array.from(document.querySelectorAll('div, span, p')).find(el => {
          if (el.closest('#livia-command-center, .livia-modal-backdrop')) return false;
          const t = el.innerText || '';
          return /\b[1-5][.,]\d.*avaliações/i.test(t) && t.length < 160;
        });
        let hRating = 5.0;
        let hReviews = 0;
        let hCat = '';
        if (subNode) {
          const sText = (subNode.innerText || '').replace(/[\u200B-\u200F\u202A-\u202E]/g, '');
          const rM = sText.match(/\b([1-5][.,]\d)\b/);
          if (rM) hRating = parseFloat(rM[1].replace(',', '.'));
          const revM = sText.match(/(?:[1-5][.,]\d\s*)?(\d[\d.]*)\s+avaliaç[õo]es/i) || sText.match(/(\d[\d.]*)\s+avaliações/i);
          if (revM) hReviews = parseInt(revM[1].replace(/\./g, ''), 10) || 0;

          const catEl = subNode.querySelector?.('.E5BaQ, span.E5BaQ, [data-attrid="kc:/local:primary_category"], span.YhemCb, button.DkEaL');
          if (catEl) {
            hCat = (catEl.innerText || '').trim();
          } else if (sText.includes('·')) {
            const parts = sText.split('·').map(p => p.trim());
            for (const p of parts) {
              if (p.length > 3 && !/^\d/.test(p) && !/avaliaç|Aberto|Fechado|Instagram|Facebook|TikTok|YouTube/i.test(p)) {
                hCat = p;
                break;
              }
            }
          }
          if (hCat && hCat.includes(' em ')) hCat = hCat.split(/\s+em\s+/i)[0].trim();
        }
        results.push({
          rank: 1,
          name: heroName,
          rating: hRating,
          reviews: hReviews,
          category: hCat,
          hasWebsite: !!document.querySelector('a[href^="http"]:not([href*="google.com"])') || /\b(?:Site|Website)\b/i.test(document.body.innerText || ''),
          cardEl: null,
          isSimulatedBenchmark: false
        });
      }
    }

    return results.slice(0, 15);
  }

  // Empacota um Canvas A4 (JPEG) em um arquivo binário .PDF (Padrão PDF 1.4 Nativo) e faz o download direto
  function downloadCanvasAsPdfFile(canvas, filename) {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
    const base64 = dataUrl.split(',')[1];
    const binaryStr = atob(base64);
    const jpegBytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      jpegBytes[i] = binaryStr.charCodeAt(i);
    }

    const encoder = new TextEncoder();
    const chunks = [];
    const offsets = [0];
    let currentOffset = 0;

    function pushStr(str) {
      const bytes = encoder.encode(str);
      chunks.push(bytes);
      currentOffset += bytes.length;
    }

    function pushBytes(bytes) {
      chunks.push(bytes);
      currentOffset += bytes.length;
    }

    const pdfWidth = 595.28;
    const pdfHeight = 841.89;

    pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

    // Obj 1: Catalog
    offsets[1] = currentOffset;
    pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

    // Obj 2: Pages
    offsets[2] = currentOffset;
    pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

    // Obj 3: Page
    offsets[3] = currentOffset;
    pushStr(`3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /XObject << /Im0 4 0 R >> >> /MediaBox [0 0 ${pdfWidth} ${pdfHeight}] /Contents 5 0 R >>\nendobj\n`);

    // Obj 4: JPEG Image XObject
    offsets[4] = currentOffset;
    pushStr(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
    pushBytes(jpegBytes);
    pushStr('\nendstream\nendobj\n');

    // Obj 5: Content Stream
    const contentStream = `q ${pdfWidth} 0 0 ${pdfHeight} 0 0 cm /Im0 Do Q`;
    offsets[5] = currentOffset;
    pushStr(`5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`);

    // XRef Table
    const xrefOffset = currentOffset;
    pushStr('xref\n0 6\n0000000000 65535 f \n');
    for (let i = 1; i <= 5; i++) {
      const offStr = String(offsets[i]).padStart(10, '0');
      pushStr(`${offStr} 00000 n \n`);
    }
    pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

    const pdfBlob = new Blob(chunks, { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
  }

  // Desenha o Laudo Oficial em resolução A4 (1240x1754) e gera o download direto do arquivo .PDF
  function generateAndDownloadDirectPdf(auditData, audit, kwRadar, compGap, agencyBiz) {
    const companyName = auditData.kpName || activeBizNameFallback(agencyBiz);
    const agencyName = agencyBiz?.agencyName || agencyBiz?.name || 'ConectWeb Soluções Digitais';
    const agencyPhone = agencyBiz?.agencyWhatsapp || agencyBiz?.whatsapp || '5514996988997';
    const agencySlogan = agencyBiz?.slogan || 'Especialistas em SEO Local & Performance';
    const agencyColor = agencyBiz?.primaryColor || '#0284c7';
    const scoreColor = audit.score >= 80 ? '#10b981' : audit.score >= 55 ? '#f59e0b' : '#ef4444';
    const top1Plan = window.LiviaApi.generateTop1ActionPlan(auditData, audit, { business: agencyBiz });

    const canvas = document.createElement('canvas');
    canvas.width = 1240;
    canvas.height = 1754;
    const ctx = canvas.getContext('2d');

    // Fundo A4 Branco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1240, 1754);

    const padX = 65;
    const contentW = 1240 - padX * 2;
    let y = 65;

    // Cabeçalho
    ctx.fillStyle = agencyColor;
    ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
    ctx.fillText('AUDITORIA OFICIAL DE POSICIONAMENTO GOOGLE MEU NEGÓCIO', padX, y);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 21px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(agencyName, padX + contentW, y);

    y += 34;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 34px "Segoe UI", Arial, sans-serif';
    ctx.fillText(companyName.slice(0, 38), padX, y);

    ctx.textAlign = 'right';
    ctx.fillStyle = agencyColor;
    ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
    ctx.fillText(agencySlogan, padX + contentW, y - 6);

    y += 26;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.font = '600 18px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`Categoria: ${auditData.categoryText || 'Não configurada'}  •  Cidade: ${auditData.detectedCity || 'Local'}`, padX, y);

    ctx.textAlign = 'right';
    ctx.font = '15px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`Data: ${new Date().toLocaleDateString('pt-BR')}`, padX + contentW, y);
    ctx.textAlign = 'left';

    y += 20;
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(padX, y, contentW, 4);

    // Box de Pontuação Geral
    y += 22;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(padX, y, contentW, 108);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
    ctx.fillText('ÍNDICE DE FORÇA E VISIBILIDADE NO GOOGLE MAPS', padX + 26, y + 30);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 25px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`Classificação Atual: ${audit.grade}`, padX + 26, y + 62);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '16px "Segoe UI", Arial, sans-serif';
    const compScoreText = compGap.hasCompetitors && compGap.avgTopReviews !== null
      ? `Avaliações Atuais: ${auditData.reviewCount || 0} (Média do Top 3 Concorrentes: ${compGap.avgTopReviews} avaliações)`
      : `Avaliações Atuais: ${auditData.reviewCount || 0} • Volume de avaliações verificado no Google`;
    ctx.fillText(compScoreText, padX + 26, y + 89);

    ctx.textAlign = 'right';
    ctx.fillStyle = scoreColor;
    ctx.font = '900 58px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`${audit.score}%`, padX + contentW - 28, y + 74);
    ctx.textAlign = 'left';

    // Seção 1: 8 Pilares
    y += 140;
    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.fillText('1. RAIO-X TÉCNICO DOS 8 PILARES DE RANQUEAMENTO', padX, y);
    y += 8;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(padX, y, contentW, 2);
    y += 14;

    audit.checks.forEach((c) => {
      const barCol = c.status === 'pass' ? '#10b981' : c.status === 'warn' ? '#f59e0b' : '#ef4444';
      const tag = c.status === 'pass' ? '[APROVADO]' : c.status === 'warn' ? '[ATENÇÃO]' : '[CRÍTICO]';

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(padX, y, contentW, 64);
      ctx.fillStyle = barCol;
      ctx.fillRect(padX, y, 7, 64);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16.5px "Segoe UI", Arial, sans-serif';
      ctx.fillText(`${tag} ${c.label}`.slice(0, 88), padX + 18, y + 25);

      ctx.fillStyle = '#475569';
      ctx.font = '14.5px "Segoe UI", Arial, sans-serif';
      ctx.fillText((c.detail || '').slice(0, 105), padX + 18, y + 49);

      y += 72;
    });

    // Seção 2: Palavras-Chave
    y += 18;
    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`2. COBERTURA DE PALAVRAS-CHAVE COMERCIAIS (${kwRadar.coverageScore}%)`, padX, y);
    y += 8;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(padX, y, contentW, 2);
    y += 12;

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(padX, y, contentW, 34);
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Termo Pesquisado pelo Cliente no Google', padX + 14, y + 22);
    ctx.fillText('Intenção', padX + 560, y + 22);
    ctx.fillText('Status na Ficha', padX + 830, y + 22);
    y += 34;

    (kwRadar.keywords || []).slice(0, 6).forEach((k) => {
      ctx.fillStyle = '#0f172a';
      ctx.font = '600 15px "Segoe UI", Arial, sans-serif';
      ctx.fillText((k.term || '').slice(0, 48), padX + 14, y + 22);

      ctx.fillStyle = '#475569';
      ctx.font = '14.5px "Segoe UI", Arial, sans-serif';
      ctx.fillText((k.intent || '').replace(/^[^\wÀ-ÿ]+\s*/, '').slice(0, 26), padX + 560, y + 22);

      ctx.fillStyle = k.present ? '#059669' : '#dc2626';
      ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
      ctx.fillText(k.present ? 'Presente na Ficha' : 'Ausente (Perdendo Buscas)', padX + 830, y + 22);

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(padX, y + 31, contentW, 1);
      y += 32;
    });

    // Seção 3: Plano de Ação para o Top 1 (Algoritmo do Google)
    y += 24;
    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`3. ROTEIRO DE RANQUEAMENTO TOP 1 (ALGORITMO DO GOOGLE DECODIFICADO)`, padX, y);
    y += 8;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(padX, y, contentW, 2);
    y += 24;

    const top1PlanPdf = window.LiviaApi.generateTop1ActionPlan(auditData, audit, { business: agencyBiz });
    (top1PlanPdf.tiers || []).forEach((tier) => {
      const tierTag = tier.id === 'critical' ? '🔴 NÍVEL 1 (24h - Travas Críticas)' : tier.id === 'growth' ? '🟡 NÍVEL 2 (7 Dias - Aceleradores)' : '🟢 NÍVEL 3 (Semanal - Dominação)';
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
      ctx.fillText(tierTag, padX + 8, y);
      y += 20;

      const mainAction = tier.items.find(i => i.status !== 'pass') || tier.items[0];
      if (mainAction) {
        ctx.fillStyle = '#334155';
        ctx.font = '600 13.5px "Segoe UI", Arial, sans-serif';
        ctx.fillText(`• ${mainAction.title}: ${mainAction.action}`.slice(0, 108), padX + 16, y);
        y += 18;
        ctx.fillStyle = '#4338ca';
        ctx.font = 'italic 12px "Segoe UI", Arial, sans-serif';
        ctx.fillText(`  ↳ Algoritmo Google: ${mainAction.whyGoogle}`.slice(0, 112), padX + 16, y);
        y += 22;
      }
    });

    // Rodapé Comercial CTA
    const footerY = 1605;
    ctx.fillStyle = '#f0f9ff';
    ctx.fillRect(padX, footerY, contentW, 88);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.strokeRect(padX, footerY, contentW, 88);

    ctx.fillStyle = '#0369a1';
    ctx.font = 'bold 19px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Quer que nossa equipe execute 100% dessas otimizações para você?', padX + 22, footerY + 36);

    ctx.fillStyle = '#334155';
    ctx.font = '16px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`Fale agora com ${agencyName} e coloque sua empresa no topo das buscas locais.`, padX + 22, footerY + 64);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#0284c7';
    ctx.font = '900 21px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`WhatsApp: ${agencyPhone}`, padX + contentW - 22, footerY + 52);
    ctx.textAlign = 'left';

    const safeSlug = companyName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'empresa';

    const pdfFilename = `laudo-gmn-${safeSlug}.pdf`;
    downloadCanvasAsPdfFile(canvas, pdfFilename);
    showToast(`📥 PDF "${pdfFilename}" salvo direto na sua pasta Downloads!`, 5500);
  }

  // Gera o download direto do arquivo .PDF E abre a visualização em nova aba com botões imunes a bloqueio CSP
  function openPrintableAuditReport(auditData, audit, kwRadar, compGap, agencyBiz) {
    // 1. Já dispara o download direto do arquivo .PDF na pasta Downloads do computador!
    try {
      generateAndDownloadDirectPdf(auditData, audit, kwRadar, compGap, agencyBiz);
    } catch (e) {
      console.error('[Lívia Copilot] Erro ao gerar PDF direto:', e);
    }

    const companyName = auditData.kpName || activeBizNameFallback(agencyBiz);
    const agencyName = agencyBiz?.agencyName || agencyBiz?.name || 'ConectWeb Soluções Digitais';
    const agencyPhone = agencyBiz?.agencyWhatsapp || agencyBiz?.whatsapp || '5514996988997';
    const agencySlogan = agencyBiz?.slogan || 'Especialistas em SEO Local & Performance';
    const agencyColor = agencyBiz?.primaryColor || '#0284c7';
    const scoreColor = audit.score >= 80 ? '#10b981' : audit.score >= 55 ? '#f59e0b' : '#ef4444';
    const top1Plan = window.LiviaApi.generateTop1ActionPlan(auditData, audit, { business: agencyBiz });

    const checksRows = audit.checks.map(c => `
      <div style="border-left: 5px solid ${c.status === 'pass' ? '#10b981' : c.status === 'warn' ? '#f59e0b' : '#ef4444'}; background: #f8fafc; padding: 10px 14px; border-radius: 6px; margin-bottom: 8px;">
        <div style="font-weight: 700; font-size: 13px; color: #0f172a;">
          ${c.status === 'pass' ? '✅ APROVADO:' : c.status === 'warn' ? '⚠️ ATENÇÃO:' : '❌ CRÍTICO:'} ${c.label}
        </div>
        <div style="font-size: 12px; color: #475569; margin-top: 3px;">${c.detail || ''}</div>
      </div>
    `).join('');

    const kwRows = (kwRadar.keywords || []).slice(0, 6).map(k => `
      <tr>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${k.term}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0;">${k.intent}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: ${k.present ? '#10b981' : '#ef4444'};">
          ${k.present ? '✅ Presente na Ficha' : '❌ Ausente (Perdendo Buscas)'}
        </td>
      </tr>
    `).join('');

    const compRows = (compGap.competitors || []).slice(0, 3).map(c => `
      <tr>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 800; color: #0284c7;">#${c.rank}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 700;">${c.name}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0;">⭐ ${c.rating}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #059669;">${c.reviews} avaliações</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0;">${c.hasWebsite ? '🌐 Possui Site' : '❌ Sem Site'}</td>
      </tr>
    `).join('');

    const win = window.open('', '_blank');
    if (!win) {
      return;
    }

    win.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Laudo de SEO Local — ${companyName}</title>
        <style>
          body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #0f172a; background: #e2e8f0; margin: 0; padding: 24px; }
          .page { max-width: 820px; margin: 0 auto; background: #ffffff; padding: 36px 42px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.12); }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0284c7; padding-bottom: 16px; margin-bottom: 22px; }
          .score-box { display: flex; align-items: center; justify-content: space-between; background: #0f172a; color: #fff; padding: 18px 24px; border-radius: 10px; margin-bottom: 22px; }
          h2 { font-size: 16px; color: #0284c7; text-transform: uppercase; margin: 22px 0 10px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
          th { background: #f1f5f9; text-align: left; padding: 8px 10px; color: #334155; }
          .print-bar { display: flex; justify-content: space-between; align-items: center; max-width: 820px; margin: 0 auto 14px auto; background: #0f172a; color: #fff; padding: 12px 18px; border-radius: 10px; }
          .btn-action { background: #059669; color: #fff; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 13.5px; margin-left: 8px; }
          .btn-print { background: #0284c7; color: #fff; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 13.5px; margin-left: 8px; }
          @media print { body { background: #fff; padding: 0; } .page { box-shadow: none; padding: 10px; } .print-bar { display: none !important; } }
        </style>
      </head>
      <body>
        <div class="print-bar">
          <div style="font-size: 13px; font-weight: 600; color: #38bdf8;">
            ✅ O arquivo PDF já foi baixado na sua pasta <strong>Downloads</strong>!
          </div>
          <div>
            <button type="button" class="btn-action" id="livia-direct-download-pdf">📥 Baixar Arquivo .PDF Novamente</button>
            <button type="button" class="btn-print" id="livia-native-print-pdf">🖨️ Imprimir / Salvar via Chrome (Ctrl+P)</button>
          </div>
        </div>
        <div class="page">
          <div class="header">
            <div>
              <div style="font-size: 11px; font-weight: 800; color: #0284c7; text-transform: uppercase;">AUDITORIA OFICIAL DE POSICIONAMENTO GOOGLE MEU NEGÓCIO</div>
              <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin-top: 4px;">${companyName}</div>
              <div style="font-size: 13px; color: #64748b; margin-top: 3px;">
                Categoria: <strong>${auditData.categoryText || 'Não configurada'}</strong> • Cidade: <strong>${auditData.detectedCity || 'Local'}</strong>
                ${auditData.hasStreetAddress ? ` • Endereço: <strong>${auditData.addressText}</strong>` : ''}
              </div>
              <div style="margin-top: 6px;">
                <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(companyName + ' ' + (auditData.detectedCity || ''))}" target="_blank" style="color: #0284c7; font-size: 12px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                  🗺️ Abrir Ficha Oficial no Google Maps (Conferir) ↗
                </a>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 800; font-size: 14px; color: #0f172a;">${agencyName}</div>
              <div style="font-size: 12px; color: ${agencyColor}; font-weight: 600;">${agencySlogan}</div>
              <div style="font-size: 11px; color: #64748b;">Data: ${new Date().toLocaleDateString('pt-BR')}</div>
            </div>
          </div>

          <div class="score-box">
            <div>
              <div style="font-size: 12px; color: #94a3b8; font-weight: 700;">ÍNDICE DE FORÇA E VISIBILIDADE NO GOOGLE MAPS</div>
              <div style="font-size: 20px; font-weight: 800; margin-top: 4px;">Classificação Atual: <span style="color: ${scoreColor};">${audit.grade}</span></div>
              <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">Avaliações Atuais: <strong>${auditData.reviewCount || 0}</strong>${compGap.hasCompetitors && compGap.avgTopReviews !== null ? ` (Média do Top 3 Concorrentes: <strong>${compGap.avgTopReviews} avaliações</strong>)` : ' • Volume de avaliações verificado no Google'}</div>
            </div>
            <div style="font-size: 44px; font-weight: 900; color: ${scoreColor};">${audit.score}%</div>
          </div>

          <h2>1. Raio-X Técnico dos 8 Pilares de Ranqueamento</h2>
          ${checksRows}

          <h2>2. Cobertura de Palavras-Chave de Alta Intenção Comercial (${kwRadar.coverageScore}%)</h2>
          <table>
            <thead>
              <tr><th>Termo Pesquisado pelo Cliente no Google</th><th>Intenção</th><th>Status na Ficha</th></tr>
            </thead>
            <tbody>${kwRows}</tbody>
          </table>

          <h2>3. Comparativo com Concorrentes no Google Maps (${auditData.detectedCity || 'Local'})</h2>
          ${compGap.hasCompetitors && compGap.competitors.length > 0 ? `
            <table>
              <thead>
                <tr><th>Posição</th><th>Empresa Local</th><th>Nota</th><th>Avaliações</th><th>Site</th></tr>
              </thead>
              <tbody>
                ${compRows}
                <tr style="background: #f0f9ff; font-weight: 800;">
                  <td style="padding: 8px 10px; color: #0284c7;">SUA FICHA</td>
                  <td style="padding: 8px 10px;">${companyName}</td>
                  <td style="padding: 8px 10px;">⭐ ${compGap.myRating}</td>
                  <td style="padding: 8px 10px; color: ${compGap.avgTopReviews && compGap.myReviews >= compGap.avgTopReviews ? '#059669' : '#dc2626'};">${compGap.myReviews} avaliações</td>
                  <td style="padding: 8px 10px;">${auditData.hasWebsite ? '🌐 Possui Site' : '❌ Sem Site'}</td>
                </tr>
              </tbody>
            </table>
          ` : `
            <div style="background: #f8fafc; border: 1px dashed #cbd5e1; padding: 14px 18px; border-radius: 8px; font-size: 13px; color: #475569; line-height: 1.5;">
              ℹ️ <strong>Nenhum concorrente direto detectado nesta tela do Google.</strong><br>
              Para carregar a análise comparativa real com os líderes do mercado, pesquise no Google pelo segmento e cidade (ex: <em>"${auditData.categoryText || 'seu segmento'}${auditData.detectedCity ? ' em ' + auditData.detectedCity : ''}"</em>) e gere o laudo novamente.
            </div>
          `}

          <h2>4. Plano de Ação Estruturado para o Top 1 (Algoritmo do Google Decodificado)</h2>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; margin-bottom: 14px; font-size: 12.5px; color: #334155; line-height: 1.5;">
            <strong>Classificação de Potencial:</strong> Ficha avaliada em <strong>${audit.score}%</strong> (${top1Plan.estimatedRanking}).<br>
            O algoritmo de ranqueamento local do Google baseia-se em 3 pilares: <strong>Relevância Semântica (60%)</strong>, <strong>Proeminência & Freshness (25%)</strong> e <strong>Proximidade (15%)</strong>. A execução do roteiro abaixo assegura a entrega de todos os sinais exigidos pelo Google para posicionar esta empresa no topo.
          </div>
          ${(top1Plan.tiers || []).map(tier => `
            <div style="margin-bottom: 14px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <div style="background: ${tier.id === 'critical' ? '#fef2f2' : tier.id === 'growth' ? '#fffbeb' : '#f0fdf4'}; border-left: 5px solid ${tier.id === 'critical' ? '#ef4444' : tier.id === 'growth' ? '#f59e0b' : '#10b981'}; padding: 8px 12px;">
                <div style="font-weight: 800; font-size: 13px; color: #0f172a;">${tier.name}</div>
                <div style="font-size: 11.5px; color: #64748b;">${tier.sub}</div>
              </div>
              <div style="padding: 10px 14px; background: #ffffff;">
                ${tier.items.map(item => `
                  <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #e2e8f0;">
                    <div style="font-weight: 700; font-size: 12.5px; color: #0f172a;">
                      ${item.status === 'pass' ? '✅' : item.status === 'warn' ? '⚠️' : '❌'} ${item.title}
                    </div>
                    <div style="font-size: 12px; color: #334155; margin-top: 3px;">
                      <strong>🎯 Ação Recomendada:</strong> ${item.action}
                    </div>
                    <div style="font-size: 11.5px; color: #4338ca; background: #eef2ff; padding: 5px 8px; border-radius: 4px; margin-top: 4px; line-height: 1.35;">
                      <strong>🧠 Visão do Algoritmo:</strong> ${item.whyGoogle}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}

          <div style="margin-top: 26px; background: #f0f9ff; border: 1px solid #bae6fd; padding: 14px 18px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: #0369a1; font-size: 14px;">Quer que nossa equipe execute 100% dessas otimizações para você?</strong>
              <div style="font-size: 12px; color: #334155;">Fale agora com ${agencyName} e coloque sua empresa no topo das buscas locais.</div>
            </div>
            <div style="font-weight: 900; font-size: 15px; color: #0284c7;">📲 WhatsApp: ${agencyPhone}</div>
          </div>
        </div>
      </body>
      </html>
    `);
    win.document.close();

    // Conecta os eventos via JavaScript da Extensão (imune ao bloqueio CSP do Google para onclick inline!)
    const directBtn = win.document.getElementById('livia-direct-download-pdf');
    if (directBtn) {
      directBtn.addEventListener('click', () => {
        generateAndDownloadDirectPdf(auditData, audit, kwRadar, compGap, agencyBiz);
      });
    }

    const printBtn = win.document.getElementById('livia-native-print-pdf');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        win.focus();
        win.print();
      });
    }
  }

  function activeBizNameFallback(biz) {
    return (biz && biz.name) ? biz.name : 'Empresa Analisada';
  }

  // Abre Plaquinha QR Code de Balcão pronta para imprimir (com listener imune a CSP)
  function openPrintableQrCard(companyName, reviewUrl) {
    const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(reviewUrl)}`;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Display QR Code de Avaliações — ${companyName}</title>
        <style>
          body { font-family: 'Segoe UI', Roboto, sans-serif; background: #0f172a; display: flex; flex-direction: column; align-items: center; padding: 30px; color: #fff; }
          .card { background: #ffffff; color: #0f172a; width: 420px; border-radius: 20px; padding: 32px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.5); border: 4px solid #00d2ff; }
          .stars { font-size: 32px; margin: 12px 0; color: #f59e0b; }
          .btn { margin-bottom: 20px; background: #00d2ff; color: #0f172a; border: none; padding: 10px 22px; border-radius: 99px; font-weight: 800; cursor: pointer; }
          @media print { body { background: #fff; } .btn { display: none; } }
        </style>
      </head>
      <body>
        <button type="button" class="btn" id="livia-qr-print-btn">🖨️ Imprimir Plaquinha de Balcão</button>
        <div class="card">
          <div style="font-size: 13px; font-weight: 800; color: #0284c7; text-transform: uppercase;">GOSTOU DO NOSSO ATENDIMENTO?</div>
          <h1 style="font-size: 26px; margin: 8px 0;">${companyName}</h1>
          <div class="stars">⭐⭐⭐⭐⭐</div>
          <p style="font-size: 14px; color: #475569; margin-bottom: 18px;">Aponte a câmera do seu celular para o QR Code abaixo e deixe sua avaliação no Google em 30 segundos!</p>
          <img src="${qrApi}" alt="QR Code Avaliação Google" style="width: 240px; height: 240px; border: 2px solid #e2e8f0; border-radius: 12px; padding: 10px;">
          <p style="font-size: 12px; color: #64748b; margin-top: 16px; font-weight: 600;">Sua opinião ajuda nossa empresa a crescer cada vez mais! 💙</p>
        </div>
      </body>
      </html>
    `);
    win.document.close();

    const qrPrintBtn = win.document.getElementById('livia-qr-print-btn');
    if (qrPrintBtn) {
      qrPrintBtn.addEventListener('click', () => {
        win.focus();
        win.print();
      });
    }
  }

  // Abre Relatório Oficial de Geo-Grid e Ranking Local para Impressão / Salvar PDF
  function openPrintableGeoGridReport(geoData, agencyBiz) {
    const companyName = geoData.companyName || 'Empresa Analisada';
    const city = geoData.city || 'Sua Cidade';
    const keyword = geoData.keyword || 'Serviços';
    const agencyName = agencyBiz?.agencyName || agencyBiz?.name || 'ConectWeb Soluções Digitais';
    const agencyPhone = agencyBiz?.agencyWhatsapp || agencyBiz?.whatsapp || '5514996988997';
    const agencySlogan = agencyBiz?.slogan || 'Especialistas em SEO Local & Ranking no Google Maps';
    const agencyColor = agencyBiz?.primaryColor || '#0284c7';

    const win = window.open('', '_blank');
    if (!win) return;

    const cellsHtml = geoData.grid.map(g => `
      <div style="background: #ffffff; border: 2px solid ${g.color}; border-radius: 12px; padding: 12px 8px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.06); display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="width: 38px; height: 38px; border-radius: 50%; background: ${g.color}; color: #fff; font-weight: 900; font-size: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 6px;">
          #${g.rank}
        </div>
        <div style="font-weight: 800; font-size: 13px; color: #0f172a; line-height: 1.2;">${g.bairro}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 3px;">${g.distanceKm} km • ${g.quadrant}</div>
        <div style="font-size: 10.5px; font-weight: 700; color: ${g.color}; margin-top: 4px;">${g.statusLabel}</div>
      </div>
    `).join('');

    const rowsHtml = geoData.grid.map(g => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 9px 12px; font-weight: 900; color: ${g.color};">
          <span style="display: inline-block; width: 26px; height: 26px; border-radius: 50%; background: ${g.color}; color: #fff; text-align: center; line-height: 26px; font-size: 13px;">#${g.rank}</span>
        </td>
        <td style="padding: 9px 12px; font-weight: 800; color: #0f172a;">${g.bairro} ${g.isHome ? '<span style="font-size: 10px; background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 4px; margin-left: 4px;">SEDE</span>' : ''}</td>
        <td style="padding: 9px 12px; color: #64748b;">${g.distanceKm} km</td>
        <td style="padding: 9px 12px; font-weight: 700; color: ${g.color};">${g.statusLabel}</td>
        <td style="padding: 9px 12px; font-size: 12px; color: #334155;">${g.tip}</td>
      </tr>
    `).join('');

    win.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório Geo-Grid de Bairros — ${companyName}</title>
        <style>
          body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #0f172a; background: #f1f5f9; margin: 0; padding: 24px; }
          .page { max-width: 860px; margin: 0 auto; background: #ffffff; padding: 36px 42px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.12); }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0284c7; padding-bottom: 16px; margin-bottom: 20px; }
          .print-bar { display: flex; justify-content: space-between; align-items: center; max-width: 860px; margin: 0 auto 14px auto; background: #0f172a; color: #fff; padding: 12px 18px; border-radius: 10px; }
          .btn-print { background: #0284c7; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 800; cursor: pointer; font-size: 14px; }
          .matrix-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #cbd5e1; margin: 16px 0 24px 0; }
          .metrics-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 22px; }
          .stat-box { background: #0f172a; color: #fff; padding: 14px 16px; border-radius: 10px; text-align: center; }
          .stat-val { font-size: 26px; font-weight: 900; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-top: 10px; }
          th { background: #f1f5f9; text-align: left; padding: 10px 12px; color: #334155; font-size: 11.5px; text-transform: uppercase; }
          @media print { body { background: #fff; padding: 0; } .page { box-shadow: none; padding: 10px; } .print-bar { display: none !important; } }
        </style>
      </head>
      <body>
        <div class="print-bar">
          <div style="font-size: 13px; font-weight: 600; color: #38bdf8;">
            🗺️ Relatório de Auditoria Geo-Grid do Google Maps pronto para visualização e apresentação.
          </div>
          <button type="button" class="btn-print" id="livia-native-print-geogrid">🖨️ Imprimir / Salvar PDF (Ctrl+P)</button>
        </div>
        <div class="page">
          <div class="header">
            <div>
              <div style="font-size: 11px; font-weight: 800; color: #0284c7; text-transform: uppercase;">AUDITORIA DE POSICIONAMENTO LOCAL POR BAIRROS (GEO-GRID)</div>
              <div style="font-size: 26px; font-weight: 900; color: #0f172a; margin-top: 4px;">${companyName}</div>
              <div style="font-size: 13px; color: #64748b; margin-top: 3px;">
                Termo Auditado: <strong>"${keyword}"</strong> • Cidade: <strong>${city}</strong> • Raio da Matriz: <strong>3x3 (9 Regiões)</strong>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 800; font-size: 14px; color: #0f172a;">${agencyName}</div>
              <div style="font-size: 12px; color: ${agencyColor}; font-weight: 600;">${agencySlogan}</div>
              <div style="font-size: 11px; color: #64748b;">Data: ${new Date().toLocaleDateString('pt-BR')}</div>
            </div>
          </div>

          <div class="metrics-strip">
            <div class="stat-box">
              <div style="font-size: 11px; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Posição Média (AGR)</div>
              <div class="stat-val" style="color: ${geoData.agr <= 3 ? '#10b981' : geoData.agr <= 7 ? '#f59e0b' : '#ef4444'};">#${geoData.agr}</div>
              <div style="font-size: 10px; color: #cbd5e1;">Média nos 9 quadrantes</div>
            </div>
            <div class="stat-box">
              <div style="font-size: 11px; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Domínio Top 3 (SoLV)</div>
              <div class="stat-val" style="color: ${geoData.solv >= 70 ? '#10b981' : geoData.solv >= 40 ? '#f59e0b' : '#ef4444'};">${geoData.solv}%</div>
              <div style="font-size: 10px; color: #cbd5e1;">Share of Local Voice</div>
            </div>
            <div class="stat-box">
              <div style="font-size: 11px; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Top 3 (Local Pack)</div>
              <div class="stat-val" style="color: #10b981;">${geoData.top3Count} <span style="font-size: 16px; color: #94a3b8;">/ 9</span></div>
              <div style="font-size: 10px; color: #cbd5e1;">Recebe +70% das ligações</div>
            </div>
            <div class="stat-box">
              <div style="font-size: 11px; color: #94a3b8; font-weight: 800; text-transform: uppercase;">Fora do Top 3</div>
              <div class="stat-val" style="color: ${geoData.weakBairros.length === 0 ? '#10b981' : '#ef4444'};">${geoData.weakBairros.length} <span style="font-size: 16px; color: #94a3b8;">bairros</span></div>
              <div style="font-size: 10px; color: #cbd5e1;">Perdendo para concorrentes</div>
            </div>
          </div>

          <h2 style="font-size: 15px; color: #0284c7; text-transform: uppercase; margin: 20px 0 10px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
            1. Matriz de Ranqueamento Geográfico 3x3 (Mapa da Cidade)
          </h2>
          <div class="matrix-grid">
            ${cellsHtml}
          </div>

          <h2 style="font-size: 15px; color: #0284c7; text-transform: uppercase; margin: 24px 0 10px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
            2. Detalhamento de Posicionamento por Bairro
          </h2>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">Posição</th>
                <th>Bairro / Região</th>
                <th>Distância</th>
                <th>Status no Mapa</th>
                <th>Ação Recomendada</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <h2 style="font-size: 15px; color: #0284c7; text-transform: uppercase; margin: 24px 0 10px 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
            3. Plano de Ação Estratégico para Dominar Todos os Bairros (30 Dias)
          </h2>
          <ul style="font-size: 13px; line-height: 1.7; color: #1e293b;">
            ${geoData.strategicPlan.map(step => `<li>${step}</li>`).join('')}
          </ul>

          <div style="margin-top: 26px; background: #f0f9ff; border: 1px solid #bae6fd; padding: 14px 18px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: #0369a1; font-size: 14px;">Quer que nossa equipe coloque sua empresa no Top 3 em todos os bairros?</strong>
              <div style="font-size: 12px; color: #334155;">Entre em contato com ${agencyName} para um plano completo de SEO Local.</div>
            </div>
            <div style="font-weight: 900; font-size: 15px; color: #0284c7;">📲 WhatsApp: ${agencyPhone}</div>
          </div>
        </div>
      </body>
      </html>
    `);
    win.document.close();

    const printBtn = win.document.getElementById('livia-native-print-geogrid');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        win.focus();
        win.print();
      });
    }
  }

  // Modal de Configuração de Bairros para o Geo-Grid 3x3
  function openGeoGridNeighborhoodsModal(currentNeighborhoods, onSaveCallback) {
    const backdrop = document.createElement('div');
    backdrop.className = 'livia-modal-backdrop';

    const presets = [
      { name: 'Macatuba', list: ['Centro', 'Vila Nova', 'Jardim América', 'Bairro Alto', 'Distrito Industrial', 'Jardim Planalto', 'Jardim Sonho Meu', 'Vila Santa Rita', 'Zona Rural / Entorno'] },
      { name: 'Bauru', list: ['Centro', 'Altos da Cidade', 'Jardim Estoril', 'Vila Falcão', 'Vila Cardia', 'Mary Dota', 'Geisel', 'Bela Vista', 'Distrito Industrial'] },
      { name: 'Lençóis Paulista', list: ['Centro', 'Jardim das Nações', 'Vila Nova Irerê', 'Cecap', 'Distrito Industrial', 'Jardim Primavera', 'Caju', 'Parque Rondon', 'Jardim Cruzeiro'] },
      { name: 'Botucatu', list: ['Centro', 'Vila dos Lavradores', 'Jardim Paraíso', 'Rubião Júnior', 'Vila Sonia', 'Cohab 1', 'Bairro Alto', 'Distrito Industrial', 'Jardim Aeroporto'] },
      { name: 'Jaú', list: ['Centro', 'Jardim Pedro Ometto', 'Vila Netinho', 'Jardim Novo Horizonte', 'Distrito Industrial', 'Vila Operária', 'Jardim América', 'Chácara Braz Miraglia', 'Vila Maria'] },
      { name: 'Pederneiras', list: ['Centro', 'Michel Neme', 'Cidade Nova', 'Distrito Industrial', 'Vila Paulista', 'Jardim Marajoara', 'Maria Elena', 'Bairro Alto', 'Entorno Ferroviário'] },
      { name: '9 Quadrantes Gerais', list: ['Zona Noroeste', 'Zona Norte', 'Zona Nordeste', 'Zona Oeste', 'Centro (Sede)', 'Zona Leste', 'Zona Sudoeste', 'Zona Sul', 'Zona Sudeste'] }
    ];

    const currentList = [...(currentNeighborhoods || presets[0].list)].slice(0, 9);
    while (currentList.length < 9) {
      currentList.push(`Região ${currentList.length + 1}`);
    }

    const quadrantNames = [
      'Noroeste', 'Norte', 'Nordeste',
      'Oeste', 'Centro (Sede)', 'Leste',
      'Sudoeste', 'Sul', 'Sudeste'
    ];

    const inputsHtml = currentList.map((b, idx) => `
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <label style="font-size: 11px; font-weight: 800; color: var(--cc-text, #0f172a);">
          Ponto ${idx + 1} (${quadrantNames[idx]}):
        </label>
        <input type="text" class="livia-cc-input geogrid-bairro-input" data-idx="${idx}" value="${b}" style="font-size: 12.5px; padding: 7px 10px;">
      </div>
    `).join('');

    const presetChipsHtml = presets.map((p, idx) => `
      <button type="button" class="livia-chip-btn geogrid-preset-btn" data-preset-idx="${idx}">
        🏙️ ${p.name}
      </button>
    `).join('');

    backdrop.innerHTML = `
      <div class="livia-modal" style="width: 600px; max-width: 95vw;">
        <div class="livia-modal-header" style="border-bottom: 1px solid var(--cc-border, #e2e8f0); padding-bottom: 12px;">
          <div class="livia-modal-title" style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #0284c7 0%, #00d2ff 100%); display: flex; align-items: center; justify-content: center; font-size: 18px; color: #fff;">🗺️</div>
            <div>
              <div style="font-size: 16px; font-weight: 800; color: var(--cc-text, #0f172a);">Configurar Bairros do Geo-Grid 3x3</div>
              <div style="font-size: 11.5px; color: var(--cc-text-muted, #64748b);">Personalize as 9 regiões da sua cidade para a auditoria de ranking local</div>
            </div>
          </div>
          <button class="livia-modal-close" style="font-size: 24px; cursor: pointer; border: none; background: transparent; color: var(--cc-text-muted, #64748b);">&times;</button>
        </div>

        <div class="livia-modal-body" style="padding: 16px 0; display: flex; flex-direction: column; gap: 14px;">
          <div>
            <div style="font-size: 11px; font-weight: 800; color: var(--cc-text-muted, #64748b); margin-bottom: 6px; text-transform: uppercase;">
              Carregar Bairros Rápidos por Cidade:
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${presetChipsHtml}
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: var(--cc-surface-alt, #f8fafc); padding: 12px; border-radius: 10px; border: 1px solid var(--cc-border, #cbd5e1);">
            ${inputsHtml}
          </div>
        </div>

        <div class="livia-modal-actions" style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--cc-border, #e2e8f0); padding-top: 14px;">
          <button type="button" class="livia-btn-inline livia-btn-secondary" id="geogrid-bairros-cancel" style="padding: 8px 16px;">
            Cancelar
          </button>
          <button type="button" class="livia-btn-inline livia-btn-auto" id="geogrid-bairros-save" style="padding: 9px 20px; font-size: 13px; font-weight: 800;">
            💾 Salvar Bairros & Recalcular Grid
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    backdrop.querySelector('.livia-modal-close').onclick = close;
    backdrop.querySelector('#geogrid-bairros-cancel').onclick = close;

    backdrop.querySelectorAll('.geogrid-preset-btn').forEach(btn => {
      btn.onclick = () => {
        const pIdx = parseInt(btn.dataset.presetIdx, 10);
        const p = presets[pIdx];
        if (p) {
          const inputs = backdrop.querySelectorAll('.geogrid-bairro-input');
          p.list.forEach((bName, i) => {
            if (inputs[i]) inputs[i].value = bName;
          });
          showToast(`Bairros carregados para: ${p.name}! ✨`);
        }
      };
    });

    backdrop.querySelector('#geogrid-bairros-save').onclick = () => {
      const inputs = Array.from(backdrop.querySelectorAll('.geogrid-bairro-input'));
      const values = inputs.map(inp => inp.value.trim()).filter(Boolean);
      close();
      if (onSaveCallback) onSaveCallback(values);
    };
  }

  // Modal 8: Central GBP Check Pro (Prospecção Comercial, Espião de Concorrentes, Radar de Palavras-Chave e Kit de Avaliações)
  async function openGbpCheckProModal(initialTab = 'prospect') {
    await refreshBusinessData();
    const activeBiz = cachedBizData?.activeBusiness;
    let agencyBiz = (cachedBizData?.businesses || []).find(b => b.primaryCategory?.toLowerCase().includes('agência') || b.name.toLowerCase().includes('conectweb')) || activeBiz;
    try {
      if (window.LiviaApi && window.LiviaApi.getAgencyBranding) {
        const branding = await window.LiviaApi.getAgencyBranding();
        if (branding && branding.name) {
          agencyBiz = { ...agencyBiz, ...branding };
        }
      }
    } catch (e) {}

    const auditData = collectLiveProfileData(activeBiz);
    const audit = window.LiviaApi.auditProfileHeuristics(auditData);
    const scrapedCompetitors = scrapeCompetitorsFromPage();
    const compGap = window.LiviaApi.analyzeCompetitorsGap(auditData, scrapedCompetitors);
    const kwRadar = await window.LiviaApi.generateLocalKeywordsRadar(auditData, { business: activeBiz });
    const pitchData = window.LiviaApi.generateProspectPitch(auditData, audit, agencyBiz);
    const reviewKit = window.LiviaApi.generateReviewRequestKit(activeBiz, auditData.kpName);

    const backdrop = document.createElement('div');
    backdrop.className = 'livia-modal-backdrop';

    backdrop.innerHTML = `
      <div class="livia-modal" style="width: 780px; max-width: 95vw;">
        <div class="livia-modal-header">
          <div class="livia-modal-title">
            <span>🎯</span> Central GBP Check Pro — Prospecção, Concorrentes & SEO (${auditData.kpName || activeBiz?.name || 'Ficha Atual'})
          </div>
          <button class="livia-modal-close">&times;</button>
        </div>

        <div style="display: flex; gap: 6px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; margin-bottom: 14px; flex-wrap: wrap;">
          <button type="button" class="livia-btn-inline livia-tab-btn" data-tab="prospect" style="font-size: 12px; padding: 6px 14px;">
            💼 1. Prospecção & Scripts de Venda
          </button>
          <button type="button" class="livia-btn-inline livia-btn-secondary livia-tab-btn" data-tab="competitors" style="font-size: 12px; padding: 6px 14px;">
            🏆 2. Espião Top 3 Concorrentes
          </button>
          <button type="button" class="livia-btn-inline livia-btn-secondary livia-tab-btn" data-tab="keywords" style="font-size: 12px; padding: 6px 14px;">
            🔑 3. Radar de Palavras-Chave (${kwRadar.coverageScore}%)
          </button>
          <button type="button" class="livia-btn-inline livia-btn-secondary livia-tab-btn" data-tab="reviews" style="font-size: 12px; padding: 6px 14px;">
            ⭐ 4. Acelerador de Avaliações & QR Code
          </button>
        </div>

        <div class="livia-modal-body" id="livia-gbpcheck-content" style="max-height: 430px; overflow-y: auto; padding-right: 4px;"></div>

        <div class="livia-modal-actions" style="justify-content: space-between;">
          <div style="display: flex; gap: 8px;">
            <button type="button" class="livia-btn-inline" id="livia-gbp-pdf-btn" style="background: linear-gradient(135deg, #10b981 0%, #00d2ff 100%) !important; color: #070b14 !important;">
              📄 Gerar Laudo PDF Comercial (Para Cliente)
            </button>
            <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-gbp-onboard-btn">
              ➕ Cadastrar esta Empresa na Lívia
            </button>
          </div>
          <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-gbp-close">Fechar</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    backdrop.querySelector('.livia-modal-close').onclick = close;
    backdrop.querySelector('#livia-gbp-close').onclick = close;

    backdrop.querySelector('#livia-gbp-pdf-btn').onclick = () => {
      openPrintableAuditReport(auditData, audit, kwRadar, compGap, agencyBiz);
    };

    backdrop.querySelector('#livia-gbp-onboard-btn').onclick = () => {
      close();
      openQuickOnboardModal(auditData.kpName);
    };

    const contentBox = backdrop.querySelector('#livia-gbpcheck-content');

    function renderTab(tabName) {
      backdrop.querySelectorAll('.livia-tab-btn').forEach(b => {
        if (b.dataset.tab === tabName) {
          b.classList.remove('livia-btn-secondary');
        } else {
          b.classList.add('livia-btn-secondary');
        }
      });

      // ABA 1: PROSPECÇÃO COMERCIAL & SCRIPTS DE VENDA
      if (tabName === 'prospect') {
        const scriptsHtml = pitchData.scripts.map((s, idx) => `
          <div class="livia-faq-card" style="margin-bottom: 12px;">
            <div style="font-weight: 800; color: #00d2ff; font-size: 13px; margin-bottom: 6px;">${s.title}</div>
            <div style="font-size: 12px; color: #ccd6f6; white-space: pre-wrap; background: #0b0f19; padding: 10px; border-radius: 6px; margin-bottom: 8px;">${s.text}</div>
            <button type="button" class="livia-btn-inline" style="font-size: 11px; padding: 4px 12px;" data-copy-pitch="${idx}">
              📋 Copiar Mensagem de Abordagem
            </button>
          </div>
        `).join('');

        contentBox.innerHTML = `
          <div style="background: #151c2c; border: 1px solid rgba(0, 210, 255, 0.3); border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 11px; color: #00d2ff; font-weight: 800; text-transform: uppercase;">OPORTUNIDADE DE VENDA DETECTADA NESTA FICHA</div>
              <div style="font-size: 14px; font-weight: 700; color: #fff; margin-top: 2px;">
                ${auditData.kpName || 'Empresa na Tela'} — Saúde: <span style="color: ${audit.score >= 75 ? '#10b981' : '#ffa502'};">${audit.score}% (${audit.grade})</span>
              </div>
              <div style="font-size: 12px; color: #8892b0; margin-top: 2px;">
                ${!auditData.hasWebsite ? '🔥 Sem site próprio (Venda Site + GMN!)' : '✅ Possui site'} • ${auditData.reviewCount || 0} avaliações • Descrição: ${auditData.descriptionLength}/750 chars
              </div>
            </div>
          </div>
          ${scriptsHtml}
        `;

        contentBox.querySelectorAll('button[data-copy-pitch]').forEach(btn => {
          btn.onclick = () => {
            const item = pitchData.scripts[parseInt(btn.dataset.copyPitch, 10)];
            navigator.clipboard.writeText(item.text);
            showToast('Script comercial copiado! Envie no WhatsApp do empresário junto com o Laudo PDF! 🚀');
          };
        });
      }

      // ABA 2: ESPIÃO TOP 3 CONCORRENTES & PLANO DE ULTRAPASSAGEM
      else if (tabName === 'competitors') {
        if (!compGap.hasCompetitors || compGap.competitors.length === 0) {
          contentBox.innerHTML = `
            <div style="background: #151c2c; border-left: 4px solid #00d2ff; padding: 14px; border-radius: 8px; margin-bottom: 14px; font-size: 13px; color: #cbd5e1; line-height: 1.5;">
              ℹ️ <strong>Nenhum concorrente direto detectado nesta tela do Google.</strong><br>
              Para carregar a análise comparativa real com os líderes do mercado, pesquise no Google pelo segmento e cidade (ex: <em>"${auditData.categoryText || 'seu segmento'}${auditData.detectedCity ? ' em ' + auditData.detectedCity : ''}"</em>).
            </div>
            <div style="font-size: 12.5px; color: #94a3b8; line-height: 1.6;">
              ${compGap.actionPlan.map(step => `<p>• ${step}</p>`).join('')}
            </div>
          `;
          return;
        }

        const rowsHtml = compGap.competitors.map(c => `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
            <td style="padding: 8px; font-weight: 800; color: #00d2ff;">#${c.rank}</td>
            <td style="padding: 8px; font-weight: 700; color: #fff;">${c.name}</td>
            <td style="padding: 8px; color: #ffa502;">⭐ ${c.rating}</td>
            <td style="padding: 8px; font-weight: 700; color: #10b981;">${c.reviews} avaliações</td>
            <td style="padding: 8px;">${c.hasWebsite ? '🌐 Com Site' : '❌ Sem Site'}</td>
          </tr>
        `).join('');

        contentBox.innerHTML = `
          <div style="background: #151c2c; border-left: 4px solid #00d2ff; padding: 12px; border-radius: 8px; margin-bottom: 14px; font-size: 12.5px;">
            <strong>📊 Benchmark Competitivo (${auditData.detectedCity}):</strong> A média do Top 3 é de <strong>${compGap.avgTopReviews} avaliações</strong>.
            A ficha analisada possui <strong>${compGap.myReviews} avaliação(ões)</strong>.
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; background: #101624; border-radius: 8px; overflow: hidden; margin-bottom: 16px;">
            <thead>
              <tr style="background: #151c2c; color: #8892b0; text-align: left;">
                <th style="padding: 8px;">Posição</th>
                <th style="padding: 8px;">Concorrente / Benchmark</th>
                <th style="padding: 8px;">Nota</th>
                <th style="padding: 8px;">Volume</th>
                <th style="padding: 8px;">Website</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr style="background: rgba(0, 210, 255, 0.12); border-top: 2px solid #00d2ff;">
                <td style="padding: 8px; font-weight: 800; color: #00d2ff;">SUA FICHA</td>
                <td style="padding: 8px; font-weight: 800; color: #fff;">${compGap.myName}</td>
                <td style="padding: 8px; color: #ffa502;">⭐ ${compGap.myRating}</td>
                <td style="padding: 8px; font-weight: 800; color: #fff;">${compGap.myReviews} avaliações</td>
                <td style="padding: 8px;">${auditData.hasWebsite ? '🌐 Com Site' : '❌ Sem Site'}</td>
              </tr>
            </tbody>
          </table>

          <div style="font-size: 12px; font-weight: 800; color: #00d2ff; text-transform: uppercase; margin-bottom: 8px;">
            🚀 Plano Matemático de Ultrapassagem (30 Dias):
          </div>
          ${compGap.actionPlan.map(step => `
            <div style="background: #151c2c; padding: 8px 12px; border-radius: 6px; margin-bottom: 6px; font-size: 12.5px; color: #e2e8f0;">
              ${step}
            </div>
          `).join('')}
        `;
      }

      // ABA 3: RADAR DE PALAVRAS-CHAVE LOCAIS COM AUTO-POST EM 1 CLIQUE
      else if (tabName === 'keywords') {
        const kwHtml = kwRadar.keywords.map((k, idx) => `
          <div style="display: flex; justify-content: space-between; align-items: center; background: #151c2c; padding: 9px 12px; border-radius: 8px; margin-bottom: 8px; border-left: 4px solid ${k.present ? '#10b981' : '#ff4757'};">
            <div>
              <div style="font-weight: 700; color: #ffffff; font-size: 13px;">
                ${k.present ? '✅' : '❌'} "${k.term}"
              </div>
              <div style="font-size: 11px; color: #8892b0; margin-top: 2px;">
                ${k.intent} • Volume: ${k.volume} • ${k.present ? 'Termo já indexado na ficha' : 'Termo ausente! Crie um post ou adicione nos serviços'}
              </div>
            </div>
            <button type="button" class="livia-btn-inline" style="font-size: 11px; padding: 4px 10px; flex-shrink: 0;" data-kw-post="${idx}">
              ⚡ Auto-Postar este Termo
            </button>
          </div>
        `).join('');

        contentBox.innerHTML = `
          <p style="font-size: 12.5px; margin-bottom: 12px;">
            Estes são os termos mais lucrativos que os clientes digitam em <strong>${kwRadar.targetCity}</strong> para encontrar <strong>${kwRadar.targetCategory}</strong>. Clique em <strong>"⚡ Auto-Postar este Termo"</strong> para a Lívia criar e preencher um post focado nessa palavra-chave:
          </p>
          ${kwHtml}
        `;

        contentBox.querySelectorAll('button[data-kw-post]').forEach(btn => {
          btn.onclick = async () => {
            const kwObj = kwRadar.keywords[parseInt(btn.dataset.kwPost, 10)];
            const postIdea = `Procurando por ${kwObj.term}? Na ${activeBiz?.name || auditData.kpName}, oferecemos atendimento especializado, rapidez e garantia total em ${kwRadar.targetCity}!`;
            const post = new window.LiviaProviders.UniversalPost({ source: 'manual', text: postIdea });
            const res = await window.LiviaApi.transformPostForLocalSEO(post, { postType: 'update' });
            const banner = generatePromotionalBannerDataUrl(activeBiz);
            const seoName = window.LiviaApi.buildSeoFilename(activeBiz, kwObj.term.slice(0, 20), 'png');
            close();
            await startGoogleAutomationFlow('CREATE_POST', {
              text: res.text || postIdea,
              mediaUrl: banner,
              mediaDataUrl: banner,
              filename: seoName
            });
          };
        });
      }

      // ABA 4: ACELERADOR DE AVALIAÇÕES & PLAQUINHA QR CODE
      else if (tabName === 'reviews') {
        const scriptsHtml = reviewKit.scripts.map((s, idx) => `
          <div class="livia-faq-card" style="margin-bottom: 12px;">
            <div style="font-weight: 700; color: #00d2ff; font-size: 13px; margin-bottom: 6px;">${s.title}</div>
            <div style="font-size: 12px; color: #ccd6f6; white-space: pre-wrap; background: #0b0f19; padding: 10px; border-radius: 6px; margin-bottom: 8px;">${s.text}</div>
            <button type="button" class="livia-btn-inline" style="font-size: 11px; padding: 4px 10px;" data-copy-rev-script="${idx}">
              📋 Copiar Mensagem para Clientes
            </button>
          </div>
        `).join('');

        contentBox.innerHTML = `
          <div style="display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap;">
            <button type="button" class="livia-btn-inline" id="livia-open-google-review-link">
              🔗 Abrir Link Oficial "Solicitar Avaliações" no Painel
            </button>
            <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-print-qr-card">
              🖨️ Gerar Plaquinha QR Code de Balcão (Imprimir)
            </button>
          </div>
          ${scriptsHtml}
        `;

        contentBox.querySelector('#livia-open-google-review-link').onclick = async () => {
          close();
          await startGoogleAutomationFlow('REQUEST_REVIEWS', {});
        };

        contentBox.querySelector('#livia-print-qr-card').onclick = () => {
          openPrintableQrCard(reviewKit.businessName, reviewKit.reviewLink);
        };

        contentBox.querySelectorAll('button[data-copy-rev-script]').forEach(btn => {
          btn.onclick = () => {
            const item = reviewKit.scripts[parseInt(btn.dataset.copyRevScript, 10)];
            navigator.clipboard.writeText(item.text);
            showToast('Mensagem de solicitação de avaliação copiada! Envie para seus clientes no WhatsApp! ⭐');
          };
        });
      }
    }

    backdrop.querySelectorAll('.livia-tab-btn').forEach(btn => {
      btn.onclick = () => renderTab(btn.dataset.tab);
    });

    renderTab(initialTab);
  }

  // --- 6.5 RENDERIZADOR DO PAINEL DE OPERAÇÕES SPLIT-SCREEN (5 ABAS COMPLETAS SEM MODAIS SOBREPOSTOS) ---
  async function renderCommandCenterContent(tabId = 'auditoria') {
    const panel = document.getElementById('livia-command-center');
    if (!panel) return;

    await refreshBusinessData();
    const activeBiz = cachedBizData?.activeBusiness;
    let agencyBiz = (cachedBizData?.businesses || []).find(b => b.primaryCategory?.toLowerCase().includes('agência') || b.name.toLowerCase().includes('conectweb')) || activeBiz;
    try {
      if (window.LiviaApi && window.LiviaApi.getAgencyBranding) {
        const branding = await window.LiviaApi.getAgencyBranding();
        if (branding && branding.name) {
          agencyBiz = { ...agencyBiz, ...branding };
        }
      }
    } catch (e) {}

    const auditData = collectLiveProfileData(activeBiz);
    const audit = window.LiviaApi.auditProfileHeuristics(auditData);
    const scoreColor = audit.score >= 80 ? '#059669' : audit.score >= 55 ? '#d97706' : '#dc2626';

    // Quando o usuário está prospectando uma empresa externa na tela do Google (ex: "Notebook SoS"),
    // monta automaticamente um perfil virtual em tempo real para que o Seletor Superior e todas as 5 abas
    // trabalhem 100% em cima da empresa externa aberta na tela (sem misturar com a ConectWeb)!
    const isExternalProspect = !auditData.isManagedClient && !!(auditData.kpName && auditData.kpName.trim().length > 2);
    const cleanShortName = isExternalProspect
      ? (auditData.kpName.split('|')[0].split(' - ')[0].trim() || auditData.kpName)
      : (activeBiz?.name || 'Empresa');

    const effectiveBiz = isExternalProspect
      ? {
          id: '__live_prospect__',
          name: cleanShortName,
          fullName: auditData.kpName,
          niche: auditData.categoryText || 'Comércio e Serviços Locais',
          primaryCategory: auditData.categoryText || 'Comércio e Serviços Locais',
          secondaryKeywords: [
            (auditData.categoryText || 'serviços').toLowerCase(),
            cleanShortName.toLowerCase(),
            (auditData.detectedCity || 'região').toLowerCase()
          ],
          services: [],
          city: auditData.detectedCity || 'São Paulo',
          neighborhood: 'Centro',
          serviceAreas: `${auditData.detectedCity || 'Região'} e arredores`,
          whatsapp: (auditData.phoneText || '').replace(/\D/g, ''),
          website: auditData.websiteUrl || '',
          savedDescription: ''
        }
      : activeBiz;

    // Sincroniza o seletor superior (#livia-dock-select) para listar tanto a ficha aberta quanto todas as empresas da busca!
    const scrapedListOnScreen = scrapeCompetitorsFromPage();
    const dockSelect = panel.querySelector('#livia-dock-select');
    const addClientBtn = panel.querySelector('#livia-cc-add-client');
    if (dockSelect) {
      // Remove opções dinâmicas antigas antes de recriar
      dockSelect.querySelectorAll('option[data-dynamic-prospect="true"]').forEach(o => o.remove());

      // Insere na ordem reversa no topo do select
      const dynamicOptions = [];
      if (isExternalProspect) {
        dynamicOptions.push({
          value: '__live_prospect__',
          label: `🎯 [Prospecto Ativo] ${cleanShortName.slice(0, 28)} (${audit.score}%)`,
          selected: true
        });
      }

      scrapedListOnScreen.forEach((item, idx) => {
        if (isExternalProspect && item.name.toLowerCase() === (auditData.kpName || '').toLowerCase()) return;
        dynamicOptions.push({
          value: `__prospect_idx_${idx}`,
          label: `🔎 [Na Busca #${idx + 1}] ${item.name.slice(0, 25)} (★${item.rating} • ${item.reviews})`,
          selected: false
        });
      });

      for (let i = dynamicOptions.length - 1; i >= 0; i--) {
        const optData = dynamicOptions[i];
        const opt = document.createElement('option');
        opt.value = optData.value;
        opt.innerText = optData.label;
        opt.dataset.dynamicProspect = 'true';
        if (optData.selected) opt.selected = true;
        dockSelect.insertBefore(opt, dockSelect.firstChild);
      }

      const badgeMode = panel.querySelector('#livia-cc-badge-mode');
      if (badgeMode) {
        if (isExternalProspect) {
          badgeMode.className = 'livia-badge-prospect';
          badgeMode.innerText = '🎯 Prospecto na Tela';
        } else {
          badgeMode.className = 'livia-badge-client';
          badgeMode.innerText = '🏢 Cliente Ativo';
        }
      }

      const mapsDirectLink = panel.querySelector('#livia-cc-open-maps-direct');
      if (mapsDirectLink) {
        const queryTarget = (auditData.kpName || effectiveBiz?.name || '') + ' ' + (auditData.detectedCity || effectiveBiz?.city || '');
        mapsDirectLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryTarget.trim())}`;
      }

      if (isExternalProspect) {
        dockSelect.value = '__live_prospect__';
        if (addClientBtn) {
          addClientBtn.innerHTML = '<span>📥</span> Salvar da Tela';
          addClientBtn.title = `Cadastrar "${cleanShortName}" na sua carteira de clientes da Lívia`;
        }
      } else {
        if (activeBiz && dockSelect.value !== activeBiz.id) {
          dockSelect.value = activeBiz.id;
        }
        if (addClientBtn) {
          addClientBtn.innerHTML = '<span>📥</span> Importar da Tela';
        }
      }
    }

    // Atualiza a barra de Saúde Ao Vivo no topo do painel
    const strip = panel.querySelector('#livia-cc-live-score-strip');
    if (strip) {
      const failCount = audit.checks.filter(c => c.status === 'fail' || c.status === 'warn').length;
      strip.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; overflow: hidden;">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: ${scoreColor}; box-shadow: 0 0 8px ${scoreColor}; flex-shrink: 0;"></div>
          <div style="overflow: hidden;">
            <div style="color: var(--cc-text); font-weight: 800; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${auditData.kpName || effectiveBiz?.name || 'Empresa'}
            </div>
            <div style="font-size: 10px; color: var(--cc-text-muted); font-weight: 600;">
              ${failCount === 0 ? '✅ 100% Otimizada no Google' : `⚠️ ${failCount} pontos para otimizar`}
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
          <div style="text-align: right; margin-right: 2px;">
            <div style="font-weight: 900; font-size: 14px; color: ${scoreColor}; line-height: 1;">${audit.score}%</div>
            <div style="font-size: 9px; color: var(--cc-text-muted); font-weight: 800; letter-spacing: 0.5px;">SAÚDE</div>
          </div>
          <button type="button" class="livia-btn-action-primary" id="livia-strip-pdf-btn" style="padding: 5px 9px; font-size: 10.5px;" title="Baixar Laudo Oficial em PDF com marca da agência">
            📄 PDF
          </button>
        </div>
      `;
      strip.querySelector('#livia-strip-pdf-btn').onclick = async () => {
        const kwRadar = await window.LiviaApi.generateLocalKeywordsRadar(auditData, { business: effectiveBiz });
        const compGap = window.LiviaApi.analyzeCompetitorsGap(auditData, scrapeCompetitorsFromPage());
        openPrintableAuditReport(auditData, audit, kwRadar, compGap, agencyBiz);
      };
    }

    // Destaca a aba ativa
    panel.querySelectorAll('.livia-cc-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.ccTab === tabId);
    });

    const body = panel.querySelector('#livia-cc-body-content');
    if (!body) return;

    // ABA 1: AUDITORIA REAL-TIME & PLANO ESTRATÉGICO TOP 1 (ALGORITMO DO GOOGLE)
    if (tabId === 'auditoria') {
      let provReport = { fields: [], reliability: 0, suspiciousCount: 0, context: {} };
      try {
        provReport = buildDataProvenanceReport(auditData);
      } catch (err) {
        console.warn('[Lívia] Falha ao montar relatório de confiabilidade:', err);
      }
      const firstPending = audit.checks.find(c => (c.status === 'fail' || c.status === 'warn') && c.fixAction);

      // Gera o Plano de Ação Estruturado nos 3 Níveis do Algoritmo do Google
      const top1Plan = window.LiviaApi.generateTop1ActionPlan(auditData, audit, { business: effectiveBiz });

      const tiersHtml = (top1Plan.tiers || []).map(tier => {
        const tierClass = tier.id === 'critical' ? 'tier-critical' : tier.id === 'growth' ? 'tier-growth' : 'tier-domination';
        const pendingInTier = tier.items.filter(item => item.status !== 'pass').length;
        const badgeText = pendingInTier === 0 ? '✅ 100% Conforme' : `⚠️ ${pendingInTier} ação(ões) pendente(s)`;
        const badgeColor = pendingInTier === 0 ? 'var(--cc-emerald, #059669)' : tier.id === 'critical' ? '#ef4444' : '#f59e0b';

        const itemsHtml = tier.items.map(item => `
          <div class="livia-plan-item">
            <div class="livia-plan-item-header">
              <div style="display: flex; align-items: flex-start; gap: 7px;">
                <span style="font-size: 13px; flex-shrink: 0; margin-top: 1px;">
                  ${item.status === 'pass' ? '✅' : item.status === 'warn' ? '⚠️' : '❌'}
                </span>
                <div>
                  <div class="livia-plan-item-title">${item.title}</div>
                  <div class="livia-plan-action-text"><strong>🎯 O que fazer:</strong> ${item.action}</div>
                </div>
              </div>
              ${item.fixAction ? `
                <button type="button" class="livia-btn-inline ${item.status === 'pass' ? 'livia-btn-secondary' : 'livia-btn-auto'}" data-cc-plan-action="${item.fixAction}" style="padding: 4px 9px; font-size: 11px; white-space: nowrap; flex-shrink: 0;">
                  ${item.fixLabel || '⚡ Resolver'}
                </button>
              ` : ''}
            </div>
            <div class="livia-plan-why-box">
              <strong style="color: #6366f1;">🧠 Visão do Algoritmo:</strong> ${item.whyGoogle}
            </div>
          </div>
        `).join('');

        return `
          <div class="livia-plan-tier-card ${tierClass}">
            <div class="livia-plan-tier-header">
              <div>
                <div class="livia-plan-tier-title">${tier.name}</div>
                <div class="livia-plan-tier-sub">${tier.sub}</div>
              </div>
              <span style="font-size: 10px; font-weight: 800; color: ${badgeColor}; background: var(--cc-surface); padding: 3px 8px; border-radius: 6px; border: 1px solid var(--cc-border); white-space: nowrap;">
                ${badgeText}
              </span>
            </div>
            <div>${itemsHtml}</div>
          </div>
        `;
      }).join('');

      const checksHtml = audit.checks.map((c, idx) => `
        <div class="livia-cc-audit-item ${c.status}">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
            <div style="font-weight: 700; font-size: 12.5px; color: var(--cc-text); line-height: 1.35;">
              ${c.status === 'pass' ? '✅' : c.status === 'warn' ? '⚠️' : '❌'} ${c.label}
            </div>
            ${c.fixAction ? `
              <button type="button" class="livia-btn-inline ${c.status === 'pass' ? 'livia-btn-secondary' : 'livia-btn-auto'}" data-cc-fix-idx="${idx}" style="padding: 4px 9px; font-size: 11px; white-space: nowrap; flex-shrink: 0;">
                ${c.fixLabel ? c.fixLabel.replace('⚡ Resolver Agora: ', '⚡ ') : '⚡ Resolver'}
              </button>
            ` : ''}
          </div>
          ${c.detail ? `<div style="font-size: 11.5px; color: var(--cc-text-secondary); margin-top: 5px; line-height: 1.4;">${c.detail}</div>` : ''}
        </div>
      `).join('');

      body.innerHTML = `
        <div class="livia-cc-card" style="border-top: 4px solid ${scoreColor};">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 10.5px; font-weight: 800; color: var(--cc-text-muted); text-transform: uppercase;">
                ${isExternalProspect ? '🎯 AUDITORIA DE PROSPECÇÃO EXTERNA' : 'SAÚDE REAL DA FICHA NO GOOGLE'}
              </div>
              <div style="display: flex; align-items: center; gap: 8px; margin-top: 3px; flex-wrap: wrap;">
                <span style="font-size: 16px; font-weight: 900; color: var(--cc-text);">${audit.grade}</span>
                <span style="font-size: 11px; font-weight: 800; background: rgba(99, 102, 241, 0.12); color: #6366f1; padding: 2px 7px; border-radius: 6px; border: 1px solid rgba(99, 102, 241, 0.3);">
                  ${top1Plan.estimatedRanking}
                </span>
              </div>
              <div style="font-size: 11.5px; color: var(--cc-text-secondary); margin-top: 4px;">
                Avaliações: <strong>${auditData.reviewCount || 0}</strong> • Categoria: <strong>${auditData.categoryText || 'Não detectada'}</strong>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 34px; font-weight: 900; color: ${scoreColor}; line-height: 1;">${audit.score}%</div>
              <div style="font-size: 9px; font-weight: 800; color: var(--cc-text-muted); margin-top: 2px;">ÍNDICE DO GOOGLE</div>
            </div>
          </div>

          <div style="margin-top: 10px; padding: 8px 10px; border-radius: 6px; background: var(--cc-surface-alt); border: 1px solid var(--cc-border); font-size: 11px; color: var(--cc-text-secondary); line-height: 1.4;">
            🤖 <strong>Como o Google decide quem fica no Top 1:</strong> O Local Pack avalia <em>Relevância Semântica (60%)</em>, <em>Proeminência & Freshness (25%)</em> e <em>Proximidade Física (15%)</em>. Siga o roteiro em 3 níveis abaixo para assumir as primeiras posições.
          </div>

          <div style="display: flex; gap: 6px; margin-top: 12px; flex-wrap: wrap;">
            ${isExternalProspect ? `
              <button type="button" class="livia-btn-inline livia-btn-auto" id="livia-cc-prospect-pdf-btn" style="flex: 1; padding: 8px 12px;">
                📥 Baixar Laudo PDF p/ Prospectar
              </button>
            ` : (firstPending ? `
              <button type="button" class="livia-btn-inline livia-btn-auto" id="livia-cc-fix-main" style="flex: 1; padding: 8px 12px;">
                ⚡ Resolver Principal Pendência Sozinha
              </button>
            ` : '')}
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((auditData.kpName || effectiveBiz?.name || '') + ' ' + (auditData.detectedCity || ''))}" target="_blank" class="livia-btn-inline livia-btn-secondary" style="padding: 8px 10px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;" title="Abrir a ficha oficial desta empresa no Google Maps em nova aba para conferir visualmente todos os dados">
              🗺️ Ver no Maps
            </a>
            <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-cc-copy-whatsapp" style="padding: 8px 10px;" title="Copiar plano estratégico de ranqueamento para o WhatsApp">
              📋 Copiar WhatsApp
            </button>
          </div>
        </div>

        <div class="livia-plan-container">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 0 2px;">
            <span style="font-size: 12.5px; font-weight: 800; color: var(--cc-text); text-transform: uppercase; letter-spacing: 0.3px;">
              🎯 Roteiro Algorítmico para o Top 1
            </span>
            <span style="font-size: 10.5px; color: var(--cc-text-muted);">
              3 Níveis de Ação
            </span>
          </div>
          ${tiersHtml}
        </div>

        <details class="livia-cc-card" style="margin-top: 10px; cursor: pointer;">
          <summary style="font-size: 12px; font-weight: 700; color: var(--cc-text); outline: none;">
            🔬 Ver Raio-X Técnico dos 8 Pilares do Perfil (${audit.score}%)
          </summary>
          <div style="margin-top: 10px;">${checksHtml}</div>
        </details>

        ${renderProvenanceCardHtml(provReport)}
      `;

      const exportDiagBtn = body.querySelector('#livia-cc-export-diag');
      if (exportDiagBtn) exportDiagBtn.onclick = () => exportLiveDiagnosticFile(auditData, audit, provReport);
      const copyDiagBtn = body.querySelector('#livia-cc-copy-diag');
      if (copyDiagBtn) {
        copyDiagBtn.onclick = async () => {
          await navigator.clipboard.writeText(buildDiagnosticSummaryText(auditData, audit, provReport));
          showToast('📋 Resumo do teste copiado! Cole aqui no chat para análise.');
        };
      }

      body.querySelectorAll('button[data-cc-fix-idx]').forEach(btn => {
        btn.onclick = () => {
          const check = audit.checks[parseInt(btn.dataset.ccFixIdx, 10)];
          if (check && check.fixAction) {
            executeAuditFixAction(check.fixAction, auditData, effectiveBiz, null);
          }
        };
      });

      body.querySelectorAll('button[data-cc-plan-action]').forEach(btn => {
        btn.onclick = () => {
          const action = btn.dataset.ccPlanAction;
          if (action) {
            executeAuditFixAction(action, auditData, effectiveBiz, null);
          }
        };
      });

      const fixMain = body.querySelector('#livia-cc-fix-main');
      if (fixMain && firstPending) {
        fixMain.onclick = () => executeAuditFixAction(firstPending.fixAction, auditData, effectiveBiz, null);
      }

      const prospectPdfBtn = body.querySelector('#livia-cc-prospect-pdf-btn');
      if (prospectPdfBtn) {
        prospectPdfBtn.onclick = async () => {
          const kwRadar = await window.LiviaApi.generateLocalKeywordsRadar(auditData, { business: effectiveBiz });
          const compGap = window.LiviaApi.analyzeCompetitorsGap(auditData, scrapeCompetitorsFromPage());
          openPrintableAuditReport(auditData, audit, kwRadar, compGap, agencyBiz);
        };
      }

      body.querySelector('#livia-cc-copy-whatsapp').onclick = async () => {
        const lines = [
          `📊 *DIAGNÓSTICO ALGORÍTMICO GOOGLE LOCAL — ${(auditData.kpName || 'EMPRESA').toUpperCase()}*`,
          `🎯 *Índice de Força Atual:* ${audit.score}% (${audit.grade})`,
          `🏆 *Potencial Detectado:* ${top1Plan.estimatedRanking}`,
          ``,
          `🤖 *COMO O GOOGLE RANQUEIA NO LOCAL PACK (3 PILARES):*`,
          `• Relevância Semântica (60%): Categorias, Descrição 750 chars, Serviços`,
          `• Proeminência & Freshness (25%): Ritmo de Avaliações & Posts Ativos`,
          `• Proximidade Física (15%): Endereço e Horários "Aberto Agora"`,
          ``,
          `🚀 *PLANO DE AÇÃO ESTRUTURADO PARA O TOP 1:*`,
          ...top1Plan.tiers.map(t => [
            `\n*${t.name}*`,
            `_${t.sub}_`,
            ...t.items.map(item => `  ${item.status === 'pass' ? '✅' : item.status === 'warn' ? '⚠️' : '❌'} *${item.title}*\n     ↳ 🎯 ${item.action}\n     ↳ 🧠 _Por que o Google exige:_ ${item.whyGoogle}`)
          ].join('\n')),
          ``,
          `📈 _Relatório de Engenharia Reversa gerado por Lívia Copilot Pro (ConectWeb)_`
        ];
        await navigator.clipboard.writeText(lines.join('\n'));
        showToast('Plano de Ação para o Top 1 copiado para o WhatsApp! 📋🚀');
      };
    }

    // ABA 2: PUBLICAR & IA (POST + INSTAGRAM + BANNER HD + CALENDÁRIO SEMANAL)
    else if (tabId === 'publicar') {
      const planRes = await window.LiviaApi.generateWeeklyContentPlan({ business: effectiveBiz });
      const weeklyPosts = planRes.posts || [];

      const weeklyHtml = weeklyPosts.map((p, idx) => `
        <div class="livia-cc-card" style="margin-top: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="font-size: 12px; color: var(--cc-accent);">📅 ${p.day} — ${p.type}</strong>
            <button type="button" class="livia-btn-inline livia-btn-auto" data-cc-weekly-auto="${idx}" style="padding: 4px 10px; font-size: 11px;">
              ⚡ Auto-Publicar
            </button>
          </div>
          <div style="font-size: 11.5px; color: var(--cc-text-secondary); white-space: pre-wrap; background: var(--cc-surface-alt); padding: 8px; border-radius: 6px; border: 1px solid var(--cc-border); max-height: 110px; overflow-y: auto;">${p.caption}</div>
        </div>
      `).join('');

      body.innerHTML = `
        <div class="livia-cc-card">
          <div class="livia-cc-card-title">
            <span>📝 Publicação Automática (${effectiveBiz.name.slice(0, 22)})</span>
            <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-cc-gen-post-text" style="padding: 4px 9px; font-size: 11px;">
              ✨ Gerar Legenda IA
            </button>
          </div>

          <div id="livia-cc-media-slot"></div>

          <div style="display: flex; gap: 4px; margin-bottom: 8px; flex-wrap: wrap;">
            <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-cc-pull-social" style="flex: 1.2; font-size: 11px; padding: 6px;" title="Importar o post capturado do Instagram, Facebook ou TikTok">
              📥 Puxar das Redes (Insta/Face/TikTok)
            </button>
            <input type="file" id="livia-cc-file-picker" accept="image/*,video/*" style="display: none;">
            <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-cc-pick-pc" style="flex: 1; font-size: 11px; padding: 6px;">
              💻 Foto/Vídeo PC
            </button>
            <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-cc-gen-banner" style="flex: 1; font-size: 11px; padding: 6px;">
              🎨 Arte HD 1080p
            </button>
          </div>

          <textarea id="livia-cc-post-textarea" class="livia-cc-textarea" style="min-height: 115px; margin-bottom: 8px;" placeholder="Digite um tema, puxe das redes sociais (Instagram, Facebook ou TikTok) ou clique em '✨ Gerar Legenda IA'..."></textarea>

          <div style="display: flex; gap: 6px;">
            <button type="button" class="livia-btn-inline livia-btn-auto" id="livia-cc-autopost-btn" style="flex: 1; padding: 9px 12px;">
              ⚡ Publicar no Google Sozinha (Texto + Foto)
            </button>
            <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-cc-copy-post-btn" style="padding: 9px 12px;">
              📋
            </button>
          </div>
        </div>

        <div>
          <div style="font-size: 11.5px; font-weight: 800; color: var(--cc-text-muted); text-transform: uppercase; margin: 4px 0;">
            📅 Plano Semanal Pronto (3 Posts da Semana)
          </div>
          ${weeklyHtml}
        </div>
      `;

      const postTa = body.querySelector('#livia-cc-post-textarea');
      const mediaSlot = body.querySelector('#livia-cc-media-slot');
      let activeMedia = null;

      chrome.storage.local.get(['lastTransformedPost'], (res) => {
        const saved = res.lastTransformedPost;
        if (saved && saved.text) postTa.value = saved.text;
        if (saved && (saved.mediaDataUrl || (saved.mediaUrls && saved.mediaUrls[0]))) {
          activeMedia = saved;
          renderImportedMediaCard(body, mediaSlot, saved);
        }
      });

      const pullSocialBtn = body.querySelector('#livia-cc-pull-social');
      if (pullSocialBtn) {
        pullSocialBtn.onclick = () => {
          chrome.storage.local.get(['lastTransformedPost'], (res) => {
            const saved = res.lastTransformedPost;
            if (saved && saved.text) {
              postTa.value = saved.text;
              if (saved.mediaDataUrl || (saved.mediaUrls && saved.mediaUrls[0])) {
                activeMedia = saved;
                renderImportedMediaCard(body, mediaSlot, saved);
              }
              const sourceName = saved.source === 'tiktok' ? 'TikTok' : saved.source === 'facebook' ? 'Facebook' : 'Instagram';
              showToast(`Post e mídia importados do ${sourceName}! ✨`);
            } else {
              showToast('Nenhum post capturado ainda. Abra o Instagram, Facebook ou TikTok e clique no botão Lívia!');
            }
          });
        };
      }

      const fileInput = body.querySelector('#livia-cc-file-picker');
      body.querySelector('#livia-cc-pick-pc').onclick = () => fileInput.click();
      fileInput.onchange = (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const isVid = f.type.startsWith('video/');
        const ext = f.name.split('.').pop() || (isVid ? 'mp4' : 'jpg');
        const seoName = window.LiviaApi.buildSeoFilename(effectiveBiz, 'post-local', ext);
        const reader = new FileReader();
        reader.onload = () => {
          activeMedia = {
            text: postTa.value,
            mediaUrls: [reader.result],
            mediaDataUrl: reader.result,
            mediaType: isVid ? 'VIDEO' : 'IMAGE',
            mainMediaFilename: seoName,
            timestamp: Date.now()
          };
          chrome.storage.local.set({ lastTransformedPost: activeMedia });
          renderImportedMediaCard(body, mediaSlot, activeMedia);
          showToast(`✅ Arquivo renomeado com SEO: "${seoName}"`);
        };
        reader.readAsDataURL(f);
      };

      body.querySelector('#livia-cc-gen-banner').onclick = () => {
        const bannerUrl = generatePromotionalBannerDataUrl(effectiveBiz);
        const seoName = window.LiviaApi.buildSeoFilename(effectiveBiz, 'arte-hd', 'png');
        activeMedia = {
          text: postTa.value,
          mediaUrls: [bannerUrl],
          mediaDataUrl: bannerUrl,
          mediaType: 'IMAGE',
          mainMediaFilename: seoName,
          timestamp: Date.now()
        };
        chrome.storage.local.set({ lastTransformedPost: activeMedia });
        renderImportedMediaCard(body, mediaSlot, activeMedia);
        showToast('🎨 Arte HD 1080x1080 gerada com sucesso!');
      };

      body.querySelector('#livia-cc-gen-post-text').onclick = () => {
        if (weeklyPosts.length > 0) {
          const pick = weeklyPosts[Math.floor(Math.random() * weeklyPosts.length)];
          postTa.value = pick.caption;
          showToast('✨ Legenda SEO gerada!');
        }
      };

      body.querySelector('#livia-cc-copy-post-btn').onclick = async () => {
        await navigator.clipboard.writeText(postTa.value || '');
        showToast('Texto do post copiado! 📋');
      };

      body.querySelector('#livia-cc-autopost-btn').onclick = async () => {
        let finalText = (postTa.value || '').trim();
        if (!finalText && weeklyPosts[0]) finalText = weeklyPosts[0].caption;
        if (!activeMedia) {
          const bannerUrl = generatePromotionalBannerDataUrl(effectiveBiz);
          activeMedia = {
            mediaUrls: [bannerUrl],
            mediaDataUrl: bannerUrl,
            mainMediaFilename: window.LiviaApi.buildSeoFilename(effectiveBiz, 'destaque', 'png')
          };
        }
        await startGoogleAutomationFlow('CREATE_POST', {
          text: finalText,
          mediaUrl: (activeMedia.mediaUrls && activeMedia.mediaUrls[0]) || activeMedia.mediaDataUrl,
          mediaDataUrl: activeMedia.mediaDataUrl,
          filename: activeMedia.mainMediaFilename
        });
      };

      body.querySelectorAll('button[data-cc-weekly-auto]').forEach(btn => {
        btn.onclick = async () => {
          const item = weeklyPosts[parseInt(btn.dataset.ccWeeklyAuto, 10)];
          const bannerUrl = generatePromotionalBannerDataUrl(effectiveBiz, item.title);
          const seoName = window.LiviaApi.buildSeoFilename(effectiveBiz, item.day.toLowerCase(), 'png');
          await startGoogleAutomationFlow('CREATE_POST', {
            text: item.caption,
            mediaUrl: bannerUrl,
            mediaDataUrl: bannerUrl,
            filename: seoName
          });
        };
      });
    }

    // ABA 3: OTIMIZAR FICHA (DESCRIÇÃO 750 CHARS + CATEGORIAS + SERVIÇOS + Q&A)
    else if (tabId === 'otimizar') {
      let desc = (!isExternalProspect && effectiveBiz && effectiveBiz.savedDescription) ? effectiveBiz.savedDescription : '';
      if (!desc) {
        const dRes = await window.LiviaApi.generateBusinessDescription({ business: effectiveBiz });
        desc = dRes.description || '';
      }
      const catRes = await window.LiviaApi.suggestGoogleCategories({ business: effectiveBiz });
      const srvRes = await window.LiviaApi.generateServicesCatalog({ business: effectiveBiz });

      const catsHtml = [catRes.primaryCategory, ...(catRes.secondaryCategories || [])].map((cat, idx) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: var(--cc-surface-alt); border: 1px solid var(--cc-border); border-radius: 6px; margin-bottom: 5px;">
          <span style="font-size: 12px; font-weight: ${idx === 0 ? '800' : '600'}; color: var(--cc-text);">
            ${idx === 0 ? '👑 ' : '🏷️ '}${cat}
          </span>
          <button type="button" class="livia-btn-inline livia-btn-auto" data-cc-cat="${cat}" style="padding: 3px 8px; font-size: 10.5px;">
            ⚡ Auto-Inserir
          </button>
        </div>
      `).join('');

      const srvsHtml = (srvRes.services || []).slice(0, 5).map((s, idx) => `
        <div style="padding: 8px; background: var(--cc-surface-alt); border: 1px solid var(--cc-border); border-radius: 6px; margin-bottom: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="font-size: 12px; color: var(--cc-text);">${s.title}</strong>
            <button type="button" class="livia-btn-inline livia-btn-secondary" data-cc-srv="${idx}" style="padding: 2px 8px; font-size: 10.5px;">
              📋 Copiar
            </button>
          </div>
          <div style="font-size: 11px; color: var(--cc-text-secondary); margin-top: 3px;">${s.description}</div>
        </div>
      `).join('');

      body.innerHTML = `
        <div class="livia-cc-card">
          <div class="livia-cc-card-title">
            <span>✍️ Descrição SEO — ${effectiveBiz.name.slice(0, 22)}</span>
            <span class="livia-char-counter good" id="livia-cc-desc-count">${desc.length}/750</span>
          </div>
          <textarea id="livia-cc-desc-ta" class="livia-cc-textarea" style="min-height: 125px; margin-bottom: 8px;">${desc}</textarea>
          <div style="display: flex; gap: 6px;">
            <button type="button" class="livia-btn-inline livia-btn-auto" id="livia-cc-autofill-desc" style="flex: 1; padding: 8px;">
              ⚡ Auto-Preencher / Copiar
            </button>
            <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-cc-regen-desc" style="padding: 8px;">
              🔄 Regerar
            </button>
          </div>
        </div>

        <div class="livia-cc-card">
          <div class="livia-cc-card-title">
            <span>🏷️ Categorias Oficiais do Google Maps</span>
          </div>
          ${catsHtml}
        </div>

        <div class="livia-cc-card">
          <div class="livia-cc-card-title">
            <span>🛠️ Catálogo de Serviços com SEO</span>
          </div>
          ${srvsHtml}
        </div>
      `;

      const descTa = body.querySelector('#livia-cc-desc-ta');
      const descCount = body.querySelector('#livia-cc-desc-count');
      descTa.oninput = () => {
        descCount.innerText = `${descTa.value.length}/750`;
      };

      body.querySelector('#livia-cc-regen-desc').onclick = async () => {
        const r = await window.LiviaApi.generateBusinessDescription({ business: effectiveBiz });
        if (r && r.description) {
          descTa.value = r.description;
          descCount.innerText = `${r.description.length}/750`;
          showToast(`Nova descrição gerada para ${effectiveBiz.name}! ✨`);
        }
      };

      body.querySelector('#livia-cc-autofill-desc').onclick = async () => {
        const val = descTa.value.trim();
        if (!isExternalProspect && activeBiz && val.length > 30) {
          activeBiz.savedDescription = val;
          await window.LiviaApi.saveBusiness(activeBiz);
        }
        await startGoogleAutomationFlow('FILL_DESCRIPTION', { text: val });
      };

      body.querySelectorAll('button[data-cc-cat]').forEach(btn => {
        btn.onclick = () => startGoogleAutomationFlow('FILL_CATEGORY', { categoryName: btn.dataset.ccCat });
      });

      body.querySelectorAll('button[data-cc-srv]').forEach(btn => {
        btn.onclick = () => {
          const s = srvRes.services[parseInt(btn.dataset.ccSrv, 10)];
          navigator.clipboard.writeText(`${s.title}\n${s.description}`);
          showToast(`Serviço "${s.title}" copiado! 📋`);
        };
      });
    }

    // ABA 4: PROSPECÇÃO & GBP CHECK (EMPRESAS DA PÁGINA + CONCORRENTES + PALAVRAS-CHAVE + PITCH DE VENDAS)
    // ABA 4: PROSPECÇÃO TURBO & RADAR DE LEADS (GOOGLE PLACES API + EMPRESAS DA PÁGINA + CONCORRENTES + PALAVRAS-CHAVE + PITCH DE VENDAS)
    else if (tabId === 'prospeccao') {
      const placesApiKey = await window.LiviaApi.getGooglePlacesApiKey();
      const kwRadar = await window.LiviaApi.generateLocalKeywordsRadar(auditData, { business: effectiveBiz });
      const compGap = window.LiviaApi.analyzeCompetitorsGap(auditData, scrapedListOnScreen);
      const pitchData = window.LiviaApi.generateProspectPitch(auditData, audit, agencyBiz);

      // 1. Leads obtidos via Google Places API (Modo Turbo)
      let apiLeadsHtml = '';
      if (isSearchingApi) {
        apiLeadsHtml = `
          <div class="livia-pulse-loader">
            <span>📡</span>
            <span>Consultando satélites do Google Places API em tempo real... extraindo empresas, notas e categorias secretas...</span>
          </div>
        `;
      } else if (lastApiProspects.length > 0) {
        apiLeadsHtml = `
          <div class="livia-cc-card" style="border: 1px solid rgba(16, 185, 129, 0.4); background: linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, var(--cc-surface) 100%);">
            <div class="livia-cc-card-title" style="display: flex; justify-content: space-between; align-items: center;">
              <span>⚡ Leads Turbo — Google Places API (${lastApiProspects.length})</span>
              <div style="display: flex; gap: 5px;">
                <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-export-api-leads-csv" style="padding: 2px 7px; font-size: 10px;" title="Exportar tabela completa com telefones e categorias ocultas para Excel">
                  📊 Exportar Excel
                </button>
                <button type="button" class="livia-btn-inline" id="livia-clear-api-leads" style="padding: 2px 6px; font-size: 10px;" title="Limpar resultados">
                  ✕
                </button>
              </div>
            </div>
            <p style="font-size: 10.5px; color: var(--cc-text-secondary); margin: 0 0 8px 0;">
              Categorias secundárias reveladas e telefones prontos para abordagem comercial:
            </p>
            <div style="max-height: 380px; overflow-y: auto; padding-right: 3px;">
              ${lastApiProspects.map((lead, idx) => {
                const isSelected = (selectedProspectOverride && selectedProspectOverride.name === lead.name) ||
                                   (auditData.kpName || '').toLowerCase() === lead.name.toLowerCase();
                const hasHidden = lead.hiddenCategories && lead.hiddenCategories.length > 0;
                return `
                  <div class="livia-api-lead-card" style="border-left: 3px solid ${isSelected ? 'var(--cc-accent)' : (lead.reviews < 10 ? '#ef4444' : '#10b981')}; margin-bottom: 6px; padding: 7px 9px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 6px;">
                      <div style="overflow: hidden; flex: 1;">
                        <div style="font-size: 11.5px; font-weight: 800; color: var(--cc-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          ${isSelected ? '🎯 ' : `#${lead.rank} `}${lead.name}
                        </div>
                        <div style="font-size: 10.5px; margin-top: 2px; display: flex; align-items: center; gap: 4px;">
                          <span style="font-weight: 700; color: ${lead.rating >= 4.5 ? 'var(--cc-emerald)' : 'var(--cc-accent)'};">⭐ ${lead.rating || 'N/A'}</span>
                          <span style="color: var(--cc-text-secondary);">(${lead.reviews} aval.)</span>
                          ${lead.reviews < 10 ? `<span class="livia-lead-tag livia-lead-tag-alert" title="Ficha fraca em avaliações: cliente fácil de fechar!">Alvo Fácil!</span>` : ''}
                        </div>
                        <div style="font-size: 10px; margin-top: 3px; display: flex; flex-wrap: wrap; gap: 3px; align-items: center;">
                          <span class="livia-lead-tag livia-lead-tag-primary">🏷️ ${lead.primaryCategory}</span>
                          ${hasHidden ? lead.hiddenCategories.slice(0, 2).map(hc => `
                            <span class="livia-lead-tag livia-lead-tag-hidden" title="Categoria secundária secreta detectada pela Google Places API!">👁️ ${hc}</span>
                          `).join('') : ''}
                        </div>
                        <div style="font-size: 9.5px; color: var(--cc-text-muted); margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          📍 ${lead.address}
                        </div>
                        ${lead.phone ? `
                          <div style="font-size: 10.5px; color: var(--cc-emerald); font-weight: 700; margin-top: 3px; display: flex; align-items: center; gap: 6px;">
                            <span>📞 ${lead.phone}</span>
                            ${lead.website ? `<a href="${lead.website}" target="_blank" style="color: #00d2ff; text-decoration: underline; font-size: 9.5px;">🌐 Site</a>` : ''}
                          </div>
                        ` : ''}
                      </div>
                    </div>
                    <div style="display: flex; gap: 4px; margin-top: 6px;">
                      <button type="button" class="livia-btn-inline ${isSelected ? 'livia-btn-secondary' : 'livia-btn-auto'}" data-cc-analyze-api-lead="${idx}" style="flex: 1; padding: 4px 6px; font-size: 10.5px;">
                        ${isSelected ? '✅ Ativa' : '🎯 Analisar'}
                      </button>
                      <button type="button" class="livia-btn-inline" data-cc-phone-api-lead="${idx}" style="padding: 4px 7px; font-size: 10px;" title="Buscar telefone oficial e website no Google Places API">
                        ${lead.phone ? '📞 Atualizado' : '📞 Buscar Tel'}
                      </button>
                      <button type="button" class="livia-btn-inline livia-btn-secondary" data-cc-pitch-api-lead="${idx}" style="padding: 4px 7px; font-size: 10px;" title="Gerar proposta comercial e script de vendas WhatsApp">
                        💬 Pitch
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }

      // 2. Empresas na busca da tela atual do Google (Modo Gratuito)
      const pageProspectsHtml = scrapedListOnScreen.length > 0
        ? scrapedListOnScreen.slice(0, 8).map((item, idx) => {
            const isSelected = (auditData.kpName || '').toLowerCase() === item.name.toLowerCase();
            return `
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; padding: 6px 8px; background: ${isSelected ? 'var(--cc-accent-soft)' : 'var(--cc-surface-alt)'}; border: 1px solid ${isSelected ? 'var(--cc-accent)' : 'var(--cc-border)'}; border-radius: 6px; margin-bottom: 5px;">
                <div style="overflow: hidden;">
                  <div style="font-size: 11.5px; font-weight: 800; color: var(--cc-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${isSelected ? '🎯 ' : `#${idx + 1} `}${item.name}
                  </div>
                  <div style="font-size: 10.5px; color: var(--cc-text-secondary);">
                    ⭐ ${item.rating} (${item.reviews} aval.) ${item.category ? `• ${item.category}` : ''}
                  </div>
                </div>
                <button type="button" class="livia-btn-inline ${isSelected ? 'livia-btn-secondary' : 'livia-btn-auto'}" data-cc-select-prospect="${idx}" style="padding: 4px 8px; font-size: 10.5px; flex-shrink: 0;">
                  ${isSelected ? '✅ Ativa' : '🎯 Analisar'}
                </button>
              </div>
            `;
          }).join('')
        : `<div style="font-size: 11.5px; color: var(--cc-text-secondary);">Nenhuma empresa detectada nesta tela. Use a busca acima para buscar leads via Google Places API ou no Google Maps.</div>`;

      const kwHtml = kwRadar.keywords.slice(0, 6).map((k, idx) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 7px 8px; background: var(--cc-surface-alt); border-left: 3px solid ${k.present ? 'var(--cc-emerald)' : 'var(--cc-fail)'}; border-radius: 5px; margin-bottom: 5px;">
          <div style="font-size: 11.5px; font-weight: 700; color: var(--cc-text);">
            ${k.present ? '✅' : '❌'} ${k.term}
          </div>
          <button type="button" class="livia-btn-inline livia-btn-auto" data-cc-kw-idx="${idx}" style="padding: 3px 8px; font-size: 10px; flex-shrink: 0;">
            ⚡ Postar
          </button>
        </div>
      `).join('');

      const compRows = (compGap.hasCompetitors && compGap.competitors.length > 0)
        ? compGap.competitors.slice(0, 3).map(c => `
          <div style="display: flex; justify-content: space-between; font-size: 11.5px; padding: 5px 0; border-bottom: 1px solid var(--cc-border);">
            <span><strong>#${c.rank}</strong> ${c.name.slice(0, 26)}</span>
            <span style="font-weight: 700; color: var(--cc-emerald);">⭐ ${c.rating} (${c.reviews} aval.)</span>
          </div>
        `).join('')
        : `<div style="font-size: 11.5px; color: var(--cc-text-secondary); padding: 6px 0;">Nenhum concorrente direto detectado nesta tela. Pesquise no Google pelo segmento e cidade para listar o Top 3 local.</div>`;

      body.innerHTML = `
        <div class="livia-cc-card" style="border-left: 4px solid var(--cc-accent); background: linear-gradient(135deg, var(--cc-surface) 0%, var(--cc-surface-alt) 100%);">
          <div class="livia-cc-card-title" style="display: flex; justify-content: space-between; align-items: center;">
            <span>📡 Radar de Prospecção & Leads</span>
            <span style="font-size: 10px; padding: 2px 7px; border-radius: 12px; font-weight: 700; ${placesApiKey ? 'background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);' : 'background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3);'}">
              ${placesApiKey ? '⚡ API Google Conectada' : '🌐 Modo Tela Gratuito'}
            </span>
          </div>
          <p style="font-size: 11.5px; color: var(--cc-text-secondary); margin: 0 0 8px 0;">
            Encontre novos clientes no Google buscando por nicho e cidade em 1 clique:
          </p>
          <div style="display: flex; gap: 6px; margin-bottom: 8px;">
            <input type="text" id="livia-radar-niche" class="livia-cc-input" placeholder="Ex: oficinas mecanicas, motos eletricas, pizzarias" style="flex: 1.2; font-size: 11.5px; padding: 6px 8px;" value="${queryCategory || ''}">
            <input type="text" id="livia-radar-city" class="livia-cc-input" placeholder="Ex: Macatuba, Bauru" style="flex: 1; font-size: 11.5px; padding: 6px 8px;" value="${queryCity || ''}">
          </div>
          <div style="display: flex; gap: 6px;">
            <button type="button" class="livia-btn-inline livia-btn-auto" id="livia-radar-api-btn" style="flex: 1.2; padding: 7px 10px; font-size: 11.5px; white-space: nowrap;">
              ⚡ Buscar Turbo (Google API)
            </button>
            <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-radar-screen-btn" style="flex: 0.8; padding: 7px 10px; font-size: 11px; white-space: nowrap;" title="Pesquisar direto na tela do Google sem consumir créditos da API">
              🔍 Abrir na Tela
            </button>
          </div>
          ${!placesApiKey ? `
            <div style="margin-top: 8px; padding: 6px 8px; background: rgba(59, 130, 246, 0.08); border: 1px dashed rgba(59, 130, 246, 0.3); border-radius: 6px; font-size: 10.5px; color: var(--cc-text-secondary); display: flex; justify-content: space-between; align-items: center;">
              <span>💡 Ative a <strong>Google Places API</strong> para extrair categorias ocultas e telefones ($200 grátis/mês).</span>
              <button type="button" class="livia-btn-inline" id="livia-open-api-config" style="padding: 2px 7px; font-size: 10px; margin-left: 6px;">⚙️ Configurar</button>
            </div>
          ` : ''}
        </div>

        ${apiLeadsHtml}

        <div class="livia-cc-card">
          <div class="livia-cc-card-title" style="display: flex; justify-content: space-between; align-items: center;">
            <span>🏢 Empresas nesta Busca da Tela (${scrapedListOnScreen.length})</span>
            ${scrapedListOnScreen.length > 0 ? `
              <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-export-leads-csv" style="padding: 2px 7px; font-size: 10px;" title="Exportar tabela de leads em arquivo CSV para Excel">
                📊 Exportar Excel
              </button>
            ` : ''}
          </div>
          ${pageProspectsHtml}
        </div>

        <div class="livia-cc-card">
          <div class="livia-cc-card-title">
            <span>📄 Laudo Comercial & Pitch — ${effectiveBiz.name.slice(0, 20)}</span>
          </div>
          <p style="font-size: 11.5px; color: var(--cc-text-secondary); margin: 0 0 10px 0;">
            Feche contratos mostrando ao dono da <strong>${effectiveBiz.name}</strong> os pontos de melhoria da ficha dele:
          </p>
          <div style="display: flex; gap: 6px; margin-bottom: 8px;">
            <button type="button" class="livia-btn-inline livia-btn-auto" id="livia-cc-open-pdf" style="flex: 1; padding: 8px;">
              📥 Baixar Laudo .PDF
            </button>
            <button type="button" class="livia-btn-inline" id="livia-cc-copy-pitch" style="flex: 1; padding: 8px;">
              💬 Copiar Script Venda
            </button>
          </div>
        </div>

        <div class="livia-cc-card">
          <div class="livia-cc-card-title">
            <span>🏆 Top 3 Concorrentes vs. Ficha (${compGap.myReviews} aval.)</span>
          </div>
          ${compRows}
          <div style="font-size: 11.5px; color: var(--cc-accent); font-weight: 700; margin-top: 8px;">
            ${compGap.actionPlan[0]}
          </div>
        </div>

        <div class="livia-cc-card">
          <div class="livia-cc-card-title">
            <span>🔑 Radar de Palavras-Chave (${kwRadar.coverageScore}%)</span>
          </div>
          ${kwHtml}
        </div>

        <div class="livia-cc-card" style="border-left: 4px solid var(--cc-accent); background: linear-gradient(135deg, var(--cc-surface) 0%, var(--cc-surface-alt) 100%);">
          <div class="livia-cc-card-title">
            <span>🗺️ Mapeamento Geo-Grid de Bairros</span>
          </div>
          <p style="font-size: 11.5px; color: var(--cc-text-secondary); margin: 0 0 8px 0;">
            Descubra em quais bairros da cidade a <strong>${effectiveBiz.name.slice(0, 20)}</strong> está perdendo clientes para concorrentes:
          </p>
          <button type="button" class="livia-btn-inline livia-btn-auto" id="livia-prospect-goto-geogrid" style="width: 100%; padding: 8px;">
            🗺️ Abrir Matriz Geo-Grid de Bairros (9 Regiões)
          </button>
        </div>
      `;

      // Ação: Buscar Turbo via Google Places API
      const apiRadarBtn = body.querySelector('#livia-radar-api-btn');
      if (apiRadarBtn) {
        apiRadarBtn.onclick = async () => {
          const nicheInput = body.querySelector('#livia-radar-niche');
          const cityInput = body.querySelector('#livia-radar-city');
          const niche = (nicheInput?.value || '').trim();
          const city = (cityInput?.value || '').trim();
          if (!niche && !city) {
            showToast('⚠️ Digite o nicho e/ou a cidade para buscar.');
            return;
          }

          if (!placesApiKey) {
            showToast('⚠️ Configure sua chave gratuita da Google Places API primeiro.');
            if (chrome.runtime?.openOptionsPage) {
              chrome.runtime.openOptionsPage();
            } else {
              window.open(chrome.runtime.getURL('options/options.html#tab-server'));
            }
            return;
          }

          isSearchingApi = true;
          renderCommandCenterContent('prospeccao');

          try {
            showToast(`⚡ Consultando Google Places API para "${niche || city}"...`);
            const res = await window.LiviaApi.searchGooglePlaces(niche, city);
            if (res.ok && res.results) {
              lastApiProspects = res.results;
              showToast(`🚀 ${res.results.length} leads encontrados com categorias secretas!`);
            } else {
              showToast(`⚠️ Google API: ${res.error || 'Nenhum resultado retornado'}`);
            }
          } catch (err) {
            showToast(`⚠️ Erro ao buscar na API: ${err.message}`);
          } finally {
            isSearchingApi = false;
            renderCommandCenterContent('prospeccao');
          }
        };
      }

      // Ação: Buscar na Tela (Modo Tradicional)
      const screenRadarBtn = body.querySelector('#livia-radar-screen-btn');
      if (screenRadarBtn) {
        screenRadarBtn.onclick = () => {
          const nicheInput = body.querySelector('#livia-radar-niche');
          const cityInput = body.querySelector('#livia-radar-city');
          const niche = (nicheInput?.value || '').trim();
          const city = (cityInput?.value || '').trim();
          if (!niche && !city) {
            showToast('⚠️ Digite o nicho e/ou a cidade para buscar.');
            return;
          }
          const query = [niche, city].filter(Boolean).join(' ');
          showToast(`🔍 Buscando ${query} no Google...`);
          window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        };
      }

      // Botão Configurar API Google Places
      const configApiBtn = body.querySelector('#livia-open-api-config');
      if (configApiBtn) {
        configApiBtn.onclick = () => {
          if (chrome.runtime?.openOptionsPage) {
            chrome.runtime.openOptionsPage();
          } else {
            window.open(chrome.runtime.getURL('options/options.html#tab-server'));
          }
        };
      }

      // Ação: Analisar Lead da API
      body.querySelectorAll('button[data-cc-analyze-api-lead]').forEach(btn => {
        btn.onclick = () => {
          const idx = parseInt(btn.dataset.ccAnalyzeApiLead, 10);
          const lead = lastApiProspects[idx];
          if (lead) {
            selectedProspectOverride = {
              name: lead.name,
              category: lead.primaryCategory,
              rating: lead.rating,
              reviews: lead.reviews,
              address: lead.address,
              phone: lead.phone || '',
              website: lead.website || '',
              place_id: lead.place_id
            };
            showToast(`🎯 Analisando lead: ${lead.name}`);
            renderCommandCenterContent('auditoria');
          }
        };
      });

      // Ação: Buscar Telefone e Website do Lead da API
      body.querySelectorAll('button[data-cc-phone-api-lead]').forEach(btn => {
        btn.onclick = async () => {
          const idx = parseInt(btn.dataset.ccPhoneApiLead, 10);
          const lead = lastApiProspects[idx];
          if (!lead) return;
          btn.disabled = true;
          btn.innerText = '⏳ Tel...';
          try {
            const details = await window.LiviaApi.getGooglePlaceDetails(lead.place_id);
            if (details.ok && details.place) {
              lead.phone = details.place.phone || '';
              lead.website = details.place.website || '';
              showToast(lead.phone ? `📞 Telefone encontrado: ${lead.phone}` : 'ℹ️ Nenhum telefone público registrado nesta ficha.');
            } else {
              showToast(`⚠️ Detalhes: ${details.error || 'Não localizado'}`);
            }
          } catch (err) {
            showToast(`⚠️ Erro: ${err.message}`);
          } finally {
            renderCommandCenterContent('prospeccao');
          }
        };
      });

      // Ação: Pitch Comercial do Lead da API (com link WhatsApp)
      body.querySelectorAll('button[data-cc-pitch-api-lead]').forEach(btn => {
        btn.onclick = () => {
          const idx = parseInt(btn.dataset.ccPitchApiLead, 10);
          const lead = lastApiProspects[idx];
          if (!lead) return;

          const city = (lead.address || '').split(',').slice(-2, -1)[0]?.trim() || 'sua região';
          const scriptText = `Olá! Tudo bem? Vi o perfil da ${lead.name} no Google em ${city}.

Notei que vocês estão com nota ${lead.rating || '4.0'} e ${lead.reviews || 0} avaliações. Como especialista em posicionamento local e Google Meu Negócio, observei que concorrentes estão aparecendo antes de vocês para buscas de "${lead.primaryCategory}".

Podemos fazer um raio-x gratuito da ficha da ${lead.name} para colocar vocês no Top 3 do Google Maps e aumentar as ligações e clientes que chegam até vocês?`;

          navigator.clipboard.writeText(scriptText);

          if (lead.phone) {
            const cleanPhone = lead.phone.replace(/\D/g, '');
            const targetPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
            const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(scriptText)}`;
            showToast('📋 Script copiado! Abrindo WhatsApp comercial... 🚀');
            window.open(waUrl, '_blank');
          } else {
            showToast('📋 Script comercial personalizado copiado para a área de transferência! 🚀');
          }
        };
      });

      // Exportar Leads da API em CSV
      const exportApiCsvBtn = body.querySelector('#livia-export-api-leads-csv');
      if (exportApiCsvBtn) {
        exportApiCsvBtn.onclick = () => {
          if (!lastApiProspects || lastApiProspects.length === 0) {
            showToast('⚠️ Nenhum lead retornado da API para exportar.');
            return;
          }
          const headers = [
            'Posição',
            'Nome da Empresa',
            'Nota Google',
            'Total Avaliações',
            'Categoria Principal',
            'Categorias Ocultas (Types)',
            'Endereço Completo',
            'Telefone',
            'Website',
            'Status Operacional',
            'Place ID',
            'Link Google Maps'
          ];
          const rows = lastApiProspects.map((lead, i) => [
            i + 1,
            `"${(lead.name || '').replace(/"/g, '""')}"`,
            lead.rating || 'N/A',
            lead.reviews || 0,
            `"${(lead.primaryCategory || '').replace(/"/g, '""')}"`,
            `"${(lead.hiddenCategories || []).join(', ').replace(/"/g, '""')}"`,
            `"${(lead.address || '').replace(/"/g, '""')}"`,
            `"${(lead.phone || '').replace(/"/g, '""')}"`,
            `"${(lead.website || '').replace(/"/g, '""')}"`,
            lead.business_status || 'OPERATIONAL',
            lead.place_id || '',
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name)}&query_place_id=${lead.place_id || ''}`
          ]);
          const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const cleanQ = (lastApiProspects[0]?.primaryCategory || 'leads_turbo').toLowerCase().replace(/\s+/g, '_');
          a.download = `leads_google_places_api_${cleanQ}_${Date.now()}.csv`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 500);
          showToast(`📊 Planilha Turbo com ${lastApiProspects.length} leads exportada com sucesso! 🚀`);
        };
      }

      // Limpar Leads da API
      const clearApiBtn = body.querySelector('#livia-clear-api-leads');
      if (clearApiBtn) {
        clearApiBtn.onclick = () => {
          lastApiProspects = [];
          showToast('Lista da API limpa.');
          renderCommandCenterContent('prospeccao');
        };
      }

      body.querySelectorAll('button[data-cc-select-prospect]').forEach(btn => {
        btn.onclick = () => {
          const idx = parseInt(btn.dataset.ccSelectProspect, 10);
          const chosen = scrapedListOnScreen[idx];
          if (chosen) {
            selectedProspectOverride = chosen;
            if (chosen.cardEl) {
              try { chosen.cardEl.click(); } catch (err) {}
            }
            showToast(`🎯 Analisando empresa: ${chosen.name}`);
            renderCommandCenterContent('prospeccao');
            setTimeout(() => renderCommandCenterContent(currentCommandTab), 750);
            setTimeout(() => renderCommandCenterContent(currentCommandTab), 1600);
          }
        };
      });

      const exportCsvBtn = body.querySelector('#livia-export-leads-csv');
      if (exportCsvBtn) {
        exportCsvBtn.onclick = () => {
          if (!scrapedListOnScreen || scrapedListOnScreen.length === 0) {
            showToast('⚠️ Nenhuma empresa na busca para exportar.');
            return;
          }
          const headers = ['Posição', 'Nome da Empresa', 'Nota Google', 'Avaliações', 'Categoria', 'Tem Website'];
          const rows = scrapedListOnScreen.map((c, i) => [
            i + 1,
            `"${(c.name || '').replace(/"/g, '""')}"`,
            c.rating || 'N/A',
            c.reviews || 0,
            `"${(c.category || '').replace(/"/g, '""')}"`,
            c.hasWebsite ? 'Sim' : 'Não'
          ]);
          const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const cleanQ = (queryCategory || 'leads').toLowerCase().replace(/\s+/g, '_');
          a.download = `leads_google_${cleanQ}_${Date.now()}.csv`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 500);
          showToast(`📊 Planilha de ${scrapedListOnScreen.length} leads exportada com sucesso! 🚀`);
        };
      }

      body.querySelector('#livia-cc-open-pdf').onclick = () => {
        openPrintableAuditReport(auditData, audit, kwRadar, compGap, agencyBiz);
      };

      body.querySelector('#livia-cc-copy-pitch').onclick = () => {
        navigator.clipboard.writeText(pitchData.scripts[0].text);
        showToast('Script comercial copiado! Envie no WhatsApp do cliente junto com o Laudo PDF! 🚀');
      };

      const gotoGeoBtn = body.querySelector('#livia-prospect-goto-geogrid');
      if (gotoGeoBtn) {
        gotoGeoBtn.onclick = () => renderCommandCenterContent('geogrid');
      }

      body.querySelectorAll('button[data-cc-kw-idx]').forEach(btn => {
        btn.onclick = async () => {
          const kwObj = kwRadar.keywords[parseInt(btn.dataset.ccKwIdx, 10)];
          const postIdea = `Procurando por ${kwObj.term}? Na ${effectiveBiz?.name || auditData.kpName}, oferecemos atendimento especializado e garantia total em ${kwRadar.targetCity}!`;
          const post = new window.LiviaProviders.UniversalPost({ source: 'manual', text: postIdea });
          const res = await window.LiviaApi.transformPostForLocalSEO(post, { postType: 'update', business: effectiveBiz });
          const banner = generatePromotionalBannerDataUrl(effectiveBiz);
          const seoName = window.LiviaApi.buildSeoFilename(effectiveBiz, kwObj.term.slice(0, 18), 'png');
          await startGoogleAutomationFlow('CREATE_POST', {
            text: res.text || postIdea,
            mediaUrl: banner,
            mediaDataUrl: banner,
            filename: seoName
          });
        };
      });
    }

    // ABA 5: AVALIAÇÕES & QR CODE
    else if (tabId === 'avaliacoes') {
      const revKit = window.LiviaApi.generateReviewRequestKit(effectiveBiz, auditData.kpName);

      body.innerHTML = `
        <div class="livia-cc-card">
          <div class="livia-cc-card-title">
            <span>⚡ Responder Avaliações com SEO Local</span>
          </div>
          <p style="font-size: 11.5px; color: var(--cc-text-secondary); margin: 0 0 10px 0;">
            Abra a janela "Ler avaliações" no Google e clique abaixo para preencher respostas personalizadas em todas as avaliações pendentes:
          </p>
          <button type="button" class="livia-btn-inline livia-btn-auto" id="livia-cc-batch-reviews" style="width: 100%; padding: 9px;">
            ⚡ Auto-Responder Avaliações Pendentes na Tela
          </button>
        </div>

        <div class="livia-cc-card">
          <div class="livia-cc-card-title">
            <span>⭐ Conquistar Novas Avaliações 5 Estrelas</span>
          </div>
          <div style="display: flex; gap: 6px; margin-bottom: 10px;">
            <button type="button" class="livia-btn-inline" id="livia-cc-req-rev-google" style="flex: 1; padding: 8px; font-size: 11px;">
              🔗 Abrir Link no Google
            </button>
            <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-cc-qr-print" style="flex: 1; padding: 8px; font-size: 11px;">
              🖨️ Plaquinha QR Code
            </button>
          </div>
          <div style="font-size: 11.5px; color: var(--cc-text-secondary); white-space: pre-wrap; background: var(--cc-surface-alt); padding: 8px; border-radius: 6px; border: 1px solid var(--cc-border); margin-bottom: 8px;">${revKit.scripts[0].text}</div>
          <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-cc-copy-rev-msg" style="width: 100%; padding: 7px;">
            📋 Copiar Mensagem de WhatsApp para Clientes
          </button>
        </div>
      `;

      body.querySelector('#livia-cc-batch-reviews').onclick = () => batchAnswerPendingReviews();
      body.querySelector('#livia-cc-req-rev-google').onclick = () => startGoogleAutomationFlow('REQUEST_REVIEWS', {});
      body.querySelector('#livia-cc-qr-print').onclick = () => openPrintableQrCard(revKit.businessName, revKit.reviewLink);
      body.querySelector('#livia-cc-copy-rev-msg').onclick = () => {
        navigator.clipboard.writeText(revKit.scripts[0].text);
        showToast('Mensagem copiada! Envie para os clientes no WhatsApp! ⭐');
      };
    }

    // ABA 6: GEO-GRID DE BAIRROS & RANKING LOCAL (ESTILO LOCAL FALCON / GBP CHECK)
    else if (tabId === 'geogrid') {
      const defaultKw = customGeoGridConfig.keyword || (effectiveBiz?.services && effectiveBiz?.services[0]) || auditData.categoryText || 'serviços';
      const targetCity = customGeoGridConfig.city || auditData.detectedCity || effectiveBiz?.city || 'Sua Cidade';

      const geoData = window.LiviaApi.generateGeoGridRanking(effectiveBiz, {
        keyword: defaultKw,
        city: targetCity,
        neighborhoods: customGeoGridConfig.neighborhoods
      });

      const agrColor = geoData.agr <= 3 ? 'var(--cc-emerald, #059669)' : geoData.agr <= 7 ? 'var(--cc-warn, #d97706)' : 'var(--cc-fail, #dc2626)';
      const solvColor = geoData.solv >= 70 ? 'var(--cc-emerald, #059669)' : geoData.solv >= 40 ? 'var(--cc-warn, #d97706)' : 'var(--cc-fail, #dc2626)';

      const matrixCellsHtml = geoData.grid.map(g => `
        <a href="${g.searchUrl}" target="_blank" class="livia-geogrid-cell" title="Clique para abrir a busca real no Google Maps em ${g.bairro}">
          <div class="livia-geogrid-pin ${g.status}">#${g.rank}</div>
          <div class="livia-geogrid-cell-title">${g.bairro}</div>
          <div class="livia-geogrid-cell-dist">${g.distanceKm} km • ${g.quadrant}</div>
        </a>
      `).join('');

      const bairrosListHtml = geoData.grid.map(g => `
        <div class="livia-geogrid-bairro-item">
          <div style="display: flex; align-items: center; gap: 8px; overflow: hidden;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: ${g.color}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 12px; flex-shrink: 0;">
              #${g.rank}
            </div>
            <div style="overflow: hidden;">
              <div style="font-size: 12px; font-weight: 800; color: var(--cc-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${g.bairro} ${g.isHome ? '<span style="font-size: 9.5px; background: var(--cc-accent-soft); color: var(--cc-accent); padding: 1px 5px; border-radius: 4px;">SEDE</span>' : ''}
              </div>
              <div style="font-size: 10.5px; color: var(--cc-text-muted);">
                ${g.distanceKm} km • ${g.statusLabel}
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 4px; flex-shrink: 0;">
            <button type="button" class="livia-btn-inline livia-btn-auto" data-geogrid-post="${g.index}" style="padding: 4px 8px; font-size: 10.5px;" title="Criar post no Google Meu Negócio citando este bairro">
              ⚡ Postar
            </button>
            <a href="${g.searchUrl}" target="_blank" class="livia-btn-inline livia-btn-secondary" style="padding: 4px 7px; font-size: 10.5px; text-decoration: none;" title="Abrir busca no Google Maps">
              🗺️
            </a>
          </div>
        </div>
      `).join('');

      body.innerHTML = `
        <div class="livia-cc-card" style="border-left: 4px solid var(--cc-accent); background: linear-gradient(135deg, var(--cc-surface) 0%, var(--cc-surface-alt) 100%);">
          <div class="livia-cc-card-title">
            <span>🗺️ Geo-Grid de Bairros & Ranking Local</span>
            <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-geogrid-edit-bairros" style="padding: 3px 8px; font-size: 10.5px;">
              ⚙️ Bairros
            </button>
          </div>
          <p style="font-size: 11.5px; color: var(--cc-text-secondary); margin: 0 0 8px 0;">
            Veja a posição exata da <strong>${effectiveBiz.name.slice(0, 22)}</strong> em 9 bairros e regiões da cidade:
          </p>
          <div style="display: flex; gap: 6px; margin-bottom: 6px;">
            <input type="text" id="livia-geogrid-kw-input" class="livia-cc-input" placeholder="Termo / Serviço (Ex: oficina mecanica)" value="${defaultKw}" style="flex: 1.2; font-size: 11.5px; padding: 6px 8px;">
            <input type="text" id="livia-geogrid-city-input" class="livia-cc-input" placeholder="Cidade" value="${targetCity}" style="flex: 1; font-size: 11.5px; padding: 6px 8px;">
            <button type="button" class="livia-btn-inline livia-btn-auto" id="livia-geogrid-run-btn" style="padding: 6px 12px; font-size: 11.5px; white-space: nowrap;">
              🔍 Simular
            </button>
          </div>
        </div>

        <div class="livia-geogrid-metrics-grid">
          <div class="livia-geogrid-stat-box">
            <span style="font-size: 10px; font-weight: 800; color: var(--cc-text-muted); text-transform: uppercase;">Posição Média (AGR)</span>
            <span style="font-size: 22px; font-weight: 900; color: ${agrColor}; margin-top: 2px;">#${geoData.agr}</span>
            <span style="font-size: 10px; color: var(--cc-text-muted);">Média nos 9 pontos</span>
          </div>
          <div class="livia-geogrid-stat-box">
            <span style="font-size: 10px; font-weight: 800; color: var(--cc-text-muted); text-transform: uppercase;">Domínio Top 3 (SoLV)</span>
            <span style="font-size: 22px; font-weight: 900; color: ${solvColor}; margin-top: 2px;">${geoData.solv}%</span>
            <span style="font-size: 10px; color: var(--cc-text-muted);">${geoData.top3Count} de 9 bairros</span>
          </div>
        </div>

        <div class="livia-cc-card">
          <div class="livia-cc-card-title" style="display: flex; justify-content: space-between; align-items: center;">
            <span>📍 Matriz Geográfica 3x3 (${targetCity})</span>
            <button type="button" class="livia-btn-inline" id="livia-geogrid-print-btn" style="padding: 3px 9px; font-size: 10.5px; background: linear-gradient(135deg, #10b981 0%, #00d2ff 100%) !important; color: #070b14 !important;">
              🖨️ Relatório / PDF
            </button>
          </div>
          <div class="livia-geogrid-matrix">
            ${matrixCellsHtml}
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10.5px; color: var(--cc-text-muted); padding: 0 4px;">
            <span>🟢 Top 1-3 (Local Pack)</span>
            <span>🟡 Pág. 1 (#4-10)</span>
            <span>🔴 Fora (+10)</span>
          </div>
        </div>

        <div class="livia-cc-card">
          <div class="livia-cc-card-title">
            <span>📋 Classificação Detalhada por Bairro</span>
          </div>
          <div>
            ${bairrosListHtml}
          </div>
        </div>

        <div class="livia-cc-card">
          <div class="livia-cc-card-title">
            <span>💡 Diagnóstico e Estratégia de Expansão</span>
          </div>
          <ul style="font-size: 11.5px; line-height: 1.6; color: var(--cc-text-secondary); margin: 0; padding-left: 16px;">
            ${geoData.strategicPlan.map(s => `<li style="margin-bottom: 4px;">${s}</li>`).join('')}
          </ul>
        </div>
      `;

      // Event Listeners da aba geogrid
      body.querySelector('#livia-geogrid-run-btn').onclick = () => {
        const kw = body.querySelector('#livia-geogrid-kw-input').value.trim();
        const city = body.querySelector('#livia-geogrid-city-input').value.trim();
        customGeoGridConfig.keyword = kw;
        customGeoGridConfig.city = city;
        renderCommandCenterContent('geogrid');
        showToast(`Simulação de Geo-Grid atualizada para "${kw}" em ${city}! 🗺️`);
      };

      body.querySelector('#livia-geogrid-edit-bairros').onclick = () => {
        openGeoGridNeighborhoodsModal(geoData.grid.map(g => g.bairro), (newBairros) => {
          customGeoGridConfig.neighborhoods = newBairros;
          renderCommandCenterContent('geogrid');
          showToast('Bairros do Geo-Grid atualizados com sucesso! 📍');
        });
      };

      body.querySelector('#livia-geogrid-print-btn').onclick = () => {
        openPrintableGeoGridReport(geoData, agencyBiz);
      };

      body.querySelectorAll('button[data-geogrid-post]').forEach(btn => {
        btn.onclick = async () => {
          const idx = parseInt(btn.dataset.geogridPost, 10);
          const item = geoData.grid[idx];
          const postText = `Atendimento especializado em ${geoData.keyword} para o bairro ${item.bairro} e região de ${geoData.city}! A ${effectiveBiz.name} oferece garantia, rapidez e equipe qualificada. Fale conosco no WhatsApp!`;
          const post = new window.LiviaProviders.UniversalPost({ source: 'manual', text: postText });
          const res = await window.LiviaApi.transformPostForLocalSEO(post, { postType: 'update', business: effectiveBiz });
          const banner = generatePromotionalBannerDataUrl(effectiveBiz);
          const seoName = window.LiviaApi.buildSeoFilename(effectiveBiz, `bairro-${item.bairro.toLowerCase().replace(/\s+/g, '-')}`, 'png');
          await startGoogleAutomationFlow('CREATE_POST', {
            text: res.text || postText,
            mediaUrl: banner,
            mediaDataUrl: banner,
            filename: seoName
          });
        };
      });
    }
  }

  // --- 7. OBSERVER PARA PÁGINAS DINÂMICAS DO GOOGLE E SUB-IFRAMES ---
  let dockDebounceTimer = null;
  let autoDebounceTimer = null;
  let liveScreenSyncTimer = null;
  let lastObservedScreenSignature = '';

  function checkAndSyncLiveScreenChanges() {
    if (!IS_TOP_FRAME || !document.getElementById('livia-command-center')) return;
    const currentTitle = getRealBusinessTitleFromPage() || '';
    const scrapedCount = scrapeCompetitorsFromPage().length;
    const sig = `${currentTitle}|${scrapedCount}|${window.location.href}`;
    if (sig !== lastObservedScreenSignature) {
      lastObservedScreenSignature = sig;
      renderCommandCenterContent(currentCommandTab);
    }
  }

  const observer = new MutationObserver((mutations) => {
    // Ignora mutações geradas dentro do próprio painel da Lívia para não criar loop
    const isInternalOnly = mutations.every(
      m => m.target && m.target.closest && m.target.closest('#livia-command-center, #livia-panel-launcher, .livia-toast')
    );
    if (isInternalOnly) return;

    injectReviewReplyButtons();
    injectPostCreationButtons();
    injectDescriptionButtons();

    clearTimeout(autoDebounceTimer);
    autoDebounceTimer = setTimeout(() => {
      checkAndExecutePendingAutomation();
      scanAndBroadcastSubframeSignals();
    }, 250);

    // Garante que o Painel de Operações esteja sempre presente e sincronizado quando o Google carregar resultados/fichas
    if (IS_TOP_FRAME) {
      if (!document.getElementById('livia-command-center')) {
        clearTimeout(dockDebounceTimer);
        dockDebounceTimer = setTimeout(() => {
          injectLiviaDock();
        }, 350);
      } else {
        clearTimeout(liveScreenSyncTimer);
        liveScreenSyncTimer = setTimeout(() => {
          checkAndSyncLiveScreenChanges();
        }, 550);
      }
    }
  });

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  // Listener para menu de contexto (botão direito em qualquer texto selecionado)
  chrome.runtime.onMessage.addListener(async (msg) => {
    if (msg.action === 'optimize_selected_text' && msg.text) {
      const post = new window.LiviaProviders.UniversalPost({ source: 'manual', text: msg.text });
      const res = await window.LiviaApi.transformPostForLocalSEO(post);
      if (res && res.text) {
        await navigator.clipboard.writeText(res.text);
        showToast('Texto selecionado otimizado com SEO Local e copiado! ✨');
      }
    }
  });

  // Assistente de Criação de Ficha na página oficial do Google Meu Negócio (business.google.com/create)
  async function injectGoogleCreateAssistant() {
    const isCreateUrl = window.location.href.includes('business.google.com/create') || window.location.href.includes('business.google.com/add');
    if (!isCreateUrl) return;

    // Se o Google redirecionou com erro 500 por causa de query params inválidos (?fp=...), limpa a URL imediatamente
    if (window.location.search && (window.location.search.includes('fp=') || (document.body && document.body.innerText.includes('500. Isto é um erro')))) {
      window.location.replace('https://business.google.com/create');
      return;
    }

    if (document.getElementById('livia-create-guide-card')) return;

    await refreshBusinessData();
    const activeBiz = cachedBizData?.activeBusiness;
    if (!activeBiz) return;

    const guide = document.createElement('div');
    guide.id = 'livia-create-guide-card';
    guide.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 320px;
      background: #0f172a;
      color: #ffffff;
      border: 1px solid #3b82f6;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
      z-index: 2147483645;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    guide.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 18px;">🚀</span>
          <strong style="font-size: 13.5px; color: #60a5fa;">Assistente Lívia Copilot</strong>
        </div>
        <button id="livia-guide-close" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">&times;</button>
      </div>
      <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 10px; line-height: 1.4;">
        Criando ficha para: <strong style="color: #ffffff;">${activeBiz.name}</strong>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <button type="button" class="livia-btn-inline livia-btn-auto" id="livia-guide-copy-name" style="padding: 7px 10px; font-size: 11.5px; width: 100%;">
          📋 Copiar Nome: "${activeBiz.name.slice(0, 22)}"
        </button>
        <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-guide-copy-cat" style="padding: 7px 10px; font-size: 11.5px; width: 100%; color: #fff; background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2);">
          📋 Copiar Categoria: "${activeBiz.primaryCategory.slice(0, 22)}"
        </button>
        <button type="button" class="livia-btn-inline" id="livia-guide-copy-desc" style="padding: 7px 10px; font-size: 11.5px; width: 100%;">
          ✨ Gerar e Copiar Descrição (750c)
        </button>
        <div style="display: flex; gap: 6px; margin-top: 4px;">
          <a href="https://business.google.com/create" class="livia-btn-inline livia-btn-secondary" style="flex: 1; text-align: center; text-decoration: none; padding: 5px 8px; font-size: 10.5px; color: #93c5fd;" title="Abrir página oficial de criação limpa">
            🔄 Recarregar Limpo
          </a>
          <a href="https://www.google.com/maps" target="_blank" class="livia-btn-inline livia-btn-secondary" style="flex: 1; text-align: center; text-decoration: none; padding: 5px 8px; font-size: 10.5px; color: #93c5fd;" title="Adicionar empresa pelo Google Maps">
            🗺️ Google Maps
          </a>
        </div>
      </div>
    `;

    document.body.appendChild(guide);

    guide.querySelector('#livia-guide-close').onclick = () => guide.remove();
    guide.querySelector('#livia-guide-copy-name').onclick = async () => {
      await navigator.clipboard.writeText(activeBiz.name);
      showToast(`Nome "${activeBiz.name}" copiado! Cole no Google Meu Negócio 📋`);
    };
    guide.querySelector('#livia-guide-copy-cat').onclick = async () => {
      await navigator.clipboard.writeText(activeBiz.primaryCategory);
      showToast(`Categoria "${activeBiz.primaryCategory}" copiada! 📋`);
    };
    guide.querySelector('#livia-guide-copy-desc').onclick = async () => {
      const res = await window.LiviaApi.generateBusinessDescription({ business: activeBiz });
      if (res && res.description) {
        await navigator.clipboard.writeText(res.description);
        showToast(`Descrição de ${res.description.length} caracteres gerada e copiada! 📋 Cole na etapa de descrição.`);
      }
    };

    // Tenta auto-digitar o nome da empresa no campo oficial do Google quando carregar
    const tryAutoFillGoogleName = () => {
      const inputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])')).filter(inp => {
        if (inp.closest('#livia-command-center, #livia-create-guide-card')) return false;
        const aria = (inp.getAttribute('aria-label') || '').toLowerCase();
        const placeholder = (inp.placeholder || '').toLowerCase();
        const nameAttr = (inp.name || '').toLowerCase();
        return aria.includes('empresa') || aria.includes('nome') || aria.includes('business') || placeholder.includes('empresa') || placeholder.includes('nome') || nameAttr.includes('business');
      });
      if (inputs.length > 0 && (!inputs[0].value || inputs[0].value.trim() === '')) {
        setNativeValue(inputs[0], activeBiz.name);
        inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        showToast(`✨ Nome "${activeBiz.name}" preenchido automaticamente no Google!`);
      }
    };
    [700, 1500, 3000].forEach(delay => setTimeout(tryAutoFillGoogleName, delay));
  }

  // Execuções periódicas e de inicialização (500ms, 1200ms, 2500ms e 4200ms) para vencer o carregamento assíncrono do Google
  [500, 1200, 2500, 4200].forEach((delay) => {
    setTimeout(() => {
      injectLiviaDock();
      injectGoogleCreateAssistant();
      checkAndSyncLiveScreenChanges();
      injectReviewReplyButtons();
      injectPostCreationButtons();
      injectDescriptionButtons();
      checkAndExecutePendingAutomation();
      scanAndBroadcastSubframeSignals();
    }, delay);
  });

})();
