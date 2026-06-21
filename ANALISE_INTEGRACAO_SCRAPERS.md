# Análise de Integração do Sistema de Busca de Leilões

## 📊 Resumo Executivo

Você possui um **sistema maduro e funcional** com 7 scrapers de sites de leilões + integração com n8n. A estrutura pode ser integrada ao projeto React atual com mínimas mudanças.

---

## 🏗️ Arquitetura Atual

### **Backend TypeScript** (`sistema busca leilões/backend/services/`)

| Scraper | Site | Tecnologia | Abordagem | Status |
|---------|------|-----------|----------|--------|
| `leiloesScraper.ts` | Leilões MS | Axios + Cheerio | HTML Scraping simples | ✅ Pronto |
| `sodreScraper.ts` | Sodré Santoro | Playwright | API GraphQL (após cookies) | ✅ Pronto |
| `superbidScraper.ts` | Superbid | Axios + JSON | `__NEXT_DATA__` parsing | ✅ Pronto |
| `copartScraper.ts` | Copart | Axios + JSON | API REST pública `/search` | ✅ Pronto |
| `autotranScraper.ts` | AutoTran | Axios + Cheerio | Scraping + paginação | ✅ Pronto |
| `pestanaScraper.ts` | Pestana | Axios | Scripts JSON `__hydrateLotes` | ✅ Pronto |
| `marcaLeiloesScraper.ts` | Marca Leilões | Axios + Cheerio | HTML + JSON `var lote = {...}` | ✅ Pronto |

### **Backend Python** (`sistema busca leilões/backend/`)

- **`app/api/auctions.py`**: Router FastAPI com endpoints REST
- **`app/api/integrations/leiloes_ms.py`**: Integração Python com BeautifulSoup (redundante com TS)

### **Fluxo de Dados**

```
Scraper (TS) 
  ↓ (POST)
Webhook N8N
  ↓ (Processa)
Banco de Dados (PostgreSQL na VPS)
  ↓
Frontend React (seu projeto)
```

**Webhook N8N**: `https://leiloes-n8n.ini6ln.easypanel.host/webhook-test/ca21f95f-ea9c-4b88-a3dc-4db8b4035655`

---

## 📦 Estrutura de Dados

### **Formato de Lote (padrão entre scrapers)**

```typescript
interface AuctionLot {
  numero_lote: string;           // Ex: "1234-5678" (blindado com ID único)
  veiculo_origem: string;        // Ex: "SUCATA - FORD FIESTA"
  link_leilao: string;           // URL direto do lote
  tipo_sucata: string;           // "aproveitavel" | "inservivel"
  image_url: string;             // Foto principal
  auction_start_at: string | null; // ISO DateTime
  auction_end_at: string | null;   // ISO DateTime
  fonte: string;                 // Ex: "Leilões MS", "Sodré Santoro"
}
```

### **Validação de Sucata**

- Existem funções utilitárias em `../utils/validadorSucata` (não vistas, mas referenciadas)
- Filtra palavras-chave como "MOTOCICLETA", "INSERVÍVEL"
- Mapeia tipos: `aproveitavel` vs `inservivel`

---

## 🔄 Funcionamento do Sistema

### **1. Disparo dos Scrapers**

**Opção A (Manual)**: POST para rotas HTTP
```
POST /api/auctions/sync/leiloes-ms
POST /api/auctions/sync/sodre
POST /api/auctions/sync/superbid
...
```

**Opção B (Agendado)**: Cron job ou N8N trigger

### **2. Processamento**

1. Acessa a página de busca do site (ex: `leiloesonlinems.com.br/busca.aspx?p=sucata`)
2. Extrai links de lotes
3. Para cada lote:
   - Faz req GET na página de detalhes
   - Extrai: título, imagem, datas (abertura/encerramento)
   - Valida se é sucata veicular válida
   - Cria objeto `AuctionLot`
4. Envia lote em batch para webhook N8N

### **3. Webhook N8N**

O N8N recebe JSON com `lotes: []` e:
- ✅ Valida dados
- ✅ Normaliza (remove acentos, formatos)
- ✅ Insere/atualiza banco (PostgreSQL)
- ✅ Notifica frontend via realtime

---

## 🚀 Como Integrar ao Projeto React

### **Cenário Recomendado:**

#### **1. Mover scrapers para `/backend` (criar estrutura Node/Express)**

