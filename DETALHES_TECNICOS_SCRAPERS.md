# Detalhes Técnicos dos Scrapers

## 1️⃣ Leilões MS (`leiloesScraper.ts`)

### Estratégia
- **HTTP GET** da página de busca: `https://www.leiloesonlinems.com.br/busca.aspx?p=sucata`
- Extrai links de lotes com regex: `/lote/`
- Acessa detalhe de cada lote para extrair imagem e datas
- Filtra por palavras-chave: `MOTOCICLETA`, `HONDA`, `YAMAHA`, `SUZUKI` (excluir motos)

### Dados Extraídos
- Título do veículo (slug em URL)
- Imagem (via `og:image` meta tag)
- Datas: Abertura e Encerramento (regex: `ABERTURA:\s*(\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2})`)
- Tipo: aproveitável vs inservível (detecta "INSERVIVEL" no título)

### Pontos-Chave
- ✅ Simples e rápido (Cheerio)
- ✅ Anti-bloqueio: User-Agent básico, pausa 600ms entre requisições
- ✅ Blindagem de lote: `{numeroLote}-{idUnicoURL}`

### Webhook
```
POST https://n8n.douradosap.com.br/webhook/531322fb-763e-496c-846e-364aa8de1331
Body: { lotes: [{...}, {...}] }
```

---

## 2️⃣ Sodré Santoro (`sodreScraper.ts`)

### Estratégia
- **Playwright** com stealth mode (evita detecção de bot)
- Acessa `https://www.sodresantoro.com.br/sucatas/lotes`
- Executa API interna: `POST /api/search-lots`
- Payload: Query Elasticsearch com filtros específicos
- Extrai ~100 lotes por requisição

### Dados Extraídos (da API)
- `lot_title`, `lot_number`, `lot_id` (ID único do Sodré)
- `lot_pictures[0]` (URL de imagem)
- `auction_date_init` e `auction_date_limit` (timestamps ISO)
- `lot_is_scrap` (boolean validação)

### Técnica Anti-Bot
```typescript
const context = await browser.newContext({
  userAgent: "Mozilla/5.0 (...) Chrome/145.0.0.0 Safari/537.36",
  locale: "pt-BR"
});
```

### Pontos-Chave
- ✅ API é pública (sem autenticação)
- ✅ Muito confiável (dados estruturados)
- ⚠️ Mais lento (Playwright precisa abrir browser)
- ✅ Blindagem: `{numeroLote}-{lotId}`

---

## 3️⃣ Superbid (`superbidScraper.ts`)

### Estratégia
- **Axios** + parsing de JSON embutido na página
- Paginação: `https://exchange.superbid.net/categorias/carros-motos/carros/sucata-de-carros?searchType=opened&pageNumber={N}`
- Extrai JSON do `<script id="__NEXT_DATA__">` (Next.js hydration)
- Para validar inservível, acessa página individual do lote

### Dados Extraídos
- `offer.product.shortDesc` (título)
- `offer.product.galleryJson[0].link` (imagem)
- `offer.closingDate`, `offer.endDate`, `offer.dateEnd` (múltiplas tentativas de campos)
- `offer.offerDetail.id` (ID único)

### Técnica JSON Parsing
```typescript
const json = JSON.parse(match[1]); // __NEXT_DATA__
const offers = json?.props?.pageProps?.offersList?.offers;
```

### Pontos-Chave
- ✅ Rápido (sem browser)
- ✅ Dados estruturados
- ✅ Paginação automática
- ⚠️ Campo de datas inconsistente (múltiplas tentativas)
- ✅ Blindagem: `{lotNumber}-{offerId}`

---

## 4️⃣ Copart (`copartScraper.ts`)

### Estratégia
- **Axios** + API REST pública
- `POST https://www.copart.com.br/public/lots/search`
- Payload: Query JSON com filtros Lucene (facets, categorias, documentos)
- Filtro: **Leilão** (não "Compre Agora"), **Irrecuperável** (documento_tipo), 7 categorias

### Filtros Aplicados
```json
{
  "filter": {
    "MISC": ["tipovenda:Leilão"],
    "tipodocumento": ["tipodocumento:\"Irrecuperável\""],
    "categoria": [
      "categoria:\"Automóveis\"",
      "categoria:\"Picapes Pequenas\"",
      // ... 7 categorias total
    ]
  }
}
```

