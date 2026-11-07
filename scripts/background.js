/**
 * Lívia Copilot Pro — Service Worker (Background)
 * Manifest V3 - ConectWeb Enterprise
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Lívia Copilot Pro] Extensão instalada/atualizada com sucesso!');

  // Inicializa configurações v2.0 se ainda não existirem
  chrome.storage.sync.get(['liviaApiUrl', 'businesses'], (res) => {
    const updates = {};
    if (!res.liviaApiUrl) {
      updates.liviaApiUrl = 'https://livia.conectweb.online/api';
      updates.liviaApiToken = '';
    }
    if (!res.businesses || !Array.isArray(res.businesses) || res.businesses.length === 0) {
      updates.businesses = [
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
        }
      ];
      updates.activeBusinessId = 'biz_conectweb_default';
    }

    if (Object.keys(updates).length > 0) {
      chrome.storage.sync.set(updates);
    }
  });

  // Recria menus de contexto de clique direito
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'livia-optimize-selection',
      title: '✨ Otimizar texto selecionado para SEO Local (Lívia)',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'livia-capture-image',
      title: '📸 Capturar esta imagem para Post no Google Meu Negócio (Lívia)',
      contexts: ['image']
    });
  });
});

// Listener de cliques no menu de contexto
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id) return;

  if (info.menuItemId === 'livia-optimize-selection' && info.selectionText) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'optimize_selected_text',
      text: info.selectionText
    }).catch(() => {});
  } else if (info.menuItemId === 'livia-capture-image' && info.srcUrl) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'capture_image_for_post',
      srcUrl: info.srcUrl
    }).catch(() => {});
  }
});

// Converte ArrayBuffer em Base64 de forma eficiente
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Gerenciamento de mensagens internas (CORS-free media fetch + Options)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'open_options') {
    chrome.runtime.openOptionsPage();
    sendResponse({ ok: true });
    return true;
  }

  // Busca imagem/mídia em background sem restrição de CORS da página
  if (request.action === 'fetch_media_base64' && request.url) {
    fetch(request.url)
      .then(async (res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        const buffer = await res.arrayBuffer();
        // Limite seguro de 4MB para salvar em storage.local como DataURL
        if (buffer.byteLength > 4 * 1024 * 1024) {
          sendResponse({ ok: false, reason: 'too_large' });
          return;
        }
        const base64 = arrayBufferToBase64(buffer);
        const dataUrl = `data:${contentType};base64,${base64}`;
        sendResponse({ ok: true, dataUrl, contentType });
      })
      .catch((err) => {
        sendResponse({ ok: false, error: err.message });
      });
    return true; // Indica resposta assíncrona
  }

  // --- GOOGLE PLACES API (MODO TURBO DE PROSPECÇÃO & INTELIGÊNCIA COMPETITIVA) ---
  const GOOGLE_TYPES_TRANSLATION = {
    'motorcycle_dealer': 'Concessionária de motocicletas',
    'motorcycle_repair_shop': 'Oficina de motocicletas',
    'bicycle_store': 'Loja de bicicletas elétricas',
    'car_repair': 'Oficina mecânica',
    'car_dealer': 'Concessionária de veículos',
    'car_wash': 'Lava-rápido',
    'auto_parts_store': 'Loja de autopeças / motopeças',
    'restaurant': 'Restaurante',
    'meal_delivery': 'Delivery / Entregas',
    'meal_takeaway': 'Comida para viagem',
    'bakery': 'Padaria / Confeitaria',
    'bar': 'Bar / Pub',
    'cafe': 'Cafeteria',
    'supermarket': 'Supermercado',
    'grocery_or_supermarket': 'Mercado / Mercearia',
    'convenience_store': 'Loja de conveniência',
    'clothing_store': 'Loja de roupas / confecções',
    'shoe_store': 'Loja de calçados',
    'electronics_store': 'Loja de eletrônicos / informática',
    'home_goods_store': 'Artigos para o lar',
    'hardware_store': 'Materiais de construção',
    'furniture_store': 'Loja de móveis',
    'pet_store': 'Pet shop',
    'veterinary_care': 'Clínica veterinária',
    'pharmacy': 'Farmácia / Drogaria',
    'hospital': 'Hospital',
    'dentist': 'Dentista / Odontologia',
    'physiotherapist': 'Fisioterapia',
    'doctor': 'Consultório médico',
    'hair_care': 'Barbearia / Cabeleireiro',
    'beauty_salon': 'Salão de beleza / Estética',
    'gym': 'Academia / Fitness',
    'real_estate_agency': 'Imobiliária',
    'lawyer': 'Advocacia',
    'accounting': 'Contabilidade',
    'insurance_agency': 'Corretora de seguros',
    'travel_agency': 'Agência de viagens',
    'school': 'Escola / Educação',
    'lodging': 'Hotel / Pousada',
    'store': 'Loja comercial'
  };

  // 1. Testar chave da Google Places API (suporta Places API New e Classic)
  if (request.action === 'test_google_places_api') {
    const key = (request.apiKey || '').trim();
    if (!key) {
      sendResponse({ ok: false, error: 'Chave de API não informada.' });
      return true;
    }

    // Tenta primeiro a moderna Places API (New) recomendada pelo Google
    fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'places.id,places.displayName'
      },
      body: JSON.stringify({ textQuery: 'padaria sao paulo', languageCode: 'pt-BR' })
    })
    .then(async (r) => {
      const data = await r.json();
      if (r.ok && (data.places || Object.keys(data).length === 0)) {
        return sendResponse({ ok: true, version: 'new', message: 'Chave do Google Places API (New) ativa e conectada com sucesso!' });
      }

      // Se deu erro na New, tenta a classic Places API (Legacy)
      try {
        const classicUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=padaria+sao+paulo&key=${encodeURIComponent(key)}&language=pt-BR`;
        const cr = await fetch(classicUrl);
        const cdata = await cr.json();
        if (cdata.status === 'OK' || cdata.status === 'ZERO_RESULTS') {
          return sendResponse({ ok: true, version: 'classic', message: 'Chave do Google Places API (Classic) ativa e conectada!' });
        }
        sendResponse({
          ok: false,
          error: data.error?.message || cdata.error_message || data.error?.status || cdata.status || 'Chave não autorizada ou API não ativada.'
        });
      } catch (err2) {
        sendResponse({ ok: false, error: data.error?.message || err2.message });
      }
    })
    .catch(err => {
      sendResponse({ ok: false, error: err.message });
    });
    return true;
  }

  // 2. Busca de Leads e Concorrentes via Google Places API (New + Classic Fallback)
  if (request.action === 'search_google_places') {
    const key = (request.apiKey || '').trim();
    const query = (request.query || '').trim();
    const city = (request.city || '').trim();
    if (!key || !query) {
      sendResponse({ ok: false, error: 'Chave ou termo de busca ausente.' });
      return true;
    }

    const fullQuery = city ? `${query} em ${city}` : query;

    // Tenta primeiro a moderna Places API (New)
    fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.primaryType,places.primaryTypeDisplayName,places.types,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.businessStatus,places.googleMapsUri,places.location'
      },
      body: JSON.stringify({ textQuery: fullQuery, languageCode: 'pt-BR' })
    })
    .then(async (r) => {
      const data = await r.json();
      if (r.ok && Array.isArray(data.places)) {
        const leads = data.places.map((p, idx) => {
          const rawTypes = p.types || [];
          const translatedTypes = rawTypes
            .map(t => GOOGLE_TYPES_TRANSLATION[t] || null)
            .filter(Boolean);
          const primaryCategory = p.primaryTypeDisplayName?.text ||
            GOOGLE_TYPES_TRANSLATION[p.primaryType] ||
            translatedTypes[0] ||
            (rawTypes[0] ? rawTypes[0].replace(/_/g, ' ') : 'Comércio local');

          return {
            rank: idx + 1,
            place_id: p.id,
            name: p.displayName?.text || 'Sem nome',
            rating: p.rating || 0,
            reviews: p.userRatingCount || 0,
            address: p.formattedAddress || '',
            lat: p.location?.latitude || null,
            lng: p.location?.longitude || null,
            primaryCategory,
            hiddenCategories: translatedTypes.filter(t => t !== primaryCategory),
            allTypes: rawTypes,
            hasWebsite: !!p.websiteUri,
            phone: p.nationalPhoneNumber || p.internationalPhoneNumber || '',
            website: p.websiteUri || '',
            business_status: p.businessStatus || 'OPERATIONAL',
            isOpenNow: true,
            googleMapsUrl: p.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${p.id}`
          };
        });

        return sendResponse({ ok: true, results: leads, total: leads.length, source: 'places_new' });
      }

      // Se falhar ou não estiver ativa, tenta a Classic Places API
      try {
        const classicUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(fullQuery)}&key=${encodeURIComponent(key)}&language=pt-BR`;
        const cr = await fetch(classicUrl);
        const cdata = await cr.json();

        if (cdata.status === 'OK' || cdata.status === 'ZERO_RESULTS') {
          const rawResults = cdata.results || [];
          const leads = rawResults.map((p, idx) => {
            const rawTypes = p.types || [];
            const translatedTypes = rawTypes
              .map(t => GOOGLE_TYPES_TRANSLATION[t] || null)
              .filter(Boolean);
            const primaryCategory = translatedTypes[0] || (rawTypes[0] ? rawTypes[0].replace(/_/g, ' ') : 'Comércio local');

            return {
              rank: idx + 1,
              place_id: p.place_id,
              name: p.name,
              rating: p.rating || 0,
              reviews: p.user_ratings_total || 0,
              address: p.formatted_address || '',
              lat: p.geometry?.location?.lat || null,
              lng: p.geometry?.location?.lng || null,
              primaryCategory,
              hiddenCategories: translatedTypes.slice(1),
              allTypes: rawTypes,
              hasWebsite: false,
              phone: '',
              business_status: p.business_status || 'OPERATIONAL',
              isOpenNow: !!p.opening_hours?.open_now
            };
          });

          return sendResponse({ ok: true, results: leads, total: leads.length, source: 'places_classic' });
        }

        sendResponse({ ok: false, error: data.error?.message || cdata.error_message || cdata.status || 'Falha na busca' });
      } catch (err2) {
        sendResponse({ ok: false, error: data.error?.message || err2.message });
      }
    })
    .catch(err => {
      sendResponse({ ok: false, error: err.message });
    });
    return true;
  }

  // 3. Detalhes completos do local (Telefone, Website, Avaliações, Fotos)
  if (request.action === 'get_google_place_details') {
    const key = (request.apiKey || '').trim();
    const placeId = (request.placeId || '').trim();
    if (!key || !placeId) {
      sendResponse({ ok: false, error: 'Chave ou Place ID ausente.' });
      return true;
    }

    // Tenta primeiro a Places API (New)
    fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=pt-BR`, {
      headers: {
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,userRatingCount,primaryTypeDisplayName,primaryType,types,nationalPhoneNumber,internationalPhoneNumber,websiteUri,googleMapsUri,reviews'
      }
    })
    .then(async (r) => {
      const data = await r.json();
      if (r.ok && data.id) {
        const rawTypes = data.types || [];
        const translatedTypes = rawTypes
          .map(t => GOOGLE_TYPES_TRANSLATION[t] || null)
          .filter(Boolean);
        const primaryCategory = data.primaryTypeDisplayName?.text ||
          GOOGLE_TYPES_TRANSLATION[data.primaryType] ||
          translatedTypes[0] || 'Comércio local';

        return sendResponse({
          ok: true,
          place: {
            place_id: data.id,
            name: data.displayName?.text || '',
            phone: data.nationalPhoneNumber || data.internationalPhoneNumber || '',
            website: data.websiteUri || '',
            rating: data.rating || 0,
            reviewsCount: data.userRatingCount || 0,
            address: data.formattedAddress || '',
            googleMapsUrl: data.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${data.id}`,
            primaryCategory,
            hiddenCategories: translatedTypes.filter(t => t !== primaryCategory),
            recentReviews: (data.reviews || []).map(rev => ({
              author: rev.authorAttribution?.displayName || 'Cliente',
              rating: rev.rating,
              text: rev.text?.text || '',
              time: rev.relativePublishTimeDescription || ''
            }))
          }
        });
      }

      // Fallback para Classic Place Details
      try {
        const fields = 'name,formatted_phone_number,international_phone_number,website,rating,user_ratings_total,formatted_address,types,reviews,url,opening_hours';
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${encodeURIComponent(key)}&language=pt-BR`;

        const cr = await fetch(url);
        const cdata = await cr.json();

        if (cdata.status !== 'OK') {
          return sendResponse({ ok: false, error: data.error?.message || cdata.error_message || cdata.status });
        }

        const res = cdata.result || {};
        const rawTypes = res.types || [];
        const translatedTypes = rawTypes
          .map(t => GOOGLE_TYPES_TRANSLATION[t] || null)
          .filter(Boolean);

        sendResponse({
          ok: true,
          place: {
            place_id: placeId,
            name: res.name,
            phone: res.formatted_phone_number || res.international_phone_number || '',
            website: res.website || '',
            rating: res.rating || 0,
            reviewsCount: res.user_ratings_total || 0,
            address: res.formatted_address || '',
            googleMapsUrl: res.url || `https://www.google.com/maps/place/?q=place_id:${placeId}`,
            primaryCategory: translatedTypes[0] || 'Comércio local',
            hiddenCategories: translatedTypes.slice(1),
            recentReviews: (res.reviews || []).map(rev => ({
              author: rev.author_name,
              rating: rev.rating,
              text: rev.text,
              time: rev.relative_time_description
            }))
          }
        });
      } catch (err2) {
        sendResponse({ ok: false, error: data.error?.message || err2.message });
      }
    })
    .catch(err => {
      sendResponse({ ok: false, error: err.message });
    });
    return true;
  }

  return false;
});
