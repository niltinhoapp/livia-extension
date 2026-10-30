/**
 * Lívia Copilot — Camada de Provedores de Redes Sociais & Modelo Universal
 * Arquitetura extensível: Instagram, Facebook e futuro LinkedIn / TikTok.
 * ConectWeb 2026.
 */

// 1. MODELO UNIVERSAL DE POSTAGEM
class UniversalPost {
  constructor({
    id = '',
    source = 'generic',
    author = '',
    text = '',
    mediaUrls = [],
    mediaType = 'IMAGE', // IMAGE, VIDEO, CAROUSEL, TEXT_ONLY
    permalink = '',
    publishedAt = new Date().toISOString(),
    metrics = { likes: 0, comments: 0 }
  } = {}) {
    this.id = id;
    this.source = source; // 'instagram' | 'facebook' | 'linkedin' | 'generic'
    this.author = author;
    this.text = text;
    this.mediaUrls = Array.isArray(mediaUrls) ? mediaUrls : [];
    this.mediaType = mediaType;
    this.permalink = permalink;
    this.publishedAt = publishedAt;
    this.metrics = metrics;
  }

  // Limpa o texto original removendo excesso de hashtags de engajamento do feed
  getCleanedCaption() {
    if (!this.text) return '';
    // Remove hashtags muito genéricas que não agregam no Google Meu Negócio
    return this.text
      .replace(/#([a-zA-Z0-9_]+)/g, (match, tag) => {
        const lower = tag.toLowerCase();
        const bannedTags = ['foryou', 'fyp', 'viral', 'reels', 'explore', 'feed', 'instagood', 'instalike', 'love'];
        if (bannedTags.includes(lower)) return '';
        return match; // Mantém tags de nicho/produto se houver
      })
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// 2. CLASSE BASE PARA QUALQUER PROVEDOR DE REDE SOCIAL
class BaseSocialProvider {
  constructor(name) {
    this.name = name;
  }

  isCurrentPage() {
    throw new Error('Método isCurrentPage deve ser implementado');
  }

  extractCurrentPost() {
    throw new Error('Método extractCurrentPost deve ser implementado');
  }
}

// 3. PROVEDOR INSTAGRAM
class InstagramProvider extends BaseSocialProvider {
  constructor() {
    super('instagram');
  }

  isCurrentPage() {
    return window.location.hostname.includes('instagram.com');
  }

  // Extrai dados do post atualmente aberto na tela do Instagram Web
  extractCurrentPost() {
    try {
      // 1. Verifica se está em um modal ou página de post (/p/ ou /reel/)
      const pathname = window.location.pathname;
      const isPostUrl = pathname.includes('/p/') || pathname.includes('/reel/');

      // Busca o container do post (artigo ou modal)
      const article = document.querySelector('article[role="presentation"]') || document.querySelector('article');
      if (!article && !isPostUrl) return null;

      const container = article || document;

      // 2. Extrai o texto da legenda
      let captionText = '';
      // No Instagram web, a legenda geralmente fica dentro do primeiro span com texto após o autor
      const captionElement = container.querySelector('h1 + span') ||
                             container.querySelector('div[role="button"] + span') ||
                             container.querySelector('span._ap3a._aaco._aacu._aacx._aad7._aade') ||
                             container.querySelector('article span[dir="auto"]');

      if (captionElement) {
        captionText = captionElement.innerText || captionElement.textContent || '';
      }

      // 3. Extrai imagens ou vídeos
      const mediaUrls = [];
      const images = container.querySelectorAll('img[srcset], img[src*="instagram"]');
      images.forEach(img => {
        // Ignora foto de avatar (pequenas ou com classe de avatar)
        if (img.width > 150 && img.height > 150 && img.src && !mediaUrls.includes(img.src)) {
          mediaUrls.push(img.src);
        }
      });

      // Se for vídeo/reel
      const video = container.querySelector('video');
      let mediaType = 'IMAGE';
      if (video && video.src) {
        mediaUrls.unshift(video.src);
        mediaType = 'VIDEO';
      } else if (mediaUrls.length > 1) {
        mediaType = 'CAROUSEL';
      }

      // 4. Identificador / Link
      const permalink = window.location.href;
      const postId = pathname.split('/')[2] || 'insta_' + Date.now();

      return new UniversalPost({
        id: postId,
        source: 'instagram',
        text: captionText,
        mediaUrls: mediaUrls,
        mediaType: mediaType,
        permalink: permalink
      });
    } catch (err) {
      console.warn('[Lívia Copilot] Erro ao extrair post do Instagram:', err);
      return null;
    }
  }
}

// 4. PROVEDOR FACEBOOK
class FacebookProvider extends BaseSocialProvider {
  constructor() {
    super('facebook');
  }

  isCurrentPage() {
    return window.location.hostname.includes('facebook.com');
  }

  extractCurrentPost() {
    try {
      // Localiza o post em destaque ou primeiro post visível
      const postContainer = document.querySelector('div[role="article"]') || document.querySelector('div[data-pagelet*="FeedUnit"]');
      if (!postContainer) return null;

      // Texto do post no Facebook
      const messageElement = postContainer.querySelector('div[data-ad-preview="message"]') ||
                             postContainer.querySelector('div[dir="auto"]');
      const text = messageElement ? messageElement.innerText : '';

      // Imagem do post
      const mediaUrls = [];
      const img = postContainer.querySelector('img[src*="fbcdn"]');
      if (img && img.width > 200) {
        mediaUrls.push(img.src);
      }

      return new UniversalPost({
        id: 'fb_' + Date.now(),
        source: 'facebook',
        text: text,
        mediaUrls: mediaUrls,
        permalink: window.location.href
      });
    } catch (err) {
      console.warn('[Lívia Copilot] Erro ao extrair post do Facebook:', err);
      return null;
    }
  }
}

// 5. PROVEDOR LINKEDIN (Esqueleto pronto para expansão futura)
class LinkedInProvider extends BaseSocialProvider {
  constructor() {
    super('linkedin');
  }

  isCurrentPage() {
    return window.location.hostname.includes('linkedin.com');
  }

  extractCurrentPost() {
    // Pronto para ativação na fase B2B
    return new UniversalPost({
      source: 'linkedin',
      text: 'Exemplo de post LinkedIn para conversão B2B'
    });
  }
}

// Exporta globalmente para uso nos content scripts e background
if (typeof window !== 'undefined') {
  window.LiviaProviders = {
    UniversalPost,
    InstagramProvider: new InstagramProvider(),
    FacebookProvider: new FacebookProvider(),
    LinkedInProvider: new LinkedInProvider()
  };
}