```
projetos futuros/leilão-hub-brasil/
├── backend/               ← NOVO
│   ├── src/
│   │   ├── services/      ← Move daqui
│   │   │   ├── leiloesScraper.ts
│   │   │   ├── sodreScraper.ts
│   │   │   └── ...
│   │   ├── routes/
│   │   │   └── auctions.ts
│   │   ├── server.ts
│   │   └── config.ts
│   ├── package.json
│   └── tsconfig.json
├── src/                   ← Frontend React (atual)
└── ...
```

#### **2. Endpoints Express (simples)**

```typescript
// backend/src/routes/auctions.ts

POST /api/auctions/sync/leiloes-ms       → dispara extrairDadosLeiloesMS()
POST /api/auctions/sync/sodre            → dispara extrairDadosSodre()
POST /api/auctions/sync/superbid         → dispara extrairDadosSuperbid()
POST /api/auctions/webhook/n8n           ← recebe payload do N8N (upsert lotes)

GET  /api/auctions                       → lista lotes do PostgreSQL
GET  /api/auctions/:id                   → detalhe do lote
```

#### **3. Frontend React**

```typescript
// src/hooks/useAuctions.ts

useEffect(() => {
  // Busca lista de lotes
  fetch('/api/auctions').then(res => res.json())
}, [])

const syncLeiloes = async (source: 'leiloes-ms' | 'sodre' | 'superbid') => {
  await fetch(`/api/auctions/sync/${source}`, { method: 'POST' })
}
```

#### **4. Realtime com PostgreSQL / Websocket**

O N8N pode usar a API do PostgreSQL para inserir/atualizar, e o frontend escuta em tempo real via WebSocket ou outro canal de notificação:

```typescript
// Exemplo com websocket ou serviço de notificação
socket.on('auction_lots_updated', (payload) => {
  // Atualiza lista em tempo real
})
```

---

## 📋 Próximos Passos (Recomendação)

### **Fase 1: Setup Básico**
- [ ] Ler `copartScraper.ts`, `autotranScraper.ts`, etc. (completar análise)
- [ ] Copiar scrapers para novo `/backend`
- [ ] Instalar deps: `axios`, `cheerio`, `playwright`
- [ ] Criar servidor Express em `backend/src/server.ts`

### **Fase 2: Integração Backend**
- [ ] Rotas Express (sync, webhook, list, search)
- [ ] Variáveis de env (DATABASE_URL, WEBHOOK_N8N)
- [ ] Conexão com PostgreSQL (ou SQLite local)

### **Fase 3: Frontend React**
- [ ] Hook `useAuctions()` para buscar lotes
- [ ] Botões de sync para cada source
- [ ] Tabela/grid de lotes com filtros
- [ ] Detalhes do lote (modal/página)

### **Fase 4: Automação**
- [ ] Cron job (node-schedule) para sync automático a cada 2h
- [ ] Webhook do N8N retorna para atualizar frontend
- [ ] Notificações (toast) de novos lotes

---

## ⚠️ Possíveis Problemas & Soluções

| Problema | Causa | Solução |
|----------|-------|--------|
| Bloqueio por anti-bot | Sites bloqueiam bots | Usar Playwright stealth (já implementado no Sodré) |
| Datas em formato errado | Regex quebrado | Validar parse no N8N antes de salvar |
| Imagens quebradas | URLs relativas | Usar `toAbs()` para converter em URLs absolutas |
| Duplicatas de lote | Sem controle de hash | Usar `numero_lote` como chave única (com blindagem) |
| Perda de dados | Webhook N8N cai | Implementar retry exponencial + fila (Bull/BullMQ) |

---

## 📄 Dependências Necessárias

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "cheerio": "^1.0.0",
    "playwright": "^1.40.0",
    "express": "^4.18.0",
    "pg": "^8.11.1",
    "node-schedule": "^2.1.0"
  }
}
```

---

## 🔗 Webhooks Importantes

| Webhook | Função | Status |
|---------|--------|--------|
| N8N | Recebe lotes dos scrapers | ✅ Conhecida |
| Seu Webhook | Retorna dados processados ao backend | ⚠️ A configurar |

---

## ✅ Benefícios da Integração

✔️ Sistema modular (cada scraper independente)
✔️ Validação em 2 camadas (TS + N8N)
✔️ Datas e imagens já tratadas
✔️ Pronto para escalabilidade (adicionar mais sources)
✔️ Anti-bot (Playwright stealth no Sodré)

---

**Próximo**: Quer que eu começe pela **Fase 1** (ler/copiar scrapers para backend)?
