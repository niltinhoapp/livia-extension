/**
 * Lívia Copilot Pro — Camada de Provedores de Redes Sociais & Modelo Universal
 * Arquitetura extensível: Instagram, Facebook e LinkedIn / TikTok.
 * Inclui extração de legenda, mídia em alta resolução (srcset 1080p) e fallback de OCR (alt text).
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

  // Limpa o texto original removendo excesso de hashtags genéricas de engajamento do feed
  getCleanedCaption() {
    if (!this.text) return '';
    return this.text
      .replace(/#([a-zA-Z0-9_À-ÿ]+)/g, (match, tag) => {
        const lower = tag.toLowerCase();
        const bannedTags = ['foryou', 'fyp', 'viral', 'reels', 'explore', 'feed', 'instagood', 'instalike', 'love', 'bomdia', 'boatarde', 'boanoite'];
        if (bannedTags.includes(lower)) return '';
        return match;
      })
      .replace(/[ \t]+/g, ' ')
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
      const pathname = window.location.pathname;
      const isPostUrl = pathname.includes('/p/') || pathname.includes('/reel/');

      // Localiza o modal do post aberto ou a página dedicada de post
      const dialog = document.querySelector('div[role="dialog"]');
      const article = document.querySelector('article[role="presentation"]') || document.querySelector('article');

      // Se for a página de perfil e o modal não estiver aberto, não há post ativo na tela
      const container = dialog || (isPostUrl ? (article || document) : null);
      if (!container) return null;

      // 1. Extrai o texto da legenda do post
      let captionText = '';
      const rootComment = container.querySelector('div[data-testid="post-comment-root"]') ||
                          container.querySelector('ul > li:first-child');
      const targetArea = rootComment || container;

      const captionElement = targetArea.querySelector('h1[dir="auto"]') ||
                             targetArea.querySelector('h1') ||
                             targetArea.querySelector('span._ap3a._aaco._aacu._aacx._aad7._aade') ||
                             targetArea.querySelector('div[role="button"] + span') ||
                             targetArea.querySelector('div[data-testid="post-comment-root"] span') ||
                             targetArea.querySelector('span[dir="auto"]');

      if (captionElement) {
        captionText = captionElement.innerText || captionElement.textContent || '';
      }

      if (!captionText) {
        const anyH1 = container.querySelector('h1');
        if (anyH1) {
          captionText = anyH1.innerText || anyH1.textContent || '';
        } else {
          const spans = container.querySelectorAll('span[dir="auto"]');
          for (const s of spans) {
            const txt = (s.innerText || s.textContent || '').trim();
            const lower = txt.toLowerCase();
            if (
              txt.length > 20 &&
              !lower.startsWith('ver todos os') &&
              !lower.startsWith('curtido por') &&
              !lower.includes('adicione um comentário')
            ) {
              captionText = txt;
              break;
            }
          }
        }
      }

      // Limpa possível prefixo com o username do autor colado na legenda
      if (captionText) {
        captionText = captionText.replace(/^[a-zA-Z0-9._]{2,30}\s*\n+/, '').trim();
      }

      // 2. Extrai imagens em alta resolução (1080p via srcset) e OCR (alt text da imagem)
      const mediaUrls = [];
      let ocrFallbackText = '';
      const images = container.querySelectorAll('img[srcset], img[src*="instagram"], img[src*="cdninstagram"], img[src*="fbcdn"]');

      images.forEach(img => {
        const w = img.naturalWidth || img.width || 0;
        const h = img.naturalHeight || img.height || 0;
        const alt = (img.alt || '').trim();
        const isAvatar = img.src.includes('s150x150') || img.src.includes('s320x320') || alt.toLowerCase().includes('foto do perfil') || alt.toLowerCase().includes('profile picture');

        if (!isAvatar && (w === 0 || w > 140) && (h === 0 || h > 140)) {
          let bestSrc = img.src;
          if (img.srcset) {
            const candidates = img.srcset
              .split(',')
              .map(s => s.trim().split(' ')[0])
              .filter(s => s.startsWith('http'));
            if (candidates.length > 0) {
              bestSrc = candidates[candidates.length - 1];
            }
          }
          if (bestSrc && !mediaUrls.includes(bestSrc)) {
            mediaUrls.push(bestSrc);
          }

          // Se a imagem possui texto OCR extraído pelo próprio Instagram no atributo alt
          if (!ocrFallbackText && alt.length > 25) {
            const quotedMatch = alt.match(/que diz ['"]([^'"]+)['"]/i) || alt.match(/that says ['"]([^'"]+)['"]/i);
            if (quotedMatch && quotedMatch[1]) {
              ocrFallbackText = quotedMatch[1];
            } else {
              ocrFallbackText = alt.replace(/^(Photo by|Foto de)[^.]+\.\s*/i, '');
            }
          }
        }
      });

      // Se a legenda estava vazia (arte gráfica sem texto na descrição), usa o texto lido da própria imagem!
      if ((!captionText || captionText.length < 10) && ocrFallbackText) {
        captionText = ocrFallbackText;
      }

      // 3. Verifica se é Vídeo ou Reel
      const video = container.querySelector('video');
      let mediaType = 'IMAGE';
      if (video) {
        const videoSrc = video.src || video.querySelector('source')?.src;
        if (videoSrc && !videoSrc.startsWith('blob:')) {
          mediaUrls.unshift(videoSrc);
          mediaType = 'VIDEO';
        } else if (video.poster && !mediaUrls.includes(video.poster)) {
          mediaUrls.unshift(video.poster);
          mediaType = 'VIDEO';
        }
      } else if (mediaUrls.length > 1) {
        mediaType = 'CAROUSEL';
      }

      // 4. Identificador e link permanente do post
      let permalink = window.location.href;
      if (!isPostUrl && dialog) {
        const postLink = dialog.querySelector('a[href*="/p/"], a[href*="/reel/"]');
        if (postLink && postLink.href) {
          permalink = postLink.href;
        }
      }
      const postId = permalink.split('/p/')[1]?.split('/')[0] ||
                     permalink.split('/reel/')[1]?.split('/')[0] ||
                     'insta_' + Date.now();

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
      const dialog = document.querySelector('div[role="dialog"]');
      const postContainer = dialog || document.querySelector('div[role="article"]') || document.querySelector('div[data-pagelet*="FeedUnit"]');
      if (!postContainer) return null;

      const messageElement = postContainer.querySelector('div[data-ad-preview="message"]') ||
                             postContainer.querySelector('div[dir="auto"]');
      const text = messageElement ? messageElement.innerText : '';

      const mediaUrls = [];
      const imgs = postContainer.querySelectorAll('img[src*="fbcdn"]');
      imgs.forEach(img => {
        if ((img.width > 180 || img.naturalWidth > 180) && img.src && !mediaUrls.includes(img.src)) {
          mediaUrls.push(img.src);
        }
      });

      return new UniversalPost({
        id: 'fb_' + Date.now(),
        source: 'facebook',
        text: text,
        mediaUrls: mediaUrls,
        mediaType: mediaUrls.length > 0 ? 'IMAGE' : 'TEXT_ONLY',
        permalink: window.location.href
      });
    } catch (err) {
      console.warn('[Lívia Copilot] Erro ao extrair post do Facebook:', err);
      return null;
    }
  }
}

