/**
 * Lívia Copilot — Injeção no Facebook Web
 * Permite ao usuário capturar posts de Páginas do Facebook e transformar
 * em post otimizado para o Google Meu Negócio.
 */

(function () {
  'use strict';

  console.log('[Lívia Copilot] Ativado no Facebook.');

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

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s ease';
      setTimeout(() => toast.remove(), 500);
    }, 6000);
  }

  function injectFacebookBridge() {
    if (document.getElementById('livia-fb-fab')) return;

    const fab = document.createElement('button');
    fab.id = 'livia-fb-fab';
    fab.className = 'livia-fab';
    fab.innerHTML = `
      <div class="livia-fab-icon">✨</div>
      <span>Lívia: Facebook ➔ Google</span>
    `;

    fab.addEventListener('click', async () => {
      const originalHtml = fab.innerHTML;
      fab.innerHTML = `<div class="livia-fab-icon">⏳</div><span>Convertendo...</span>`;

      try {
        const post = window.LiviaProviders.FacebookProvider.extractCurrentPost();

        if (!post || !post.text) {
          showToast('Nenhum post em destaque encontrado na tela.', null, null);
          fab.innerHTML = originalHtml;
          return;
        }

        const result = await window.LiviaApi.transformPostForLocalSEO(post);

        if (result && result.text) {
          chrome.storage.local.set({
            lastTransformedPost: {
              text: result.text,
              sourceUrl: post.permalink,
              timestamp: Date.now()
            }
          });

          navigator.clipboard.writeText(result.text);

          showToast('Post do Facebook convertido para o Google e copiado!', 'Abrir Google Meu Negócio', () => {
            window.open('https://www.google.com/search?q=minha+empresa', '_blank');
          });
        }
      } catch (err) {
        console.error('[Lívia Copilot] Erro ao converter do Facebook:', err);
        showToast('Erro ao processar post.');
      } finally {
        fab.innerHTML = originalHtml;
      }
    });

    document.body.appendChild(fab);
  }

  setTimeout(injectFacebookBridge, 2500);

})();
