# Plano de Integração Completo - Sistema de Busca de Leilões

**Status**: 🟢 Pronto para implementar  
**Data**: 14/06/2026  
**Escopo**: Integração de 7 scrapers ao projeto React + N8N

---

## 📋 Fase 1: Preparação da Estrutura Backend

### 1.1 Criar diretória `/backend`

```bash
mkdir -p backend/src/{services,routes,utils,config}
cd backend
```

### 1.2 Criar `backend/package.json`

```json
{
  "name": "leilao-hub-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "start": "tsx src/server.ts",
    "build": "tsc --noEmit"
  },
  "dependencies": {
    "express": "^4.21.2",
    "axios": "^1.6.0",
    "cheerio": "^1.0.0",
    "playwright": "^1.40.0",
    "dotenv": "^17.2.3",
    "cors": "^2.8.5",
    "node-schedule": "^2.1.0"
  },
  "devDependencies": {
    "typescript": "~5.8.2",
    "@types/express": "^4.17.21",
    "@types/node": "^22.14.0",
    "tsx": "^4.21.0"
  }
}
```

### 1.3 Criar `backend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "skipLibCheck": true,
    "allowJs": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

---

## 📦 Fase 2: Criar Utilitários Compartilhados

### 2.1 Criar `backend/src/utils/validadorSucata.ts`

```typescript
// Palavras-chave que indicam veículos a EXCLUIR
const PALAVRAS_EXCLUIR = [
  "MOTOCICLETA",
  "MOTOCICLETAS",
  "MOTO ",
  "MOTONETA",
  "MOTO AQUÁTICA",
  "JETSKI",
  "TRICICLO",
  "QUADRICICLO",
  "BICICLETA",
  "REBOQUE",
  "SEMIREBOQUE",
  "CARRETILHA",
];

// Palavras que indicam sucata INSERVÍVEL
const PALAVRAS_INSERVIVEL = [
  "INSERVÍVEL",
  "INSERVIVEL",
  "DESTRUÍDA",
  "DESTROÇOS",
  "SUCATA IRRECUPERÁVEL",
  "IRRECUPERÁVEL",
];

// Palavras que indicam sucata APROVEITÁVEL
const PALAVRAS_APROVEITAVEL = [
  "SUCATA",
  "REAPROVEITÁVEL",
  "REAPROVEITAVEL",
  "APROVEITÁVEL",
  "APROVEITAVEL",
  "PEÇAS",
  "DESMONTE",
];

export function isSucataVeicularValida(texto: string): boolean {
  const textoUpper = texto.toUpperCase();

  // Rejeita palavras de exclusão
  if (PALAVRAS_EXCLUIR.some((p) => textoUpper.includes(p))) {
    return false;
  }

  // Deve conter ao menos uma palavra de aceitação
  return PALAVRAS_APROVEITAVEL.some((p) => textoUpper.includes(p));
}

export function mapearTipoSucata(texto: string): string {
  const textoUpper = texto.toUpperCase();

  if (PALAVRAS_INSERVIVEL.some((p) => textoUpper.includes(p))) {
    return "inservivel";
  }

  return "aproveitavel";
}

export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toUpperCase()
    .trim();
}
```

### 2.2 Criar `backend/src/config/index.ts`

```typescript
import dotenv from "dotenv";

dotenv.config();

export const config = {
  PORT: parseInt(process.env.PORT || "3001", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  
  // Webhooks N8N
  WEBHOOK_N8N_LEILOES_MS: 
    process.env.WEBHOOK_N8N_LEILOES_MS ||
    "https://n8n.douradosap.com.br/webhook/531322fb-763e-496c-846e-364aa8de1331",
  WEBHOOK_N8N_SODRE:
    process.env.WEBHOOK_N8N_SODRE ||
    "https://n8n.douradosap.com.br/webhook/receber-sodre",
  WEBHOOK_N8N_SUPERBID:
    process.env.WEBHOOK_N8N_SUPERBID ||
    "https://n8n.douradosap.com.br/webhook/receber-superbid",
  WEBHOOK_N8N_COPART:
    process.env.WEBHOOK_N8N_COPART ||
    "https://n8n.douradosap.com.br/webhook/receber-copart",
  WEBHOOK_N8N_AUTOTRAN:
    process.env.WEBHOOK_N8N_AUTOTRAN ||
    "https://n8n.douradosap.com.br/webhook/receber-autotran",
  WEBHOOK_N8N_PESTANA:
    process.env.WEBHOOK_N8N_PESTANA ||
    "https://n8n.douradosap.com.br/webhook/receber-pestana",
  WEBHOOK_N8N_MARCA_LEILOES:
    process.env.WEBHOOK_N8N_MARCA_LEILOES ||
    "https://n8n.douradosap.com.br/webhook/receber-marca-leiloes",

  // Supabase (se usar)
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
};

export default config;
```

