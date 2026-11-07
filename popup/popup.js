document.addEventListener('DOMContentLoaded', async () => {
  const bizSelector = document.getElementById('biz-selector');
  const btnAddBiz = document.getElementById('btn-add-biz');
  const displayCompany = document.getElementById('display-company');
  const displayNiche = document.getElementById('display-niche');
  const displayLocation = document.getElementById('display-location');
  const btnOpenGbp = document.getElementById('btn-open-gbp');
  const btnOpenInsta = document.getElementById('btn-open-insta');
  const btnOpenFace = document.getElementById('btn-open-face');
  const btnOpenTiktok = document.getElementById('btn-open-tiktok');
  const popupLicenseBadge = document.getElementById('popup-license-badge');
  const linkOptions = document.getElementById('link-options');
  const btnGenerate = document.getElementById('btn-generate');
  const quickInput = document.getElementById('quick-input');
  const quickActionType = document.getElementById('quick-action-type');
  const resultBox = document.getElementById('result-box');
  const resultText = document.getElementById('result-text');
  const resultTitle = document.getElementById('result-title');
  const btnCopy = document.getElementById('btn-copy');

  let currentBusinessData = null;

  // Carrega lista de empresas e preenche a interface
  async function loadData() {
    currentBusinessData = await window.LiviaApi.getBusinessData();
    const { businesses, activeBusiness, activeBusinessId } = currentBusinessData;

    // Popula o seletor
    bizSelector.innerHTML = '';
    businesses.forEach((b) => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.innerText = b.name;
      if (b.id === activeBusinessId) opt.selected = true;
      bizSelector.appendChild(opt);
    });

    // Atualiza Card de Contexto
    if (activeBusiness) {
      displayCompany.innerText = activeBusiness.name;
      displayNiche.innerText = activeBusiness.primaryCategory || activeBusiness.niche || 'Geral';
      displayLocation.innerText = `${activeBusiness.city} (${activeBusiness.neighborhood})`;
    } else {
      displayCompany.innerText = 'Nenhuma empresa cadastrada';
      displayNiche.innerText = '-';
      displayLocation.innerText = '-';
    }
  }

  await loadData();

  // Troca de Empresa no seletor
  bizSelector.addEventListener('change', async (e) => {
    const newId = e.target.value;
    await window.LiviaApi.setActiveBusiness(newId);
    await loadData();
  });

  // Botão Adicionar Empresa
  btnAddBiz.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html?new=true') });
  });

  // Links rápidos
  const btnCreateListing = document.getElementById('btn-create-listing');
  btnCreateListing?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://business.google.com/create' });
  });

  const btnOpenGeogrid = document.getElementById('btn-open-geogrid');
  btnOpenGeogrid?.addEventListener('click', () => {
    const biz = currentBusinessData?.activeBusiness;
    const q = (biz?.primaryCategory || biz?.niche || 'serviços') + ' em ' + (biz?.city || 'Macatuba');
    chrome.tabs.create({ url: `https://www.google.com/search?q=${encodeURIComponent(q)}` });
  });

  btnOpenGbp?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.google.com/search?q=minha+empresa' });
  });

  btnOpenInsta?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.instagram.com/' });
  });

  btnOpenFace?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.facebook.com/' });
  });

  btnOpenTiktok?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.tiktok.com/' });
  });

  // Carrega status da licença
  try {
    if (window.LiviaApi && window.LiviaApi.getLicenseData) {
      const lic = await window.LiviaApi.getLicenseData();
      if (popupLicenseBadge) {
        popupLicenseBadge.innerText = lic.plan === 'agency' ? 'Agência Pro' : 'Plano Solo';
      }
    }
  } catch (e) {}

  linkOptions.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  // Ajusta o placeholder conforme a ação escolhida
  quickActionType.addEventListener('change', () => {
    const action = quickActionType.value;
    if (action === 'review') {
      quickInput.placeholder = 'Cole a avaliação do cliente (ex: "Carlos: Atendimento muito bom, mas atrasou um pouco")...';
      quickInput.style.display = 'block';
    } else if (action === 'geogrid') {
      quickInput.placeholder = '(Opcional) Digite a palavra-chave ou serviço para simular o ranking (ex: oficina mecanica, motos eletricas)...';
      quickInput.style.display = 'block';
    } else if (action === 'post') {
      quickInput.placeholder = 'Digite uma ideia de post ou tema (ex: "Promoção de sexta-feira pizza em dobro")...';
      quickInput.style.display = 'block';
    } else if (action === 'description') {
      quickInput.placeholder = '(Opcional) Digite algum diferencial específico que gostaria de destacar na descrição...';
      quickInput.style.display = 'block';
    } else if (action === 'weekly_plan') {
      quickInput.placeholder = '(Opcional) Digite algum foco para a semana ou deixe em branco para gerar o plano completo...';
      quickInput.style.display = 'block';
    } else if (action === 'services') {
      quickInput.placeholder = '(Opcional) Digite um serviço específico ou deixe em branco para gerar o catálogo do nicho...';
      quickInput.style.display = 'block';
    } else if (action === 'categories') {
      quickInput.placeholder = '(Opcional) Deixe em branco para sugerir as melhores categorias primária e secundárias...';
      quickInput.style.display = 'block';
    } else if (action === 'qa') {
      quickInput.placeholder = '(Opcional) Deixe em branco para gerar as melhores FAQs estratégicas para o nicho...';
      quickInput.style.display = 'block';
    } else if (action === 'repurpose') {
      quickInput.placeholder = 'Cole a legenda de um post do Instagram ou Facebook para transformar em post de SEO Local...';
      quickInput.style.display = 'block';
    }
  });

  // Gerador com a Lívia
  btnGenerate.addEventListener('click', async () => {
    const action = quickActionType.value;
    const text = quickInput.value.trim();

    const originalBtn = btnGenerate.innerHTML;
    btnGenerate.innerHTML = `<span>⏳</span><span>Lívia processando...</span>`;
    btnGenerate.disabled = true;

    try {
      let output = '';

      if (action === 'review') {
        // Tenta detectar se é crítica
        const isNegative = text.toLowerCase().includes('péssimo') || text.toLowerCase().includes('ruim') || text.toLowerCase().includes('atrasou') || text.toLowerCase().includes('demorou') || text.toLowerCase().includes('horrível') || text.includes('1 estrela') || text.includes('2 estrela');
        const res = await window.LiviaApi.generateReviewReply({
          reviewerName: 'Cliente',
          stars: isNegative ? 2 : 5,
          reviewText: text,
          mode: isNegative ? 'crisis' : 'smart'
        });
        output = res.reply || 'Erro ao gerar resposta.';
        resultTitle.innerText = isNegative ? '🛡️ Resposta de Gestão de Crise:' : '✨ Resposta Otimizada com SEO Local:';
      } else if (action === 'geogrid') {
        const geo = window.LiviaApi.generateGeoGridRanking(currentBusinessData?.activeBusiness, {
          keyword: text || ''
        });
        output = `🗺️ Relatório Geo-Grid — ${geo.companyName} (${geo.city})\nTermo: "${geo.keyword}"\n\n📊 Métricas do Grid:\n• Posição Média (AGR): #${geo.agr}\n• Domínio no Top 3 (SoLV): ${geo.solv}%\n• Bairros no Top 3: ${geo.top3Count} de 9\n• Bairros Fora do Top 3: ${geo.weakBairros.length}\n\n📍 Posicionamento por Bairro:\n${geo.grid.map(g => `• [Ponto ${g.index + 1} - #${g.rank}] ${g.bairro} (${g.distanceKm} km) -> ${g.statusLabel}`).join('\n')}\n\n💡 Recomendações Estratégicas:\n${geo.strategicPlan.map(s => `• ${s}`).join('\n')}`;
        resultTitle.innerText = `🗺️ Geo-Grid de Bairros (AGR: #${geo.agr} • SoLV: ${geo.solv}%):`;
      } else if (action === 'description') {
        const res = await window.LiviaApi.generateBusinessDescription();
        output = res.description || 'Erro ao gerar descrição.';
        resultTitle.innerText = `✍️ Descrição da Empresa (${res.charCount || output.length}/750 chars):`;
      } else if (action === 'weekly_plan') {
        const res = await window.LiviaApi.generateWeeklyContentPlan();
        output = (res.posts || []).map(p => `📅 ${p.day} (${p.type}):\n${p.title}\n\n${p.caption}\n\n📸 Foto: ${p.photoIdea}\n------------------`).join('\n\n');
        resultTitle.innerText = '📅 Plano Semanal de Conteúdo (Google Meu Negócio):';
      } else if (action === 'services') {
        const res = await window.LiviaApi.generateServicesCatalog();
        output = (res.services || []).map(s => `🛠️ ${s.title} (${s.priceType}):\n${s.description}\n`).join('\n');
        resultTitle.innerText = '🛠️ Catálogo de Serviços Otimizados:';
      } else if (action === 'categories') {
        const res = await window.LiviaApi.suggestGoogleCategories();
        output = `⭐ Categoria Primária Recomendada:\n${res.primaryCategory}\n\n📌 Categorias Secundárias de Alto Ranqueamento:\n${res.secondaryCategories.map(c => `• ${c}`).join('\n')}\n\n💡 Dica de SEO: ${res.rankingTip}`;
        resultTitle.innerText = '🏷️ Categorias Estratégicas do Google:';
      } else if (action === 'qa') {
        const res = await window.LiviaApi.generateFaqList();
        output = (res.faqs || []).map(f => `❓ P: ${f.question}\n💡 R: ${f.answer}\n`).join('\n');
        resultTitle.innerText = '❓ Perguntas e Respostas Frequentes (Q&A):';
      } else {
        // post ou repurpose
        const fakePost = new window.LiviaProviders.UniversalPost({
          source: action === 'repurpose' ? 'instagram' : 'manual',
          text: text || 'Novidades e atendimento especial'
        });
        const res = await window.LiviaApi.transformPostForLocalSEO(fakePost);
        output = res.text || 'Erro ao gerar postagem.';
        resultTitle.innerText = '📝 Post Otimizado para o Google Meu Negócio:';
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
