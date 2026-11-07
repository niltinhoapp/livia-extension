document.addEventListener('DOMContentLoaded', async () => {
  // Elementos das Abas
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Elementos da Aba Empresas
  const bizGridContainer = document.getElementById('biz-grid-container');
  const bizCounter = document.getElementById('biz-counter');
  const btnGoOnboarding = document.getElementById('btn-go-onboarding');
  const btnExportJson = document.getElementById('btn-export-json');
  const btnImportJson = document.getElementById('btn-import-json');
  const fileImportJson = document.getElementById('file-import-json');

  // Elementos do Formulário de Onboarding
  const onboardingForm = document.getElementById('onboarding-form');
  const onboardingFormTitle = document.getElementById('onboarding-form-title');
  const editBizIdInput = document.getElementById('edit-biz-id');
  const bizNameInput = document.getElementById('bizName');
  const bizNicheInput = document.getElementById('bizNiche');
  const bizPrimaryCategoryInput = document.getElementById('bizPrimaryCategory');
  const bizCityInput = document.getElementById('bizCity');
  const bizNeighborhoodInput = document.getElementById('bizNeighborhood');
  const bizServiceAreasInput = document.getElementById('bizServiceAreas');
  const bizServicesInput = document.getElementById('bizServices');
  const bizKeywordsInput = document.getElementById('bizKeywords');
  const bizWhatsappInput = document.getElementById('bizWhatsapp');
  const bizWebsiteInput = document.getElementById('bizWebsite');
  const bizToneInput = document.getElementById('bizTone');
  const bizPolicyInput = document.getElementById('bizPolicy');
  const btnCancelEdit = document.getElementById('btn-cancel-edit');
  const bizSaveMsg = document.getElementById('biz-save-msg');

  // Elementos da Aba Servidor
  const liviaApiUrlInput = document.getElementById('liviaApiUrl');
  const liviaApiTokenInput = document.getElementById('liviaApiToken');
  const btnTestConnection = document.getElementById('btn-test-connection');
  const btnSaveServer = document.getElementById('btn-save-server');
  const connectionStatus = document.getElementById('connection-status');

  // 1. GERENCIAMENTO DE ABAS
  function switchTab(tabId) {
    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    tabContents.forEach(content => {
      content.classList.toggle('active', content.id === tabId);
    });
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  btnGoOnboarding.addEventListener('click', () => {
    resetOnboardingForm();
    switchTab('tab-onboarding');
  });

  // Se veio com ?new=true na URL, abre direto a aba de onboarding
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('new') === 'true') {
    switchTab('tab-onboarding');
  }

  // 2. CARREGAMENTO E RENDERIZAÇÃO DAS EMPRESAS
  async function loadAndRenderBusinesses() {
    const data = await window.LiviaApi.getBusinessData();
    const { businesses, activeBusinessId, liviaApiUrl, liviaApiToken } = data;

    // Atualiza campos de servidor
    liviaApiUrlInput.value = liviaApiUrl;
    liviaApiTokenInput.value = liviaApiToken;

    // Atualiza contador
    bizCounter.innerText = `${businesses.length} ${businesses.length === 1 ? 'Empresa' : 'Empresas'}`;

    bizGridContainer.innerHTML = '';

    if (businesses.length === 0) {
      bizGridContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #0b0f19; border-radius: 8px; border: 1px dashed rgba(255,255,255,0.1);">
          <p style="color: #8892b0; margin-bottom: 12px;">Nenhuma empresa cadastrada ainda.</p>
          <button type="button" class="btn btn-primary" id="btn-empty-onboard">
            <span>➕</span> Cadastrar Primeira Empresa
          </button>
        </div>
      `;
      document.getElementById('btn-empty-onboard')?.addEventListener('click', () => {
        resetOnboardingForm();
        switchTab('tab-onboarding');
      });
      return;
    }

    businesses.forEach(biz => {
      const isActive = biz.id === activeBusinessId;
      const card = document.createElement('div');
      card.className = `biz-card ${isActive ? 'is-active' : ''}`;

      card.innerHTML = `
        ${isActive ? '<span class="biz-card-badge">● ATIVA NO GOOGLE</span>' : ''}
        <div>
          <div class="biz-card-name">${biz.name}</div>
          <div style="font-size: 11px; color: #00d2ff; font-weight: 600; margin-top: 2px;">
            ${biz.primaryCategory || biz.niche}
          </div>
        </div>

        <div class="biz-card-info">
          <span>📍 ${biz.city} (${biz.neighborhood})</span>
          <span>📲 ${biz.whatsapp || 'Sem WhatsApp'}</span>
          <span>🎭 Tom: ${biz.toneOfVoice || 'amigavel'}</span>
        </div>

        <div class="biz-card-actions">
          ${!isActive ? `<button type="button" class="biz-card-btn btn-active-toggle" data-id="${biz.id}">Ativar</button>` : ''}
          <button type="button" class="biz-card-btn btn-edit" data-id="${biz.id}">Editar</button>
          <button type="button" class="biz-card-btn btn-delete" data-id="${biz.id}">Excluir</button>
        </div>
      `;

      bizGridContainer.appendChild(card);
    });

    // Eventos dos botões dos cards
    document.querySelectorAll('.btn-active-toggle').forEach(btn => {
      btn.addEventListener('click', async () => {
        await window.LiviaApi.setActiveBusiness(btn.dataset.id);
        await loadAndRenderBusinesses();
      });
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const biz = businesses.find(b => b.id === id);
        if (biz) populateOnboardingForm(biz);
      });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (confirm('Tem certeza que deseja remover esta empresa?')) {
          await window.LiviaApi.deleteBusiness(id);
          await loadAndRenderBusinesses();
        }
      });
    });
  }

  // 3. FORMULÁRIO DE ONBOARDING / EDIÇÃO
  function resetOnboardingForm() {
    onboardingForm.reset();
    editBizIdInput.value = '';
    onboardingFormTitle.innerText = '➕ Onboarding de Empresa / Cliente';
    btnCancelEdit.style.display = 'none';
    bizSaveMsg.innerText = '';
  }

  function populateOnboardingForm(biz) {
    resetOnboardingForm();
    editBizIdInput.value = biz.id;
    onboardingFormTitle.innerText = `✏️ Editando: ${biz.name}`;
    btnCancelEdit.style.display = 'inline-block';

    bizNameInput.value = biz.name || '';
    bizNicheInput.value = biz.niche || '';
    bizPrimaryCategoryInput.value = biz.primaryCategory || '';
    bizCityInput.value = biz.city || '';
    bizNeighborhoodInput.value = biz.neighborhood || '';
    bizServiceAreasInput.value = biz.serviceAreas || '';
    bizServicesInput.value = Array.isArray(biz.services) ? biz.services.join(', ') : (biz.services || '');
    bizKeywordsInput.value = Array.isArray(biz.secondaryKeywords) ? biz.secondaryKeywords.join(', ') : (biz.secondaryKeywords || '');
    bizWhatsappInput.value = biz.whatsapp || '';
    bizWebsiteInput.value = biz.website || '';
    bizToneInput.value = biz.toneOfVoice || 'amigavel';
    bizPolicyInput.value = biz.reviewReplyPolicy || 'balanced';

    switchTab('tab-onboarding');
  }

  btnCancelEdit.addEventListener('click', () => {
    resetOnboardingForm();
    switchTab('tab-businesses');
  });

  onboardingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const servicesArr = bizServicesInput.value.split(',').map(s => s.trim()).filter(Boolean);
    const keywordsArr = bizKeywordsInput.value.split(',').map(k => k.trim()).filter(Boolean);

    const businessPayload = {
      id: editBizIdInput.value.trim() || undefined,
      name: bizNameInput.value.trim(),
      niche: bizNicheInput.value.trim(),
      primaryCategory: bizPrimaryCategoryInput.value.trim(),
      city: bizCityInput.value.trim(),
      neighborhood: bizNeighborhoodInput.value.trim(),
      serviceAreas: bizServiceAreasInput.value.trim(),
      services: servicesArr,
      secondaryKeywords: keywordsArr,
      whatsapp: bizWhatsappInput.value.trim(),
      website: bizWebsiteInput.value.trim(),
      toneOfVoice: bizToneInput.value,
      reviewReplyPolicy: bizPolicyInput.value
    };

    await window.LiviaApi.saveBusiness(businessPayload);

    bizSaveMsg.className = 'status-msg status-success';
    bizSaveMsg.innerText = '✅ Perfil da empresa salvo com sucesso!';

    setTimeout(() => {
      resetOnboardingForm();
      switchTab('tab-businesses');
      loadAndRenderBusinesses();
    }, 1200);
  });

  // 4. EXPORTAÇÃO E IMPORTAÇÃO DE BACKUP JSON
  btnExportJson.addEventListener('click', async () => {
    const data = await window.LiviaApi.getBusinessData();
    const blob = new Blob([JSON.stringify(data.businesses, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `livia_copilot_empresas_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  btnImportJson.addEventListener('click', () => {
    fileImportJson.click();
  });

  fileImportJson.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const imported = JSON.parse(evt.target.result);
        if (Array.isArray(imported)) {
          const current = await window.LiviaApi.getBusinessData();
          const merged = [...current.businesses];

          imported.forEach(newBiz => {
            if (!merged.some(b => b.name.toLowerCase() === newBiz.name.toLowerCase())) {
              merged.push({
                ...newBiz,
                id: newBiz.id || 'biz_' + Math.random().toString(36).substr(2, 9)
              });
            }
          });

          chrome.storage.sync.set({ businesses: merged }, () => {
            alert('Importação concluída com sucesso!');
            loadAndRenderBusinesses();
          });
        } else {
          alert('O arquivo selecionado não contém uma lista válida de empresas.');
        }
      } catch (err) {
        alert('Erro ao processar arquivo JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  // 5. CONFIGURAÇÕES DO SERVIDOR & API
  btnSaveServer.addEventListener('click', () => {
    const url = liviaApiUrlInput.value.trim();
    const token = liviaApiTokenInput.value.trim();

    chrome.storage.sync.set({
      liviaApiUrl: url,
      liviaApiToken: token
    }, () => {
      connectionStatus.className = 'status-msg status-success';
      connectionStatus.innerText = '✅ Configurações de API salvas com sucesso!';
      setTimeout(() => connectionStatus.innerText = '', 3500);
    });
  });

  btnTestConnection.addEventListener('click', async () => {
    connectionStatus.className = 'status-msg';
    connectionStatus.innerText = 'Testando comunicação com a Lívia...';

    const url = liviaApiUrlInput.value.trim();
    const token = liviaApiTokenInput.value.trim();

    try {
      const res = await fetch(`${url}/health`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        connectionStatus.className = 'status-msg status-success';
        connectionStatus.innerText = '🟢 Conexão com a Lívia estabelecida com sucesso!';
      } else {
        connectionStatus.className = 'status-msg status-error';
        connectionStatus.innerText = `🟡 Servidor respondeu com status ${res.status}. Verifique o token de acesso.`;
      }
    } catch (err) {
      connectionStatus.className = 'status-msg status-error';
      connectionStatus.innerText = `🔴 Não foi possível conectar ao servidor (${err.message}). O modo local autônomo está ativo.`;
    }
  });

  // 5.1 GOOGLE PLACES API (MODO TURBO)
  const googlePlacesApiKeyInput = document.getElementById('googlePlacesApiKey');
  const btnTestGooglePlaces = document.getElementById('btn-test-google-places');
  const btnSaveGooglePlaces = document.getElementById('btn-save-google-places');
  const googlePlacesStatus = document.getElementById('google-places-status');

  if (window.LiviaApi && window.LiviaApi.getGooglePlacesApiKey) {
    window.LiviaApi.getGooglePlacesApiKey().then(k => {
      if (googlePlacesApiKeyInput) googlePlacesApiKeyInput.value = k;
    });
  }

  if (btnSaveGooglePlaces) {
    btnSaveGooglePlaces.addEventListener('click', async () => {
      const key = googlePlacesApiKeyInput.value.trim();
      await window.LiviaApi.saveGooglePlacesApiKey(key);
      googlePlacesStatus.className = 'status-msg status-success';
      googlePlacesStatus.innerText = '✅ Chave do Google Places salva com sucesso!';
      setTimeout(() => googlePlacesStatus.innerText = '', 3500);
    });
  }

  if (btnTestGooglePlaces) {
    btnTestGooglePlaces.addEventListener('click', async () => {
      const key = googlePlacesApiKeyInput.value.trim();
      if (!key) {
        googlePlacesStatus.className = 'status-msg status-error';
        googlePlacesStatus.innerText = '⚠️ Digite a chave de API do Google Places para testar.';
        return;
      }

      googlePlacesStatus.className = 'status-msg';
      googlePlacesStatus.innerText = 'Validando chave com os servidores do Google... ⏳';

      const res = await window.LiviaApi.testGooglePlacesApiKey(key);
      if (res && res.ok) {
        googlePlacesStatus.className = 'status-msg status-success';
        googlePlacesStatus.innerText = '🟢 Sucesso! Chave do Google Places ativa e pronta para o Modo Turbo!';
      } else {
        googlePlacesStatus.className = 'status-msg status-error';
        googlePlacesStatus.innerText = `🔴 Falha na validação do Google: ${res.error || 'Verifique se a Places API está ativada no Google Cloud'}.`;
      }
    });
  }

  // 6. GESTÃO DE MARCA WHITE-LABEL DA AGÊNCIA
  const whitelabelForm = document.getElementById('whitelabel-form');
  const agencyNameInput = document.getElementById('agencyNameInput');
  const agencyWhatsappInput = document.getElementById('agencyWhatsappInput');
  const agencyWebsiteInput = document.getElementById('agencyWebsiteInput');
  const agencySloganInput = document.getElementById('agencySloganInput');
  const agencyColorInput = document.getElementById('agencyColorInput');
  const agencyColorHex = document.getElementById('agencyColorHex');
  const agencyLogoUrlInput = document.getElementById('agencyLogoUrlInput');
  const whitelabelStatus = document.getElementById('whitelabel-status');

  async function loadAgencyBranding() {
    if (!window.LiviaApi || !window.LiviaApi.getAgencyBranding) return;
    const b = await window.LiviaApi.getAgencyBranding();
    if (agencyNameInput) agencyNameInput.value = b.name || '';
    if (agencyWhatsappInput) agencyWhatsappInput.value = b.whatsapp || '';
    if (agencyWebsiteInput) agencyWebsiteInput.value = b.website || '';
    if (agencySloganInput) agencySloganInput.value = b.slogan || '';
    if (agencyColorInput) agencyColorInput.value = b.primaryColor || '#0284c7';
    if (agencyColorHex) agencyColorHex.value = b.primaryColor || '#0284c7';
    if (agencyLogoUrlInput) agencyLogoUrlInput.value = b.logoUrl || '';
  }

  if (agencyColorInput && agencyColorHex) {
    agencyColorInput.addEventListener('input', () => agencyColorHex.value = agencyColorInput.value);
    agencyColorHex.addEventListener('input', () => agencyColorInput.value = agencyColorHex.value);
  }

  if (whitelabelForm) {
    whitelabelForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const brandingObj = {
        name: agencyNameInput.value.trim() || 'Sua Agência',
        whatsapp: agencyWhatsappInput.value.trim() || '',
        website: agencyWebsiteInput.value.trim() || '',
        slogan: agencySloganInput.value.trim() || 'Especialistas em SEO Local & Google Meu Negócio',
        primaryColor: agencyColorHex.value.trim() || '#0284c7',
        logoUrl: agencyLogoUrlInput.value.trim() || ''
      };

      await window.LiviaApi.saveAgencyBranding(brandingObj);
      whitelabelStatus.className = 'status-msg status-success';
      whitelabelStatus.innerText = '✅ Marca da agência salva com sucesso! Os Laudos em PDF agora sairão com a sua assinatura.';
      setTimeout(() => whitelabelStatus.innerText = '', 4000);
    });
  }

  // 7. GESTÃO DE LICENÇA COMERCIAL
  const licenseForm = document.getElementById('license-form');
  const licensePlanTitle = document.getElementById('license-plan-title');
  const licenseCurrentKey = document.getElementById('license-current-key');
  const licenseKeyInput = document.getElementById('licenseKeyInput');
  const licenseEmailInput = document.getElementById('licenseEmailInput');
  const licenseStatusMsg = document.getElementById('license-status-msg');

  async function loadLicenseData() {
    if (!window.LiviaApi || !window.LiviaApi.getLicenseData) return;
    const lic = await window.LiviaApi.getLicenseData();
    if (licensePlanTitle) {
      licensePlanTitle.innerText = lic.plan === 'agency' ? 'Plano Agência Ilimitado' : 'Plano Profissional Solo';
    }
    if (licenseCurrentKey) {
      licenseCurrentKey.innerText = lic.key || 'NENHUMA CHAVE';
    }
  }

  if (licenseForm) {
    licenseForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const key = licenseKeyInput.value.trim();
      const email = licenseEmailInput ? licenseEmailInput.value.trim() : '';
      if (!key) return;

      licenseStatusMsg.className = 'status-msg';
      licenseStatusMsg.innerText = 'Validando chave com o servidor seguro...';

      const res = await window.LiviaApi.activateLicense(key, email);
      if (res.success) {
        licenseStatusMsg.className = 'status-msg status-success';
        licenseStatusMsg.innerText = res.message;
        licenseKeyInput.value = '';
        if (licenseEmailInput) licenseEmailInput.value = '';
        await loadLicenseData();
      } else {
        licenseStatusMsg.className = 'status-msg status-error';
        licenseStatusMsg.innerText = res.message;
      }
      setTimeout(() => licenseStatusMsg.innerText = '', 5000);
    });
  }

  // Carregamento inicial
  await loadAndRenderBusinesses();
  await loadAgencyBranding();
  await loadLicenseData();
});