---

## 🔄 Fase 3: Copiar Scrapers

### 3.1 Listar Arquivos a Copiar

```
De: sistema busca leilões/backend/services/
Para: backend/src/services/

✓ leiloesScraper.ts
✓ sodreScraper.ts
✓ superbidScraper.ts
✓ copartScraper.ts
✓ autotranScraper.ts
✓ pestanaScraper.ts
✓ marcaLeiloesScraper.ts
```

### 3.2 Adaptações Necessárias

**Em cada scraper**, alterações mínimas:

1. **Imports**: Atualizar path dos utils
   ```typescript
   // De:
   import { isSucataVeicularValida } from "../utils/validadorSucata";
   
   // Para:
   import { isSucataVeicularValida } from "@/utils/validadorSucata";
   ```

2. **Webhooks**: Usar config centralizado
   ```typescript
   // De:
   const WEBHOOK_N8N = "https://n8n.douradosap.com.br/webhook/...";
   
   // Para:
   import config from "@/config";
   const WEBHOOK_N8N = config.WEBHOOK_N8N_LEILOES_MS;
   ```

3. **Async/Await**: Garantir que retorna lotes
   ```typescript
   // No final de cada scraper:
   export async function syncLeiloesMS(): Promise<AuctionLot[]> {
     // ... código ...
     return veiculosEncontrados;
   }
   ```

---

## 🛣️ Fase 4: Criar Rotas Express

### 4.1 Criar `backend/src/routes/auctions.ts`

```typescript
import { Router, Request, Response } from "express";
import { syncLeiloesMS } from "@/services/leiloesScraper";
import { syncSodre } from "@/services/sodreScraper";
import { syncSuperbid } from "@/services/superbidScraper";
import { syncCopart } from "@/services/copartScraper";
import { syncAutotran } from "@/services/autotranScraper";
import { syncPestana } from "@/services/pestanaScraper";
import { syncMarcaLeiloes } from "@/services/marcaLeiloesScraper";

const router = Router();

// POST /api/auctions/sync/:source
router.post("/sync/:source", async (req: Request, res: Response) => {
  const { source } = req.params;

  try {
    console.log(`🔄 Iniciando sync: ${source}`);
    
    let lotes;
    switch (source.toLowerCase()) {
      case "leiloes-ms":
        lotes = await syncLeiloesMS();
        break;
      case "sodre":
        lotes = await syncSodre();
        break;
      case "superbid":
        lotes = await syncSuperbid();
        break;
      case "copart":
        lotes = await syncCopart();
        break;
      case "autotran":
        lotes = await syncAutotran();
        break;
      case "pestana":
        lotes = await syncPestana();
        break;
      case "marca-leiloes":
        lotes = await syncMarcaLeiloes();
        break;
      default:
        return res.status(400).json({ error: "Source desconhecido" });
    }

    res.json({ 
      success: true, 
      source, 
      count: lotes.length,
      lotes 
    });
  } catch (error: any) {
    console.error(`❌ Erro em ${source}:`, error.message);
    res.status(500).json({ 
      error: error.message,
      source 
    });
  }
});

// GET /api/auctions (listar lotes — conectar ao Supabase depois)
router.get("/", (req: Request, res: Response) => {
  res.json({ message: "Implemente busca no Supabase" });
});

// POST /api/auctions/webhook/n8n (receber dados processados)
router.post("/webhook/n8n", (req: Request, res: Response) => {
  console.log("📩 Webhook N8N recebido:", req.body);
  // Salvar no banco aqui
  res.json({ success: true });
});

export default router;
```

### 4.2 Criar `backend/src/server.ts`

```typescript
import express from "express";
import cors from "cors";
import config from "@/config";
import auctionsRouter from "@/routes/auctions";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rotas
app.use("/api/auctions", auctionsRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Start server
app.listen(config.PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${config.PORT}`);
  console.log(`📊 Ambiente: ${config.NODE_ENV}`);
});

export default app;
```

---

## 🎨 Fase 5: Frontend React

### 5.1 Criar `src/hooks/useAuctions.ts`

```typescript
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";

