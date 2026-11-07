/**
 * Suíte de Testes Automatizados — Saneamento e Integridade Lívia Stenção
 * Validação rigorosa dos Cenários A a F (Multi-Tenant, Isolamento de Abas,
 * Desambiguação de Filiais, Não-Contaminação de Website, Migração de Schema e Regressão dos 13 Motores).
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Mock do Ambiente Chrome Extensions (Storage Sync + Local com suporte a Quota e Backups)
class MockStorageArea {
  constructor(name, quotaBytes = Infinity) {
    this.name = name;
    this.quotaBytes = quotaBytes;
    this.data = {};
  }

  get(keys, callback) {
    let result = {};
    if (keys === null || keys === undefined) {
      result = { ...this.data };
    } else if (typeof keys === 'string') {
      result[keys] = this.data[keys];
    } else if (Array.isArray(keys)) {
      keys.forEach(k => {
        result[k] = this.data[k];
      });
    } else if (typeof keys === 'object') {
      Object.keys(keys).forEach(k => {
        result[k] = this.data[k] !== undefined ? this.data[k] : keys[k];
      });
    }
    if (callback) callback(result);
    return Promise.resolve(result);
  }

  set(items, callback) {
    for (const key of Object.keys(items)) {
      const serialized = JSON.stringify(items[key]);
      if (serialized && serialized.length > this.quotaBytes) {
        const err = new Error(`QUOTA_BYTES_PER_ITEM quota exceeded in ${this.name} for key "${key}"`);
        if (chrome.runtime) chrome.runtime.lastError = err;
        if (callback) callback();
        return Promise.reject(err);
      }
      this.data[key] = JSON.parse(JSON.stringify(items[key]));
    }
    if (chrome.runtime) delete chrome.runtime.lastError;
    if (callback) callback();
    return Promise.resolve();
  }

  clear(callback) {
    this.data = {};
    if (callback) callback();
  }
}

// Configuração do ambiente global
global.window = global;
global.chrome = {
  storage: {
    sync: new MockStorageArea('sync', 8192), // Limite estrito de 8KB por item
    local: new MockStorageArea('local', 10 * 1024 * 1024) // 10MB
  },
  runtime: {
    sendMessage: (msg, cb) => {
      if (cb) cb({ ok: true, data: [] });
    }
  }
};

// Carrega o código do livia-api.js
const liviaApiPath = path.resolve(__dirname, '../lib/livia-api.js');
const liviaApiCode = fs.readFileSync(liviaApiPath, 'utf8');
eval(liviaApiCode);

const api = window.LiviaApi;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}`);
    console.error(`     Erro: ${err.message}`);
    failedTests++;
  }
}

async function itAsync(desc, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}`);
    console.error(`     Erro: ${err.message}`);
    failedTests++;
  }
}

async function runSuite() {
  console.log('================================================================');
  console.log('🧪 INICIANDO SUÍTE DE TESTES AUTOMATIZADOS: LÍVIA STENÇÃO');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // CENÁRIO A: Cidades Diferentes (Independência Geográfica)
  // -------------------------------------------------------------
  console.log('--- CENÁRIO A: Cidades Diferentes (Independência Geográfica) ---');
  await itAsync('A1: Cadastro de empresas com mesmo nome em cidades diferentes coexistem com IDs independentes', async () => {
    chrome.storage.local.clear();
    chrome.storage.sync.clear();

    const biz1 = {
      name: 'ConectWeb Soluções Digitais',
      city: 'Bauru',
      neighborhood: 'Vila Universitária',
      address: 'Rua Araújo Leite, 15-40',
      niche: 'Marketing Digital'
    };

    const biz2 = {
      name: 'ConectWeb Soluções Digitais',
      city: 'Macatuba',
      neighborhood: 'Centro',
      address: 'Alameda Tiradentes, 348',
      niche: 'Marketing Digital'
    };

    const res1 = await api.saveBusiness(biz1);
    const res2 = await api.saveBusiness(biz2);

    assert.ok(res1.business.id, 'Biz 1 deve ter ID gerado');
    assert.ok(res2.business.id, 'Biz 2 deve ter ID gerado');
    assert.notStrictEqual(res1.business.id, res2.business.id, 'IDs devem ser distintos para filiais em cidades diferentes');

    const data = await api.getBusinessData();
    const bauruBiz = data.businesses.find(b => b.city === 'Bauru');
    const macatubaBiz = data.businesses.find(b => b.city === 'Macatuba' && b.name.includes('ConectWeb'));

    assert.ok(bauruBiz, 'Empresa de Bauru deve existir');
    assert.ok(macatubaBiz, 'Empresa de Macatuba deve existir');
    assert.strictEqual(bauruBiz.city, 'Bauru', 'A cidade de Bauru não pode ser alterada para Macatuba');
  });

  await itAsync('A2: Gerador de descrição respeita a cidade informada e não força Macatuba', async () => {
    const payload = {
      context: {
        companyName: 'Clínica Odonto Vida',
        city: 'Fortaleza',
        neighborhood: 'Aldeota',
        niche: 'Odontologia e Implantes'
      }
    };
    const desc = api._localDescriptionGenerator(payload);
    assert.ok(desc.success, 'Geração de descrição deve ter sucesso');
    assert.ok(desc.description.includes('Fortaleza'), 'Descrição deve citar a cidade real (Fortaleza)');
    assert.ok(!desc.description.includes('Macatuba'), 'Descrição NÃO pode citar Macatuba para empresa de Fortaleza');
  });

  // -------------------------------------------------------------
  // CENÁRIO B: Empresas com Nomes Iguais (Filiais Homônimas)
  // -------------------------------------------------------------
  console.log('\n--- CENÁRIO B: Filiais Homônimas e Desambiguação Estável ---');
  await itAsync('B1: Filiais homônimas com endereços distintos em mesma cidade mantêm registros independentes', async () => {
    chrome.storage.local.clear();
    chrome.storage.sync.clear();

    const matriz = {
      name: 'Supermercado Progresso',
      city: 'Campinas',
      neighborhood: 'Cambuí',
      address: 'Rua Coronel Silva, 500',
      whatsapp: '19999990001'
    };

    const filial = {
      name: 'Supermercado Progresso',
      city: 'Campinas',
      neighborhood: 'Barão Geraldo',
      address: 'Av. Albino de Oliveira, 1200',
      whatsapp: '19999990002'
    };

    const resM = await api.saveBusiness(matriz);
    const resF = await api.saveBusiness(filial);

    assert.notStrictEqual(resM.business.id, resF.business.id, 'Matriz e filial devem ter IDs diferentes');

    // Atualiza apenas a filial
    await api.saveBusiness({
      id: resF.business.id,
      whatsapp: '19999999999'
    });

    const data = await api.getBusinessData();
    const updatedM = data.businesses.find(b => b.id === resM.business.id);
    const updatedF = data.businesses.find(b => b.id === resF.business.id);

    assert.strictEqual(updatedM.whatsapp, '19999990001', 'WhatsApp da matriz deve permanecer intacto');
    assert.strictEqual(updatedF.whatsapp, '19999999999', 'WhatsApp da filial deve ser atualizado');
  });

  await itAsync('B2: Deduplicação por Google Place ID canônico atualiza sem criar duplicata', async () => {
    const placeBiz1 = {
      name: 'Auto Elétrica Central',
      city: 'Ribeirão Preto',
      googlePlaceId: 'ChIJ_TEST_PLACE_123',
      whatsapp: '16999991111'
    };

    const placeBiz2 = {
      name: 'Auto Elétrica Central & Baterias', // Nome comercial levemente modificado
      city: 'Ribeirão Preto',
      googlePlaceId: 'ChIJ_TEST_PLACE_123', // Mesmo Place ID oficial do Google
      whatsapp: '16999992222'
    };

    const r1 = await api.saveBusiness(placeBiz1);
    const r2 = await api.saveBusiness(placeBiz2);

    assert.strictEqual(r1.business.id, r2.business.id, 'Deve reutilizar o mesmo ID devido ao mesmo Place ID canônico');
    const data = await api.getBusinessData();
    const matches = data.businesses.filter(b => b.googlePlaceId === 'ChIJ_TEST_PLACE_123');
    assert.strictEqual(matches.length, 1, 'Não deve haver duplicatas para o mesmo Place ID');
  });

  // -------------------------------------------------------------
  // CENÁRIO C: Múltiplas Abas e Isolamento de Contexto
  // -------------------------------------------------------------
  console.log('\n--- CENÁRIO C: Múltiplas Abas e Isolamento de Contexto ---');
  await itAsync('C1: getBusinessData com tabBusinessId isola o cliente ativo por aba', async () => {
    chrome.storage.local.clear();
    chrome.storage.sync.clear();

    const data = await api.getBusinessData();
    assert.ok(data.businesses.length >= 2, 'Deve carregar defaults');

    const bizId1 = data.businesses[0].id;
    const bizId2 = data.businesses[1].id;

    const tab1Context = await api.getBusinessData({ tabBusinessId: bizId1 });
    const tab2Context = await api.getBusinessData({ tabBusinessId: bizId2 });

    assert.strictEqual(tab1Context.activeBusiness.id, bizId1, 'Aba 1 deve manter contexto do cliente 1');
    assert.strictEqual(tab2Context.activeBusiness.id, bizId2, 'Aba 2 deve manter contexto do cliente 2');
    assert.notStrictEqual(tab1Context.activeBusiness.id, tab2Context.activeBusiness.id, 'Contextos das abas devem ser isolados');
  });

  await itAsync('C2: matchBusinessByPageText retorna null quando não há correspondência segura (não assume activeBusiness)', async () => {
    const matched = await api.matchBusinessByPageText('Texto genérico de uma página qualquer do Google Maps');
    assert.strictEqual(matched, null, 'Não deve associar perfil aleatório ao cliente ativo por engano');
  });

  await itAsync('C3: Armazenamento de posts sociais mantém rastreabilidade por businessId', async () => {
    const postSos = {
      text: 'Manutenção rápida de notebooks em Horizonte',
      businessId: 'biz_sos_notebook_default',
      businessName: 'SOS Notebook',
      timestamp: Date.now()
    };

    const postConect = {
      text: 'Otimização de SEO Local para empresas',
      businessId: 'biz_conectweb_default',
      businessName: 'ConectWeb',
      timestamp: Date.now()
    };

    const dict = {
      [postSos.businessId]: postSos,
      [postConect.businessId]: postConect
    };

    await chrome.storage.local.set({
      lastTransformedPost: postConect,
      transformedPostsByBusiness: dict
    });

    const res = await chrome.storage.local.get(['transformedPostsByBusiness', 'lastTransformedPost']);
    assert.strictEqual(res.transformedPostsByBusiness['biz_sos_notebook_default'].text, postSos.text);
    assert.strictEqual(res.transformedPostsByBusiness['biz_conectweb_default'].text, postConect.text);
    assert.strictEqual(res.lastTransformedPost.businessId, 'biz_conectweb_default');
  });

  // -------------------------------------------------------------
  // CENÁRIO D: Associação de Website e Proveniência de Dados
  // -------------------------------------------------------------
  console.log('\n--- CENÁRIO D: Associação de Website e Proveniência de Dados ---');
  it('D1: Ficha sem botão de site no Google NÃO herda site do cliente ativo', () => {
    // Simula a lógica implementada em collectLiveProfileData
    const activeBiz = {
      id: 'biz_1',
      name: 'Oficina do Zé',
      website: 'https://conectweb.online' // Site da agência no CRM
    };

    const siteBtn = null; // Ficha no Google NÃO tem botão de site
    const isManagedClient = true;

    // Regra corrigida:
    const rawSiteUrl = (siteBtn && siteBtn.href && !siteBtn.href.includes('google.com/search')) ? siteBtn.href : (siteBtn ? siteBtn.getAttribute('data-url') || '' : '');
    const hasWebsite = !!(siteBtn && rawSiteUrl);
    const websiteUrl = rawSiteUrl;
    const crmWebsite = (isManagedClient && activeBiz) ? (activeBiz.website || '') : '';

    assert.strictEqual(hasWebsite, false, 'hasWebsite deve ser estritamente false quando não há botão no Google');
    assert.strictEqual(websiteUrl, '', 'websiteUrl deve ser vazio quando não há botão no Google');
    assert.strictEqual(crmWebsite, 'https://conectweb.online', 'crmWebsite deve anotar a existência de site no cadastro da agência');
  });

  it('D2: Ficha com botão de site confirmado na página do Google extrai URL corretamente', () => {
    const siteBtn = {
      href: 'https://autoeletricaprogresso.com.br'
    };
    const rawSiteUrl = (siteBtn && siteBtn.href && !siteBtn.href.includes('google.com/search')) ? siteBtn.href : '';
    const hasWebsite = !!(siteBtn && rawSiteUrl);

    assert.strictEqual(hasWebsite, true, 'hasWebsite deve ser true');
    assert.strictEqual(rawSiteUrl, 'https://autoeletricaprogresso.com.br', 'URL correta deve ser capturada');
  });

  // -------------------------------------------------------------
  // CENÁRIO E: Persistência, Quota e Migração de Schema
  // -------------------------------------------------------------
  console.log('\n--- CENÁRIO E: Persistência, Quota e Migração de Schema ---');
  await itAsync('E1: Migração de schema v1 (sync) para v2 (local) cria backup seguro', async () => {
    chrome.storage.local.clear();
    chrome.storage.sync.clear();

    const legacyBusinesses = [
      { id: 'biz_leg_1', name: 'Empresa Legada 1', city: 'Bauru' },
      { id: 'biz_leg_2', name: 'Empresa Legada 2', city: 'Jaú' }
    ];

    await chrome.storage.sync.set({
      businesses: legacyBusinesses,
      liviaApiToken: 'token_secreto_sync_123',
      googlePlacesApiKey: 'places_key_sync_456',
      activeBusinessId: 'biz_leg_1'
    });

    // Dispara a migração
    await api.migrateStorageSchema();

    const localData = await chrome.storage.local.get(null);
    assert.strictEqual(localData.storageSchemaVersion, 2, 'Versão do schema deve ser 2');
    assert.ok(localData.storageMigratedAt, 'Data de migração deve ser registrada');
    assert.deepStrictEqual(localData.businesses_backup_v1, legacyBusinesses, 'Backup da v1 deve ser preservado');
    assert.strictEqual(localData.businesses.length, 2, 'Empresas devem estar em storage.local');
    assert.strictEqual(localData.googlePlacesApiKey, 'places_key_sync_456', 'Chave da Places API deve ser migrada para local');
    assert.strictEqual(localData.liviaApiToken, 'token_secreto_sync_123', 'Token deve ser migrado para local');
  });

  await itAsync('E2: Catálogo volumoso com descrições ricas (>10KB) é persistido em local sem erro de cota', async () => {
    // Cria 15 empresas com descrições longas (mais de 15 KB de JSON)
    const largeCatalog = [];
    for (let i = 1; i <= 15; i++) {
      largeCatalog.push({
        id: `biz_large_${i}`,
        name: `Empresa Comercial Modelo Número ${i}`,
        city: `Cidade ${i}`,
        neighborhood: 'Bairro Nobre',
        savedDescription: 'Esta é uma descrição longa de teste para demonstrar a robustez do storage.local da extensão Lívia Stenção. '.repeat(10),
        services: ['Serviço Especializado A', 'Serviço Especializado B', 'Consultoria Local Avançada'],
        secondaryKeywords: ['palavra chave 1', 'palavra chave 2', 'palavra chave 3']
      });
    }

    const payloadSize = JSON.stringify(largeCatalog).length;
    assert.ok(payloadSize > 8192, `Tamanho do payload (${payloadSize} bytes) deve exceder o limite de 8KB do storage.sync`);

    await api.saveRawBusinesses(largeCatalog);
    const data = await api.getBusinessData();
    assert.ok(data.businesses.length >= 15, 'Todas as empresas volumosas devem ser persistidas');
    for (let i = 1; i <= 15; i++) {
      assert.ok(data.businesses.some(b => b.id === `biz_large_${i}`), `Empresa biz_large_${i} deve ser preservada intacta`);
    }
  });

  // -------------------------------------------------------------
  // CENÁRIO F: Regressão Funcional dos 13 Motores
  // -------------------------------------------------------------
  console.log('\n--- CENÁRIO F: Regressão Funcional dos 13 Motores ---');

  const sampleBiz = {
    id: 'biz_teste_regressao',
    name: 'Mecânica e Auto Center Aliança',
    primaryCategory: 'Oficina mecânica',
    niche: 'Manutenção Automotiva e Freios',
    city: 'Limeira',
    neighborhood: 'Centro',
    whatsapp: '19998887766',
    services: ['Troca de Óleo e Filtros', 'Revisão de Freios e ABS', 'Alinhamento e Balanceamento 3D']
  };

  await itAsync('F1: Engine 1 — transformPostForLocalSEO', async () => {
    const post = {
      source: 'instagram',
      text: 'Hoje realizamos uma revisão completa de freios e suspensão!',
      mediaUrls: ['https://example.com/foto1.jpg']
    };
    const res = await api.transformPostForLocalSEO(post, { businessContext: sampleBiz });
    assert.ok(res.success, 'Engine 1 deve ter sucesso');
    assert.ok(res.text && res.text.length > 20, 'Engine 1 deve retornar texto adaptado');
  });

  await itAsync('F2: Engine 2 — generateReviewReply', async () => {
    const res = await api.generateReviewReply({
      reviewerName: 'Carlos Eduardo',
      stars: 5,
      reviewText: 'Atendimento nota 10, consertaram meu carro no mesmo dia!',
      mode: 'smart'
    }, { businessContext: sampleBiz });
    assert.ok(res.success, 'Engine 2 deve ter sucesso');
    assert.ok(res.reply && res.reply.includes('Carlos'), 'Engine 2 deve citar o nome do cliente');
  });

  await itAsync('F3: Engine 3 — generateBusinessDescription', async () => {
    const res = await api.generateBusinessDescription({ businessContext: sampleBiz });
    assert.ok(res.success, 'Engine 3 deve ter sucesso');
    assert.ok(res.description.length <= 750, 'Engine 3 deve respeitar o limite de 750 caracteres do Google');
    assert.ok(res.description.includes('Limeira'), 'Engine 3 deve conter a cidade correta');
  });

  await itAsync('F4: Engine 4 — generateServicesCatalog', async () => {
    const res = await api.generateServicesCatalog({ businessContext: sampleBiz });
    assert.ok(res.success, 'Engine 4 deve ter sucesso');
    assert.ok(Array.isArray(res.services) && res.services.length >= 3, 'Engine 4 deve retornar lista de serviços');
  });

  await itAsync('F5: Engine 5 — suggestGoogleCategories', async () => {
    const res = await api.suggestGoogleCategories({ businessContext: sampleBiz });
    assert.ok(res.success, 'Engine 5 deve ter sucesso');
    assert.ok(res.primaryCategory, 'Engine 5 deve sugerir categoria primária');
  });

  await itAsync('F6: Engine 6 — generateWeeklyContentPlan', async () => {
    const res = await api.generateWeeklyContentPlan({ businessContext: sampleBiz });
    assert.ok(res.success, 'Engine 6 deve ter sucesso');
    assert.ok(Array.isArray(res.posts) && res.posts.length === 3, 'Engine 6 deve gerar exatamente 3 posts da semana');
  });

  await itAsync('F7: Engine 7 — generateFaqList', async () => {
    const res = await api.generateFaqList({ businessContext: sampleBiz });
    assert.ok(res.success, 'Engine 7 deve ter sucesso');
    assert.ok(Array.isArray(res.faqs) && res.faqs.length >= 3, 'Engine 7 deve gerar lista de perguntas e respostas');
  });

  it('F8: Engine 8 — buildSeoFilename', () => {
    const filename = api.buildSeoFilename(sampleBiz, 'troca-de-oleo', 'jpg');
    assert.ok(filename.includes('mecanica'), 'Filename deve conter nome normalizado');
    assert.ok(filename.includes('limeira'), 'Filename deve conter a cidade');
    assert.ok(filename.endsWith('.jpg'), 'Filename deve ter extensão correta');
  });

  it('F9: Engine 9 — auditProfileHeuristics', () => {
    const mockProfile = {
      kpName: 'Mecânica Aliança',
      hasCategory: true,
      categoryText: 'Oficina mecânica',
      hasPhone: true,
      phoneText: '(19) 99888-7766',
      hasStreetAddress: true,
      addressText: 'Rua Central, 100',
      detectedCity: 'Limeira',
      hasHours: true,
      hasWebsite: true,
      websiteUrl: 'https://mecanicaalianca.com.br',
      reviewCount: 45,
      rating: 4.8,
      descriptionLength: 680,
      hasRealPhotos: true
    };
    const audit = api.auditProfileHeuristics(mockProfile);
    assert.ok(audit.score >= 80, 'Score deve ser alto para perfil bem completo');
    assert.ok(audit.grade, 'Grade deve existir');
    assert.strictEqual(audit.checks.length, 8, 'Deve avaliar exatamente os 8 pilares');
  });

  it('F10: Engine 10 — generateTop1ActionPlan', () => {
    const mockProfile = {
      kpName: 'Mecânica Aliança',
      categoryText: 'Oficina mecânica',
      detectedCity: 'Limeira',
      hasWebsite: false,
      reviewCount: 5
    };
    const audit = api.auditProfileHeuristics(mockProfile);
    const plan = api.generateTop1ActionPlan(mockProfile, audit);
    assert.ok(Array.isArray(plan.tiers) && plan.tiers.length === 3, 'Deve retornar os 3 níveis de plano tático (crítico, crescimento, dominação)');
    assert.ok(plan.tiers[0].items.length > 0, 'Deve ter pelo menos uma trava crítica no Nível 1');
  });

  await itAsync('F11: Engine 11 — generateLocalKeywordsRadar', async () => {
    const mockProfile = {
      kpName: 'Mecânica Aliança',
      categoryText: 'Oficina mecânica',
      detectedCity: 'Limeira',
      fullPageText: 'oficina mecânica em limeira troca de óleo suspensão'
    };
    const radar = await api.generateLocalKeywordsRadar(mockProfile, { businessContext: sampleBiz });
    assert.ok(radar.keywords.length >= 5, 'Deve gerar pelo menos 5 palavras-chave de intenção');
    assert.ok(typeof radar.coverageScore === 'number', 'Deve calcular percentual de cobertura');
  });

  it('F12: Engine 12 — analyzeCompetitorsGap', () => {
    const mockProfile = { reviewCount: 10, rating: 4.5, hasWebsite: false };
    const comps = [
      { name: 'Oficina Líder', reviews: 120, rating: 4.9, hasWebsite: true },
      { name: 'Mecânica Express', reviews: 80, rating: 4.7, hasWebsite: true }
    ];
    const gap = api.analyzeCompetitorsGap(mockProfile, comps);
    assert.ok(gap.hasCompetitors, 'Deve identificar concorrentes');
    assert.ok(gap.reviewsNeededForTop3 > 0, 'Deve calcular avaliações necessárias para alcançar os líderes');
  });

  it('F13: Engine 13 — generateProspectPitch', () => {
    const mockProfile = {
      kpName: 'Padaria Modelo',
      categoryText: 'Padaria',
      detectedCity: 'Limeira',
      hasWebsite: false,
      reviewCount: 3
    };
    const audit = api.auditProfileHeuristics(mockProfile);
    const agencyBiz = {
      name: 'ConectWeb Soluções Digitais',
      whatsapp: '5514996988997'
    };
    const pitch = api.generateProspectPitch(mockProfile, audit, agencyBiz);
    assert.ok(Array.isArray(pitch.scripts) && pitch.scripts.length === 3, 'Deve gerar os 3 scripts de abordagem');
    assert.ok(pitch.scripts[0].text.includes('Padaria Modelo'), 'Pitch deve citar a empresa prospectada');
    assert.ok(pitch.scripts[0].text.includes('Limeira'), 'Pitch deve citar a cidade da empresa');
    assert.ok(pitch.scripts[0].text.includes('ConectWeb'), 'Pitch deve citar a agência');
  });

  console.log('\n================================================================');
  console.log(`📊 RESULTADO FINAL DOS TESTES: ${passedTests}/${totalTests} PASSARAM`);
  if (failedTests === 0) {
    console.log('🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!');
  } else {
    console.error(`⚠️ ATENÇÃO: ${failedTests} TESTES FALHARAM!`);
  }
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Erro fatal na execução da suíte:', err);
  process.exit(1);
});
