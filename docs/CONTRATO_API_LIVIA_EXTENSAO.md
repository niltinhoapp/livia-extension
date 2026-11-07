# Contrato de Integração — Lívia Copilot Pro v2.0 ⇄ API Lívia (ConectWeb)

Este documento define os endpoints, payloads e comportamento esperado no servidor da **Lívia** (`livia.conectweb.online`) para atender às funcionalidades corporativas da extensão **Lívia Copilot Pro**.

---

## 1. Princípios de Segurança & Autenticação

* **Protocolo:** HTTPS obrigatório.
* **Header de Autenticação:** `Authorization: Bearer <LIVIA_API_SECRET>`
* **CORS:** Permitir origens de extensões Chrome (`chrome-extension://*`), `localhost` e `https://*.conectweb.online`.

---

## 2. Endpoints da API

### 2.1. Health Check
* **Rota:** `GET /api/health`
* **Headers:** `Authorization: Bearer <LIVIA_API_SECRET>`
* **Resposta Esperada (200 OK):**
```json
{
  "status": "online",
  "version": "2.0.0",
  "service": "Livia AI Copilot Engine Pro"
}
```

---

### 2.2. Transformação de Post Social ➔ SEO Local (Google Meu Negócio)
Converte uma legenda de post do Instagram/Facebook ou texto manual em uma postagem de alto impacto local no Google.

* **Rota:** `POST /api/copilot/transform`
* **Request Body:**
```json
{
  "action": "repurpose_social_post",
  "source": "instagram",
  "postType": "update", // "update", "offer", "tip", "event"
  "originalText": "Saindo pizza quentinha de forno a lenha! #pizza #delivery",
  "mediaUrls": ["https://..."],
  "context": {
    "companyName": "Pizzaria Bela Vista",
    "city": "Bauru",
    "neighborhood": "Altos da Cidade",
    "serviceAreas": "Bauru, Piratininga e Região",
    "niche": "Pizzaria Artesanal e Delivery",
    "primaryCategory": "Pizzaria",
    "services": ["Pizza Artesanal", "Forno a Lenha", "Delivery Rápido"],
    "secondaryKeywords": ["melhor pizza bauru", "pizza delivery"],
    "whatsapp": "5514996988997",
    "website": "https://pizzariabelavista.com.br",
    "tone": "amigavel"
  }
}
```
* **Response Body (200 OK):**
```json
{
  "success": true,
  "optimizedPost": "Procurando a melhor pizza artesanal em Bauru no bairro Altos da Cidade? Na Pizzaria Bela Vista...",
  "ctaType": "WHATSAPP_OR_CALL",
  "keywords": ["pizza artesanal", "Bauru", "Altos da Cidade", "delivery"]
}
```

---

### 2.3. Resposta Inteligente a Avaliação (Elogio vs Gestão de Crise)
Gera respostas humanas, empáticas e otimizadas para SEO Local ou mitigação de crise quando a avaliação for negativa (1 a 3 estrelas).

* **Rota:** `POST /api/copilot/review-reply`
* **Request Body:**
```json
{
  "action": "generate_review_reply",
  "reviewerName": "Carlos Eduardo",
  "stars": 2,
  "reviewText": "A comida estava boa, mas demorou mais de uma hora para entregar.",
  "mode": "crisis", // "smart", "seo_local", "executive", "crisis", "sales_hook"
  "context": {
    "companyName": "Pizzaria Bela Vista",
    "city": "Bauru",
    "neighborhood": "Altos da Cidade",
    "niche": "Pizzaria Artesanal",
    "services": ["Pizza Artesanal", "Delivery Rápido"],
    "whatsapp": "5514996988997",
    "tone": "amigavel",
    "policy": "conciliatory"
  }
}
```
* **Response Body (200 OK):**
```json
{
  "success": true,
  "reply": "Olá, Carlos. Lamentamos sinceramente pelo atraso na sua entrega..."
}
```

---

### 2.4. Otimizador de Descrição da Empresa (750 chars)
Gera ou reformula a descrição oficial da empresa com densidade equilibrada de palavras-chave locais e proposta de valor respeitando estritamente o limite de 750 caracteres do Google.

* **Rota:** `POST /api/copilot/description`
* **Request Body:**
```json
{
  "action": "generate_business_description",
  "context": {
    "companyName": "Pizzaria Bela Vista",
    "niche": "Pizzaria Artesanal e Delivery",
    "primaryCategory": "Pizzaria",
    "services": ["Pizza Artesanal", "Forno a Lenha", "Delivery Rápido"],
    "secondaryKeywords": ["melhor pizza bauru", "pizza delivery"],
    "city": "Bauru",
    "neighborhood": "Altos da Cidade",
    "serviceAreas": "Bauru e Região",
    "whatsapp": "5514996988997",
    "website": "https://pizzariabelavista.com.br",
    "tone": "amigavel"
  }
}
```
* **Response Body (200 OK):**
```json
{
  "success": true,
  "description": "A Pizzaria Bela Vista é a sua melhor escolha em Pizzaria Artesanal em Bauru no bairro Altos da Cidade...",
  "charCount": 738
}
```

---

### 2.5. Sincronização de Empresas da Agência (Nuvem ConectWeb)
Permite que operadores da extensão acessem todas as empresas cadastradas no CRM central da ConectWeb.

* **Rota:** `GET /api/companies`
* **Response Body (200 OK):**
```json
{
  "success": true,
  "companies": [
    {
      "id": "biz_101",
      "name": "Pizzaria Bela Vista",
      "niche": "Pizzaria Artesanal e Delivery",
      "primaryCategory": "Pizzaria",
      "city": "Bauru",
      "neighborhood": "Altos da Cidade",
      "whatsapp": "5514996988997"
    }
  ]
}
```

---

### 2.6. Validação e Ativação de Licença Comercial (SaaS / B2B)
Valida a chave de licença vendida para o cliente (via Kiwify, Hotmart, Asaas ou venda direta) e emite o token seguro para liberação das ferramentas de IA.

* **Rota:** `POST /api/license/verify`
* **Request Body:**
```json
{
  "licenseKey": "LIVIA-AGY-9F8A-77C2-1B3E",
  "clientEmail": "agencia@alfa.com.br",
  "extensionVersion": "2.0.0"
}
```
* **Response Body (200 OK — Licença Válida):**
```json
{
  "success": true,
  "valid": true,
  "plan": "agency",
  "holderName": "Alfa Marketing Digital",
  "status": "active",
  "expiresAt": null,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "features": {
    "unlimitedBusinesses": true,
    "whiteLabelPdf": true,
    "socialRepurposeTikTok": true,
    "crisisManagement": true
  }
}
```
* **Response Body (403 Forbidden — Chave Inválida ou Reembolsada):**
```json
{
  "success": false,
  "valid": false,
  "message": "Chave de licença inválida, expirada ou cancelada na plataforma de pagamento."
}
```