export interface AuctionLot {
  numero_lote: string;
  veiculo_origem: string;
  link_leilao: string;
  tipo_sucata: "aproveitavel" | "inservivel";
  image_url: string;
  auction_start_at: string | null;
  auction_end_at: string | null;
  fonte: string;
}

const API_BASE = "http://localhost:3001/api/auctions";

export function useAuctions() {
  const [source, setSource] = useState<string | null>(null);

  // Listar lotes
  const { data: lotes, isLoading: loadingLotes } = useQuery({
    queryKey: ["auctions"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}`);
      return res.json();
    },
  });

  // Sync de um source
  const { mutate: sync, isPending } = useMutation({
    mutationFn: async (src: string) => {
      const res = await fetch(`${API_BASE}/sync/${src}`, { 
        method: "POST" 
      });
      return res.json();
    },
    onSuccess: (data) => {
      console.log(`✅ ${data.count} lotes sincronizados de ${data.source}`);
      // Refetch lotes
    },
  });

  return {
    lotes,
    loadingLotes,
    sync,
    isPending,
  };
}
```

### 5.2 Criar Componente `src/pages/AuctionSync.tsx`

```typescript
import { useAuctions } from "@/hooks/useAuctions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const SOURCES = [
  "leiloes-ms",
  "sodre",
  "superbid",
  "copart",
  "autotran",
  "pestana",
  "marca-leiloes",
];

export default function AuctionSync() {
  const { lotes, sync, isPending } = useAuctions();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">🔄 Sincronização de Leilões</h1>

      {/* Botões de Sync */}
      <div className="grid grid-cols-2 gap-2 mb-6 md:grid-cols-7">
        {SOURCES.map((src) => (
          <Button
            key={src}
            onClick={() => sync(src)}
            disabled={isPending}
            variant="outline"
          >
            {src}
          </Button>
        ))}
      </div>

      {/* Tabela de Lotes */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fonte</TableHead>
              <TableHead>Encerramento</TableHead>
              <TableHead>Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lotes?.map((lot: AuctionLot) => (
              <TableRow key={lot.numero_lote}>
                <TableCell className="font-mono text-sm">{lot.numero_lote}</TableCell>
                <TableCell className="truncate max-w-xs">{lot.veiculo_origem}</TableCell>
                <TableCell>
                  <span className={lot.tipo_sucata === "inservivel" ? "text-red-600" : "text-green-600"}>
                    {lot.tipo_sucata}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{lot.fonte}</TableCell>
                <TableCell className="text-sm">
                  {lot.auction_end_at 
                    ? new Date(lot.auction_end_at).toLocaleDateString("pt-BR")
                    : "-"}
                </TableCell>
                <TableCell>
                  <a href={lot.link_leilao} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    Ver
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

---

## ⏰ Fase 6: Automação (Opcional)

### 6.1 Criar `backend/src/scheduler/index.ts`

```typescript
import schedule from "node-schedule";
import {
  syncLeiloesMS,
  syncSodre,
  syncSuperbid,
  syncCopart,
  syncAutotran,
  syncPestana,
  syncMarcaLeiloes,
} from "@/services/*";

/**
 * Agenda sincronizações automáticas
 * - Leilões MS: A cada 2 horas
 * - Sodré: A cada 3 horas
 * - Superbid: A cada 2 horas
 * - etc.
 */
export function setupScheduler() {
  // A cada 2 horas (00 minutos)
  schedule.scheduleJob("0 */2 * * *", async () => {
    console.log("⏰ Executando sync a cada 2h: Leilões MS, Superbid, Copart");
    try {
      await syncLeiloesMS();
      await syncSuperbid();
      await syncCopart();
    } catch (err) {
      console.error("❌ Erro no scheduler:", err);
    }
  });

  // A cada 3 horas (30 minutos)
  schedule.scheduleJob("30 */3 * * *", async () => {
    console.log("⏰ Executando sync a cada 3h: Sodré, AutoTran, Pestana, Marca");
    try {
      await syncSodre();
      await syncAutotran();
      await syncPestana();
      await syncMarcaLeiloes();
    } catch (err) {
      console.error("❌ Erro no scheduler:", err);
    }
  });

  console.log("📅 Scheduler inicializado");
}
```

### 6.2 Ativar em `backend/src/server.ts`

```typescript
import { setupScheduler } from "@/scheduler";

// ... app setup ...

setupScheduler();

app.listen(config.PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${config.PORT}`);
});
```

---

## 📝 Fase 7: Variáveis de Ambiente

### 7.1 Criar `.env.local` (backend)

```env
PORT=3001
NODE_ENV=development

# Webhooks N8N (opcional, se diferente do padrão)
WEBHOOK_N8N_LEILOES_MS=https://leiloes-n8n.ini6ln.easypanel.host/webhook-test/ca21f95f-ea9c-4b88-a3dc-4db8b4035655
WEBHOOK_N8N_SODRE=https://seu-webhook-sodre.com
# ... etc

# Supabase (para salvar dados)
SUPABASE_URL=https://sua-instancia.supabase.co
SUPABASE_KEY=sua-chave-publica
```

---

## 🧪 Fase 8: Testes

### 8.1 Testar Backend

```bash
cd backend
npm install
npm run dev

# Em outro terminal:
curl -X POST http://localhost:3001/api/auctions/sync/leiloes-ms

# Resultado esperado:
# { "success": true, "source": "leiloes-ms", "count": 42, "lotes": [...] }
```

### 8.2 Testar Frontend

```bash
npm run dev

# Abrir http://localhost:3000/auctions
# Clicar em botões de sync
# Verificar tabela preenchida
```

### 8.3 Testar N8N

1. Acesse `https://seu-n8n.com/webhook-test/...`
2. Dispare um sync: `curl -X POST http://localhost:3001/api/auctions/sync/leiloes-ms`
3. Verifique se o webhook N8N recebeu dados
4. Confirme se o banco foi atualizado

---

## ✅ Checklist de Implementação

### Backend
- [ ] Criar estrutura `/backend` com `src/{services,routes,utils,config}`
- [ ] Criar `package.json` e `tsconfig.json`
- [ ] Criar `backend/src/utils/validadorSucata.ts`
- [ ] Criar `backend/src/config/index.ts`
- [ ] Copiar 7 scrapers com adaptações
- [ ] Criar `backend/src/routes/auctions.ts`
- [ ] Criar `backend/src/server.ts`
- [ ] Teste: `npm run dev` + `curl ...`

### Frontend
- [ ] Criar `src/hooks/useAuctions.ts`
- [ ] Criar `src/pages/AuctionSync.tsx`
- [ ] Integrar em `src/App.tsx` (rota)
- [ ] Teste: Abrir página + clicar botões

### Automação (Opcional)
- [ ] Criar `backend/src/scheduler/index.ts`
- [ ] Ativar em `server.ts`
- [ ] Verificar logs a cada 2h

### Banco de Dados
- [ ] Conectar Supabase (criar tabela `auction_lots`)
- [ ] Implementar webhook N8N → DB
- [ ] Realtime listening no React

---

## 🚀 Próximos Passos (Fase 9)

1. **Replicar estrutura do banco** (Supabase)
   ```sql
   CREATE TABLE auction_lots (
     id UUID PRIMARY KEY,
     numero_lote VARCHAR(50) UNIQUE,
     veiculo_origem VARCHAR(150),
     link_leilao TEXT,
     tipo_sucata VARCHAR(20),
     image_url TEXT,
     auction_start_at TIMESTAMP,
     auction_end_at TIMESTAMP,
     fonte VARCHAR(50),
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Implementar busca + filtros**
   - `GET /api/auctions?type=inservivel&fonte=sodre&search=toyota`

3. **Adicionar histórico de sync**
   - Tabela `sync_logs` com erro/sucesso/count

4. **Alertas em tempo real**
   - WebSocket para novos lotes
   - Notificação de lotes finalizando

---

## 📞 Suporte & Troubleshooting

### Problema: "Module not found: validadorSucata"
**Solução**: Criar arquivo em `backend/src/utils/validadorSucata.ts` (já fornecido acima)

### Problema: "Webhook N8N não recebe dados"
**Solução**:
1. Verificar URL do webhook em `.env`
2. Testar: `curl -X POST {WEBHOOK_URL} -d '{"test": true}'`
3. Verificar logs do N8N

### Problema: "Scraper bloqueado por site"
**Solução**:
- Aumentar pausa entre requisições (ex: 800ms → 1500ms)
- Usar Playwright stealth mode (já implementado em Sodré)
- Rotacionar User-Agent

### Problema: "Memória cheia (Playwright)"
**Solução**:
- Limitar simultâneas: max 2 browsers
- Fechar browser após sync
- Monitorar com `top` ou `free -h`

---

**Fim do Plano — Pronto para implementar! 🎉**
