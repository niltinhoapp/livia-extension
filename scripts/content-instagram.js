/**
 * Lívia Copilot Pro — Injeção no Instagram Web (v2.0)
 * Permite ao usuário capturar qualquer post do Instagram (texto + foto/vídeo em alta resolução)
 * e transformar em post otimizado com SEO Local para o Google Meu Negócio com 1 clique.
 * ConectWeb 2026.
 */

(function () {
  'use strict';

  console.log('[Lívia Copilot Pro] Ativado no Instagram Web.');

  let cachedBizData = null;

  function ensureInjectedStyles() {
    if (document.getElementById('livia-insta-injected-style')) return;
    const style = document.createElement('style');
    style.id = 'livia-insta-injected-style';
    style.textContent = `
      #livia-insta-container {
        position: fixed !important;
        bottom: 85px !important;
        right: 24px !important;
        z-index: 2147483647 !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-end !important;
        gap: 8px !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
      }

      .livia-insta-fab-btn {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        background: rgba(11, 15, 25, 0.95) !important;
        backdrop-filter: blur(12px) !important;
        border: 1px solid #00d2ff !important;
        padding: 10px 18px !important;
        border-radius: 9999px !important;
        color: #f0f4f8 !important;
        font-size: 13px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 210, 255, 0.4) !important;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        text-decoration: none !important;
        outline: none !important;
        user-select: none !important;
      }

      .livia-insta-fab-btn:hover {
        transform: translateY(-3px) scale(1.03) !important;
        box-shadow: 0 14px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 210, 255, 0.6) !important;
        background: #151c2c !important;
        border-color: #33dcff !important;
      }

      .livia-insta-fab-btn.is-post-open {
        background: linear-gradient(135deg, rgba(0, 210, 255, 0.28) 0%, rgba(11, 15, 25, 0.96) 100%) !important;
        border-color: #00d2ff !important;
        animation: liviaGlowPulse 2s infinite !important;
      }

      @keyframes liviaGlowPulse {
        0% { box-shadow: 0 0 15px rgba(0, 210, 255, 0.4); }
        50% { box-shadow: 0 0 30px rgba(0, 210, 255, 0.85); }
        100% { box-shadow: 0 0 15px rgba(0, 210, 255, 0.4); }
      }

      .livia-insta-fab-icon {
        width: 24px !important;
        height: 24px !important;
        border-radius: 50% !important;
        background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 13px !important;
        flex-shrink: 0 !important;
      }

      .livia-insta-biz-switch {
        padding: 2px 8px !important;
        background: rgba(255, 255, 255, 0.08) !important;
        border-radius: 6px !important;
        font-size: 10px !important;
        color: #8892b0 !important;
        margin-left: 4px !important;
        cursor: pointer !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        transition: all 0.2s ease !important;
      }

      .livia-insta-biz-switch:hover {
        background: rgba(0, 210, 255, 0.2) !important;
        color: #00d2ff !important;
        border-color: #00d2ff !important;
      }

      .livia-insta-card {
        background: #0d121f !important;
        border: 1px solid rgba(0, 210, 255, 0.4) !important;
        border-radius: 14px !important;
        padding: 16px !important;
        color: #f0f4f8 !important;
        box-shadow: 0 20px 45px rgba(0, 0, 0, 0.85), 0 0 25px rgba(0, 210, 255, 0.25) !important;
        max-width: 330px !important;
        font-size: 13px !important;
        line-height: 1.5 !important;
        animation: liviaSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }

      @keyframes liviaSlideIn {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .livia-insta-card h4 {
        margin: 0 0 8px 0 !important;
        font-size: 14px !important;
        font-weight: 700 !important;
        color: #00d2ff !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
      }

      .livia-insta-card-close {
        cursor: pointer !important;
        font-size: 16px !important;
        color: #8892b0 !important;
        line-height: 1 !important;
      }

      .livia-insta-card-close:hover {
        color: #ffffff !important;
      }

      .livia-insta-btn-primary {
        background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%) !important;
        color: #060911 !important;
        font-weight: 700 !important;
        padding: 8px 14px !important;
        border-radius: 8px !important;
        border: none !important;
        cursor: pointer !important;
        font-size: 12px !important;
        width: 100% !important;
        margin-top: 10px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
      }

      .livia-insta-btn-primary:hover {
        filter: brightness(1.15) !important;
      }

      .livia-insta-biz-list {
        display: flex !important;
        flex-direction: column !important;
        gap: 6px !important;
        margin-top: 10px !important;
      }

      .livia-insta-biz-item {
        padding: 8px 12px !important;
        background: #151c2c !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        border-radius: 8px !important;
        cursor: pointer !important;
        font-size: 12px !important;
        color: #ccd6f6 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        transition: all 0.2s ease !important;
      }

      .livia-insta-biz-item:hover, .livia-insta-biz-item.active {
        border-color: #00d2ff !important;
        background: rgba(0, 210, 255, 0.12) !important;
        color: #ffffff !important;
      }

      .livia-toast {
        position: fixed !important;
        bottom: 30px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        background: #101624 !important;
        color: #ffffff !important;
        border: 1px solid #00d2ff !important;
        padding: 12px 24px !important;
        border-radius: 9999px !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 210, 255, 0.5) !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        z-index: 2147483647 !important;
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        animation: liviaSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      @keyframes liviaSlideUp {
        from { opacity: 0; transform: translate(-50%, 20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function showToast(message, actionText, onAction) {
    const existing = document.querySelector('.livia-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'livia-toast';
    toast.innerHTML = `<span>🚀</span><span>${message}</span>`;

    if (actionText && onAction) {
      const actionBtn = document.createElement('button');
      actionBtn.type = 'button';
      actionBtn.style.padding = '6px 14px';
      actionBtn.style.fontSize = '12px';
      actionBtn.style.marginLeft = '8px';
      actionBtn.style.borderRadius = '9999px';
      actionBtn.style.border = 'none';
      actionBtn.style.background = 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)';
      actionBtn.style.color = '#060911';
      actionBtn.style.fontWeight = '700';
      actionBtn.style.cursor = 'pointer';
      actionBtn.innerText = actionText;
      actionBtn.onclick = onAction;
      toast.appendChild(actionBtn);
    }

    (document.body || document.documentElement).appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s ease';
      setTimeout(() => toast.remove(), 500);
    }, 7500);
  }

  function isPostOpenOnScreen() {
    const dialog = document.querySelector('div[role="dialog"]');
    const pathname = window.location.pathname;
    const isPostUrl = pathname.includes('/p/') || pathname.includes('/reel/');
    return !!(dialog || isPostUrl);
  }

  function getBusinessShortLabel(biz) {
    if (!biz || !biz.name) return 'Google Meu Negócio';
    return biz.name.split(' - ')[0].trim().slice(0, 18);
  }

  async function refreshBusinessData() {
    try {
      if (window.LiviaApi && window.LiviaApi.getBusinessData) {
        cachedBizData = await window.LiviaApi.getBusinessData();
        return cachedBizData;
      }
    } catch (e) {
      console.warn('[Lívia Copilot] Não foi possível ler storage:', e);
    }
    return cachedBizData;
  }

  // Converte imagem para Base64 DataURL (via fetch local ou background worker) e dispara download
  async function processAndDownloadMedia(mediaUrl, filename) {
    if (!mediaUrl) return null;

    let dataUrl = null;
    try {
      // Tenta primeiro via background worker para evitar qualquer bloqueio de CORS
      const bgRes = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'fetch_media_base64', url: mediaUrl }, (res) => {
          resolve(res || null);
        });
      });

      if (bgRes && bgRes.ok && bgRes.dataUrl) {
        dataUrl = bgRes.dataUrl;
      }
    } catch (e) {}

    try {
      const response = await fetch(mediaUrl, { mode: 'cors' });
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Se ainda não tínhamos o dataUrl, converte do blob
      if (!dataUrl && blob.size <= 4 * 1024 * 1024) {
        dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      }

      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.download = filename || 'post-instagram.jpg';
      document.body.appendChild(tempLink);
      tempLink.click();
      tempLink.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
    } catch (err) {
      // Se temos o dataUrl vindo do background, faz o download por ele
      if (dataUrl) {
        const tempLink = document.createElement('a');
        tempLink.href = dataUrl;
        tempLink.download = filename || 'post-instagram.jpg';
        document.body.appendChild(tempLink);
        tempLink.click();
        tempLink.remove();
      } else {
        const tempLink = document.createElement('a');
        tempLink.href = mediaUrl;
        tempLink.download = filename || 'post-instagram.jpg';
        tempLink.target = '_blank';
        document.body.appendChild(tempLink);
        tempLink.click();
        tempLink.remove();
      }
    }

    return dataUrl;
  }

  // Monta a interface na tela de forma imediata (0ms) e atualiza dados em seguida
  async function injectInstagramBridge() {
    ensureInjectedStyles();

    let container = document.getElementById('livia-insta-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'livia-insta-container';
      (document.body || document.documentElement).appendChild(container);
    }

    const postOpen = isPostOpenOnScreen();

    let fab = document.getElementById('livia-insta-fab');
    if (!fab) {
      fab = document.createElement('button');
      fab.id = 'livia-insta-fab';
      fab.className = 'livia-insta-fab-btn';
      fab.innerHTML = `<div class="livia-insta-fab-icon">✨</div><span>Lívia Copilot</span>`;
      container.appendChild(fab);
      fab.addEventListener('click', handleFabClick);
    }

    await refreshBusinessData();
    const activeBiz = cachedBizData?.activeBusiness;
    const bizLabel = getBusinessShortLabel(activeBiz);

    fab.className = `livia-insta-fab-btn ${postOpen ? 'is-post-open' : ''}`;

    if (postOpen) {
      fab.title = `Clique para converter texto + foto deste post para a ${bizLabel} no Google Meu Negócio`;
      fab.innerHTML = `
        <div class="livia-insta-fab-icon">⚡</div>
        <span>Converter Post + Foto ➔ <strong>${bizLabel}</strong></span>
        <span class="livia-insta-biz-switch" id="livia-insta-switch-btn" title="Trocar empresa de destino">Trocar</span>
      `;
    } else {
      fab.title = `Lívia Copilot para Google Meu Negócio (Empresa: ${bizLabel})`;
      fab.innerHTML = `
        <div class="livia-insta-fab-icon">✨</div>
        <span>Lívia ➔ <strong>${bizLabel}</strong></span>
        <span class="livia-insta-biz-switch" id="livia-insta-switch-btn" title="Trocar empresa de destino">Trocar</span>
      `;
    }

    const switchBtn = fab.querySelector('#livia-insta-switch-btn');
    if (switchBtn) {
      switchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleBusinessSwitcher();
      });
    }
  }

  async function handleFabClick(e) {
    if (e.target && e.target.id === 'livia-insta-switch-btn') return;

    const fab = document.getElementById('livia-insta-fab');
    const originalHtml = fab.innerHTML;

    if (isPostOpenOnScreen()) {
      fab.innerHTML = `<div class="livia-insta-fab-icon">⏳</div><span>Lívia convertendo texto e salvando foto...</span>`;

      try {
        const post = window.LiviaProviders.InstagramProvider.extractCurrentPost();

        if (!post || (!post.text && (!post.mediaUrls || post.mediaUrls.length === 0))) {
          showToast('Abra uma postagem clicando na foto para a Lívia capturar!', null, null);
          fab.innerHTML = originalHtml;
          return;
        }

        const result = await window.LiviaApi.transformPostForLocalSEO(post);

        if (result && result.text) {
          const activeBiz = cachedBizData?.activeBusiness;
          const bizLabel = getBusinessShortLabel(activeBiz);

          const mediaUrls = post.mediaUrls || [];
          const mainMediaUrl = mediaUrls.length > 0 ? mediaUrls[0] : null;
          const isVideo = post.mediaType === 'VIDEO';
          const ext = isVideo ? 'mp4' : 'jpg';
          const safeBizName = (bizLabel || 'empresa').toLowerCase().replace(/[^a-z0-9]/g, '-');
          const filename = `post-${safeBizName}-${Date.now()}.${ext}`;

          let mediaDataUrl = null;
          if (mainMediaUrl) {
            mediaDataUrl = await processAndDownloadMedia(mainMediaUrl, filename);
          }

          const postPayload = {
            text: result.text,
            sourceUrl: post.permalink,
            mediaUrls: mediaUrls,
            mediaDataUrl: mediaDataUrl,
            mediaType: post.mediaType || 'IMAGE',
            mainMediaFilename: filename,
            businessId: activeBiz?.id || null,
            businessName: activeBiz?.name || bizLabel,
            timestamp: Date.now()
          };

          chrome.storage.local.get(['transformedPostsByBusiness'], (st) => {
            const dict = st.transformedPostsByBusiness || {};
            if (activeBiz?.id) {
              dict[activeBiz.id] = postPayload;
            }
            chrome.storage.local.set({
              lastTransformedPost: postPayload,
              transformedPostsByBusiness: dict
            });
          });

          try {
            await navigator.clipboard.writeText(result.text);
          } catch (clipErr) {
            console.warn('[Lívia] Clipboard API:', clipErr);
          }

          const toastMsg = mainMediaUrl
            ? `Texto copiado e ${isVideo ? 'vídeo' : 'foto'} salva! Prontos para o Google 📸`
            : `Post convertido para ${bizLabel} e copiado! ✨`;

          showToast(toastMsg, 'Abrir Google Meu Negócio', () => {
            const searchQuery = activeBiz?.name ? encodeURIComponent(activeBiz.name) : 'minha+empresa';
            window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
          });
        }
      } catch (err) {
        console.error('[Lívia Copilot] Erro ao converter do Instagram:', err);
        showToast('Erro ao processar post.');
      } finally {
        fab.innerHTML = originalHtml;
      }
      return;
    }

    togglePostSelectorHelp();
  }

  function togglePostSelectorHelp() {
    const existing = document.getElementById('livia-insta-help-card');
    if (existing) {
      existing.remove();
      return;
    }

    const container = document.getElementById('livia-insta-container');
    if (!container) return;

    const activeBiz = cachedBizData?.activeBusiness;
    const city = activeBiz?.city || 'sua região';

    const card = document.createElement('div');
    card.id = 'livia-insta-help-card';
    card.className = 'livia-insta-card';
    card.innerHTML = `
      <h4>
        <span>📸 Levar Post + Foto para o Google</span>
        <span class="livia-insta-card-close" id="livia-insta-card-close">×</span>
      </h4>
      <p style="margin: 0 0 8px 0; color: #ccd6f6;">
        Para capturar a <strong>Foto em Alta Resolução + Legenda com SEO Local para ${city}</strong>:
      </p>
      <ol style="margin: 0 0 10px 0; padding-left: 18px; color: #8892b0; font-size: 12px;">
        <li>Clique em qualquer postagem na grade (ex: <em>"NOTEBOOK TRAVOU?"</em>).</li>
        <li>Assim que o post abrir, clique no botão pulsante da Lívia.</li>
        <li>A Lívia baixa a foto e copia o texto otimizado para você colar no Google!</li>
      </ol>
      <button type="button" class="livia-insta-btn-primary" id="livia-insta-open-latest">
        <span>🚀 Abrir Primeiro Post da Grade Agora</span>
      </button>
    `;

    container.insertBefore(card, container.firstChild);

    card.querySelector('#livia-insta-card-close').onclick = () => card.remove();

    card.querySelector('#livia-insta-open-latest').onclick = () => {
      card.remove();
      const firstPostLink = document.querySelector('article a[href*="/p/"], article a[href*="/reel/"], main a[href*="/p/"], a[href*="/reel/"]');
      if (firstPostLink) {
        firstPostLink.click();
      } else {
        showToast('Clique em qualquer foto da grade para abrir!', null, null);
      }
    };
  }

  async function toggleBusinessSwitcher() {
    const existing = document.getElementById('livia-insta-switch-card');
    if (existing) {
      existing.remove();
      return;
    }

    const container = document.getElementById('livia-insta-container');
    if (!container) return;

    await refreshBusinessData();
    const businesses = cachedBizData?.businesses || [];
    const activeId = cachedBizData?.activeBusinessId;

    const card = document.createElement('div');
    card.id = 'livia-insta-switch-card';
    card.className = 'livia-insta-card';
    card.innerHTML = `
      <h4>
        <span>🏢 Selecionar Empresa Ativa</span>
        <span class="livia-insta-card-close" id="livia-switch-card-close">×</span>
      </h4>
      <p style="margin: 0 0 8px 0; color: #8892b0; font-size: 12px;">
        Escolha para qual ficha do Google Meu Negócio os posts serão direcionados:
      </p>
      <div class="livia-insta-biz-list" id="livia-insta-biz-items"></div>
    `;

    const listContainer = card.querySelector('#livia-insta-biz-items');
    businesses.forEach((biz) => {
      const item = document.createElement('div');
      item.className = `livia-insta-biz-item ${biz.id === activeId ? 'active' : ''}`;
      item.innerHTML = `
        <div>
          <strong>${biz.name}</strong><br>
          <small style="color: #8892b0;">${biz.city || 'Sem cidade'} • ${biz.primaryCategory || biz.niche || 'GMN'}</small>
        </div>
        ${biz.id === activeId ? '<span style="color:#00d2ff; font-weight:bold;">✓ Ativa</span>' : ''}
      `;
      item.onclick = async () => {
        await window.LiviaApi.setActiveBusiness(biz.id);
        card.remove();
        showToast(`Empresa ativa alterada para: ${biz.name}`, null, null);
        injectInstagramBridge();
      };
      listContainer.appendChild(item);
    });

    container.insertBefore(card, container.firstChild);
    card.querySelector('#livia-switch-card-close').onclick = () => card.remove();
  }

  // Listener para menu de contexto (botão direito em texto ou imagem)
  chrome.runtime.onMessage.addListener(async (msg) => {
    if (msg.action === 'optimize_selected_text' && msg.text) {
      const post = new window.LiviaProviders.UniversalPost({ source: 'instagram', text: msg.text });
      const res = await window.LiviaApi.transformPostForLocalSEO(post);
      if (res && res.text) {
        await navigator.clipboard.writeText(res.text);
        showToast('Texto selecionado otimizado com SEO Local e copiado! ✨');
      }
    } else if (msg.action === 'capture_image_for_post' && msg.srcUrl) {
      await refreshBusinessData();
      const activeBiz = cachedBizData?.activeBusiness;
      const bizLabel = getBusinessShortLabel(activeBiz);
      const filename = `post-imagem-${Date.now()}.jpg`;
      const dataUrl = await processAndDownloadMedia(msg.srcUrl, filename);
      const post = new window.LiviaProviders.UniversalPost({ source: 'instagram', text: '', mediaUrls: [msg.srcUrl] });
      const res = await window.LiviaApi.transformPostForLocalSEO(post);

      const postPayload = {
        text: res.text,
        sourceUrl: window.location.href,
        mediaUrls: [msg.srcUrl],
        mediaDataUrl: dataUrl,
        mediaType: 'IMAGE',
        mainMediaFilename: filename,
        businessId: activeBiz?.id || null,
        businessName: activeBiz?.name || bizLabel,
        timestamp: Date.now()
      };
      chrome.storage.local.get(['transformedPostsByBusiness'], (st) => {
        const dict = st.transformedPostsByBusiness || {};
        if (activeBiz?.id) {
          dict[activeBiz.id] = postPayload;
        }
        chrome.storage.local.set({
          lastTransformedPost: postPayload,
          transformedPostsByBusiness: dict
        });
      });
      await navigator.clipboard.writeText(res.text);
      showToast('Imagem baixada e post gerado para o Google! 📸', 'Abrir Google Meu Negócio', () => {
        const q = activeBiz?.name ? encodeURIComponent(activeBiz.name) : 'minha+empresa';
        window.open(`https://www.google.com/search?q=${q}`, '_blank');
      });
    }
  });

  let instaDebounce = null;
  const observer = new MutationObserver(() => {
    clearTimeout(instaDebounce);
    instaDebounce = setTimeout(injectInstagramBridge, 250);
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  window.addEventListener('popstate', () => setTimeout(injectInstagramBridge, 300));

  [100, 400, 1000, 2500].forEach((delay) => {
    setTimeout(injectInstagramBridge, delay);
  });

})();
