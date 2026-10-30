/**
 * Lívia Copilot — Injeção no Instagram Web
 * Permite ao usuário capturar o post do Instagram e transformar
 * em post otimizado para o Google Meu Negócio com 1 clique.
 */

(function () {
  'use strict';

  console.log('[Lívia Copilot] Ativado no Instagram.');

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

  // Injeta botão flutuante para capturar o post aberto
  function injectInstagramBridge() {
    // Verifica se já existe o botão
    if (document.getElementById('livia-insta-fab')) return;

    const fab = document.createElement('button');
    fab.id = 'livia-insta-fab';
    fab.className = 'livia-fab';
    fab.innerHTML = `
      <div class="livia-fab-icon">✨</div>
      <span>Lívia ➔ Google Meu Negócio</span>
    `;

    fab.addEventListener('click', async () => {
      const originalHtml = fab.innerHTML;
      fab.innerHTML = `<div class="livia-fab-icon">⏳</div><span>Lívia convertendo...</span>`;

      try {
        const post = window.LiviaProviders.InstagramProvider.extractCurrentPost();

        if (!post || (!post.text && post.mediaUrls.length === 0)) {
          showToast('Abra um post do Instagram primeiro para converter!', null, null);
          fab.innerHTML = originalHtml;
          return;
        }

        // Transforma via API da Lívia
        const result = await window.LiviaApi.transformPostForLocalSEO(post);

        if (result && result.text) {
          // Salva no storage para o content script do Google Meu Negócio pegar
          chrome.storage.local.set({
            lastTransformedPost: {
              text: result.text,
              sourceUrl: post.permalink,
              timestamp: Date.now()
            }
          });

          // Copia para a área de transferência
          navigator.clipboard.writeText(result.text);

          showToast('Post convertido para o Google e copiado! ✨', 'Abrir Google Meu Negócio', () => {
            window.open('https://www.google.com/search?q=minha+empresa', '_blank');
          });
        }
      } catch (err) {
        console.error('[Lívia Copilot] Erro ao converter do Instagram:', err);
        showToast('Erro ao processar post.');
      } finally {
        fab.innerHTML = originalHtml;
      }
    });

    document.body.appendChild(fab);
  }

  // Inicializa quando a página carregar
  setTimeout(injectInstagramBridge, 2000);

  // Monitora alterações na URL (quando o usuário navega entre fotos sem recarregar a página)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      injectInstagramBridge();
    }
  }).observe(document, { subtree: true, childList: true });

})();
