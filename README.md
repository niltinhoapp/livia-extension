# Lívia Copilot Pro — SEO Local & Google Meu Negócio (ConectWeb)

> A extensão do Chrome mais sofisticada e completa para **Google Meu Negócio**, integrando inteligência artificial, **Instagram**, **Facebook** e suporte a **Múltiplos Clientes/Empresas (Multi-Tenant)** diretamente à IA da **Lívia** (`livia.conectweb.online`).

---

## 🌟 O que a Lívia Copilot Pro faz?

### 1. 🏢 Gestão Multi-Clientes & Onboarding de Empresas (Inspirado no Local Marketing Manager / Paige)
* **Suporte a Múltiplas Empresas:** Cadastre dezenas de clientes e filiais da sua agência.
* **Auto-Detecção Inteligente:** Ao abrir o Google Meu Negócio ou pesquisar *"minha empresa"* no Google, a Lívia reconhece o nome do negócio e ativa o contexto correspondente automaticamente!
* **Barra Flutuante (Lívia Copilot Dock):** Seletor rápido de clientes fixado diretamente na interface do Google Meu Negócio, sem necessidade de abrir as opções.
* **Backup e Restauração:** Exporte e importe a base de empresas em JSON com 1 clique.

### 2. 🛡️ Resposta Inteligente a Avaliações (Elogios vs. Gestão de Crise)
* **Análise de Sentimento Automática:**
  * **4 a 5 Estrelas:** Agradece calorosamente, cita o nome do autor, reforça o serviço prestado e injeta cidade/bairro para impulsionar o ranqueamento no Maps.
  * **1 a 3 Estrelas (Gestão de Crise):** Adota tom empático, educado e conciliador; não discute publicamente e direciona o cliente para o canal VIP de resolução no WhatsApp da gerência.
* **Seletor de Tons de Resposta:** Escolha na hora entre *Modo Inteligente*, *SEO Local*, *Formal & Executivo*, *Comercial com Gancho de Retorno* ou *Gestão de Crise*.

### 3. ✍️ Otimizador de Descrição da Empresa (750 chars)
* Injeta um botão direto no modal de edição de perfil do Google.
* Gera uma descrição persuasiva, rica em palavras-chave e diferenciais, respeitando rigorosamente o limite de 750 caracteres do Google com contador visual em tempo real.

### 4. 📝 Criador de Atualizações & Transformador Social (Instagram/Facebook ➔ Google)
* Transforma posts visuais do Instagram e Facebook em publicações com apelo de SEO Local, removendo hashtags inúteis e injetando chamada para o WhatsApp da empresa.
* Gerador de ideias temáticas com 3 formatos: *Atualização da Semana*, *Oferta Local* e *Dica de Especialista*.

### 5. ❓ Gerador de Perguntas e Respostas (Q&A Seeder)
* Gera perguntas estratégicas que clientes reais fazem e respostas completas para publicação pelo proprietário, dominando as buscas por voz e respostas da IA do Google.

### 6. 🔍 Mini-Auditor de Perfil (Score de Otimização 0 a 100%)
* Analisa em tempo real a completude da ficha: nome, categoria primária, densidade da descrição, horários, telefone/WhatsApp e respostas pendentes a avaliações.

---

## 🚀 Como Instalar no Google Chrome (Modo Desenvolvedor)

1. Abra o navegador e acesse: `chrome://extensions/`
2. No canto superior direito, ative a chave **"Modo do desenvolvedor"**.
3. No canto superior esquerdo, clique em **"Carregar sem compactação"** (*Load unpacked*).
4. Selecione a pasta do projeto:
   ```text
   D:\conectweb\livia-extension
   ```
   *(Caso a extensão já esteja carregada, basta clicar no ícone de recarregar 🔄).*
5. Pronto! O ícone da **Lívia Copilot Pro** aparecerá na barra de ferramentas.

---

## ⚙️ Como Cadastrar Empresas e Clientes

1. Clique com o botão direito no ícone da extensão e vá em **"Opções"** (ou clique na engrenagem no rodapé do Popup).
2. Na aba **"➕ Onboard Nova Empresa"**, preencha os dados:
   * **Nome da Empresa:** Ex: *ConectWeb Soluções Digitais*
   * **Segmento:** Ex: *Marketing Digital e Desenvolvimento de Sistemas*
   * **Categoria Primária:** Ex: *Agência de Marketing Digital* (o fator #1 de SEO Local no Google!)
   * **Cidade e Bairro:** Ex: *Bauru / Centro*
   * **WhatsApp Comercial:** Ex: *5514996988997*
   * **Serviços Oferecidos:** Ex: *Criação de Sites, Gestão de Google Meu Negócio, Tráfego Pago*
   * **Tom de Voz e Política de Crise**
3. Clique em **"Salvar Perfil da Empresa"**.

> **Dica Pro:** A extensão vem com o **Modo Local Autônomo Integrado**. Ela funciona imediatamente mesmo offline ou sem configurar a API externa!

---

## 📂 Estrutura de Arquivos

```text
livia-extension/
├── manifest.json              # Configurações do Chrome Manifest V3 (v2.0.0 Pro)
├── icons/                     # Ícones em alta resolução (16, 48, 128px e SVG)
├── lib/
│   ├── providers.js           # Arquitetura universal extensível (Instagram, Facebook, LinkedIn)
│   └── livia-api.js           # Núcleo multi-empresas, SEO local, reviews, descrição e auditoria
├── popup/
│   ├── popup.html             # Painel rápido com seletor de empresa e gerador inteligente
│   ├── popup.css
│   └── popup.js
├── options/
│   ├── options.html           # Painel de Onboarding (inspirado no Local Marketing Manager) e Backup
│   ├── options.css
│   └── options.js
├── scripts/
│   ├── background.js          # Service Worker do Manifest V3
│   ├── content-gbp.js         # Dock flutuante, respostas de avaliações, descrição e posts no GMN
│   ├── content-instagram.js   # Captura no Instagram Web
│   ├── content-facebook.js    # Captura no Facebook Web
│   └── content-style.css      # Design ConectWeb Pro com glassmorphism e paleta dark/cyan
└── docs/
    └── CONTRATO_API_LIVIA_EXTENSAO.md # Especificação v2.0 para plugar no backend da Lívia
```
