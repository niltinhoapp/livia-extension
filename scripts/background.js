/**
 * Lívia Copilot — Service Worker (Background)
 * Manifest V3 - ConectWeb
 */

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Lívia Copilot] Extensão instalada/atualizada com sucesso!');

  // Inicializa configurações padrão se ainda não existirem
  chrome.storage.sync.get(['liviaApiUrl'], (res) => {
    if (!res.liviaApiUrl) {
      chrome.storage.sync.set({
        liviaApiUrl: 'https://livia.conectweb.online/api',
        liviaApiToken: '',
        companyName: 'Minha Empresa',
        companyCity: 'Bauru',
        companyNeighborhood: 'Centro',
        companyNiche: 'Comércio / Serviços',
        companyWhatsapp: '',
        toneOfVoice: 'amigavel'
      });
    }
  });

  // Cria menus de contexto de clique direito
  chrome.contextMenus.create({
    id: 'livia-optimize-selection',
    title: '✨ Otimizar texto selecionado para SEO Local (Lívia)',
    contexts: ['selection']
  });
});

// Listener de cliques no menu de contexto
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'livia-optimize-selection' && info.selectionText) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'optimize_selected_text',
      text: info.selectionText
    });
  }
});

// Gerenciamento de mensagens internas
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'open_options') {
    chrome.runtime.openOptionsPage();
    sendResponse({ ok: true });
  }
  return true;
});
