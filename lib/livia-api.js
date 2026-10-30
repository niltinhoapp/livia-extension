/**
 * Lívia Copilot — Cliente de Integração com a API da Lívia (ConectWeb)
 * Comunicação direta com https://livia.conectweb.online/api
 */

class LiviaApiClient {
  constructor() {
    this.defaultApiUrl = 'https://livia.conectweb.online/api';
  }

  // Recupera as configurações salvas na extensão
  async getConfig() {
    return new Promise((resolve) => {
      chrome.storage.sync.get({
        liviaApiUrl: this.defaultApiUrl,
        liviaApiToken: '',
        companyName: 'Minha Empresa',
        companyCity: 'Minha Cidade',
        companyNeighborhood: 'Centro',
        companyNiche: 'Comércio / Serviços',
        companyWhatsapp: '',
        toneOfVoice: 'amigavel' // 'profissional', 'amigavel', 'persuasivo', 'direto'
      }, (items) => {
        resolve(items);
      });
    });
  }

  // Testa conectividade com a API da Lívia
  async ping() {
    const config = await this.getConfig();
    try {
      const response = await fetch(`${config.liviaApiUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.liviaApiToken}`,
          'Accept': 'application/json'
        }
      });
      return { ok: response.ok, status: response.status };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  /**
   * Transforma um post de rede social (Instagram, Facebook) em um post otimizado
   * para o Google Meu Negócio com foco em SEO Local.
   */
  async transformPostForLocalSEO(universalPost) {
    const config = await this.getConfig();

    const payload = {
      action: 'repurpose_social_post',
      source: universalPost.source,
      originalText: universalPost.getCleanedCaption ? universalPost.getCleanedCaption() : universalPost.text,
      mediaUrls: universalPost.mediaUrls || [],
      context: {
        companyName: config.companyName,
        city: config.companyCity,
        neighborhood: config.companyNeighborhood,
        niche: config.companyNiche,
        whatsapp: config.companyWhatsapp,
        tone: config.toneOfVoice
      }
    };

    // 1. Tenta a API real da Lívia
    if (config.liviaApiToken && config.liviaApiToken.trim() !== '') {
      try {
        const response = await fetch(`${config.liviaApiUrl}/copilot/transform`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.liviaApiToken}`
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.optimizedPost) {
            return {
              success: true,
              text: data.optimizedPost,
              ctaType: data.ctaType || 'CALL_NOW',
              keywordsUsed: data.keywords || []
            };
          }
        }
      } catch (err) {
        console.warn('[Lívia Copilot] API da Lívia indisponível, usando motor de SEO local da extensão:', err);
      }
    }

    // 2. Fallback Inteligente Local (Garante que a extensão sempre funcione de imediato)
    return this._localPostTransformer(payload);
  }

  /**
   * Gera uma resposta profissional para uma avaliação de cliente no Google Maps.
   */
  async generateReviewReply({ reviewerName, stars, reviewText }) {
    const config = await this.getConfig();

    const payload = {
      action: 'generate_review_reply',
      reviewerName: reviewerName || 'Cliente',
      stars: parseInt(stars) || 5,
      reviewText: reviewText || '',
      context: {
        companyName: config.companyName,
        city: config.companyCity,
        neighborhood: config.companyNeighborhood,
        niche: config.companyNiche,
        whatsapp: config.companyWhatsapp,
        tone: config.toneOfVoice
      }
    };

    if (config.liviaApiToken && config.liviaApiToken.trim() !== '') {
      try {
        const response = await fetch(`${config.liviaApiUrl}/copilot/review-reply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.liviaApiToken}`
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

    // Fallback Local
    return this._localReviewReplyGenerator(payload);
  }

  // --- MOTORES LOCAIS DE REESCRITA (Garantem funcionamento mesmo antes de deploy do endpoint) ---

  _localPostTransformer(payload) {
    const ctx = payload.context;
    const cleanOriginal = payload.originalText || 'Novidades e promoções imperdíveis!';
    const cityText = ctx.city ? ` em ${ctx.city}` : '';
    const neighborhoodText = ctx.neighborhood ? ` no bairro ${ctx.neighborhood}` : '';
    const company = ctx.companyName || 'nossa equipe';

    let ctaLine = ctx.whatsapp 
      ? `\n\n📲 Dúvidas ou pedidos? Fale direto no nosso WhatsApp: ${ctx.whatsapp}` 
      : `\n\n📍 Venha nos visitar ou entre em contato pelo nosso perfil!`;

    // Transforma a legenda das redes em formato de busca local do Google
    const seoTitle = `Procurando o melhor em ${ctx.niche}${cityText}?`;
    const intro = `Na ${company}${neighborhoodText}, você encontra tudo com atendimento de excelência e qualidade garantida.`;
    
    // Resume a mensagem do Instagram focando no benefício
    const bodyContent = cleanOriginal
      .replace(/link na bio/gi, 'acesse nosso perfil do Google')
      .replace(/arrasta pra cima/gi, 'veja nossos detalhes');

    const finalText = `${seoTitle}\n\n${intro}\n\n${bodyContent}${ctaLine}`;

    return {
      success: true,
      text: finalText,
      ctaType: 'WHATSAPP_OR_CALL',
      keywordsUsed: [ctx.niche, ctx.city, ctx.neighborhood].filter(Boolean)
    };
  }

  _localReviewReplyGenerator(payload) {
    const { reviewerName, stars, reviewText, context } = payload;
    const firstName = reviewerName.split(' ')[0] || 'Cliente';
    const company = context.companyName || 'Nossa equipe';
    const city = context.city ? ` em ${context.city}` : '';

    let reply = '';

    if (stars >= 4) {
      const positiveReplies = [
        `Olá, ${firstName}! Muito obrigado pela avaliação de ${stars} estrelas! Ficamos muito felizes em saber que teve uma excelente experiência com a ${company}${city}. Nosso objetivo é sempre entregar o melhor atendimento. Conte sempre conosco e volte em breve! ✨`,
        `Oi, ${firstName}! Agradecemos de coração por dedicar seu tempo para nos avaliar. É uma satisfação imensa para toda a equipe da ${company} atender você. Esperamos vê-lo(a) novamente em breve! 👏`
      ];
      reply = positiveReplies[Math.floor(Math.random() * positiveReplies.length)];
    } else {
      const contactInfo = context.whatsapp ? `pelo WhatsApp (${context.whatsapp})` : 'por mensagem direta';
      reply = `Olá, ${firstName}. Agradecemos por compartilhar sua experiência. Na ${company}, prezamos pela máxima qualidade e transparência em nosso atendimento. Gostaríamos muito de entender melhor o ocorrido para corrigir qualquer falha. Por favor, entre em contato diretamente conosco ${contactInfo} para que possamos resolver da melhor forma para você. Estamos à disposição!`;
    }

    return {
      success: true,
      reply: reply
    };
  }
}

if (typeof window !== 'undefined') {
  window.LiviaApi = new LiviaApiClient();
}
