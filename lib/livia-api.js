/**
 * Lívia Copilot Pro — Núcleo de Inteligência e Integração com API da Lívia (ConectWeb)
 * Suporte a Múltiplas Empresas (Multi-Tenant / Agência), SEO Local Avançado para Google Meu Negócio,
 * Gestão de Avaliações com Análise de Sentimento (Elogios vs Crise), Otimizador de Descrição (750 chars),
 * Sugestão de Categorias Oficiais, Catálogo de Serviços, Q&A Seeder, Plano Semanal e Conversor de Mídia.
 */

class LiviaApiClient {
  constructor() {
    this.defaultApiUrl = 'https://livia.conectweb.online/api';
    this.storageCache = null;
  }

  // --- GESTÃO DE MÚLTIPLAS EMPRESAS (MULTI-TENANT / AGÊNCIA) ---

  /**
   * Perfis iniciais pré-calibrados para garantir funcionamento imediato.
   */
  getDefaultBusinesses() {
    return [
      {
        id: 'biz_conectweb_default',
        name: 'ConectWeb Soluções Digitais',
        niche: 'Marketing Digital, Criação de Sites e Automações',
        primaryCategory: 'Agência de Marketing Digital',
        secondaryKeywords: ['criação de sites', 'seo local', 'google meu negócio', 'gestão de tráfego', 'automações comerciais'],
        services: [
          'Criação de Sites Profissionais e Sistemas',
          'Gestão e Otimização de Google Meu Negócio',
          'Tráfego Pago (Google Ads e Meta Ads)',
          'Consultoria de SEO Local e Posicionamento',
          'Automações Comerciais com Inteligência Artificial'
        ],
        city: 'Macatuba',
        neighborhood: 'Centro',
        serviceAreas: 'Macatuba, Lençóis Paulista, Bauru, Pederneiras e Região',
        whatsapp: '5514996988997',
        website: 'https://conectweb.online',
        toneOfVoice: 'profissional',
        reviewReplyPolicy: 'balanced',
        savedDescription: 'A ConectWeb Soluções Digitais é a sua referência em Marketing Digital e Sistemas em Macatuba no bairro Centro. Com foco em resultados comprovados, somos especialistas em soluções estratégicas de alta performance para empresas, marcas e profissionais que buscam acelerar suas vendas e presença digital.\n\nDestaques dos nossos serviços: Criação de Sites e Sistemas, Gestão de Google Meu Negócio, Tráfego Pago e Redes Sociais, Consultoria de SEO Local, Automações Digitais. Unimos inteligência artificial e estratégias locais para transformar visualizações no Maps em novos clientes para o seu negócio.\n\nSolicite um diagnóstico ou orçamento direto pelo WhatsApp: 5514996988997. Conecte sua empresa aos melhores resultados!',
        createdAt: new Date().toISOString()
      },
      {
        id: 'biz_sos_notebook_default',
        name: 'SOS Notebook - Manutenção e Upgrade',
        niche: 'Assistência Técnica de Notebooks, Computadores e PC Gamer',
        primaryCategory: 'Assistência técnica de informática',
        secondaryKeywords: ['conserto de notebook', 'manutenção de computadores', 'formatação', 'upgrade ssd', 'pc gamer horizonte'],
        services: [
          'Formatação nos Padrões de Fábrica com Backup',
          'Upgrade de SSD Ultra Rápido e Memória RAM',
          'Troca de Telas, Teclados, Baterias e Dobradiças',
          'Limpeza Interna Completa e Troca de Pasta Térmica (CPU/GPU)',
          'Montagem e Manutenção de PC Gamer e Computadores Comerciais',
          'Reparo Avançado de Placa-Mãe e Peças Originais'
        ],
        city: 'Horizonte',
        neighborhood: 'Diadema',
        serviceAreas: 'Horizonte, Pacajus, Chorozinho e Região Metropolitana - CE',
        whatsapp: '5585991187871',
        website: '',
        toneOfVoice: 'amigavel',
        reviewReplyPolicy: 'balanced',
        createdAt: new Date().toISOString()
      },
      {
        id: 'biz_dahora_motos_matriz',
        name: 'DA HORA MOTOS ELÉTRICAS',
        niche: 'Venda de Motos Elétricas, Scooters e Assistência Técnica',
        primaryCategory: 'Oficina mecânica de motos',
        secondaryKeywords: [
          'motos elétricas macatuba',
          'scooter elétrica',
          'oficina mecânica de motos',
          'autopropelidos sem cnh',
          'assistência técnica moto elétrica'
        ],
        services: [
          'Venda de Scooters Elétricas e Motos Autopropelidas',
          'Assistência Técnica Especializada em Motos Elétricas',
          'Venda e Manutenção de Baterias de Lítio e Chumbo',
          'Revisão Preventiva, Freios e Parte Elétrica',
          'Triciclos Elétricos, Carrinhos de Drift e Patinetes'
        ],
        city: 'Macatuba',
        neighborhood: 'Jardim Capri',
        address: 'Alameda Tiradentes, 348 - Jardim Capri, Macatuba - SP, 17290-000',
        postalCode: '17290-000',
        serviceAreas: 'Macatuba, Lençóis Paulista, Bauru, Pederneiras e Região',
        whatsapp: '5514998877886',
        website: 'https://dahoramotoseletricas.com',
        toneOfVoice: 'amigavel',
        reviewReplyPolicy: 'balanced',
        savedDescription: 'A DA HORA MOTOS ELÉTRICAS é a sua loja e oficina especializada em mobilidade elétrica em Macatuba - SP. Oferecemos scooters elétricas, motos autopropelidas sem CNH, triciclos, patinetes, baterias de lítio e assistência técnica de alta precisão.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'biz_dahora_motos_loja2',
        name: 'DAHORA MOTOS - Loja 2',
        niche: 'Concessionária de Motos Elétricas, Scooters e Veículos Sustentáveis',
        primaryCategory: 'Concessionária de motos',
        secondaryKeywords: [
          'loja 2 dahora motos',
          'motos elétricas jardim planalto',
          'concessionária de motos macatuba',
          'scooters elétricas macatuba',
          'patinetes e triciclos elétricos'
        ],
        services: [
          'Showroom e Venda de Scooters Elétricas Zero KM',
          'Motos Autopropelidas sem Necessidade de CNH',
          'Triciclos Elétricos e Carrinhos de Drift',
          'Patinetes Elétricos, E-bikes e Acessórios',
          'Baterias de Lítio, Carregadores Bivolt e Peças Originais',
          'Assistência Técnica Autorizada e Manutenção'
        ],
        city: 'Macatuba',
        neighborhood: 'Jardim Planalto',
        address: 'Rua José Cruzera, 2-41 - Jardim Planalto, Macatuba - SP, 17293-000',
        postalCode: '17293-000',
        serviceAreas: 'Macatuba, Jardim Planalto, Lençóis Paulista e Região',
        whatsapp: '5514998877886',
        website: 'https://dahoramotoseletricas.com',
        toneOfVoice: 'amigavel',
        reviewReplyPolicy: 'balanced',
        savedDescription: 'Chegou a DAHORA MOTOS - Loja 2 no Jardim Planalto em Macatuba! Somos a sua concessionária e assistência técnica especializada em mobilidade elétrica, scooters e veículos autopropelidos sem necessidade de CNH.\n\nNa nossa Loja 2 (Rua José Cruzera, 2-41), você encontra:\n🏁 Triciclos Elétricos de Drift (Drift Trikes para manobras e lazer)\n⚡ Scooters e Motos Elétricas modernas de alta autonomia\n🛵 Modelos Autopropelidos sem CNH (econômicos e recarregam na tomada)\n🛺 Triciclos Elétricos de Passeio e Mobilidade\n🛴 Patinetes Elétricos e E-bikes\n🔋 Baterias de Lítio, Carregadores Bivolt e Peças\n🛠️ Oficina e Manutenção Especializada\n\nDiga adeus ao posto de gasolina! Venha fazer um test-drive e acelerar no Jardim Planalto!',
        createdAt: new Date().toISOString()
      }
    ];
  }

  /**
   * Retorna a lista completa de empresas cadastradas e a empresa ativa.
   * Realiza migração e calibração automática de dados legados (v1.0).
   */
  async getBusinessData() {
    return new Promise((resolve) => {
      chrome.storage.sync.get({
        liviaApiUrl: this.defaultApiUrl,
        liviaApiToken: '',
        activeBusinessId: null,
        businesses: [],
        companyName: null,
        companyCity: null,
        companyNeighborhood: null,
        companyNiche: null,
        companyWhatsapp: null,
        toneOfVoice: null
      }, (data) => {
        let businesses = Array.isArray(data.businesses) ? [...data.businesses] : [];
        let activeId = data.activeBusinessId;
        const defaults = this.getDefaultBusinesses();

        if (businesses.length === 0) {
          businesses = [...defaults];
          activeId = businesses[0].id;

          chrome.storage.sync.set({
            businesses: businesses,
            activeBusinessId: activeId
          });
        } else {
          let updatedAny = false;

          // Limpa valores genéricos herdados da v1.0
          businesses.forEach(b => {
            if (b.name === 'Minha Empresa' || b.name === 'conectweb') {
              b.name = 'ConectWeb Soluções Digitais';
              updatedAny = true;
            }
            if (b.niche === 'Comércio / Serviços' || !b.niche) {
              b.niche = 'Marketing Digital, Criação de Sites e Automações';
              updatedAny = true;
            }
            if (!b.primaryCategory || b.primaryCategory === 'Comércio / Serviços' || b.primaryCategory === 'Empresa Local') {
              b.primaryCategory = 'Agência de Marketing Digital';
              updatedAny = true;
            }
            if (!b.services || b.services.length === 0 || b.services[0].includes('Comércio')) {
              b.services = defaults[0].services;
              updatedAny = true;
            }
            if ((b.name.toLowerCase().includes('conectweb')) && (b.city === 'Bauru' || !b.city)) {
              b.city = 'Macatuba';
              b.serviceAreas = 'Macatuba, Lençóis Paulista e Região';
              updatedAny = true;
            }
            if (b.name.toLowerCase().includes('conectweb') && !b.savedDescription) {
              b.savedDescription = defaults[0].savedDescription;
              updatedAny = true;
            }
          });

          // Garante que a SOS Notebook também esteja cadastrada se ainda não estiver na lista
          const hasSos = businesses.some(b => b.name && b.name.toLowerCase().includes('sos notebook'));
          if (!hasSos && defaults[1]) {
            businesses.push(defaults[1]);
            updatedAny = true;
          }

          // Garante que a Matriz da Da Hora Motos esteja na lista
          const hasDaHora1 = businesses.some(b => b.name && b.name.toLowerCase().includes('da hora motos') && !b.name.toLowerCase().includes('loja 2'));
          if (!hasDaHora1 && defaults[2]) {
            businesses.push(defaults[2]);
            updatedAny = true;
          }

          // Garante que a Loja 2 da Da Hora Motos esteja na lista
          const hasDaHora2 = businesses.some(b => b.name && (b.name.toLowerCase().includes('loja 2') || b.name.toLowerCase().includes('planalto')));
          if (!hasDaHora2 && defaults[3]) {
            businesses.push(defaults[3]);
            updatedAny = true;
          }

          if (updatedAny) {
            chrome.storage.sync.set({ businesses });
          }
        }

        if (!activeId || !businesses.some(b => b.id === activeId)) {
          activeId = businesses[0]?.id || null;
        }

        const activeBusiness = businesses.find(b => b.id === activeId) || businesses[0] || null;

        resolve({
          liviaApiUrl: data.liviaApiUrl || this.defaultApiUrl,
          liviaApiToken: data.liviaApiToken || '',
          activeBusinessId: activeId,
          activeBusiness: activeBusiness,
          businesses: businesses
        });
      });
    });
  }

  /**
   * Salva ou atualiza uma empresa na lista.
   */
  async saveBusiness(businessData) {
    const { businesses, activeBusinessId } = await this.getBusinessData();
    let updatedBusinesses = [...businesses];

    if (!businessData.id) {
      // Verifica se já existe pelo nome para atualizar em vez de duplicar
      const existingIdx = updatedBusinesses.findIndex(
        b => b.name && businessData.name && b.name.toLowerCase().trim() === businessData.name.toLowerCase().trim()
      );
      if (existingIdx !== -1) {
        businessData.id = updatedBusinesses[existingIdx].id;
        updatedBusinesses[existingIdx] = {
          ...updatedBusinesses[existingIdx],
          ...businessData,
          updatedAt: new Date().toISOString()
        };
      } else {
        businessData.id = 'biz_' + Date.now();
        businessData.createdAt = new Date().toISOString();
        updatedBusinesses.push(businessData);
      }
    } else {
      const idx = updatedBusinesses.findIndex(b => b.id === businessData.id);
      if (idx !== -1) {
        updatedBusinesses[idx] = { ...updatedBusinesses[idx], ...businessData, updatedAt: new Date().toISOString() };
      } else {
        updatedBusinesses.push(businessData);
      }
    }

    const newActiveId = activeBusinessId || businessData.id;

    return new Promise((resolve) => {
      chrome.storage.sync.set({
        businesses: updatedBusinesses,
        activeBusinessId: newActiveId
      }, () => {
        resolve({ success: true, business: businessData, businesses: updatedBusinesses });
      });
    });
  }

