/**
 * Lívia Copilot Pro — Injeção no Facebook Web (v2.0)
 * Permite ao usuário capturar posts e imagens de Páginas do Facebook e transformar
 * em post otimizado com SEO Local para o Google Meu Negócio.
 */

(function () {
  'use strict';

  console.log('[Lívia Copilot Pro] Ativado no Facebook.');

  let cachedBizData = null;

  function showToast(message, actionText, onAction) {
    const existing = document.querySelector('.livia-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'livia-toast';
    toast.innerHTML = `<span>🚀</span><span>${message}</span>`;

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
      a.download = filename || 'post-facebook.jpg';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    return dataUrl;
  }

  async function injectFacebookBridge() {
    if (document.getElementById('livia-fb-fab')) return;

    try {
      cachedBizData = await window.LiviaApi.getBusinessData();
    } catch (e) {}

    const activeBiz = cachedBizData?.activeBusiness;
    const bizLabel = getBusinessShortLabel(activeBiz);

    const fab = document.createElement('button');
    fab.id = 'livia-fb-fab';
    fab.className = 'livia-fab';
    fab.innerHTML = `
      <div class="livia-fab-icon">✨</div>
      <span>Lívia: Facebook ➔ ${bizLabel}</span>
    `;

    fab.addEventListener('click', async () => {
      const originalHtml = fab.innerHTML;
      fab.innerHTML = `<div class="livia-fab-icon">⏳</div><span>Convertendo post e foto...</span>`;

      try {
        const post = window.LiviaProviders.FacebookProvider.extractCurrentPost();

        if (!post || (!post.text && (!post.mediaUrls || post.mediaUrls.length === 0))) {
          showToast('Nenhum post em destaque encontrado na tela. Abra um post primeiro!', null, null);
          fab.innerHTML = originalHtml;
          return;
        }

        const result = await window.LiviaApi.transformPostForLocalSEO(post);

        if (result && result.text) {
          const mediaUrls = post.mediaUrls || [];
          const mainMediaUrl = mediaUrls[0] || null;
          const filename = `post-fb-${Date.now()}.jpg`;
          let mediaDataUrl = null;

          if (mainMediaUrl) {
            mediaDataUrl = await processAndDownloadMedia(mainMediaUrl, filename);
          }

          const postPayload = {
            text: result.text,
            sourceUrl: post.permalink,
            mediaUrls: mediaUrls,
            mediaDataUrl: mediaDataUrl,
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

          await navigator.clipboard.writeText(result.text);

          showToast(
            mainMediaUrl ? 'Post e foto do Facebook salvos e copiados! 📸' : 'Post do Facebook convertido e copiado! ✨',
            'Abrir Google Meu Negócio',
            () => {
              const q = activeBiz?.name ? encodeURIComponent(activeBiz.name) : 'minha+empresa';
              window.open(`https://www.google.com/search?q=${q}`, '_blank');
            }
          );
        }
      } catch (err) {
        console.error('[Lívia Copilot] Erro ao converter do Facebook:', err);
        showToast('Erro ao processar post.');
      } finally {
        fab.innerHTML = originalHtml;
      }
    });

    (document.body || document.documentElement).appendChild(fab);
  }

  let fbDebounce = null;
  const observer = new MutationObserver(() => {
    if (!document.getElementById('livia-fb-fab')) {
      clearTimeout(fbDebounce);
      fbDebounce = setTimeout(injectFacebookBridge, 400);
    }
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  [500, 1500, 3000].forEach(d => setTimeout(injectFacebookBridge, d));

})();
