document.addEventListener('DOMContentLoaded', async () => {
  const displayCompany = document.getElementById('display-company');
  const displayLocation = document.getElementById('display-location');
  const btnOpenGbp = document.getElementById('btn-open-gbp');
  const btnOpenInsta = document.getElementById('btn-open-insta');
  const linkOptions = document.getElementById('link-options');
  const btnGenerate = document.getElementById('btn-generate');
  const quickInput = document.getElementById('quick-input');
  const quickActionType = document.getElementById('quick-action-type');
  const resultBox = document.getElementById('result-box');
  const resultText = document.getElementById('result-text');
  const btnCopy = document.getElementById('btn-copy');

  // Carrega dados salvos
  chrome.storage.sync.get({
    companyName: 'Minha Empresa',
    companyCity: 'Bauru',
    companyNeighborhood: 'Centro'
  }, (items) => {
    displayCompany.innerText = items.companyName;
    displayLocation.innerText = `${items.companyCity} (${items.companyNeighborhood})`;
  });

  // Ações de abertura rápida
  btnOpenGbp.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.google.com/search?q=minha+empresa' });
  });

  btnOpenInsta.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.instagram.com/' });
  });

  linkOptions.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  // Gerador rápido da Lívia dentro do Popup
  btnGenerate.addEventListener('click', async () => {
    const text = quickInput.value.trim();
    if (!text) {
      quickInput.focus();
      return;
    }

    const originalBtn = btnGenerate.innerHTML;
    btnGenerate.innerHTML = `<span>⏳</span><span>Lívia pensando...</span>`;
    btnGenerate.disabled = true;

    try {
      const action = quickActionType.value;
      let output = '';

      if (action === 'review') {
        const res = await window.LiviaApi.generateReviewReply({
          reviewerName: 'Cliente',
          stars: 5,
          reviewText: text
        });
        output = res.reply || 'Erro ao gerar resposta.';
      } else {
        const fakePost = new window.LiviaProviders.UniversalPost({
          source: action === 'repurpose' ? 'instagram' : 'manual',
          text: text
        });
        const res = await window.LiviaApi.transformPostForLocalSEO(fakePost);
        output = res.text || 'Erro ao gerar post.';
      }

      resultText.innerText = output;
      resultBox.style.display = 'block';
    } catch (err) {
      resultText.innerText = 'Erro ao processar: ' + err.message;
      resultBox.style.display = 'block';
    } finally {
      btnGenerate.innerHTML = originalBtn;
      btnGenerate.disabled = false;
    }
  });

  // Copiar resultado
  btnCopy.addEventListener('click', () => {
    navigator.clipboard.writeText(resultText.innerText);
    btnCopy.innerText = 'Copiado!';
    setTimeout(() => {
      btnCopy.innerText = 'Copiar';
    }, 2000);
  });
});
