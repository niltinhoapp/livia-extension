/**
 * Lívia Copilot — Injeção no Google Meu Negócio & Busca do Google
 * Funcionalidades:
 * 1. Resposta inteligente a avaliações em 1 clique
 * 2. Criador de posts e importador de posts do Instagram/Facebook
 */

(function () {
  'use strict';

  console.log('[Lívia Copilot] Ativado no Google Meu Negócio.');

  // Utilitário para exibir Toast na tela
  function showToast(message, duration = 4000) {
    const existing = document.querySelector('.livia-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'livia-toast';
    toast.innerHTML = `<span>✨</span><span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s ease';
      setTimeout(() => toast.remove(), 500);
    }, duration);
  }

  // Preenche campo de texto simulando digitação humana para o Google reconhecer
  function setNativeValue(element, value) {
    element.focus();
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // 1. MONITORAMENTO DE AVALIAÇÕES (REVIEWS)
  function injectReviewReplyButtons() {
    // Procura caixas de texto de resposta do Google (modais ou listas de avaliações)
    const replyTextareas = document.querySelectorAll(
      'textarea[aria-label*="responder" i], textarea[aria-label*="reply" i], textarea[placeholder*="resposta" i], div[role="dialog"] textarea'
    );

    replyTextareas.forEach((textarea) => {
      // Evita duplicar o botão
      if (textarea.dataset.liviaInjected) return;
      textarea.dataset.liviaInjected = 'true';

      const parentContainer = textarea.parentElement;
      if (!parentContainer) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'livia-btn-inline';
      btn.innerHTML = `<span>✨</span><span>Responder com a Lívia</span>`;
      btn.style.marginTop = '8px';
      btn.style.marginBottom = '8px';

      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const originalBtnHtml = btn.innerHTML;
        btn.innerHTML = `<span>⏳</span><span>Lívia pensando...</span>`;
        btn.disabled = true;

        try {
          // Tenta extrair contexto da avaliação (nome do autor, estrelas, texto)
          const reviewCard = textarea.closest('div[data-review-id]') || textarea.closest('div[role="dialog"]') || textarea.closest('div[jscontroller]');
          let reviewerName = 'Cliente';
          let stars = 5;
          let reviewText = '';

          if (reviewCard) {
            // Tenta pegar nome
            const nameEl = reviewCard.querySelector('div[aria-level="3"], span.WNxzHc, div.TSUbDb, span[class*="author"]');
            if (nameEl) reviewerName = nameEl.innerText.trim();

            // Tenta pegar estrelas
            const starsEl = reviewCard.querySelector('span[aria-label*="estrela" i], span[aria-label*="star" i]');
            if (starsEl) {
              const match = starsEl.getAttribute('aria-label').match(/\d/);
              if (match) stars = parseInt(match[0]);
            }

            // Tenta pegar texto da avaliação
            const textEl = reviewCard.querySelector('span.wiI7pd, div[class*="review-snippet"], span[data-expandable-section]');
            if (textEl) reviewText = textEl.innerText.trim();
          }

          // Chama a API da Lívia
          const result = await window.LiviaApi.generateReviewReply({
            reviewerName,
            stars,
            reviewText
          });

          if (result && result.reply) {
            setNativeValue(textarea, result.reply);
            showToast('Resposta gerada com sucesso pela Lívia! ✨');
          } else {
            showToast('Não foi possível gerar a resposta no momento.');
          }
        } catch (err) {
          console.error('[Lívia Copilot] Erro ao gerar resposta:', err);
          showToast('Erro ao consultar a Lívia.');
        } finally {
          btn.innerHTML = originalBtnHtml;
          btn.disabled = false;
        }
      });

      parentContainer.insertBefore(btn, textarea.nextSibling);
    });
  }

  // 2. MONITORAMENTO DE CRIAÇÃO DE POSTAGENS / ATUALIZAÇÕES
  function injectPostCreationButtons() {
    // Procura modais de "Adicionar atualização" / "Criar post"
    const postModals = document.querySelectorAll('div[role="dialog"]');
    postModals.forEach((modal) => {
      const textarea = modal.querySelector('textarea, div[contenteditable="true"]');
      if (!textarea || textarea.dataset.liviaPostInjected) return;

      // Verifica se parece com modal de criação de post/atualização
      const modalText = modal.innerText.toLowerCase();
      if (!modalText.includes('atualização') && !modalText.includes('post') && !modalText.includes('descrição') && !modalText.includes('novidade')) {
        return;
      }

      textarea.dataset.liviaPostInjected = 'true';

      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.gap = '8px';
      buttonContainer.style.margin = '10px 0';

      // Botão 1: Importar do Instagram
      const btnImportInsta = document.createElement('button');
      btnImportInsta.type = 'button';
      btnImportInsta.className = 'livia-btn-inline livia-btn-secondary';
      btnImportInsta.innerHTML = `<span>📸</span><span>Puxar do Instagram</span>`;

      btnImportInsta.addEventListener('click', async (e) => {
        e.preventDefault();
        chrome.storage.local.get(['lastTransformedPost'], (res) => {
          if (res.lastTransformedPost && res.lastTransformedPost.text) {
            setNativeValue(textarea, res.lastTransformedPost.text);
            showToast('Post do Instagram importado e otimizado para SEO! 🚀');
          } else {
            // Modal para o usuário colar o texto ou link do Instagram
            openManualImportModal(textarea);
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
          showToast('Digite uma ideia inicial ou use "Puxar do Instagram" primeiro!');
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
          showToast('Texto otimizado com palavras-chave locais e chamada para ação! ✨');
        }

        btnSeo.innerHTML = `<span>✨</span><span>Otimizar com a Lívia</span>`;
        btnSeo.disabled = false;
      });

      buttonContainer.appendChild(btnImportInsta);
      buttonContainer.appendChild(btnSeo);
      textarea.parentElement.insertBefore(buttonContainer, textarea);
    });
  }

  // Modal para colar post manualmente do Instagram se não usou o botão de 1-clique
  function openManualImportModal(targetTextarea) {
    const backdrop = document.createElement('div');
    backdrop.className = 'livia-modal-backdrop';

    backdrop.innerHTML = `
      <div class="livia-modal">
        <div class="livia-modal-header">
          <div class="livia-modal-title">
            <span>✨</span> Lívia Copilot — Puxar do Instagram / Facebook
          </div>
          <button class="livia-modal-close">&times;</button>
        </div>
        <div class="livia-modal-body">
          <p style="font-size: 13px; color: #8892b0; margin-bottom: 12px;">
            Cole abaixo a legenda do post do seu Instagram ou Facebook. A Lívia vai converter para formato de SEO Local com palavras-chave da sua cidade e botão de contato!
          </p>
          <textarea id="livia-import-input" placeholder="Cole a legenda do post aqui..."></textarea>
        </div>
        <div class="livia-modal-actions">
          <button type="button" class="livia-btn-inline livia-btn-secondary" id="livia-cancel-btn">Cancelar</button>
          <button type="button" class="livia-btn-inline" id="livia-transform-btn">Transformar para Google 🚀</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const close = () => backdrop.remove();
    backdrop.querySelector('.livia-modal-close').onclick = close;
    backdrop.querySelector('#livia-cancel-btn').onclick = close;

    backdrop.querySelector('#livia-transform-btn').onclick = async () => {
      const input = backdrop.querySelector('#livia-import-input').value;
      if (!input.trim()) return;

      const btn = backdrop.querySelector('#livia-transform-btn');
      btn.innerText = 'Convertendo...';
      btn.disabled = true;

      const post = new window.LiviaProviders.UniversalPost({
        source: 'instagram',
        text: input
      });

      const res = await window.LiviaApi.transformPostForLocalSEO(post);
      if (res && res.text) {
        setNativeValue(targetTextarea, res.text);
        showToast('Post adaptado com sucesso para o Google Meu Negócio! ✨');
        close();
      }
    };
  }

  // 3. OBSERVER PARA PÁGINAS DINÂMICAS DO GOOGLE
  const observer = new MutationObserver(() => {
    injectReviewReplyButtons();
    injectPostCreationButtons();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Executa uma vez no carregamento inicial
  setTimeout(() => {
    injectReviewReplyButtons();
    injectPostCreationButtons();
  }, 1500);

})();
