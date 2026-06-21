# Cópia de backup — sistema de busca em leilões

Origem: repositório `crm-loja-final` (data da cópia: ver histórico local).

## Conteúdo

### `backend/services/` (Node/TypeScript — scrapers)

- `leiloesScraper.ts` — Leilões MS
- `sodreScraper.ts` — Sodré
- `superbidScraper.ts` — Superbid
- `copartScraper.ts` — Copart
- `autotranScraper.ts` — AutoTran
- `pestanaScraper.ts` — Pestana
- `marcaLeiloesScraper.ts` — Marca Leilões

### `backend/app/api/integrations/`

- `leiloes_ms.py` — varredura Python (BeautifulSoup) no site Leilões MS

### `backend/app/api/`

- `auctions.py` — router FastAPI de leilões (lotes, fontes, etc.; usa integrações)

### `backend/scripts/`

- `inspect-sodre.ts` — script auxiliar de inspeção Sodré

## Como estava ligado no CRM (`server.ts`)

Imports:

```ts
import { extrairDadosLeiloesMS } from './services/leiloesScraper';
import { extrairDadosSodre } from './services/sodreScraper';
import { extrairDadosSuperbid } from './services/superbidScraper';
import { extrairDadosCopart } from './services/copartScraper';
import { extrairDadosAutotran } from './services/autotranScraper';
import { extrairDadosPestana } from './services/pestanaScraper';
import { extrairDadosMarcaLeiloes } from './services/marcaLeiloesScraper';
```

Rotas HTTP (cada uma disparava a varredura em segundo plano):

- `POST /api/auctions/sync/leiloes-ms`
- `POST /api/auctions/sync/sodre`
- `POST /api/auctions/sync/superbid`
- `POST /api/auctions/sync/copart`
- `POST /api/auctions/sync/autotran`
- `POST /api/auctions/sync/pestana`
- `POST /api/auctions/sync/marca-leiloes`

FastAPI (`backend/app/main.py`): `app.include_router(auctions.router, prefix="/api/auctions", ...)`

## Nota

Estes ficheiros dependem do resto do projeto (Supabase, env, `package.json`, Playwright/Cheerio, etc.). Esta pasta é apenas **arquivo morto / referência** para reutilizar a lógica noutro projeto.
