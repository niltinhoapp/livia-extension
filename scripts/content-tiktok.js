/**
 * Lívia Copilot Pro — Injeção no TikTok Web (v2.0)
 * Permite ao usuário capturar vídeos, capas e legendas do TikTok
 * e transformar em post otimizado com SEO Local para o Google Meu Negócio com 1 clique.
 * ConectWeb 2026.
 */

(function () {
  'use strict';

  console.log('[Lívia Copilot Pro] Ativado no TikTok Web.');

  let cachedBizData = null;

  function showToast(message, actionText, onAction) {
    const existing = document.querySelector('.livia-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'livia-toast';
    toast.innerHTML = `<span>🎵</span><span>${message}</span>`;

    if (actionText && onAction) {
      const actionBtn = document.createElement('button');
      actionBtn.type = 'button';
      actionBtn.className = 'livia-btn-inline';
      actionBtn.style.padding = '4px 12px';
      actionBtn.style.fontSize = '12px';
      actionBtn.style.marginLeft = '8px';
      actionBtn.innerText = actionText;
      actionBtn.onclick = onAction;
      toast.appendChild(actionBtn);
    }

    (document.body || document.documentElement).appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s ease';
      setTimeout(() => toast.remove(), 500);
    }, 6500);
  }

  function getBusinessShortLabel(biz) {
    if (!biz || !biz.name) return 'Google Meu Negócio';
    return biz.name.split(' - ')[0].trim().slice(0, 18);
  }

  async function processAndDownloadMedia(mediaUrl, filename) {
    if (!mediaUrl) return null;
    let dataUrl = null;
    try {
      const bgRes = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'fetch_media_base64', url: mediaUrl }, (res) => resolve(res || null));
      });
      if (bgRes && bgRes.ok && bgRes.dataUrl) {
        dataUrl = bgRes.dataUrl;
      }
    } catch (e) {}

    if (dataUrl) {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = filename || 'post-tiktok.jpg';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    return dataUrl;
  }

  async function injectTikTokBridge() {
    if (document.getElementById('livia-tiktok-fab')) return;

    try {
      if (window.LiviaApi && window.LiviaApi.getBusinessData) {
        cachedBizData = await window.LiviaApi.getBusinessData();
      }
    } catch (e) {}

    const activeBiz = cachedBizData?.activeBusiness;
    const bizLabel = getBusinessShortLabel(activeBiz);

    const fab = document.createElement('button');
    fab.id = 'livia-tiktok-fab';
    fab.className = 'livia-fab livia-tiktok-fab';
    fab.setAttribute('title', `Capturar vídeo do TikTok e transformar em post Local SEO para ${bizLabel}`);
    fab.innerHTML = `
      <div class="livia-fab-icon" style="background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);">🎵</div>
      <span>Lívia: TikTok ➔ ${bizLabel}</span>
    `;

    fab.addEventListener('click', async () => {
      const originalHtml = fab.innerHTML;
      fab.innerHTML = `<div class="livia-fab-icon">⏳</div><span>Convertendo vídeo para SEO Local...</span>`;

      try {
        if (!window.LiviaProviders || !window.LiviaProviders.TikTokProvider) {
          showToast('Módulo de extração do TikTok não carregado.', null, null);
          fab.innerHTML = originalHtml;
          return;
        }

        const post = window.LiviaProviders.TikTokProvider.extractCurrentPost();

        if (!post || (!post.text && (!post.mediaUrls || post.mediaUrls.length === 0))) {
          showToast('Nenhum vídeo em destaque aberto na tela. Clique em um vídeo primeiro!', null, null);
          fab.innerHTML = originalHtml;
          return;
        }

        const result = await window.LiviaApi.transformPostForLocalSEO(post);

        if (result && result.text) {
          const mediaUrls = post.mediaUrls || [];
          const mainMediaUrl = mediaUrls[0] || null;
          const filename = `post-tiktok-${Date.now()}.jpg`;
          let mediaDataUrl = null;

          if (mainMediaUrl) {
            mediaDataUrl = await processAndDownloadMedia(mainMediaUrl, filename);
          }

          const postPayload = {
            source: 'tiktok',
            text: result.text,
            sourceUrl: post.permalink,
            author: post.author || '',
            mediaUrls: mediaUrls,
            mediaDataUrl: mediaDataUrl,
            mediaType: 'VIDEO',
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

          await navigator.clipboard.writeText(result.text);

          showToast(
            mainMediaUrl ? 'Vídeo e capa do TikTok salvos e copiados com SEO! 🎵' : 'Vídeo do TikTok transformado e copiado! ✨',
            'Abrir Google Meu Negócio',
            () => {
              const q = activeBiz?.name ? encodeURIComponent(activeBiz.name) : 'minha+empresa';
              window.open(`https://www.google.com/search?q=${q}`, '_blank');
            }
          );
        }
      } catch (err) {
        console.error('[Lívia Copilot] Erro ao converter do TikTok:', err);
        showToast('Erro ao processar post do TikTok.');
      } finally {
        fab.innerHTML = originalHtml;
      }
    });

    (document.body || document.documentElement).appendChild(fab);
  }

  let ttDebounce = null;
  const observer = new MutationObserver(() => {
    if (!document.getElementById('livia-tiktok-fab')) {
      clearTimeout(ttDebounce);
      ttDebounce = setTimeout(injectTikTokBridge, 400);
    }
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  [600, 1600, 3200].forEach(d => setTimeout(injectTikTokBridge, d));

})();