### Dados Extraídos
- `lot.lotNumberStr` (número do lote)
- `lot.mkn` (marca), `lot.lm` (modelo), `lot.lcy` (ano)
- `lot.tims` (thumbnail; converter para full: `imageType=full`)
- `lot.ad` (data leilão), `lot.at` (hora leilão)
- `lot.td` (documento status), `lot.dd` (condição/tipo perda)
- `lot.hb` (lance atual em número), `lot.ahb` (lance em string)

### Mapeamento de Dados
```typescript
type CopartLoteMapeado = {
  codigo: string;
  numero_lote: string;
  ano_modelo: string;
  marca: string;
  modelo: string;
  documento_status: string;
  // ... ~15 campos
  image_url: string;
  link_leilao: string;
};
```

### Pontos-Chave
- ✅ Muito estruturado (dados limpíssimos)
- ✅ Filtro exato: apenas irrecuperáveis
- ✅ Imagens com URL estável
- ✅ Sem paginação (retorna tudo em um payload)
- ⚠️ Validação: rejeita datas lixo ("COMPRE AGORA", "Aguardando Classificação")

---

## 5️⃣ AutoTran (`autotranScraper.ts`)

### Estratégia
- **Axios + Cheerio**
- Scraping HTML da listagem: `https://autotranleiloes.org/lotes/?pag={N}`
- Coleta URLs de lotes + imagens da listagem
- Para cada lote, acessa página de detalhes
- Filtra apenas categorias "Irrecuperáveis" ou "Sucatas" (no `<h2 class="ai-title">`)
- Rejeita "Sinistrados" puros

### Algoritmo de Coleta
1. Itera páginas 1–40 com pausa 450ms
2. Para cada link `a[href^="/lote/"]`, extrai imagem associada
3. Se 2 páginas consecutivas sem novos URLs, para
4. Acessa detalhe de cada lote em paralelo

### Dados Extraídos
- Título: slug da URL (convertido para maiúsculas)
- Número do lote: blindado `{idURL}-{slugShort}`
- Imagem: mantém URL do proxy `/PHPs/...`
- Data/hora: regex `(\d{2})\/(\d{2})\/(\d{4})\s+às\s+(\d{2}):(\d{2})h`
- Tipo sucata: aproveitável vs inservível (validação via `isSucataVeicularValida`)

### Pontos-Chave
- ✅ Paginação inteligente (para quando não há novos lotes)
- ✅ Filtra por categoria no título `<h2>`
- ⚠️ Mais lento (múltiplas requisições HTTP)
- ⚠️ Imagens podem estar em cache proxy

---

## 6️⃣ Pestana (`pestanaScraper.ts`)

### Estratégia
- **Axios** sem browser
- Acessa `https://www.pestanaleiloes.com.br/leilao-de-veiculos`
- Extrai 2 scripts JSON embutidos no HTML:
  - `__hydrateLotes` (lotes públicos)
  - `__hydrateLotesPrivados` (lotes privados/corporativos)
- Tenta 3 vezes se falhar

### JSON Parsing (Tolerante)
```typescript
function extrairJsonDoScript(html: string, scriptId: string): string | null {
  // Se `</script>` aparece dentro da string JSON (escape), tenta o próximo
  // Precisa verificar com JSON.parse() para garantir integridade
}
```

### Estrutura de Dados
```typescript
interface PestanaLote {
  id: number;
  leilao: number;
  numero?: string;
  descricao?: string;
  status?: string;
  bens?: [{
    descricao?: string;
    imagens?: [{ media?: string; original?: string }];
    videos?: [{ urlVideo?: string }];
  }];
}
```

### Filtro de Sucata
- Se nome do leilão contém "sucata" → inclui todo leilão
- Senão, testa cada lote: descrição + bem contém "sucata"?

### Dados Extraídos
- Título: `{nomeLeilao} - {lote.descricao} - {bem.descricao}`
- Imagem: vídeo de vistoria (`videoUrl`) ou imagem (`imagens[0].media`)
- Data: `lote.bens[0].dataLeilao` → ISO
- Número: `{lote.id}-{leilao.id}`
- Link: `https://www.pestanaleiloes.com.br/leilao-de-veiculos?leilao={leilaoId}&lote={loteId}`

### Pontos-Chave
- ✅ Suporta lotes privados (corporativos)
- ✅ Vídeos de vistoria + imagens estáticas
- ✅ Tolerante a JSON dentro de string
- ⚠️ Nenhuma validação de tipo sucata (coloca "sucata" em tudo)

---