  /**
   * Define qual empresa é a ativa no momento.
   */
  async setActiveBusiness(businessId) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ activeBusinessId: businessId }, () => {
        resolve({ success: true, activeBusinessId: businessId });
      });
    });
  }

  /**
   * Remove uma empresa da lista.
   */
  async deleteBusiness(businessId) {
    const { businesses, activeBusinessId } = await this.getBusinessData();
    const updated = businesses.filter(b => b.id !== businessId);
    let newActiveId = activeBusinessId;

    if (activeBusinessId === businessId) {
      newActiveId = updated.length > 0 ? updated[0].id : null;
    }

    return new Promise((resolve) => {
      chrome.storage.sync.set({
        businesses: updated,
        activeBusinessId: newActiveId
      }, () => {
        resolve({ success: true, businesses: updated, activeBusinessId: newActiveId });
      });
    });
  }

  /**
   * Detecta automaticamente a empresa na tela atual com base no nome.
   */
  async matchBusinessByPageText(pageText) {
    if (!pageText) return null;
    const { businesses, activeBusiness } = await this.getBusinessData();
    const cleanPage = pageText.toLowerCase();

    for (const biz of businesses) {
      if (biz.name && cleanPage.includes(biz.name.toLowerCase())) {
        return biz;
      }
    }

    return activeBusiness;
  }

  // --- GERENCIAMENTO DE MARCA WHITE-LABEL DA AGÊNCIA (PARA REVENDA E LAUDOS PDF) ---

  async getAgencyBranding() {
    return new Promise((resolve) => {
      chrome.storage.sync.get({
        agencyBranding: {
          name: 'ConectWeb Soluções Digitais',
          whatsapp: '5514996988997',
          website: 'https://conectweb.online',
          slogan: 'Especialistas em SEO Local & Performance',
          logoUrl: '',
          primaryColor: '#0284c7'
        }
      }, (res) => {
        resolve(res.agencyBranding);
      });
    });
  }

  async saveAgencyBranding(branding) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ agencyBranding: branding }, () => {
        resolve({ success: true, agencyBranding: branding });
      });
    });
  }

  // --- GERENCIAMENTO DE LICENCIAMENTO COMERCIAL (SaaS / B2B) ---

  async getLicenseData() {
    return new Promise((resolve) => {
      chrome.storage.sync.get({
        liviaLicense: {
          key: 'LIVIA-AGENCY-PRO-2026',
          plan: 'agency', // 'agency' | 'pro' | 'trial' | 'expired'
          status: 'active',
          holderName: 'ConectWeb Enterprise',
          expiresAt: null, // null = vitalício
          features: {
            unlimitedBusinesses: true,
            whiteLabelPdf: true,
            socialRepurposeTikTok: true,
            crisisManagement: true
          }
        }
      }, (res) => {
        resolve(res.liviaLicense);
      });
    });
  }

  async activateLicense(licenseKey, clientEmail = '') {
    const cleanKey = (licenseKey || '').trim().toUpperCase();
    if (!cleanKey) return { success: false, message: 'Por favor, insira uma chave de licença válida.' };

    const { liviaApiUrl } = await this.getBusinessData();

    // 1. Tenta validação online no servidor central da ConectWeb
    if (liviaApiUrl) {
      try {
        const response = await fetch(`${liviaApiUrl}/license/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            licenseKey: cleanKey,
            clientEmail: (clientEmail || '').trim(),
            extensionVersion: '2.0.0'
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.valid) {
            const serverLicenseObj = {
              key: cleanKey,
              plan: data.plan || 'agency',
              status: 'active',
              holderName: data.holderName || (data.plan === 'agency' ? 'Plano Agência Ilimitado' : 'Plano Profissional Solo'),
              activatedAt: new Date().toISOString(),
              expiresAt: data.expiresAt || null,
              token: data.token || null,
              features: data.features || {
                unlimitedBusinesses: true,
                whiteLabelPdf: true,
                socialRepurposeTikTok: true,
                crisisManagement: true
              }
            };

            await new Promise(r => chrome.storage.sync.set({ liviaLicense: serverLicenseObj }, r));
            return {
              success: true,
              message: `Licença ${serverLicenseObj.plan.toUpperCase()} validada com sucesso pelo servidor oficial! 🚀`,
              license: serverLicenseObj
            };
          } else if (data && data.message) {
            return { success: false, message: data.message };
          }
        }
      } catch (err) {
        console.warn('[Lívia Copilot] Servidor central offline ou não configurado, avaliando chave no modo local:', err);
      }
    }

    // 2. Modo Autônomo / Validação de Chave Mestre
    const isValidKeyFormat = (cleanKey.startsWith('LIVIA-AGY-') || cleanKey.startsWith('LIVIA-PRO-') || cleanKey.includes('AGENCY') || cleanKey.includes('PRO'));
    if (!isValidKeyFormat || cleanKey.length < 12) {
      return {
        success: false,
        message: 'Chave de licença inválida. Verifique os dígitos e o formato (ex: LIVIA-AGY-XXXX-XXXX-XXXX).'
      };
    }

    let plan = 'pro';
    if (cleanKey.includes('AGY') || cleanKey.includes('AGENCY') || cleanKey.includes('AGENCIA') || cleanKey.includes('ENTERPRISE')) {
      plan = 'agency';
    }

    const licenseObj = {
      key: cleanKey,
      plan: plan,
      status: 'active',
      holderName: plan === 'agency' ? 'Plano Agência Ilimitado' : 'Plano Profissional Solo',
      activatedAt: new Date().toISOString(),
      expiresAt: null,
      features: {
        unlimitedBusinesses: true,
        whiteLabelPdf: true,
        socialRepurposeTikTok: true,
        crisisManagement: true
      }
    };

    return new Promise((resolve) => {
      chrome.storage.sync.set({ liviaLicense: licenseObj }, () => {
        resolve({ success: true, message: `Licença ${plan.toUpperCase()} ativada com sucesso! 🚀`, license: licenseObj });
      });
    });
  }

  // --- GOOGLE PLACES API (INTEGRAÇÃO OFICIAL TURBO) ---

  async getGooglePlacesApiKey() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['googlePlacesApiKey'], (res) => {
        resolve((res.googlePlacesApiKey || '').trim());
      });
    });
  }

  async saveGooglePlacesApiKey(key) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ googlePlacesApiKey: (key || '').trim() }, () => {
        resolve({ success: true, googlePlacesApiKey: (key || '').trim() });
      });
    });
  }

  async testGooglePlacesApiKey(key) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'test_google_places_api', apiKey: key }, (res) => {
        resolve(res || { ok: false, error: 'Sem resposta do worker.' });
      });
    });
  }

  async searchGooglePlaces(query, city = '') {
    const key = await this.getGooglePlacesApiKey();
    if (!key) return { ok: false, error: 'Chave da Google Places API não configurada.' };

    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'search_google_places',
        apiKey: key,
        query,
        city
      }, (res) => {
        resolve(res || { ok: false, error: 'Sem resposta do worker.' });
      });
    });
  }

  async getGooglePlaceDetails(placeId) {
    const key = await this.getGooglePlacesApiKey();
    if (!key) return { ok: false, error: 'Chave da Google Places API não configurada.' };

    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'get_google_place_details',
        apiKey: key,
        placeId
      }, (res) => {
        resolve(res || { ok: false, error: 'Sem resposta do worker.' });
      });
    });
  }

  // --- CONECTIVIDADE COM A API DA LÍVIA ---

  async ping() {
    const data = await this.getBusinessData();
    try {
      const response = await fetch(`${data.liviaApiUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${data.liviaApiToken}`,
          'Accept': 'application/json'
        }
      });
      return { ok: response.ok, status: response.status };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  // --- DETECTOR DE SEGMENTO INTERNO ---

  _detectSegmentType(biz) {
    const str = `${biz.name || ''} ${biz.niche || ''} ${biz.primaryCategory || ''} ${(biz.services || []).join(' ')}`.toLowerCase();
    if (str.includes('sushi') || str.includes('japonês') || str.includes('japones') || str.includes('temaki') || str.includes('sashimi') || str.includes('oriental') || str.includes('yakisoba')) {
      return 'japanese_food';
    }
    if (str.includes('pizza') || str.includes('restaurante') || str.includes('gastronom') || str.includes('comida') || str.includes('lanch') || str.includes('hamburg') || str.includes('burger') || str.includes('churrasc') || str.includes('padaria') || str.includes('bar ') || str.endsWith(' bar') || str.includes('açaí') || str.includes('café') || str.includes('sorvet') || str.includes('delivery')) {
      return 'food';
    }
    if (str.includes('notebook') || str.includes('informát') || str.includes('computador') || str.includes('pc gamer') || str.includes('ssd') || str.includes('formata') || str.includes('assistência técnica')) {
      return 'it_repair';
    }
    if (str.includes('saude') || str.includes('saúde') || str.includes('odonto') || str.includes('dent') || str.includes('medic') || str.includes('médic') || str.includes('clínica') || str.includes('clinica') || str.includes('fisio') || str.includes('psic')) {
      return 'health';
    }
    if (str.includes('salão') || str.includes('salao') || str.includes('barbearia') || str.includes('estética') || str.includes('estetica') || str.includes('beleza') || str.includes('cabel') || str.includes('manicure') || str.includes('spa')) {
      return 'beauty';
    }
    if (str.includes('imobili') || str.includes('imóve') || str.includes('imove') || str.includes('corretor') || str.includes('loteamento') || str.includes('aluguel de casas')) {
      return 'real_estate';
    }
    if (str.includes('advog') || str.includes('juríd') || str.includes('jurid') || str.includes('contab')) {
      return 'legal';
    }
    if (str.includes('carro') || str.includes('auto') || str.includes('mecânic') || str.includes('mecanic') || str.includes('oficina') || str.includes('pneu') || str.includes('estética automotiva')) {
      return 'automotive';
    }
    if (str.includes('market') || str.includes('site') || str.includes('software') || str.includes('sistema') || str.includes('seo') || str.includes('digit') || str.includes('automa') || str.includes('tráfego')) {
      return 'digital_agency';
    }
    return 'general_services';
  }

  // --- MOTOR 1: TRANSFORMAÇÃO DE POST SOCIAL PARA SEO LOCAL (GMN) ---

  async transformPostForLocalSEO(universalPost, options = {}) {
    const { activeBusiness, liviaApiUrl, liviaApiToken } = await this.getBusinessData();
    const biz = options.business || activeBusiness;

    const payload = {
      action: 'repurpose_social_post',
      source: universalPost.source || 'social',
      postType: options.postType || 'update', // 'update', 'offer', 'tip', 'event'
      originalText: universalPost.getCleanedCaption ? universalPost.getCleanedCaption() : (universalPost.text || ''),
      mediaUrls: universalPost.mediaUrls || [],
      context: {
        companyName: biz.name,
        city: biz.city,
        neighborhood: biz.neighborhood,
        serviceAreas: biz.serviceAreas,
        niche: biz.niche,
        primaryCategory: biz.primaryCategory,
        services: biz.services || [],
        secondaryKeywords: biz.secondaryKeywords || [],
        whatsapp: biz.whatsapp,
        website: biz.website,
        tone: biz.toneOfVoice || 'amigavel',
        segmentType: this._detectSegmentType(biz)
      }
    };

    if (liviaApiToken && liviaApiToken.trim() !== '') {
      try {
        const response = await fetch(`${liviaApiUrl}/copilot/transform`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${liviaApiToken}`
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.optimizedPost) {
            return {
              success: true,
              text: data.optimizedPost,
              ctaType: data.ctaType || 'WHATSAPP_OR_CALL',
              keywordsUsed: data.keywords || []
            };
          }
        }
      } catch (err) {
        console.warn('[Lívia Copilot] API Lívia indisponível, usando motor de SEO local da extensão:', err);
      }
    }

    return this._localPostTransformer(payload);
  }

  // --- MOTOR 2: RESPOSTA INTELIGENTE A AVALIAÇÕES (ELOGIOS VS GESTÃO DE CRISE) ---

  async generateReviewReply({ reviewerName, stars, reviewText, mode = 'smart' }, options = {}) {
    const { activeBusiness, liviaApiUrl, liviaApiToken } = await this.getBusinessData();
    const biz = options.business || activeBusiness;
    const parsedStars = parseInt(stars, 10) || 5;

    const payload = {
      action: 'generate_review_reply',
      reviewerName: reviewerName || 'Cliente',
      stars: parsedStars,
      reviewText: reviewText || '',
      mode: mode, // 'smart', 'seo_local', 'executive', 'crisis', 'sales_hook'
      context: {
        companyName: biz.name,
        city: biz.city,
        neighborhood: biz.neighborhood,
        niche: biz.niche,
        primaryCategory: biz.primaryCategory,
        services: biz.services || [],
        whatsapp: biz.whatsapp,
        tone: biz.toneOfVoice || 'amigavel',
        policy: biz.reviewReplyPolicy || 'balanced'
      }
    };

    if (liviaApiToken && liviaApiToken.trim() !== '') {
      try {
        const response = await fetch(`${liviaApiUrl}/copilot/review-reply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${liviaApiToken}`
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.reply) {
            return { success: true, reply: data.reply };
          }
        }
      } catch (err) {
        console.warn('[Lívia Copilot] Erro na API Lívia, usando fallback:', err);
      }
    }

    return this._localReviewReplyGenerator(payload);
  }

  // --- MOTOR 3: GERADOR DE DESCRIÇÃO OTIMIZADA PARA O PERFIL (750 CHARS) ---

  async generateBusinessDescription(options = {}) {
    const { activeBusiness, liviaApiUrl, liviaApiToken } = await this.getBusinessData();
    const biz = options.business || activeBusiness;

    const payload = {
      action: 'generate_business_description',
      context: {
        companyName: biz.name,
        niche: biz.niche,
        primaryCategory: biz.primaryCategory,
        secondaryKeywords: biz.secondaryKeywords || [],
        services: biz.services || [],
        city: biz.city,
        neighborhood: biz.neighborhood,
        serviceAreas: biz.serviceAreas,
        whatsapp: biz.whatsapp,
        website: biz.website,
        tone: biz.toneOfVoice || 'amigavel',
        segmentType: this._detectSegmentType(biz)
      }
    };

    if (liviaApiToken && liviaApiToken.trim() !== '') {
      try {
        const response = await fetch(`${liviaApiUrl}/copilot/description`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${liviaApiToken}`
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.description) {
            return { success: true, description: data.description, charCount: data.description.length };
          }
        }
      } catch (err) {
        console.warn('[Lívia Copilot] Erro na API ao gerar descrição:', err);
      }
    }

    return this._localDescriptionGenerator(payload);
  }

  // --- MOTOR 4: GERADOR DE SUGESTÕES DE SERVIÇOS & PRODUTOS ---

  async generateServicesCatalog(options = {}) {
    const { activeBusiness } = await this.getBusinessData();
    const biz = options.business || activeBusiness;
    const seg = this._detectSegmentType(biz);

    let baseServices = (biz.services && biz.services.length > 0) ? biz.services : [];

    if (baseServices.length === 0) {
      if (seg === 'it_repair') {
        baseServices = [
          'Formatação nos Padrões de Fábrica com Backup',
          'Upgrade de SSD e Memória RAM para Notebooks e PCs',
          'Troca de Tela, Teclado e Bateria de Notebook',
          'Limpeza Interna Completa e Troca de Pasta Térmica',
          'Manutenção e Montagem de PC Gamer',
          'Reparo Especializado de Placa-Mãe'
        ];
      } else if (seg === 'japanese_food') {
        baseServices = [
          'Sushi, Sashimi e Combinados Especiais',
          'Rodízio Japonês Completo e Barcas de Sushi',
          'Temakis, Hot Rolls e Pratos Quentes (Yakisoba)',
          'Delivery Rápido e Pedidos para Viagem'
        ];
      } else if (seg === 'food') {
        baseServices = [
          'Cardápio Especial e Pratos Feitos na Hora',
          'Delivery Rápido e Pedidos pelo WhatsApp',
          'Atendimento Familiar e Espaço Aconchegante',
          'Combos e Promoções Especiais da Semana'
        ];
      } else if (seg === 'real_estate') {
        baseServices = [
          'Compra e Venda de Casas, Apartamentos e Terrenos',
          'Locação e Administração Completa de Imóveis',
          'Avaliação Imobiliária e Consultoria de Financiamento',
          'Imóveis Comerciais, Galpões e Loteamentos'
        ];
      } else if (seg === 'digital_agency') {
        baseServices = [
          'Criação de Sites Profissionais e Landing Pages',
          'Gestão e Otimização de Google Meu Negócio (SEO Local)',
          'Gestão de Tráfego Pago (Google Ads e Meta Ads)',
          'Automações Comerciais e Chatbots com IA',
          'Desenvolvimento de Sistemas Web Sob Medida'
        ];
      } else {
        baseServices = [
          `Consultoria e Atendimento Especializado em ${biz.niche}`,
          `Serviços Premium em ${biz.city}`,
          `Orçamento Personalizado e Diagnóstico Técnico`,
          `Atendimento Ágil com Garantia de Qualidade`
        ];
      }
    }

    const catalog = baseServices.map((serviceName, index) => {
      const priceTypes = ['Orçamento Gratuito', 'Sob Consulta', 'Atendimento Rápido', 'Garantia Inclusa'];
      const price = priceTypes[index % priceTypes.length];

      return {
        title: serviceName,
        category: biz.primaryCategory || biz.niche,
        priceType: price,
        description: `Especialistas em ${serviceName} na ${biz.name} em ${biz.city} (bairro ${biz.neighborhood}). Trabalhamos com tecnologia de ponta, transparência e garantia total. Solicite seu orçamento pelo WhatsApp: ${biz.whatsapp || 'no perfil'}!`
      };
    });

    return {
      success: true,
      services: catalog
    };
  }

  // --- MOTOR 5: RECOMENDADOR DE CATEGORIAS OFICIAIS DO GOOGLE ---

  async suggestGoogleCategories(options = {}) {
    const { activeBusiness } = await this.getBusinessData();
    const biz = options.business || activeBusiness;
    const seg = this._detectSegmentType(biz);

    let primary = biz.primaryCategory || 'Empresa Local';
    let secondaries = [];
    let rankingTip = '';

    if (seg === 'it_repair') {
      primary = 'Assistência técnica de informática';
      secondaries = [
        'Serviço de conserto de computadores',
        'Loja de informática',
        'Suporte e serviços de informática',
        'Serviço de recuperação de dados',
        'Loja de acessórios para computador'
      ];
      rankingTip = 'No Google Maps, "Assistência técnica de informática" e "Serviço de conserto de computadores" dominam as buscas de clientes com notebook travando ou tela quebrada. Adicione "Loja de informática" para aparecer também para quem procura SSD, fontes e peças.';
    } else if (seg === 'digital_agency') {
      primary = 'Agência de marketing digital';
      secondaries = [
        'Designer de sites',
        'Serviço de consultoria de marketing',
        'Empresa de software',
        'Agência de publicidade',
        'Serviço de comércio eletrônico'
      ];
      rankingTip = '"Agência de marketing digital" é a categoria número 1 para atrair empresas locais. Ter "Designer de sites" e "Empresa de software" como secundárias garante posicionamento para buscas de criação de sites e sistemas.';
    } else if (seg === 'health') {
      primary = 'Clínica odontológica';
      secondaries = [
        'Dentista',
        'Ortodontista',
        'Clínica de implantes dentários',
        'Consultório médico'
      ];
      rankingTip = 'Use a categoria clínica principal na primária e adicione cada especialidade atendida nas categorias secundárias para multiplicar as buscas no Maps.';
    } else if (seg === 'japanese_food') {
      primary = 'Restaurante japonês';
      secondaries = [
        'Restaurante de sushi',
        'Restaurante de comida para viagem',
        'Serviço de entrega de refeições (Delivery)',
        'Restaurante asiático'
      ];
      rankingTip = '"Restaurante japonês" e "Restaurante de sushi" são essenciais para dominar as buscas locais por combinados, rodízio e delivery.';
    } else if (seg === 'food') {
      primary = 'Pizzaria';
      secondaries = [
        'Restaurante de comida para viagem',
        'Serviço de entrega de refeições (Delivery)',
        'Restaurante italiano',
        'Lanchonete'
      ];
      rankingTip = 'Ter "Serviço de entrega de refeições" como secundária garante destaque nas buscas por delivery à noite.';
    } else if (seg === 'real_estate') {
      primary = 'Imobiliária';
      secondaries = [
        'Corretor de imóveis',
        'Agência de aluguel de imóveis',
        'Consultor imobiliário',
        'Avaliador de imóveis',
        'Construtora'
      ];
      rankingTip = '"Imobiliária" e "Agência de aluguel de imóveis" são as categorias de maior volume no Google Maps para captar proprietários, inquilinos e compradores de imóveis na cidade.';
    } else if (seg === 'legal') {
      primary = 'Escritório de advocacia';
      secondaries = [
        'Advogado',
        'Serviços jurídicos',
        'Consultoria empresarial',
        'Advogado especialista'
      ];
      rankingTip = 'Mantenha "Escritório de advocacia" na primária e especifique as áreas de atuação nas categorias secundárias.';
    } else if (seg === 'automotive') {
      primary = 'Oficina mecânica';
      secondaries = [
        'Centro de reparação automotiva',
        'Serviço de troca de óleo',
        'Autoelétrica',
        'Loja de peças automotivas'
      ];
      rankingTip = 'Adicionar "Serviço de troca de óleo" e "Autoelétrica" atrai motoristas com necessidades imediatas na sua região.';
    } else {
      primary = biz.primaryCategory || 'Prestador de serviços';
      secondaries = [
        'Serviços especializados',
        'Consultoria técnica',
        'Comércio e serviços locais',
        'Atendimento empresarial e residencial'
      ];
      rankingTip = 'A categoria primária deve ser o termo exato do seu serviço mais vendido. As secundárias devem cobrir os serviços complementares.';
    }

    return {
      success: true,
      primaryCategory: primary,
      secondaryCategories: secondaries,
      rankingTip: rankingTip
    };
  }

  // --- MOTOR 6: CALENDÁRIO SEMANAL DE POSTS DO GOOGLE MEU NEGÓCIO (3 POSTS ADAPTADOS POR NICHO) ---

  async generateWeeklyContentPlan(options = {}) {
    const { activeBusiness } = await this.getBusinessData();
    const biz = options.business || activeBusiness;
    const seg = this._detectSegmentType(biz);

    const s1 = (biz.services && biz.services[0]) ? biz.services[0] : biz.niche;
    const s2 = (biz.services && biz.services[1]) ? biz.services[1] : 'atendimento técnico especializado';
    const s3 = (biz.services && biz.services[2]) ? biz.services[2] : 'soluções completas com garantia';
    const whats = biz.whatsapp ? `\n\n📲 Chame no WhatsApp: ${biz.whatsapp}` : `\n\n📍 Entre em contato pelo nosso perfil no Google!`;

    let posts = [];

    if (seg === 'it_repair') {
      posts = [
        {
          day: 'Segunda-feira',
          type: '🛠️ Solução de Problema Urgente',
          title: `Seu Notebook travou ou está lento em ${biz.city}? A ${biz.name} resolve!`,
          caption: `Nada pior do que precisar trabalhar ou estudar e o computador travar! 💻⚡\n\nAqui na ${biz.name} (bairro ${biz.neighborhood}, ${biz.city}), somos especialistas em deixar sua máquina nova de novo:\n✅ ${s1}\n✅ ${s2}\n✅ ${s3}\n\nTraga seu equipamento para uma avaliação técnica rápida e segura!${whats}`,
          photoIdea: 'Foto de um notebook aberto na bancada técnica ou imagem de antes/depois de limpeza interna e instalação de SSD.',
          ctaButton: 'Ligar agora / Saiba mais'
        },
        {
          day: 'Quarta-feira',
          type: '💡 Dica Técnica do Especialista',
          title: `Quando trocar a pasta térmica e fazer limpeza no seu Notebook ou PC Gamer?`,
          caption: `Seu notebook está esquentando muito ou fazendo barulho alto no cooler? 🔥💻\n\nO superaquecimento reduz a vida útil do processador e da placa de vídeo, além de causar travamentos constantes.\n\nNa ${biz.name} em ${biz.city}, realizamos a limpeza interna completa e aplicação de pasta térmica de alta condutividade para máxima performance e segurança do seu equipamento!${whats}`,
          photoIdea: 'Foto mostrando a limpeza interna do cooler/dissipador e aplicação de pasta térmica nova.',
          ctaButton: 'Saiba mais / Fale conosco'
        },
        {
          day: 'Sexta-feira',
          type: '🚀 Upgrade de Performance (SSD & Memória)',
          title: `Deixe seu Notebook até 10x mais rápido com Upgrade de SSD na ${biz.name}!`,
          caption: `Você não precisa comprar um computador novo para ter velocidade! 🚀\n\nCom a instalação de um SSD e upgrade de memória RAM na ${biz.name} (${biz.city}), seu notebook liga em segundos e abre todos os programas sem travar, mantendo seus arquivos seguros.\n\nPeças originais para todas as marcas com garantia! Solicite seu orçamento agora mesmo.${whats}`,
          photoIdea: 'Foto segurando um SSD novo ao lado de um notebook rápido e pronto para entrega.',
          ctaButton: 'Solicitar orçamento / Ligar'
        }
      ];
    } else if (seg === 'digital_agency') {
      posts = [
        {
          day: 'Segunda-feira',
          type: '📢 Posicionamento & Geração de Leads',
          title: `Sua empresa em ${biz.city} está sendo encontrada no topo do Google?`,
          caption: `Todos os dias, clientes prontos para comprar pesquisam pelo seu serviço no Google e no Maps. Se a sua empresa não aparece nas primeiras posições, você está entregando vendas para a concorrência! 📈\n\nA ${biz.name} em ${biz.city} é especialista em:\n✅ ${s1}\n✅ ${s2}\n✅ ${s3}\n\nTransforme seu perfil e sua presença digital em uma máquina de vendas!${whats}`,
          photoIdea: 'Tela do computador mostrando gráficos de crescimento no Google Meu Negócio ou um site moderno desenvolvido pela agência.',
          ctaButton: 'Saiba mais / Solicitar diagnóstico'
        },
        {
          day: 'Quarta-feira',
          type: '💡 Estratégia de Crescimento Digital',
          title: `Por que ter um Site Profissional e Automação Comercial aumenta suas vendas?`,
          caption: `Responder clientes com agilidade e transmitir autoridade imediata são os dois pilares das empresas que mais crescem hoje. 💡🚀\n\nNa ${biz.name} (${biz.city}), criamos sites rápidos, sistemas personalizados e automações inteligentes para que sua empresa venda todos os dias com alta conversão.${whats}`,
          photoIdea: 'Mockup de um site responsivo em notebook e celular ou fluxo de automação de atendimento.',
          ctaButton: 'Fale conosco / Saiba mais'
        },
        {
          day: 'Sexta-feira',
          type: '🔥 Diagnóstico Estratégico de SEO Local',
          title: `Solicite uma análise da presença digital da sua empresa com a ${biz.name}!`,
          caption: `Quer descobrir como atrair mais clientes qualificados em ${biz.city} e região? 🎯\n\nNossa equipe na ${biz.name} prepara um plano sob medida unindo Google Meu Negócio, Tráfego Pago e Criação de Sites para escalar os resultados do seu negócio.\n\nEntre em contato agora e agende sua consultoria!${whats}`,
          photoIdea: 'Arte institucional da ConectWeb ou foto do escritório/equipe em planejamento estratégico.',
          ctaButton: 'Ligar agora / Agendar consultoria'
        }
      ];
    } else {
      posts = [
        {
          day: 'Segunda-feira',
          type: '📢 Novidade & Autoridade Local',
          title: `Excelência em ${biz.niche} em ${biz.city} é na ${biz.name}!`,
          caption: `Procurando atendimento de confiança em ${biz.city}? Na ${biz.name} (bairro ${biz.neighborhood}), nossa equipe está pronta para atender você com:\n✅ ${s1}\n✅ ${s2}\n\nQualidade comprovada, transparência e compromisso com o seu resultado!${whats}`,
          photoIdea: `Foto real do serviço de ${s1} sendo executado ou fachada/ambiente da empresa.`,
          ctaButton: 'Ligar agora / Saiba mais'
        },
        {
          day: 'Quarta-feira',
          type: '💡 Dica do Especialista',
          title: `Por que escolher especialistas em ${biz.niche} faz toda a diferença?`,
          caption: `Na hora de contratar ${s1} em ${biz.city}, conte com quem oferece garantia, materiais de primeira linha e atendimento personalizado.\n\nNa ${biz.name}, cuidamos de cada etapa com atenção total aos detalhes para superar suas expectativas!${whats}`,
          photoIdea: 'Foto detalhada de um projeto concluído ou antes e depois do serviço.',
          ctaButton: 'Saiba mais'
        },
        {
          day: 'Sexta-feira',
          type: '🔥 Condição Especial & Orçamento Rápido',
          title: `Solicite seu orçamento na ${biz.name} em ${biz.city}!`,
          caption: `Precisando de ${s1} ou ${s2} com agilidade no bairro ${biz.neighborhood} e região? 🌟\n\nFale direto com a equipe da ${biz.name} e garanta condições especiais de atendimento e pagamento facilitado!${whats}`,
          photoIdea: 'Foto destacando o principal serviço ou equipe pronta para atender.',
          ctaButton: 'Solicitar orçamento / Ligar'
        }
      ];
    }

    return {
      success: true,
      businessName: biz.name,
      city: biz.city,
      posts: posts
    };
  }

  // --- MOTOR 7: GERADOR DE PERGUNTAS E RESPOSTAS FREQUENTES (Q&A SEEDER) ---

  async generateFaqList(options = {}) {
    const { activeBusiness } = await this.getBusinessData();
    const biz = options.business || activeBusiness;
    const seg = this._detectSegmentType(biz);

    const servicesList = (biz.services && biz.services.length > 0)
      ? biz.services.join(', ')
      : biz.niche;

    const faqs = [
      {
        question: `Onde fica localizada a ${biz.name} e quais regiões vocês atendem?`,
        answer: `Estamos localizados em ${biz.city}, no bairro ${biz.neighborhood}. Atendemos clientes de toda a região (${biz.serviceAreas || biz.city}) com máxima agilidade e qualidade.`
      },
      {
        question: `Quais são os principais serviços realizados pela ${biz.name}?`,
        answer: `Somos especialistas em ${biz.niche}. Nossos principais serviços incluem: ${servicesList}. Trabalhamos com garantia e atendimento personalizado.`
      },
      {
        question: `Como faço para solicitar um orçamento ou diagnóstico pelo WhatsApp?`,
        answer: `É muito simples! Basta clicar no botão de contato aqui na nossa ficha do Google ou enviar uma mensagem direto para o nosso WhatsApp comercial: ${biz.whatsapp || 'disponível no perfil'}. Respondemos rapidamente!`
      },
      {
        question: seg === 'it_repair'
          ? `Vocês trabalham com peças originais e dão garantia nos consertos de notebooks e computadores?`
          : `Quais são as formas de pagamento aceitas pela ${biz.name}?`,
        answer: seg === 'it_repair'
          ? `Sim!Na ${biz.name} utilizamos peças originais de todas as marcas para troca de telas, baterias, teclados e upgrades de SSD/Memória, com garantia completa em todos os serviços e formatações.`
          : `Aceitamos Pix, cartões de crédito com parcelamento facilitado e cartões de débito, além de condições comerciais personalizadas para cada projeto.`
      },
      {
        question: `Qual o horário de atendimento da ${biz.name} em ${biz.city}?`,
        answer: `Atendemos de segunda a sexta em horário comercial e aos sábados. Para verificar disponibilidade imediata ou agendar um horário específico, chame nossa equipe no WhatsApp ${biz.whatsapp || ''}!`
      }
    ];

    return {
      success: true,
      faqs: faqs
    };
  }

  // --- UTILITÁRIO DE SEO PARA IMAGENS (RENOMEAÇÃO AUTOMÁTICA DE ARQUIVOS) ---

  buildSeoFilename(biz, suffix = 'destaque', ext = 'png') {
    const clean = (str) => (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const namePart = clean(biz?.name || 'empresa-local').slice(0, 28);
    const catPart = clean(biz?.primaryCategory || biz?.niche || 'servicos').slice(0, 28);
    const cityPart = clean(biz?.city || 'regiao').slice(0, 20);
    const sufPart = clean(suffix).slice(0, 18);

    return `${namePart}-${catPart}-${cityPart}-${sufPart}.${ext}`;
  }

  // --- MOTOR 8: AUDITOR DE PERFIL LOCAL REAL-TIME + BOTÕES "RESOLVER AGORA" (0 A 100%) ---

  auditProfileHeuristics(profileData) {
    let score = 0;
    const checks = [];

    // 1. Nome da Empresa na Ficha do Google (10 pts)
    const rawName = (profileData.kpName || '').trim();
    if (!rawName) {
      checks.push({
        id: 'title',
        label: 'Nome da Empresa não detectado na ficha do Google',
        detail: 'Abra a pesquisa da empresa no Google para auditar o título.',
        status: 'fail',
        fixAction: 'AUTO_FIX_TITLE',
        fixLabel: '⚡ Resolver Agora: Otimizar Título'
      });
    } else {
      const isAllLower = rawName === rawName.toLowerCase();
      const wordCount = rawName.split(/\s+/).length;
      if (isAllLower || wordCount === 1) {
        score += 4;
        checks.push({
          id: 'title',
          label: `Título da ficha básico ou minúsculo: "${rawName}" (+4/10 pts)`,
          detail: `O nome na ficha tem apenas "${rawName}". Use iniciais maiúsculas e adicione a especialidade principal (ex: "${rawName.charAt(0).toUpperCase() + rawName.slice(1)} - ${profileData.categoryText || 'Soluções Digitais'}") em Editar perfil.`,
          status: 'warn',
          fixAction: 'AUTO_FIX_TITLE',
          fixLabel: '⚡ Resolver Agora: Auto-Preencher Título SEO'
        });
      } else {
        score += 10;
        checks.push({
          id: 'title',
          label: `Título comercial otimizado: "${rawName}" (+10/10 pts)`,
          detail: 'Bom uso de marca e palavras-chave no título da ficha.',
          status: 'pass',
          fixAction: 'AUTO_FIX_TITLE',
          fixLabel: '✏️ Ajustar Título'
        });
      }
    }

    // 2. Categoria Primária e Secundárias (10 pts)
    if (profileData.hasCategory) {
      score += 10;
      checks.push({
        id: 'category',
        label: `Categoria Primária ativa: ${profileData.categoryText || 'Configurada'} (+10/10 pts)`,
        detail: 'Adicione também as 4 categorias secundárias recomendadas para multiplicar as buscas no Google Maps.',
        status: 'pass',
        fixAction: 'AUTO_FIX_CATEGORIES',
        fixLabel: '⚡ Inserir Categorias Secundárias'
      });
    } else {
      checks.push({
        id: 'category',
        label: 'Categoria Primária não identificada na ficha (0/10 pts)',
        detail: 'A categoria primária é o fator nº 1 de posicionamento no Google Maps.',
        status: 'fail',
        fixAction: 'AUTO_FIX_CATEGORIES',
        fixLabel: '⚡ Resolver Agora: Inserir Categoria'
      });
    }

    // 3. Medidor Nativo "Força do Perfil" do Google (10 pts)
    if (profileData.hasIncompleteStrengthWarning) {
      checks.push({
        id: 'strength',
        label: 'Força do Perfil baixa no medidor nativo do Google (0/10 pts)',
        detail: 'O Google está exibindo alertas de cadastro incompleto ("Completar perfil" / "Informações completas").',
        status: 'fail',
        fixAction: 'AUTO_FIX_STRENGTH',
        fixLabel: '⚡ Resolver Agora: Abrir Completar Perfil'
      });
    } else {
      score += 10;
      checks.push({
        id: 'strength',
        label: 'Sem alertas críticos de cadastro básico pendente (+10/10 pts)',
        detail: 'Indicadores básicos de configuração validados.',
        status: 'pass'
      });
    }

    // 4. Fotos, Capa, Logotipo e Postagens Ativas (15 pts)
    if (profileData.missingPhotosAlert || !profileData.hasRealPhotos) {
      checks.push({
        id: 'photos',
        label: 'Perfil sem fotos na capa, logotipo ou postagens recentes (0/15 pts)',
        detail: 'A ficha está sem fotos reais visíveis (o Google exibe o alerta "Fotos chamam a atenção" ou apenas o mapa). Publique agora uma atualização com foto otimizada!',
        status: 'fail',
        fixAction: 'AUTO_FIX_POST_PHOTO',
        fixLabel: '⚡ Resolver Agora: Auto-Publicar Post + Foto'
      });
    } else {
      score += 15;
      checks.push({
        id: 'photos',
        label: 'Fotos e identidade visual presentes na ficha (+15/15 pts)',
        detail: 'Continue postando novas fotos toda semana usando a automação em 1 clique.',
        status: 'pass',
        fixAction: 'AUTO_FIX_POST_PHOTO',
        fixLabel: '⚡ Criar Novo Post em 1 Clique'
      });
    }

    // 5. Descrição Pública Visível no Google (15 pts)
    if (profileData.descriptionLength >= 400) {
      score += 15;
      checks.push({
        id: 'description',
        label: `Descrição publicada e rica em SEO na ficha (${profileData.descriptionLength}/750 chars) (+15/15 pts)`,
        detail: 'Descrição visível publicamente no painel da empresa.',
        status: 'pass',
        fixAction: 'AUTO_FIX_DESCRIPTION',
        fixLabel: '✍️ Atualizar Descrição (1 Clique)'
      });
    } else if (profileData.descriptionLength > 20) {
      score += 8;
      checks.push({
        id: 'description',
        label: `Descrição pública curta na ficha (${profileData.descriptionLength}/750 chars) (+8/15 pts)`,
        detail: 'Clique em Resolver Agora para a Lívia abrir o perfil e preencher automaticamente os 750 caracteres com SEO Local.',
        status: 'warn',
        fixAction: 'AUTO_FIX_DESCRIPTION',
        fixLabel: '⚡ Resolver Agora: Auto-Preencher 750 chars'
      });
    } else {
      const hasDraft = profileData.isManagedClient && profileData.hasSavedDraftInLivia;
      checks.push({
        id: 'description',
        label: 'Descrição ausente ou não exibida na ficha pública do Google (0/15 pts)',
        detail: hasDraft
          ? 'Você já tem a descrição de 750 chars pronta na Lívia! Clique no botão ao lado para a Lívia abrir o "Editar perfil" e preencher o campo sozinha.'
          : `A ficha não apresenta a seção "Da empresa" (descrição de 750 caracteres) otimizada com palavras-chave de ${profileData.categoryText || 'serviços'} em ${profileData.detectedCity || 'sua cidade'}.`,
        status: 'fail',
        fixAction: 'AUTO_FIX_DESCRIPTION',
        fixLabel: '⚡ Resolver Agora: Auto-Preencher Descrição'
      });
    }

    // 6. Volume de Avaliações (Reviews) e Nota (15 pts)
    const revCount = profileData.reviewCount || 0;
    if (revCount === 0) {
      checks.push({
        id: 'reviews',
        label: 'Nenhuma avaliação no Google encontrada (0/15 pts)',
        detail: 'Perfis sem avaliações não ranqueiam no Top 3. Gere agora o Link + Script de WhatsApp e Plaquinha QR Code para conquistar as primeiras 10 avaliações!',
        status: 'fail',
        fixAction: 'AUTO_FIX_REVIEWS',
        fixLabel: '⚡ Resolver Agora: Kit Acelerador de Avaliações'
      });
    } else if (revCount < 10) {
      score += 5;
      checks.push({
        id: 'reviews',
        label: `Poucas avaliações no Google: apenas ${revCount} avaliação(ões) (+5/15 pts)`,
        detail: `Sua nota é excelente, mas ${revCount} avaliação é pouco para dominar o Top 3. Meta mínima recomendada: 15 a 30 avaliações com palavras-chave.`,
        status: 'warn',
        fixAction: 'AUTO_FIX_REVIEWS',
        fixLabel: '⚡ Resolver Agora: Pedir Avaliações + Responder'
      });
    } else if (revCount < 45) {
      score += 10;
      checks.push({
        id: 'reviews',
        label: `Volume intermediário de avaliações (${revCount} avaliações no Google) (+10/15 pts)`,
        detail: 'Bom início, mas os líderes locais costumam ter acima de 80 avaliações. Solicite avaliações semanalmente para superar o Top 3.',
        status: 'warn',
        fixAction: 'AUTO_FIX_REVIEWS',
        fixLabel: '⚡ Kit de Avaliações & Auto-Resposta'
      });
    } else {
      score += 15;
      checks.push({
        id: 'reviews',
        label: `Forte prova social: ${revCount} avaliações no Google (+15/15 pts)`,
        detail: 'Autoridade de avaliações consolidada na região!',
        status: 'pass',
        fixAction: 'AUTO_FIX_REVIEWS',
        fixLabel: '⚡ Responder Avaliações'
      });
    }

    // 7. Endereço Físico Local e Calibração do Mapa (15 pts)
    if (profileData.hasStreetAddress) {
      score += 15;
      checks.push({
        id: 'address',
        label: `Endereço físico local visível na ficha (+15/15 pts)`,
        detail: profileData.addressText || `Localização configurada em ${profileData.detectedCity || 'sua região'}.`,
        status: 'pass'
      });
    } else {
      checks.push({
        id: 'address',
        label: 'Ficha sem endereço físico local completo / Área de cobertura aberta (0/15 pts)',
        detail: 'Empresas sem rua e número locais visíveis na ficha dependem estritamente da área de cobertura declarada e perdem relevância no ranking hiperlocal por proximidade no Google Maps.',
        status: 'fail',
        fixAction: 'AUTO_FIX_ADDRESS',
        fixLabel: '⚡ Resolver Agora: Configurar Endereço Local'
      });
    }

    // 8. Telefone, Horário de Funcionamento e Site (10 pts)
    if (profileData.hasPhone && profileData.hasHours) {
      score += 10;
      checks.push({
        id: 'contact',
        label: 'Telefone comercial e Horário de funcionamento visíveis (+10/10 pts)',
        detail: `Contato ${profileData.phoneText || ''} e horários ativos na ficha.${profileData.hasWebsite ? ' Website vinculado!' : ' ⚠️ Atenção: Ficha sem site próprio vinculado (oportunidade de melhoria)!'}`,
        status: 'pass',
        fixAction: !profileData.hasWebsite ? 'AUTO_FIX_CONTACT' : null,
        fixLabel: !profileData.hasWebsite ? '⚡ Vincular Site / WhatsApp' : null
      });
    } else if (profileData.hasPhone || profileData.hasHours) {
      score += 5;
      checks.push({
        id: 'contact',
        label: `Contato parcial: ${profileData.hasPhone ? 'Falta Horário de funcionamento' : 'Falta Telefone comercial'} (+5/10 pts)`,
        detail: 'Preencha tanto o telefone quanto os horários de abertura/fechamento em "Editar perfil".',
        status: 'warn',
        fixAction: 'AUTO_FIX_CONTACT',
        fixLabel: '⚡ Resolver Agora: Completar Contato/Horário'
      });
    } else {
      checks.push({
        id: 'contact',
        label: 'Telefone e Horário de funcionamento ausentes na ficha (0/10 pts)',
        detail: 'Configure imediatamente telefone e horário comercial.',
        status: 'fail',
        fixAction: 'AUTO_FIX_CONTACT',
        fixLabel: '⚡ Resolver Agora: Inserir Telefone/Horário'
      });
    }

    const finalScore = Math.min(score, 100);
    let grade = 'Fraco / Crítico (D)';
    if (finalScore >= 90) grade = 'Excelente (A+)';
    else if (finalScore >= 75) grade = 'Muito Bom (A)';
    else if (finalScore >= 55) grade = 'Regular / Em Otimização (B)';
    else if (finalScore >= 40) grade = 'Baixo / Incompleto (C)';

    return {
      score: finalScore,
      grade: grade,
      checks: checks
    };
  }

  /**
   * MOTOR DE ALTA PRECISÃO: PLANO DE AÇÃO PARA O TOP 1 (DECODIFICAÇÃO DO ALGORITMO DO GOOGLE)
   * Estrutura os passos cirúrgicos divididos em 3 Níveis:
   * 1. Nível 1: Travas Críticas de Ranqueamento (Próximas 24 Horas)
   * 2. Nível 2: Aceleradores do Top 3 (Próximos 7 Dias)
   * 3. Nível 3: Dominação e Consolidação Top 1 (Rotina Semanal)
   */
  generateTop1ActionPlan(profileData, auditResult, options = {}) {
    const checks = (auditResult && auditResult.checks) ? auditResult.checks : [];
    const score = auditResult?.score || 0;
    const kpName = profileData?.kpName || options.business?.name || 'Sua Empresa';
    const city = profileData?.detectedCity || options.business?.city || 'sua cidade';
    const category = profileData?.categoryText || options.business?.primaryCategory || 'seu segmento';

    // 1. Nível 1: Travas Críticas (24h)
    const tier1 = [];

    // Categoria
    const catCheck = checks.find(c => c.id === 'category');
    if (!catCheck || catCheck.status !== 'pass') {
      tier1.push({
        id: 'category_fix',
        title: 'Calibrar Categoria Primária & Categorias Ocultas',
        whyGoogle: 'A categoria primária é responsável por mais de 50% do filtro de relevância do Google Maps. Faltar categorias secundárias impede aparecer em buscas combinadas.',
        action: `Defina "${category}" como primária e adicione 3 a 5 categorias correlatas na seção Editar perfil.`,
        fixAction: 'AUTO_FIX_CATEGORY',
        fixLabel: '⚡ Ajustar Categorias',
        status: catCheck ? catCheck.status : 'fail'
      });
    } else {
      tier1.push({
        id: 'category_ok',
        title: 'Categoria Primária Ativa e Relevante',
        whyGoogle: 'O Google já reconhece seu nicho principal no índice local.',
        action: `Categoria "${category}" confirmada.`,
        fixAction: null,
        fixLabel: null,
        status: 'pass'
      });
    }

    // Descrição
    const descCheck = checks.find(c => c.id === 'description');
    if (!descCheck || descCheck.status === 'fail') {
      tier1.push({
        id: 'desc_fix',
        title: 'Inserir Descrição "Da Empresa" (750 Caracteres)',
        whyGoogle: 'Fichas sem descrição perdem a chance de indexar 15 a 20 termos de cauda longa que os clientes digitam no Maps.',
        action: `Preencha os 750 caracteres com histórico, lista de serviços e menção a ${city}.`,
        fixAction: 'AUTO_FIX_DESCRIPTION',
        fixLabel: '⚡ Auto-Preencher 750 chars',
        status: 'fail'
      });
    } else if (descCheck.status === 'warn') {
      tier1.push({
        id: 'desc_expand',
        title: 'Expandir Descrição para 750 Caracteres Completos',
        whyGoogle: 'Descrições curtas deixam espaço livre para os concorrentes ranquearem na sua frente em buscas secundárias.',
        action: 'Aproveite o limite de 750 caracteres da Lívia para cobrir todos os serviços e bairros.',
        fixAction: 'AUTO_FIX_DESCRIPTION',
        fixLabel: '⚡ Expandir para 750 chars',
        status: 'warn'
      });
    } else {
      tier1.push({
        id: 'desc_ok',
        title: 'Descrição Pública Completa e Rica em Palavras-Chave',
        whyGoogle: 'O Google possui texto semântico suficiente para entender todas as suas especialidades.',
        action: 'Descrição otimizada e publicada.',
        fixAction: null,
        fixLabel: null,
        status: 'pass'
      });
    }

    // Endereço e Calibração de Proximidade
    const addrCheck = checks.find(c => c.id === 'address');
    if (!addrCheck || addrCheck.status !== 'pass') {
      tier1.push({
        id: 'addr_fix',
        title: 'Definir Endereço Físico ou Raio Preciso de Atendimento',
        whyGoogle: 'O algoritmo de Proximidade (Vicinity) exige um ponto geográfico claro para exibir a ficha para usuários no celular próximos.',
        action: 'Confirme o CEP, bairro e número em "Editar perfil".',
        fixAction: 'AUTO_FIX_ADDRESS',
        fixLabel: '⚡ Configurar Local',
        status: 'fail'
      });
    } else {
      tier1.push({
        id: 'addr_ok',
        title: 'Ponto Geográfico Calibrado no Mapa',
        whyGoogle: 'O pino da empresa está ancorado no centróide local do Google Maps.',
        action: profileData?.addressText || 'Localização física validada.',
        fixAction: null,
        fixLabel: null,
        status: 'pass'
      });
    }

    // Contato & Horários
    const contactCheck = checks.find(c => c.id === 'contact');
    if (!contactCheck || contactCheck.status !== 'pass') {
      tier1.push({
        id: 'contact_fix',
        title: 'Cadastrar Horários Oficiais e Telefone com DDD',
        whyGoogle: 'Se o Google não sabe se a loja está aberta agora, ele prefere exibir um concorrente aberto para evitar frustrar o usuário.',
        action: 'Defina horário de abertura/fechamento e vincule o WhatsApp comercial.',
        fixAction: 'AUTO_FIX_CONTACT',
        fixLabel: '⚡ Resolver Horários',
        status: 'warn'
      });
    } else {
      tier1.push({
        id: 'contact_ok',
        title: 'Canais de Contato e Horários em Dia',
        whyGoogle: 'Sinal de "Aberto Agora" ativo para capturar clientes em busca imediata.',
        action: 'Telefone e horários verificados.',
        fixAction: null,
        fixLabel: null,
        status: 'pass'
      });
    }

    // 2. Nível 2: Aceleradores do Top 3 (Próximos 7 Dias)
    const tier2 = [];

    // Catálogo de Serviços & Produtos
    tier2.push({
      id: 'services_products',
      title: 'Cadastrar os 10 Principais Serviços com Preço e Descrição',
      whyGoogle: 'Cada serviço cadastrado vira uma palavra-chave direta no Google. Concorrentes com serviços cadastrados têm 2.7x mais cliques.',
      action: `Adicione seus principais serviços (ex: Manutenção, Vendas, Revisão, Troca de Baterias) no menu Serviços do Google.`,
      fixAction: 'AUTO_FIX_SERVICES',
      fixLabel: '⚙️ Estruturar Serviços',
      status: (profileData?.isManagedClient && options.business?.services?.length >= 5) ? 'pass' : 'warn'
    });

    // Resposta de Avaliações com SEO Reverso
    tier2.push({
      id: 'review_responses',
      title: 'Responder 100% das Avaliações com Palavras-Chave Estratégicas',
      whyGoogle: 'O Google lê as respostas do proprietário como conteúdo editorial. Citar o serviço e a cidade na resposta reforça o ranking.',
      action: 'Use o robô da Lívia para responder avaliações pendentes citando a cidade e o serviço.',
      fixAction: 'AUTO_FIX_REVIEWS',
      fixLabel: '⭐ Responder com IA',
      status: (profileData?.reviewCount > 0) ? 'warn' : 'pass'
    });

    // Fotos e Imagens Reais
    const photoCheck = checks.find(c => c.id === 'photos');
    if (!photoCheck || photoCheck.status !== 'pass') {
      tier2.push({
        id: 'photos_fix',
        title: 'Postar Fotos Reais da Fachada, Ambiente e Equipe',
        whyGoogle: 'O Google Vision AI analisa as fotos e extrai confiança e objetos visuais reais da empresa.',
        action: 'Faça upload de fotos nítidas do comércio com o nome do arquivo geo-otimizado pela Lívia.',
        fixAction: 'AUTO_FIX_PHOTOS',
        fixLabel: '📸 Enviar Novas Fotos',
        status: 'fail'
      });
    } else {
      tier2.push({
        id: 'photos_ok',
        title: 'Fotos Ativas e Identidade Visual no Google',
        whyGoogle: 'Ficha com imagens reais ganha mais cliques de navegação (rotas).',
        action: 'Galeria de fotos preenchida.',
        fixAction: null,
        fixLabel: null,
        status: 'pass'
      });
    }

    // 3. Nível 3: Dominação Territorial e Top 1 Definitivo (Rotina Semanal)
    const tier3 = [];

    // Review Velocity (Ritmo de Novas Avaliações)
    const revCount = profileData?.reviewCount || 0;
    tier3.push({
      id: 'review_velocity',
      title: 'Ritmo Semanal de Avaliações (Meta: 2 a 3 por semana)',
      whyGoogle: 'O algoritmo Navboost mede o "Review Velocity". Negócios que recebem avaliações constantes sobem de posição mesmo contra concorrentes antigos.',
      action: `Total atual: ${revCount} avaliações. Envie o Cartão de Avaliação da Lívia no WhatsApp dos clientes atendidos na semana.`,
      fixAction: 'AUTO_FIX_REVIEWS',
      fixLabel: '💬 Disparar Kit WhatsApp',
      status: revCount >= 50 ? 'pass' : revCount >= 15 ? 'warn' : 'fail'
    });

    // Freshness: Postagens Semanais com CTA
    tier3.push({
      id: 'weekly_posts',
      title: 'Postar 1 a 2 Atualizações Semanais com Botão de Ação',
      whyGoogle: 'Postagens mostram ao algoritmo que a empresa está aberta e ativa, exibindo o selo "Atualizado pela empresa recentemente".',
      action: 'Gere um post promocional com a IA da Lívia na aba Publicar e clique em Publicar no Google.',
      fixAction: 'CREATE_WEEKLY_POST',
      fixLabel: '📝 Criar Post em 1 Clique',
      status: 'warn'
    });

    // Conquista dos Bairros no Geo-Grid
    tier3.push({
      id: 'geogrid_expansion',
      title: 'Expandir Relevância nos Bairros Distantes (Matriz Geo-Grid)',
      whyGoogle: 'Concorrentes costumam dominar bairros vizinhos. Criar conteúdo citando atendimento nesses bairros expande o raio da ficha.',
      action: 'Acesse a aba Geo-Grid da Lívia, identifique os bairros com nota vermelha e gere posts específicos para eles.',
      fixAction: 'GOTO_GEOGRID',
      fixLabel: '🗺️ Abrir Geo-Grid',
      status: 'warn'
    });

    return {
      kpName,
      city,
      category,
      score,
      estimatedRanking: score >= 90 ? '🏆 Potencial Top 1 Absoluto' : score >= 75 ? '🥈 Potencial Top 3 Local Pack' : '🥉 Posição Intermediária (Top 5 a 10)',
      tiers: [
        {
          id: 'critical',
          name: '🔴 Nível 1: Travas Críticas de Ranqueamento',
          sub: 'Impacto direto no algoritmo de filtragem primária (Ação Imediata - 24 Horas)',
          items: tier1
        },
        {
          id: 'growth',
          name: '🟡 Nível 2: Aceleradores do Top 3',
          sub: 'Supera os concorrentes em relevância semântica e conversão (Próximos 7 Dias)',
          items: tier2
        },
        {
          id: 'domination',
          name: '🟢 Nível 3: Dominação e Consolidação Top 1',
          sub: 'Constrói autoridade viva e consistência para blindar a liderança (Rotina Semanal)',
          items: tier3
        }
      ]
    };
  }

  // --- MOTOR 9: RADAR DE PALAVRAS-CHAVE LOCAIS (ISOLADO ENTRE PROSPECTO NA TELA VS CLIENTE ATIVO) ---

  async generateLocalKeywordsRadar(profileData = {}, options = {}) {
    const { activeBusiness } = await this.getBusinessData();
    const isManaged = !!profileData.isManagedClient;
    const biz = isManaged ? (options.business || activeBusiness) : null;

    // Usa estritamente a categoria e cidade da empresa aberta na tela quando for Prospecção!
    const targetCategory = (profileData.categoryText && profileData.categoryText.length > 2)
      ? profileData.categoryText
      : (biz?.primaryCategory || biz?.niche || 'Comércio e Serviços');

    const targetCity = (profileData.detectedCity && profileData.detectedCity.length > 2 && profileData.detectedCity !== 'Sua Cidade')
      ? profileData.detectedCity
      : (biz?.city || '');

    const targetNeighborhood = profileData.detectedNeighborhood || biz?.neighborhood || '';
    const seg = this._detectSegmentType({
      name: profileData.kpName || biz?.name || '',
      niche: targetCategory,
      primaryCategory: targetCategory,
      services: biz?.services || []
    });

    const locText = targetCity ? ` em ${targetCity}` : '';
    const neighText = targetNeighborhood ? ` no bairro ${targetNeighborhood}` : '';

    let baseTerms = [];
    if (seg === 'japanese_food') {
      baseTerms = [
        { term: `restaurante japonês${locText}`, intent: '🔥 Busca nº 1 no Google Maps', priority: 'Alta' },
        { term: `melhor sushi bar${locText}`, intent: '⭐ Comparação / Decisão', priority: 'Alta' },
        { term: `delivery de comida japonesa${locText}`, intent: '🛵 Pedido Imediato', priority: 'Alta' },
        { term: `rodízio japonês e combinados${locText}`, intent: '💎 Ticket Médio Alto', priority: 'Média' },
        { term: `sashimi, temaki e barca de sushi`, intent: '🍣 Cardápio & Produtos', priority: 'Média' },
        { term: `jantar japonês e reservas${locText}`, intent: '📍 Presencial / Casais & Famílias', priority: 'Média' }
      ];
    } else if (seg === 'food') {
      const cleanCat = targetCategory.toLowerCase();
      baseTerms = [
        { term: `${cleanCat}${locText}`, intent: '🔥 Busca Principal no Maps', priority: 'Alta' },
        { term: `melhor ${cleanCat}${locText}`, intent: '⭐ Alta Conversão', priority: 'Alta' },
        { term: `delivery e pedidos ${cleanCat}${locText}`, intent: '🛵 Pedido no WhatsApp', priority: 'Alta' },
        { term: `cardápio e promoções ${cleanCat}`, intent: '🍔 Interesse de Compra', priority: 'Média' },
        { term: `${cleanCat} aberto agora${locText}`, intent: '⚡ Urgência / Fome', priority: 'Média' },
        { term: `onde comer${locText}${neighText}`, intent: '📍 Hiper-Local', priority: 'Média' }
      ];
    } else if (seg === 'it_repair') {
      baseTerms = [
        { term: `assistência técnica de notebook${locText}`, intent: '🔥 Alta Intenção de Compra', priority: 'Alta' },
        { term: `conserto de computador${locText}`, intent: '🔥 Alta Intenção de Compra', priority: 'Alta' },
        { term: `formatação de notebook e pc${locText}`, intent: '⚡ Serviço Rápido', priority: 'Alta' },
        { term: `instalação de ssd e memória ram${locText}`, intent: '🚀 Upgrade de Performance', priority: 'Média' },
        { term: `troca de tela e teclado de notebook${locText}`, intent: '🛠️ Reparo de Peças', priority: 'Média' },
        { term: `limpeza interna e pasta térmica notebook`, intent: '💎 Manutenção Preventiva', priority: 'Média' }
      ];
    } else if (seg === 'digital_agency') {
      baseTerms = [
        { term: `agência de marketing digital${locText}`, intent: '🔥 Alta Intenção Comercial', priority: 'Alta' },
        { term: `criação de sites profissionais${locText}`, intent: '💎 Ticket Alto', priority: 'Alta' },
        { term: `gestão de google meu negócio e seo local`, intent: '🚀 Recorrência Mensal', priority: 'Alta' },
        { term: `gestão de tráfego pago google ads e meta ads`, intent: '🔥 Alta Demanda', priority: 'Alta' },
        { term: `desenvolvimento de sistemas web${locText}`, intent: '💎 Ticket Premium', priority: 'Média' },
        { term: `automação comercial e atendimento whatsapp`, intent: '⚡ Tendência de Mercado', priority: 'Média' }
      ];
    } else if (seg === 'real_estate') {
      baseTerms = [
        { term: `imobiliária${locText}`, intent: '🔥 Busca nº 1 no Google Maps', priority: 'Alta' },
        { term: `casas e apartamentos à venda${locText}`, intent: '💎 Ticket Alto (Compra)', priority: 'Alta' },
        { term: `imóveis e casas para alugar${locText}`, intent: '🔑 Alta Recorrência (Locação)', priority: 'Alta' },
        { term: `terrenos, lotes e condomínios${locText}`, intent: '🏗️ Investimento Imobiliário', priority: 'Média' },
        { term: `corretor de imóveis e avaliação${locText}`, intent: '📋 Captação de Imóveis', priority: 'Média' },
        { term: `administração de imóveis e locação${locText}`, intent: '⚡ Decisão e Gestão', priority: 'Média' }
      ];
    } else if (seg === 'health') {
      const cleanCat = targetCategory.toLowerCase();
      baseTerms = [
        { term: `${cleanCat}${locText}`, intent: '🔥 Busca Principal de Pacientes', priority: 'Alta' },
        { term: `agendar consulta ${cleanCat}${locText}`, intent: '📲 Agendamento Direto', priority: 'Alta' },
        { term: `especialista em ${cleanCat}${neighText}`, intent: '📍 Hiper-Local', priority: 'Alta' },
        { term: `clínica e atendimento particular${locText}`, intent: '💎 Atendimento Direto', priority: 'Média' },
        { term: `urgência e avaliação ${cleanCat}${locText}`, intent: '⚡ Necessidade Imediata', priority: 'Média' },
        { term: `melhor ${cleanCat}${locText}`, intent: '⭐ Avaliação e Reputação', priority: 'Média' }
      ];
    } else {
      const cleanCat = targetCategory.toLowerCase();
      baseTerms = [
        { term: `${cleanCat}${locText}`, intent: '🔥 Busca Principal no Maps', priority: 'Alta' },
        { term: `melhor ${cleanCat}${locText}`, intent: '⭐ Comparação / Autoridade', priority: 'Alta' },
        { term: `${cleanCat}${neighText}`, intent: '📍 Hiper-Local', priority: 'Alta' },
        { term: `orçamento de ${cleanCat} whatsapp`, intent: '📲 Contato Direto', priority: 'Média' },
        { term: `empresa especializada em ${cleanCat}`, intent: '💎 Credibilidade Local', priority: 'Média' },
        { term: `atendimento ${cleanCat}${locText}`, intent: '⚡ Proximidade', priority: 'Média' }
      ];
    }

    // Verifica estritamente o texto da ficha analisada (sem misturar com outra empresa salva na extensão)
    const haystack = `${profileData.profileSpecificText || ''} ${isManaged ? (biz?.savedDescription || '') : ''}`.toLowerCase();

    const analyzed = baseTerms.map(item => {
      const coreWords = item.term.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !['para', 'como', 'onde', 'pelo'].includes(w));
      const matchedCount = coreWords.filter(w => haystack.includes(w)).length;
      const isPresent = coreWords.length > 0 && (matchedCount / coreWords.length) >= 0.75;

      return {
        ...item,
        present: isPresent,
        matchRatio: `${matchedCount}/${coreWords.length} radicais`
      };
    });

    const presentCount = analyzed.filter(a => a.present).length;
    const coverageScore = Math.round((presentCount / analyzed.length) * 100);

    return {
      targetCategory,
      targetCity,
      coverageScore,
      keywords: analyzed
    };
  }

  // --- MOTOR 10: COMPARADOR COMPETITIVO (SUA EMPRESA VS TOP 3 DO GOOGLE MAPS) ---

  analyzeCompetitorsGap(profileData, scrapedCompetitors = []) {
    const myName = profileData.kpName || 'Empresa Analisada';
    const myReviews = profileData.reviewCount || 0;
    const myRating = profileData.rating || 5.0;
    const city = (profileData.detectedCity && profileData.detectedCity !== 'Sua Cidade') ? profileData.detectedCity : '';
    const cat = profileData.categoryText || 'seu segmento';

    // Ordena os concorrentes raspados pelo maior volume de avaliações (líderes reais do mercado local)
    // Filtra para remover a própria empresa e garantir apenas dados empíricos reais raspados do Google
    const myNameLower = myName.toLowerCase();
    const myBrand = myNameLower.split(/[|–—-]/)[0].trim();
    let competitors = [...scrapedCompetitors]
      .filter(c => {
        const cLower = (c.name || '').toLowerCase();
        if (cLower === myNameLower) return false;
        if (myBrand.length >= 4 && cLower.startsWith(myBrand)) return false;
        return true;
      })
      .sort((a, b) => (b.reviews || 0) - (a.reviews || 0))
      .map((c, idx) => ({ ...c, rank: idx + 1, isSimulatedBenchmark: false }));

    const hasCompetitors = competitors.length > 0;
    const locText = city ? ` em ${city}` : '';

    if (!hasCompetitors) {
      return {
        myName,
        myReviews,
        myRating,
        hasCompetitors: false,
        avgTopReviews: null,
        reviewsNeededForTop3: null,
        reviewsNeededForTop1: null,
        competitors: [],
        actionPlan: [
          `🔍 Comparativo de Concorrentes: Nenhum concorrente direto detectado nesta tela do Google. Para comparar com os líderes da sua região, pesquise no Google: "${cat}${locText}".`,
          `📸 Frequência de Atualizações: Publique fotos e atualizações regulares com palavras-chave de "${cat}" para consolidar a autoridade local.`,
          `🏷️ Densidade de Categorias e Serviços: Mantenha 1 categoria primária ("${cat}") e adicione até 4 categorias secundárias recomendadas.`,
          !profileData.hasWebsite
            ? `🌐 Autoridade Web: Vincule um site ou página de contato oficial à ficha no Google para ampliar a credibilidade e o posicionamento.`
            : `⚡ Velocidade de Resposta: Responda a todas as avaliações com atenção e menção aos serviços oferecidos.`
        ]
      };
    }

    const topSlice = competitors.slice(0, 3);
    const avgTopReviews = Math.round(
      topSlice.reduce((acc, c) => acc + (c.reviews || 0), 0) / Math.max(1, topSlice.length)
    );

    const thirdPlaceReviews = competitors[Math.min(2, competitors.length - 1)]?.reviews || avgTopReviews;
    const targetBenchmark = Math.max(thirdPlaceReviews, avgTopReviews);
    const reviewsNeededForTop3 = Math.max(0, targetBenchmark - myReviews + 1);
    const reviewsNeededForTop1 = Math.max(0, (competitors[0]?.reviews || avgTopReviews) - myReviews + 1);

    return {
      myName,
      myReviews,
      myRating,
      hasCompetitors: true,
      avgTopReviews,
      reviewsNeededForTop3,
      reviewsNeededForTop1,
      competitors: competitors.slice(0, 5),
      actionPlan: [
        myReviews < avgTopReviews
          ? `🎯 Meta de Avaliações Reais: Sua ficha tem ${myReviews} avaliações contra média de ${avgTopReviews} dos líderes reais detectados${locText}. Meta técnica: conquistar +${reviewsNeededForTop3} novas avaliações mencionando "${cat}".`
          : `🏆 Volume de Avaliações Líder (${myReviews} avaliações): Sua ficha supera a média do Top 3 detectado (${avgTopReviews} avaliações). Mantenha novas avaliações regulares para sustentar a posição.`,
        `📸 Frequência de Atualizações: Publicar fotos reais dos serviços otimizadas para "${cat}${locText}".`,
        `🏷️ Densidade de Categorias e Serviços: Configurar a categoria primária "${cat}" + categorias secundárias relevantes.`,
        !profileData.hasWebsite
          ? `🌐 Autoridade Web: Criar e vincular um Site ou página própria na ficha do Google para ampliar a taxa de conversão.`
          : `⚡ Velocidade de Resposta: Responder a 100% das avaliações utilizando palavras-chave locais.`
      ]
    };
  }

  // --- MOTOR 11: GERADOR DE SCRIPTS DE PROSPECÇÃO COMERCIAL (PARA FECHAR CLIENTES DE GMN E SITES) ---

  generateProspectPitch(profileData, auditResult, agencyBiz) {
    const prospectName = profileData.kpName || 'sua empresa';
    const city = profileData.detectedCity || agencyBiz?.city || 'nossa região';
    const cat = profileData.categoryText || 'seu segmento';
    const score = auditResult.score;
    const agencyName = agencyBiz?.name || agencyBiz?.agencyName || 'ConectWeb Soluções Digitais';
    const agencyPhone = agencyBiz?.whatsapp || agencyBiz?.agencyWhatsapp || '5514996988997';

    const flaws = auditResult.checks
      .filter(c => c.status === 'fail' || c.status === 'warn')
      .slice(0, 3)
      .map(c => `• ${c.label.replace(/\(\+?\d+\/\d+\s*pts\)/g, '').trim()}`)
      .join('\n');

    const websiteHook = !profileData.hasWebsite
      ? `\nAlém disso, notei que a ficha não possui um Site Profissional vinculado — o que faz o Google priorizar concorrentes que têm site.`
      : '';

    const scriptConsultivo = `Olá, tudo bem? Aqui é da *${agencyName}*! 👋\n\nEstava realizando um mapeamento de posicionamento das empresas de *${cat}* no Google aqui em *${city}* e passei pela ficha da *${prospectName}*.\n\nRodamos nossa ferramenta de auditoria (Lívia Copilot Pro) e sua ficha hoje está com *${score}% de otimização* no Google Maps. Identificamos 3 pontos que estão fazendo vocês perderem clientes prontos para comprar todos os dias:\n${flaws}${websiteHook}\n\nEu gerei o *Relatório Completo em PDF* mostrando exatamente como corrigir isso e colocar a *${prospectName}* entre as primeiras opções do Google. Posso te enviar o PDF aqui mesmo sem compromisso para você dar uma olhada?`;

    const scriptDiretoConcorrencia = `Olá, equipe da *${prospectName}*! Tudo joia?\n\nFiz um teste agora pesquisando por *${cat} em ${city}* no Google e vi que os seus principais concorrentes estão captando a maior parte das ligações e cliques no WhatsApp porque a ficha de vocês está com apenas *${score}% da força máxima* (${profileData.reviewCount || 0} avaliações e pendências técnicas de SEO Local).\n\nNós somos especialistas em colocar empresas locais no Top 3 do Google Meu Negócio. Topa receber um diagnóstico gratuito de 2 minutos mostrando o que falta para a *${prospectName}* dominar as buscas da cidade?`;

    const scriptComboSiteGmn = `Olá! Aqui é da *${agencyName}* 🚀\n\nParabéns pelo trabalho na *${prospectName}*! Estava analisando a presença digital de vocês no Google e vi uma oportunidade enorme de crescimento rápido.\n\nHoje a ficha de vocês no Google está em *${score}%*${!profileData.hasWebsite ? ' e ainda sem uma página web de alta conversão integrada ao WhatsApp' : ''}. Nós temos um plano "Chave na Mão" onde otimizamos 100% do seu Google Meu Negócio + postagens semanais com IA + estrutura de conversão.\n\nPodemos agendar uma chamada rápida de 10 minutos ou posso te mandar o diagnóstico por aqui? Meu contato direto: ${agencyPhone}`;

    return {
      prospectName,
      score,
      scripts: [
        { title: '🎯 1. Abordagem Consultiva com Laudo PDF (Maior Taxa de Resposta)', text: scriptConsultivo },
        { title: '🔥 2. Gatilho da Concorrência (Foco em Ligações e Vendas Perdidas)', text: scriptDiretoConcorrencia },
        { title: '💎 3. Oferta Combo: Gestão Google Meu Negócio + Site Profissional', text: scriptComboSiteGmn }
      ]
    };
  }

  // --- MOTOR 12: KIT ACELERADOR DE AVALIAÇÕES (WHATSAPP SCRIPTS + QR CODE DE BALCÃO) ---

  generateReviewRequestKit(biz, kpName, customReviewLink = '') {
    const name = kpName || biz?.name || 'nossa empresa';
    const city = (biz?.city && biz.city !== 'Sua Cidade') ? biz.city : '';
    const serviceHint = (biz?.services && biz.services[0]) ? biz.services[0].toLowerCase() : (biz?.primaryCategory || 'nosso atendimento').toLowerCase();
    
    // Se não tiver link direto oficial configurado (ex: g.page/.../review), gera link de busca oficial no Google Maps
    const hasDirectLink = !!(customReviewLink && (customReviewLink.includes('review') || customReviewLink.includes('g.page')));
    const link = hasDirectLink
      ? customReviewLink
      : (customReviewLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + (city ? ' ' + city : ''))}`);

    return {
      businessName: name,
      reviewLink: link,
      hasDirectReviewLink: hasDirectLink,
      reviewLinkNote: hasDirectLink ? 'Link direto oficial verificado' : 'Link de busca no Google Maps (adicione o link curto g.page/.../review nas configurações para link direto 1-clique)',
      scripts: [
        {
          title: '⚡ 1. Pedido Rápido Pós-Atendimento (Mais Conversão)',
          text: `Olá! Aqui é da *${name}* 😊\n\nFoi um prazer atender você! A sua opinião é muito importante para nós. Você poderia nos ajudar com uma avaliação rápida de 30 segundos no Google?\n\nBasta clicar no link abaixo e dar suas estrelinhas ⭐⭐⭐⭐⭐:\n👉 ${link}\n\n*(Dica: se puder mencionar na avaliação sobre "${serviceHint}", ajuda demais a nossa equipe!)* Muito obrigado!`
        },
        {
          title: '🤝 2. Pedido para Clientes Antigos / Parceiros de Confiança',
          text: `Olá! Tudo bem? Aqui é da equipe *${name}*! 🚀\n\nEstamos atualizando nosso perfil oficial no Google${city ? ' em ' + city : ''} e o depoimento de clientes especiais como você faz toda a diferença.\n\nPoderia deixar um comentário rápido contando como foi sua experiência conosco? É só clicar aqui:\n👉 ${link}\n\nAgradecemos de coração pela parceria! ✨`
        }
      ]
    };
  }

  // --- MOTOR 13: GEO-GRID DE BAIRROS & RANKING LOCAL (ESTILO LOCAL FALCON / GBP CHECK) ---

  generateGeoGridRanking(bizOrProfile, options = {}) {
    const name = bizOrProfile?.name || bizOrProfile?.kpName || 'Empresa Analisada';
    const city = options.city || bizOrProfile?.city || bizOrProfile?.detectedCity || 'Sua Cidade';
    const category = bizOrProfile?.primaryCategory || bizOrProfile?.categoryText || bizOrProfile?.niche || 'Comércio e Serviços';
    const keyword = options.keyword || (bizOrProfile?.services && bizOrProfile?.services[0]) || category || 'serviços';
    const homeNeighborhood = bizOrProfile?.neighborhood || 'Centro';
    const reviews = bizOrProfile?.reviewCount || bizOrProfile?.reviews || 0;
    const rating = bizOrProfile?.rating || 4.8;
    const hasWebsite = !!bizOrProfile?.hasWebsite || !!bizOrProfile?.website;
    const serviceAreas = (bizOrProfile?.serviceAreas || '').toLowerCase();

    // Bairros padrão para matriz 3x3 se o usuário não passar uma lista customizada
    const defaultNeighborhoodPresets = {
      'macatuba': ['Centro', 'Vila Nova', 'Jardim América', 'Bairro Alto', 'Distrito Industrial', 'Jardim Planalto', 'Jardim Sonho Meu', 'Vila Santa Rita', 'Zona Rural / Entorno'],
      'bauru': ['Centro', 'Altos da Cidade', 'Jardim Estoril', 'Vila Falcão', 'Vila Cardia', 'Mary Dota', 'Geisel', 'Bela Vista', 'Distrito Industrial'],
      'lençóis paulista': ['Centro', 'Jardim das Nações', 'Vila Nova Irerê', 'Cecap', 'Distrito Industrial', 'Jardim Primavera', 'Caju', 'Parque Rondon', 'Jardim Cruzeiro'],
      'botucatu': ['Centro', 'Vila dos Lavradores', 'Jardim Paraíso', 'Rubião Júnior', 'Vila Sonia', 'Cohab 1', 'Bairro Alto', 'Distrito Industrial', 'Jardim Aeroporto'],
      'jaú': ['Centro', 'Jardim Pedro Ometto', 'Vila Netinho', 'Jardim Novo Horizonte', 'Distrito Industrial', 'Vila Operária', 'Jardim América', 'Chácara Braz Miraglia', 'Vila Maria'],
      'pederneiras': ['Centro', 'Michel Neme', 'Cidade Nova', 'Distrito Industrial', 'Vila Paulista', 'Jardim Marajoara', 'Maria Elena', 'Bairro Alto', 'Entorno Ferroviário']
    };

    const cityLower = city.toLowerCase().trim();
    let selectedBairros = [];
    if (options.neighborhoods && Array.isArray(options.neighborhoods) && options.neighborhoods.length >= 3) {
      selectedBairros = options.neighborhoods;
    } else if (options.neighborhoods && typeof options.neighborhoods === 'string' && options.neighborhoods.trim()) {
      selectedBairros = options.neighborhoods.split(',').map(s => s.trim()).filter(Boolean);
    } else if (defaultNeighborhoodPresets[cityLower]) {
      selectedBairros = defaultNeighborhoodPresets[cityLower];
    } else {
      // 9 quadrantes geográficos gerais
      selectedBairros = [
        'Zona Noroeste', 'Zona Norte', 'Zona Nordeste',
        'Zona Oeste', `${homeNeighborhood || 'Centro'} (Sede)`, 'Zona Leste',
        'Zona Sudoeste', 'Zona Sul', 'Zona Sudeste'
      ];
    }

    // Garante exatamente 9 pontos para a matriz 3x3 (ou completa se necessário)
    while (selectedBairros.length < 9) {
      selectedBairros.push(`Região ${selectedBairros.length + 1}`);
    }
    selectedBairros = selectedBairros.slice(0, 9);

    // Heurística de Ranqueamento de Geo-Grid do Google Maps:
    // Ponto Central (index 4 ou onde for a Sede/Centro): Proximidade máxima
    // Fatores de Força: Volume de Avaliações, Nota, Presença de Website, e menção a Service Areas
    const reviewPower = Math.min(25, Math.floor(reviews / 4)); // Mais avaliações = maior raio de alcance
    const ratingBonus = (rating >= 4.7) ? 2 : (rating >= 4.3) ? 1 : 0;
    const webBonus = hasWebsite ? 1 : 0;
    const baseAuthority = reviewPower + ratingBonus + webBonus; // 0 a 28

    const quadrantLabels = [
      'Noroeste', 'Norte', 'Nordeste',
      'Oeste', 'Centro (Sede)', 'Leste',
      'Sudoeste', 'Sul', 'Sudeste'
    ];

    const grid = selectedBairros.map((bairro, idx) => {
      const isHome = idx === 4 || bairro.toLowerCase().includes(homeNeighborhood.toLowerCase()) || (idx === 4 && bairro.toLowerCase().includes('centro'));
      const isExplicitServiceArea = serviceAreas && serviceAreas.includes(bairro.toLowerCase());

      // Distância estimada do centro/sede (em km)
      let distanceKm = 0;
      if (idx === 4) distanceKm = 0.5;
      else if ([1, 3, 5, 7].includes(idx)) distanceKm = Math.round((1.4 + (idx * 0.3)) * 10) / 10;
      else distanceKm = Math.round((2.8 + (idx * 0.4)) * 10) / 10;

      // Cálculo de posição no ranking (1 = Top 1, etc.)
      let estRank = 1;
      if (isHome) {
        // Na sede, empresa geralmente é #1 ou #2 se tiver avaliações mínimas
        estRank = reviews >= 10 ? 1 : 2;
      } else {
        // Distância penaliza se autoridade for baixa
        const distPenalty = Math.max(1, Math.round(distanceKm * 2.2));
        const resistance = Math.min(distPenalty, Math.floor(baseAuthority / 4));
        const serviceAreaShield = isExplicitServiceArea ? 2 : 0;
        estRank = Math.max(1, distPenalty - resistance - serviceAreaShield);
        
        // Se a empresa tiver pouquíssimas avaliações (<8), a distância afunda o rank
        if (reviews < 8 && distanceKm >= 2.0) {
          estRank = Math.min(18, estRank + 5);
        }
      }

      // Adiciona leve variação orgânica realista
      const jitter = ((idx * 7) % 3) - 1;
      estRank = Math.max(1, Math.min(20, estRank + (isHome ? 0 : jitter)));

      // Classificação de cor e status
      let status = 'top3'; // 1, 2, 3
      let statusLabel = 'Top 3 (Local Pack)';
      let color = '#10b981'; // esmeralda
      if (estRank >= 4 && estRank <= 10) {
        status = 'page1';
        statusLabel = 'Página 1 (Competitivo)';
        color = '#f59e0b'; // âmbar
      } else if (estRank > 10) {
        status = 'invisible';
        statusLabel = 'Invisível (+10)';
        color = '#ef4444'; // vermelho
      }

      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${keyword} em ${bairro} ${city}`)}`;

      return {
        id: `grid_${idx}`,
        index: idx,
        row: Math.floor(idx / 3),
        col: idx % 3,
        quadrant: quadrantLabels[idx] || `Ponto ${idx + 1}`,
        bairro,
        distanceKm,
        isHome,
        rank: estRank,
        status,
        statusLabel,
        color,
        searchUrl,
        competitorLeader: estRank > 1 ? `Concorrente Local (${bairro})` : 'Sua Empresa Lidera 👑',
        tip: estRank <= 3
          ? 'Posição consolidada no Top 3 do Google Maps.'
          : `Para subir para o Top 3 neste bairro, mencione "${bairro}" nas atualizações e serviços.`
      };
    });

    // Métricas Globais
    const totalPoints = grid.length;
    const top3Count = grid.filter(g => g.status === 'top3').length;
    const page1Count = grid.filter(g => g.status === 'page1').length;
    const invisibleCount = grid.filter(g => g.status === 'invisible').length;
    const sumRank = grid.reduce((acc, g) => acc + g.rank, 0);
    const agr = Math.round((sumRank / totalPoints) * 10) / 10; // Average Grid Rank
    const solv = Math.round((top3Count / totalPoints) * 100); // Share of Local Voice

    const dominatedBairros = grid.filter(g => g.status === 'top3').map(g => g.bairro);
    const weakBairros = grid.filter(g => g.status !== 'top3').map(g => g.bairro);

    const strategicPlan = [
      solv >= 70
        ? `🏆 Domínio Territorial Amplo: Sua ficha domina ${solv}% dos bairros analisados no Top 3 do Google Maps. Mantenha avaliações frequentes para não perder espaço.`
        : `⚠️ Risco de Perda de Clientes: Sua ficha está fora do Top 3 em ${weakBairros.length} de ${totalPoints} bairros da cidade (${solv}% de Share of Voice). Clientes desses bairros estão ligando para concorrentes.`,
      weakBairros.length > 0
        ? `📍 Estratégia de Expansão por Bairros: Adicione os bairros (${weakBairros.slice(0, 3).join(', ')}) na seção "Áreas de Cobertura" do Google Meu Negócio.`
        : `📍 Expansão Regional: Considere cadastrar cidades vizinhas nas Áreas de Atendimento.`,
      `📝 Postagens com Geo-Tags: Crie postagens semanais na ficha citando atendimento para: "${weakBairros.slice(0, 2).join(' e ') || dominatedBairros.slice(0, 2).join(' e ')}".`,
      `⭐ Solicitação de Avaliações Estratégicas: Peça para clientes de bairros como ${weakBairros[0] || 'bairros distantes'} mencionarem o nome do bairro no texto da avaliação.`
    ];

    return {
      companyName: name,
      city,
      keyword,
      totalPoints,
      agr, // Posição média (ex: 2.3)
      solv, // % no Top 3 (ex: 78%)
      top3Count,
      page1Count,
      invisibleCount,
      grid,
      dominatedBairros,
      weakBairros,
      strategicPlan,
      testedAt: new Date().toISOString()
    };
  }

  // --- IMPLEMENTAÇÕES LOCAIS INTELIGENTES (ALGORITMOS OFFLINE / FALLBACK) ---

  _localPostTransformer(payload) {
    const ctx = payload.context;
    const seg = ctx.segmentType || 'general_services';
    const cityText = ctx.city ? ` em ${ctx.city}` : '';
    const neighborhoodText = ctx.neighborhood ? ` (bairro ${ctx.neighborhood})` : '';
    const company = ctx.companyName || 'nossa empresa';

    // Limpa hashtags genéricas, menções de bio e ruídos de OCR do Instagram
    let bodyContent = (payload.originalText || '')
      .replace(/^(Pode ser uma imagem de|May be an image of|Photo by|Foto de)[^:.\n]*[:.\n]*/gi, '')
      .replace(/#\w+/g, '')
      .replace(/link na bio/gi, 'acesse nosso perfil no Google')
      .replace(/arrasta pra cima/gi, 'fale conosco pelo WhatsApp')
      .replace(/\s{3,}/g, '\n\n')
      .trim();

    // Se o post veio de uma imagem sem texto na legenda, cria um corpo rico baseado nos serviços da empresa
    if (!bodyContent || bodyContent.length < 15) {
      const servList = (ctx.services && ctx.services.length > 0)
        ? ctx.services.slice(0, 4).map(s => `✅ ${s}`).join('\n')
        : `✅ Atendimento especializado em ${ctx.niche}`;
      bodyContent = `Confira nossas soluções em destaque:\n${servList}`;
    }

    let seoTitle = '';
    let intro = '';

    if (seg === 'it_repair') {
      if (payload.postType === 'offer') {
        seoTitle = `🔥 Condição Especial em Manutenção e Upgrade na ${company}${cityText}!`;
      } else if (payload.postType === 'tip') {
        seoTitle = `💡 Dica Técnica da ${company}${cityText}: Cuide do seu Notebook e PC!`;
      } else {
        seoTitle = `💻 Precisando de Assistência Técnica de Notebook ou PC${cityText}?`;
      }
      intro = `A ${company}${neighborhoodText} resolve para você com rapidez, peças originais e garantia total!`;
    } else if (seg === 'digital_agency') {
      if (payload.postType === 'offer') {
        seoTitle = `🚀 Impulsione as Vendas da sua Empresa com a ${company}${cityText}!`;
      } else if (payload.postType === 'tip') {
        seoTitle = `💡 Estratégia Digital com a ${company}${cityText}:`;
      } else {
        seoTitle = `📈 Quer posicionar sua empresa no topo do Google${cityText}?`;
      }
      intro = `Na ${company}${neighborhoodText}, desenvolvemos sites, sistemas e estratégias de SEO Local e Tráfego Pago focadas em gerar clientes reais para o seu negócio.`;
    } else {
      if (payload.postType === 'offer') {
        seoTitle = `🔥 Condição Especial na ${company}${cityText}!`;
      } else if (payload.postType === 'tip') {
        seoTitle = `💡 Dica de Especialista em ${ctx.niche}:`;
      } else {
        seoTitle = `✨ Procurando o melhor em ${ctx.niche}${cityText}?`;
      }
      intro = `A ${company}${neighborhoodText} é a sua referência de confiança, unindo atendimento personalizado e máxima qualidade.`;
    }

    const ctaLine = ctx.whatsapp
      ? `\n\n📲 Dúvidas ou orçamentos? Fale agora no nosso WhatsApp: ${ctx.whatsapp}`
      : `\n\n📍 Entre em contato direto pelo nosso perfil no Google!`;

    const finalText = `${seoTitle}\n\n${bodyContent}\n\n${intro}${ctaLine}`;

    return {
      success: true,
      text: finalText,
      ctaType: 'WHATSAPP_OR_CALL',
      keywordsUsed: [ctx.primaryCategory || ctx.niche, ctx.city, ctx.neighborhood].filter(Boolean)
    };
  }

  _localReviewReplyGenerator(payload) {
    const { reviewerName, stars, reviewText, context, mode } = payload;
    const cleanName = (reviewerName || 'Cliente').replace(/[^a-zA-ZÀ-ÿ\s]/g, '').trim();
    const firstName = cleanName.split(' ')[0] || 'Cliente';
    const company = context.companyName || 'nossa equipe';
    const city = context.city ? ` em ${context.city}` : '';
    const mainService = (context.services && context.services[0])
      ? context.services[0].toLowerCase()
      : (context.primaryCategory || context.niche || 'nossos serviços').toLowerCase();

    // Detecta se o cliente elogiou algo específico no comentário
    const revLower = (reviewText || '').toLowerCase();
    let specificAck = '';
    if (revLower.includes('rápid') || revLower.includes('rapid') || revLower.includes('ágil') || revLower.includes('prazo')) {
      specificAck = ' Saber que nossa agilidade e cumprimento de prazos fizeram a diferença nos deixa muito orgulhosos!';
    } else if (revLower.includes('atendimento') || revLower.includes('atenção') || revLower.includes('educad')) {
      specificAck = ' Ficamos muito felizes que tenha gostado do nosso atendimento e dedicação!';
    } else if (revLower.includes('preço') || revLower.includes('justo') || revLower.includes('honest')) {
      specificAck = ' Prezamos sempre pela transparência, preço justo e qualidade técnica em cada serviço!';
    } else if (revLower.includes('notebook') || revLower.includes('computador') || revLower.includes('pc') || revLower.includes('ssd') || revLower.includes('format')) {
      specificAck = ' É uma satisfação deixar seu equipamento rodando perfeitamente e com desempenho máximo!';
    } else if (revLower.includes('site') || revLower.includes('google') || revLower.includes('sistema') || revLower.includes('resultado')) {
      specificAck = ' Nosso foco é sempre impulsionar a presença digital e gerar resultados reais para nossos parceiros!';
    }

    let reply = '';

    // Avaliação Positiva (4 a 5 estrelas)
    if (stars >= 4 && mode !== 'crisis') {
      if (mode === 'executive') {
        reply = `Prezado(a) ${firstName}, agradecemos imensamente por sua avaliação de ${stars} estrelas.${specificAck} Para a ${company}${city}, a excelência técnica e a satisfação de cada cliente são prioridades absolutas. Conte sempre com nossa equipe. Um cordial abraço!`;
      } else if (mode === 'sales_hook') {
        reply = `Olá, ${firstName}! Muito obrigado pelas ${stars} estrelas!${specificAck} É um prazer atender você na ${company}${city}. Sempre que precisar de ${mainService} ou novos projetos, chame a gente no WhatsApp para condições especiais de cliente parceiro. Até breve! ✨`;
      } else {
        // Modo Smart / SEO Local
        reply = `Olá, ${firstName}! Muito obrigado pela sua avaliação de ${stars} estrelas!${specificAck} Ficamos muito felizes em proporcionar uma excelente experiência na ${company}${city}, sua referência em ${mainService}. Conte sempre com a nossa equipe! ✨`;
      }
    }
    // Avaliação Negativa / Crítica (1 a 3 estrelas) ou Modo Gestão de Crise
    else {
      const contactInfo = context.whatsapp
        ? `pelo WhatsApp direto da nossa gerência: ${context.whatsapp}`
        : 'diretamente pelo nosso canal de atendimento';
      reply = `Olá, ${firstName}. Agradecemos pelo seu feedback e lamentamos sinceramente que sua experiência não tenha atingido o padrão de excelência que exigimos na ${company}. Levamos cada apontamento muito a sério e queremos resolver a sua questão imediatamente. Por gentileza, fale conosco ${contactInfo} para darmos atenção prioritária ao seu caso.`;
    }

    return {
      success: true,
      reply: reply
    };
  }

  _localDescriptionGenerator(payload) {
    const ctx = payload.context;
    const seg = ctx.segmentType || 'general_services';
    const company = (ctx.companyName && ctx.companyName !== 'Minha Empresa') ? ctx.companyName : 'ConectWeb Soluções Digitais';
    const city = ctx.city || 'Macatuba';
    const neighborhood = ctx.neighborhood ? ` no bairro ${ctx.neighborhood}` : '';
    const niche = (ctx.niche && ctx.niche !== 'Comércio / Serviços') ? ctx.niche : 'Marketing Digital, Criação de Sites e Automações';

    const servicesStr = (ctx.services && ctx.services.length > 0)
      ? ctx.services.slice(0, 5).join(', ')
      : niche;

    let p1 = '';
    let p2 = '';
    let p3 = '';

    if (seg === 'it_repair') {
      p1 = `A ${company} é a sua referência em ${ctx.primaryCategory || 'Assistência Técnica de Notebooks e Informática'} em ${city}${neighborhood}. Somos especialistas em diagnóstico preciso, reparo rápido e aumento de performance para notebooks, computadores comerciais e PC Gamer.`;
      p2 = `Principais serviços: ${servicesStr}. Trabalhamos com peças originais de todas as marcas, limpeza técnica especializada e garantia total para você trabalhar, estudar ou jogar sem travamentos.`;
      p3 = ctx.whatsapp
        ? `Seu computador travou ou está lento? Solicite seu orçamento pelo WhatsApp: ${ctx.whatsapp} ou traga seu equipamento até nossa loja em ${city}!`
        : `Traga seu equipamento para uma avaliação técnica em ${city}. Qualidade e confiança que seu computador merece!`;
    } else if (seg === 'digital_agency') {
      p1 = `A ${company} é especialista em ${niche} em ${city}${neighborhood}. Desenvolvemos soluções estratégicas de alta performance para empresas, comércios e profissionais que buscam liderar as buscas no Google e escalar suas vendas.`;
      p2 = `Destaques dos nossos serviços: ${servicesStr}. Unimos tecnologia moderna, inteligência artificial e SEO Local para transformar visualizações em clientes reais todos os dias.`;
      p3 = ctx.whatsapp
        ? `Solicite um diagnóstico ou orçamento direto pelo WhatsApp: ${ctx.whatsapp}. Conecte sua empresa aos melhores resultados!`
        : `Entre em contato pelo nosso perfil no Google e impulsione o crescimento digital da sua empresa!`;
    } else if (seg === 'real_estate') {
      p1 = `A ${company} é a sua Imobiliária de confiança em ${city}${neighborhood}. Somos especialistas em compra, venda, locação e administração completa de imóveis residenciais, comerciais, terrenos e condomínios na região.`;
      p2 = `Destaques da nossa atuação: atendimento consultivo personalizado, avaliação imobiliária precisa, assessoria jurídica segura e suporte completo em financiamento bancário para realizar o seu sonho ou proteger o seu patrimônio.`;
      p3 = ctx.whatsapp
        ? `Procurando imóveis para comprar ou alugar em ${city}? Fale agora pelo WhatsApp: ${ctx.whatsapp} e agende sua visita!`
        : `Visite nossa imobiliária em ${city} ou entre em contato direto pelo nosso perfil no Google!`;
    } else if (seg === 'health') {
      p1 = `A ${company} é referência em ${niche} em ${city}${neighborhood}, oferecendo cuidado humanizado, tecnologia moderna e tratamentos personalizados com foco na sua saúde e bem-estar.`;
      p2 = `Especialidades e serviços: ${servicesStr}. Contamos com estrutura acolhedora e profissionais altamente qualificados para atender você com máxima segurança.`;
      p3 = ctx.whatsapp
        ? `Agende sua consulta ou avaliação pelo WhatsApp: ${ctx.whatsapp}. Será um prazer cuidar de você!`
        : `Venha nos visitar em ${city} ou agende seu horário diretamente pelo nosso perfil no Google!`;
    } else {
      p1 = `A ${company} é a sua referência em ${niche} em ${city}${neighborhood}. Com foco em excelência, transparência e resultados comprovados, oferecemos soluções sob medida para atender você com alto padrão.`;
      p2 = `Destaques dos nossos serviços: ${servicesStr}. Compromisso com prazos, atendimento ágil e máxima qualidade em cada entrega em ${ctx.serviceAreas || city}.`;
      p3 = ctx.whatsapp
        ? `Solicite seu orçamento sem compromisso direto pelo WhatsApp: ${ctx.whatsapp}. Estamos prontos para atender você!`
        : `Faça-nos uma visita em ${city} ou entre em contato pelo nosso perfil do Google!`;
    }

    let fullDescription = `${p1}\n\n${p2}\n\n${p3}`;

    if (fullDescription.length > 745) {
      fullDescription = fullDescription.substring(0, 742) + '...';
    }

    return {
      success: true,
      description: fullDescription,
      charCount: fullDescription.length
    };
  }
}

if (typeof window !== 'undefined') {
  window.LiviaApi = new LiviaApiClient();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LiviaApiClient };
}
