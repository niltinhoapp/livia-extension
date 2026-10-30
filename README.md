# Lívia Copilot — SEO Local & Redes Sociais (ConectWeb)

> Extensão oficial do Chrome que integra o **Google Meu Negócio**, **Instagram** e **Facebook** diretamente à inteligência artificial da **Lívia** (`livia.conectweb.online`).

---

## 🌟 O que a Lívia Copilot faz?

1. **Transformação de Posts das Redes Sociais ➔ Google Meu Negócio:**
   * Detecta postagens abertas no **Instagram Web** e **Facebook Web**.
   * Ao clicar no botão flutuante **"Lívia: Enviar para o Google Meu Negócio"**, a IA remove hashtags inúteis de feed e reformula o texto injetando a cidade, bairro e palavras-chave de busca local com botão para WhatsApp.
   * Abre o Google Meu Negócio ou cola automaticamente no formulário de criação de atualização.

2. **Resposta Inteligente a Avaliações de Clientes (Reviews):**
   * Na página de avaliações do Google Meu Negócio ou na busca direta (`minha empresa`), a extensão injeta o botão **"✨ Responder com a Lívia"**.
   * Identifica o nome do cliente, as estrelas atribuídas e o comentário.
   * Gera uma resposta humana, cordial, personalizada e otimizada para SEO Local em menos de 2 segundos.

3. **Arquitetura Aberta para Novas Redes Sociais (Multi-Canal):**
   * Estruturada sob o padrão de **Provedores Universais** (`lib/providers.js`).
   * Instagram e Facebook prontos e ativos.
   * **LinkedIn**, **TikTok** e **X (Twitter)** já possuem esqueletos pré-configurados para ativação imediata.

---

## 🚀 Como Instalar no Google Chrome (Modo Desenvolvedor)

A extensão já está montada e pronta para uso imediato em qualquer navegador baseado em Chromium (Google Chrome, Edge, Brave):

1. Abra o navegador e digite na barra de endereços: `chrome://extensions/`
2. No canto superior direito, ative a chave **"Modo do desenvolvedor"**.
3. No canto superior esquerdo, clique no botão **"Carregar sem compactação"** (ou *Load unpacked*).
4. Selecione a pasta da extensão:
   ```text
   D:\conectweb\livia-extension
   ```
5. Pronto! O ícone da **Lívia Copilot** aparecerá na barra de ferramentas do seu Chrome.

---

## ⚙️ Como Configurar a Lívia

1. Clique com o botão direito no ícone da extensão e vá em **"Opções"** (ou abra `chrome-extension://<id>/options/options.html`).
2. Defina os dados da empresa para calibração de SEO:
   * **Nome da Empresa:** (ex: *ConectWeb Soluções Digitais*)
   * **Segmento:** (ex: *Marketing Digital e Sistemas Web*)
   * **Cidade e Bairro:** (ex: *Bauru / Centro*)
   * **WhatsApp Comercial:** (ex: *5514996988997*)
   * **Token Secreto da Lívia:** O mesmo token de autenticação configurado no servidor da Lívia (`LIVIA_API_SECRET`).
3. Clique em **"Salvar Todas as Configurações"**.

> **Nota:** Se você ainda não tiver subido os novos endpoints na API da Lívia, a extensão possui um **Modo Local Autônomo Integrado**. Ela funciona imediatamente mesmo offline!

---

## 📂 Estrutura de Arquivos

```text
livia-extension/
├── manifest.json              # Configurações do Chrome Manifest V3
├── icons/                     # Ícones em alta resolução (16, 48, 128px e SVG)
│   ├── icon.svg
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── lib/
│   ├── providers.js           # Arquitetura universal extensível (Instagram, Facebook, LinkedIn)
│   └── livia-api.js           # Cliente de comunicação com livia.conectweb.online
├── popup/
│   ├── popup.html             # Painel rápido de ações e playground
│   ├── popup.css
│   └── popup.js
├── options/
│   ├── options.html           # Tela completa de configurações e calibração de SEO
│   ├── options.css
│   └── options.js
├── scripts/
│   ├── background.js          # Service Worker do Manifest V3
│   ├── content-gbp.js         # Injeta botões no Google Meu Negócio / Maps
│   ├── content-instagram.js   # Injeta botão de captura no Instagram
│   ├── content-facebook.js    # Injeta botão de captura no Facebook
│   └── content-style.css      # Estilização moderna com design ConectWeb
└── docs/
    └── CONTRATO_API_LIVIA_EXTENSAO.md # Especificação exata para plugar no backend da Lívia
```

---

## 📦 Como Subir para o GitHub

Para transformar a pasta em um repositório Git independente e enviar para o GitHub da ConectWeb:

```powershell
cd D:\conectweb\livia-extension
git init
git add .
git commit -m "feat: initial commit - Lívia Copilot Chrome Extension v1.0.0"
git branch -M main
git remote add origin https://github.com/niltinhoapp/livia-extension.git
git push -u origin main
```

---

## 🧠 Próximos Passos Recomendados

1. **Adicionar os Endpoints no Repositório da Lívia:**
   * Consulte o arquivo `docs/CONTRATO_API_LIVIA_EXTENSAO.md` e adicione a rota `/api/copilot/transform` no backend da Lívia.
2. **Ativação do LinkedIn:**
   * Quando quiser liberar a geração para LinkedIn, basta habilitar a flag no `lib/providers.js`.
3. **Publicação na Chrome Web Store:**
   * Compactar a pasta em `.zip` e publicar no painel de desenvolvedores do Google Chrome.