// 5. PROVEDOR TIKTOK
class TikTokProvider extends BaseSocialProvider {
  constructor() {
    super('tiktok');
  }

  isCurrentPage() {
    return window.location.hostname.includes('tiktok.com');
  }

  // Extrai dados reais do vídeo/post aberto na tela do TikTok Web
  extractCurrentPost() {
    try {
      const pathname = window.location.pathname;
      const isVideoPage = pathname.includes('/video/');

      // Localiza o modal do vídeo aberto ou o container do player principal
      const modal = document.querySelector('div[data-e2e="modal-content"], div[role="dialog"], div[class*="DivModalContainer"]');
      const feedItem = document.querySelector('div[data-e2e="recommend-list-item-container"], div[class*="DivItemContainer"]');
      const container = modal || (isVideoPage ? (document.querySelector('main') || document) : (feedItem || document));
      if (!container) return null;

      // 1. Extrai a legenda do vídeo (caption/descrição)
      let captionText = '';
      const descSelectors = [
        'span[data-e2e="browse-video-desc"]',
        'h1[data-e2e="browse-video-desc"]',
        'div[data-e2e="video-desc"]',
        'div[data-e2e="user-post-item-desc"]',
        'h1[data-e2e="search-card-desc"]',
        'span[data-e2e="search-card-desc"]',
        'div[class*="DivDescriptionContainer"]',
        'div[class*="DivTextContent"]',
        'h1',
        'span[class*="SpanText"]'
      ];

      for (const sel of descSelectors) {
        const el = container.querySelector(sel);
        if (el) {
          const txt = (el.innerText || el.textContent || '').trim();
          if (txt.length > 5) {
            captionText = txt;
            break;
          }
        }
      }

      // Se ainda não achou, procura por span com hashtags ou texto relevante
      if (!captionText) {
        const textNodes = Array.from(container.querySelectorAll('span, p, h1, h2, div[dir="auto"]'));
        for (const node of textNodes) {
          if (node.closest('button, nav, header, ul[role="menu"]')) continue;
          const txt = (node.innerText || '').trim();
          if (txt.length > 15 && (txt.includes('#') || txt.split(' ').length > 4)) {
            captionText = txt;
            break;
          }
        }
      }

      // 2. Extrai o autor / handle (@perfil)
      let author = '';
      const authorSelectors = [
        'span[data-e2e="browse-username"]',
        'h3[data-e2e="user-title"]',
        'span[data-e2e="video-author-uniqueid"]',
        'a[data-e2e="video-author-avatar"]',
        'a[href*="/@"]'
      ];
      for (const sel of authorSelectors) {
        const el = container.querySelector(sel);
        if (el) {
          const raw = (el.innerText || el.getAttribute('href') || '').trim();
          const match = raw.match(/@([a-zA-Z0-9._]+)/);
          if (match && match[1]) {
            author = match[1];
            break;
          } else if (raw.length > 2 && !raw.includes('/')) {
            author = raw.replace(/^@/, '');
            break;
          }
        }
      }

      // 3. Extrai a mídia do vídeo (poster / imagem de capa em alta definição e vídeo)
      const mediaUrls = [];
      const video = container.querySelector('video');
      let posterUrl = '';

      if (video) {
        posterUrl = video.poster || video.getAttribute('poster') || '';
        if (video.src && !video.src.startsWith('blob:')) {
          mediaUrls.push(video.src);
        }
      }

      // Capa/Thumbnail do vídeo do TikTok
      if (!posterUrl) {
        const coverImg = container.querySelector(
          'img[data-e2e="video-poster"], img[src*="tiktokcdn.com"], img[src*="byteoversea.com"], div[class*="DivPlayerContainer"] img'
        );
        if (coverImg && coverImg.src) {
          posterUrl = coverImg.src;
        }
      }

      if (posterUrl && !mediaUrls.includes(posterUrl)) {
        mediaUrls.unshift(posterUrl);
      }

      // 4. Métricas sociais (curtidas e comentários se visíveis)
      let likes = 0;
      let comments = 0;
      const likeEl = container.querySelector('strong[data-e2e="like-count"], span[data-e2e="like-count"]');
      if (likeEl) {
        const lTxt = (likeEl.innerText || '').trim().toLowerCase();
        likes = parseFloat(lTxt.replace('k', '000').replace('m', '000000').replace(/\D/g, '')) || 0;
      }
      const commentEl = container.querySelector('strong[data-e2e="comment-count"], span[data-e2e="comment-count"]');
      if (commentEl) {
        const cTxt = (commentEl.innerText || '').trim().toLowerCase();
        comments = parseFloat(cTxt.replace('k', '000').replace('m', '000000').replace(/\D/g, '')) || 0;
      }

      const permalink = window.location.href;
      const idMatch = permalink.match(/\/video\/(\d+)/);
      const postId = idMatch ? idMatch[1] : ('tiktok_' + Date.now());

      return new UniversalPost({
        id: postId,
        source: 'tiktok',
        author: author,
        text: captionText,
        mediaUrls: mediaUrls,
        mediaType: 'VIDEO',
        permalink: permalink,
        metrics: { likes, comments }
      });
    } catch (err) {
      console.warn('[Lívia Copilot] Erro ao extrair vídeo do TikTok:', err);
      return null;
    }
  }
}

// 6. GERENCIADOR CENTRAL DE PROVEDORES
const SocialProviderManager = {
  InstagramProvider: new InstagramProvider(),
  FacebookProvider: new FacebookProvider(),
  TikTokProvider: new TikTokProvider(),
  UniversalPost: UniversalPost,

  getActiveProvider() {
    if (this.InstagramProvider.isCurrentPage()) return this.InstagramProvider;
    if (this.FacebookProvider.isCurrentPage()) return this.FacebookProvider;
    if (this.TikTokProvider.isCurrentPage()) return this.TikTokProvider;
    return null;
  }
};

if (typeof window !== 'undefined') {
  window.LiviaProviders = SocialProviderManager;
}