## 7️⃣ Marca Leilões (`marcaLeiloesScraper.ts`)

### Estratégia
- **Axios + Cheerio** com retry de HTML
- Scraping da listagem: `https://www.marcaleiloes.com.br/eventos/leilao/{id}/{slug}`
- Extrai URL de cada lote (`article.lote-main → a[href*='/lote/']`)
- Acessa página de detalhe de cada lote
- Extrai JSON embutido: `var lote = {...}`

### Algoritmo
1. Tenta baixar HTML 3 vezes com backoff exponencial
2. Parse com Cheerio: `article.lote-main` (cada card)
3. Para cada lote:
   - URL relativa → absolutizar
   - Acessa página (`/lote/{leilaoId}/lote/{loteId}/`)
   - Extrai `var lote = {...}` (JSON literal)
   - Parse JSON (com tratamento de escape)

### Dados Extraídos
- Código/número: `article → strong.strong-cod`
- Número do lote: `.item-numeroLote span`
- Título: `h3`
- Descrição: `p` (primeira)
- Cidade: `.r2 span`
- Imagem: `img.img-evento`
- Datas: JSON `lote.leilao.dataAbertura`, `lote.dataFechamento.date`
- Tipo: `lote.leilao.tipo` ou validação via texto

### Pontos-Chave
- ✅ Scraping robusto (retry HTML 3x)
- ✅ Parse JSON literal (robustez: ignora escapes)
- ⚠️ Mais complexo (múltiplas extrações)
- ⚠️ URLs podem mudar de formato (normaliza)

---

## 📊 Comparativo de Técnicas

| Aspecto | Leilões MS | Sodré | Superbid | Copart | AutoTran | Pestana | Marca |
|---------|-----------|-------|---------|--------|----------|---------|-------|
| **Tecnologia** | Cheerio | Playwright | Axios | Axios | Cheerio | Axios | Cheerio |
| **Velocidade** | ⚡⚡⚡ | ⚡⚡ | ⚡⚡⚡ | ⚡⚡⚡ | ⚡⚡ | ⚡⚡⚡ | ⚡⚡ |
| **Confiabilidade** | 🟡 | 🟢 | 🟢 | 🟢 | 🟡 | 🟡 | 🟡 |
| **Anti-Bot** | Simples | Avançado | Nenhum | API | Simples | Nenhum | Nenhum |
| **Datas** | Regex | API ISO | Múltiplos | Formato | Regex | JSON | JSON |
| **Paginação** | Não | Não | Sim | Não | Sim | Não | Não |
| **Imagens** | og:image | API | NextData | REST | Proxy HTML | JSON | HTML |

---

## 🔗 Mapeamento de Webhooks

| Site | Webhook | Ambiente |
|------|---------|----------|
| Leilões MS | `webhook/531322fb-763e-496c-846e-364aa8de1331` | Produção |
| Sodré | `webhook/receber-sodre` (env var) | Configurável |
| Superbid | `webhook/receber-superbid` (env var) | Configurável |
| Copart | `webhook/receber-copart` (env var) | Configurável |
| AutoTran | `webhook/receber-autotran` (env var) | Configurável |
| Pestana | `webhook/receber-pestana` (env var) | Configurável |
| Marca Leilões | `webhook/receber-marca-leiloes` (env var) | Configurável |

---

## ✅ Checklist de Integração

### Para cada scraper:

- [ ] Copiar arquivo `.ts` para `/backend/src/services/`
- [ ] Instalar dependências: `axios`, `cheerio` (ou `playwright`)
- [ ] Criar rota POST em `/backend/src/routes/auctions.ts`
- [ ] Testar com: `curl -X POST http://localhost:3000/api/auctions/sync/{site}`
- [ ] Validar webhook no N8N
- [ ] Monitorar logs por 1 hora (erros de bloqueio?)
- [ ] Salvar URL real do webhook (env var)
- [ ] Agendar cron job (ex.: a cada 2 horas)

---

## 🚀 Ordem Recomendada de Integração

1. **Copart** ← Mais confiável, sem variações
2. **Sodré** ← API sólida, anti-bot já pronto
3. **Superbid** ← Rápido, JSON estruturado
4. **Leilões MS** ← Simples, boa cobertura
5. **Pestana** ← Scripts JSON, sem browser
6. **AutoTran** ← Mais requisições HTTP
7. **Marca Leilões** ← JSON literal, mais complexo

**Motivo**: Começar pelos mais estáveis permite testar infra antes dos mais complexos.
