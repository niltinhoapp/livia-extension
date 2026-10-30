# Contrato de Integração — Lívia Copilot (Extensão Chrome) ⇄ API Lívia

Este documento define os endpoints, payloads e comportamento esperado no servidor da **Lívia** (`livia.conectweb.online`) para atender as requisições da extensão Chrome **Lívia Copilot**.

---

## 1. Princípios de Segurança & Autenticação

* **Protocolo:** HTTPS obrigatório.
* **Header de Autenticação:** `Authorization: Bearer <LIVIA_API_SECRET>`
* **CORS:** Permitir chamadas de origens de extensões Chrome (`chrome-extension://*`) e `localhost`.

---

## 2. Endpoints Necessários

### 2.1. Health Check
* **Rota:** `GET /api/health`
* **Headers:** `Authorization: Bearer <LIVIA_API_SECRET>`
* **Resposta Esperada:**
```json
{
  "status": "online",
  "version": "1.0.0",
  "service": "Livia AI Copilot Engine"
}
```

---

### 2.2. Transformação de Post Social ➔ SEO Local
Converte uma legenda de post do Instagram ou Facebook em um post de alto impacto para o Google Meu Negócio / Maps.

* **Rota:** `POST /api/copilot/transform`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <LIVIA_API_SECRET>`
* **Request Body:**
```json
{
  "action": "repurpose_social_post",
  "source": "instagram",
  "originalText": "Saindo pizza quentinha de forno a lenha! Quem aí topa uma de calabresa hoje? Marca o @ nos comentários! #pizza #delivery #delicia",
  "mediaUrls": ["https://..."],
  "context": {
    "companyName": "Pizzaria Bela Vista",
    "city": "Bauru",
    "neighborhood": "Altos da Cidade",
    "niche": "Pizzaria Artesanal e Delivery",
    "whatsapp": "5514996988997",
    "tone": "amigavel"
  }
}
```

* **Response Body (200 OK):**
```json
{
  "success": true,
  "optimizedPost": "Procurando a melhor pizza artesanal em Bauru no bairro Altos da Cidade? Na Pizzaria Bela Vista, preparamos massas de fermentação natural com ingredientes selecionados, como nossa clássica Calabresa Artesanal no forno a lenha. Atendimento no local e delivery rápido para toda a cidade!\n\n📲 Faça seu pedido direto no nosso WhatsApp: (14) 99698-8997",
  "ctaType": "WHATSAPP_OR_CALL",
  "keywords": ["pizza artesanal", "Bauru", "Altos da Cidade", "delivery"]
}
```

---

### 2.3. Resposta Inteligente a Avaliação de Cliente
Gera respostas humanas, empáticas e que reforçam as palavras-chave locais e o nome da empresa.

* **Rota:** `POST /api/copilot/review-reply`
* **Request Body:**
```json
{
  "action": "generate_review_reply",
  "reviewerName": "Carlos Eduardo",
  "stars": 5,
  "reviewText": "Atendimento impecável e o produto chegou antes do prazo previsto! Recomendo a todos.",
  "context": {
    "companyName": "ConectWeb Soluções Digitais",
    "city": "Bauru",
    "neighborhood": "Centro",
    "niche": "Marketing e Sistemas",
    "whatsapp": "5514996988997",
    "tone": "amigavel"
  }
}
```

* **Response Body (200 OK):**
```json
{
  "success": true,
  "reply": "Olá, Carlos! Muito obrigado por nos avaliar com 5 estrelas! Ficamos imensamente felizes em saber que você teve uma experiência impecável com a equipe da ConectWeb em Bauru. Nosso compromisso é sempre entregar qualidade e agilidade. Conte conosco sempre que precisar e volte em breve! ✨"
}
```

---

## 3. Exemplo de Implementação no Backend da Lívia (Node.js ou PHP)

### Exemplo em Node.js (Express / Fastify):
```javascript
// Rota para transformar post de rede social para o Google Meu Negócio
app.post('/api/copilot/transform', verifyBearerToken, async (req, res) => {
  const { originalText, context } = req.body;
  
  const prompt = `
Você é a Lívia, assistente de IA especialista em SEO Local e Google Meu Negócio da ConectWeb.
Converta o texto de rede social abaixo em uma postagem perfeita para o Google Meu Negócio.

Regras Obrigatórias:
1. Inclua naturalmente a cidade (${context.city}) e o bairro (${context.neighborhood}).
2. Mencione o segmento (${context.niche}) e a empresa (${context.companyName}).
3. Remova hashtags genéricas de feed (#fyp, #love, etc).
4. Adicione uma chamada para ação clara com o WhatsApp: ${context.whatsapp}.
5. Tom de voz: ${context.tone}.

Texto Original das Redes:
"${originalText}"
`;

  // Chama o modelo de IA (Gemini ou OpenAI configurado na Lívia)
  const optimizedText = await callLiviaAI(prompt);

  return res.json({
    success: true,
    optimizedPost: optimizedText
  });
});
```
