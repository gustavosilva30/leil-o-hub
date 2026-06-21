# ⚡ Quick Start - Integração em 1 Hora

**Para**: Desenvolvedor que quer começar AGORA  
**Tempo**: 60 minutos  
**Resultado**: Backend rodando + 1 scraper funcionando

---

## 🎯 Objetivo Final

Em 1 hora, você terá:

```bash
# Terminal 1
$ cd backend && npm run dev
# Output: 🚀 Backend rodando em http://localhost:3001

# Terminal 2
$ curl -X POST http://localhost:3001/api/auctions/sync/leiloes-ms
# Output: { "success": true, "count": 42, "source": "leiloes-ms" }
```

---

## ⏱️ Timeline

| Tempo | Tarefa | Status |
|-------|--------|--------|
| 0-5 min | Setup `backend/` | ⏭️ |
| 5-10 min | `package.json` + `tsconfig` | ⏭️ |
| 10-15 min | Copiar `utils/validadorSucata.ts` | ⏭️ |
| 15-20 min | Copiar 1 scraper (Leilões MS) | ⏭️ |
| 20-30 min | Criar `server.ts` + `routes/` | ⏭️ |
| 30-50 min | Instalar deps + teste local | ⏭️ |
| 50-60 min | Debug + confirmar | ⏭️ |

---

## 🚀 Passo 1: Criar Estrutura (5 min)

```bash
# No terminal, dentro do projeto raiz
mkdir -p backend/src/{services,routes,utils,config}
cd backend

# Criar arquivos vazios
touch src/server.ts
touch src/routes/auctions.ts
touch src/utils/validadorSucata.ts
touch src/config/index.ts
```

---

## 📦 Passo 2: package.json (2 min)

Crie `backend/package.json`:

```json
{
  "name": "leilao-hub-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "start": "tsx src/server.ts"
  },
  "dependencies": {
    "express": "^4.21.2",
    "axios": "^1.6.0",
    "cheerio": "^1.0.0",
    "dotenv": "^17.2.3",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "typescript": "~5.8.2",
    "@types/express": "^4.17.21",
    "@types/node": "^22.14.0",
    "tsx": "^4.21.0"
  }
}
```

---

## ⚙️ Passo 3: tsconfig.json (1 min)

Crie `backend/tsconfig.json`:

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

## 🛠️ Passo 4: Copiar Validador (3 min)

Cole este código em `backend/src/utils/validadorSucata.ts`:

```typescript
const PALAVRAS_EXCLUIR = [
  "MOTOCICLETA", "MOTOCICLETAS", "MOTO ", "MOTONETA",
  "MOTO AQUÁTICA", "JETSKI", "TRICICLO", "QUADRICICLO",
];

const PALAVRAS_INSERVIVEL = [
  "INSERVÍVEL", "INSERVIVEL", "DESTRUÍDA", "IRRECUPERÁVEL",
];

const PALAVRAS_APROVEITAVEL = [
  "SUCATA", "REAPROVEITÁVEL", "APROVEITÁVEL", "PEÇAS",
];

export function isSucataVeicularValida(texto: string): boolean {
  const textoUpper = texto.toUpperCase();
  if (PALAVRAS_EXCLUIR.some((p) => textoUpper.includes(p))) return false;
  return PALAVRAS_APROVEITAVEL.some((p) => textoUpper.includes(p));
}

export function mapearTipoSucata(texto: string): string {
  const textoUpper = texto.toUpperCase();
  if (PALAVRAS_INSERVIVEL.some((p) => textoUpper.includes(p))) {
    return "inservivel";
  }
  return "aproveitavel";
}
```

---

## 🔧 Passo 5: Copiar Scraper (5 min)

Copie o arquivo `sistema busca leilões/backend/services/leiloesScraper.ts` para `backend/src/services/leiloesScraper.ts`.

Depois, adapte 2 linhas no topo:

**De:**
```typescript
import { isSucataVeicularValida, mapearTipoSucata } from "../utils/validadorSucata";

const WEBHOOK_N8N = "https://n8n.douradosap.com.br/webhook/531322fb-763e-496c-846e-364aa8de1331";
```

**Para:**
```typescript
import { isSucataVeicularValida, mapearTipoSucata } from "@/utils/validadorSucata";

const WEBHOOK_N8N = "https://n8n.douradosap.com.br/webhook/531322fb-763e-496c-846e-364aa8de1331";
// OU se tiver config centralizado:
// import config from "@/config";
// const WEBHOOK_N8N = config.WEBHOOK_N8N_LEILOES_MS;
```

---

## 🛣️ Passo 6: Criar config (2 min)

Cole em `backend/src/config/index.ts`:

```typescript
import dotenv from "dotenv";
dotenv.config();

export const config = {
  PORT: parseInt(process.env.PORT || "3001", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
};

export default config;
```

---

## 🛣️ Passo 7: Criar Routes (5 min)

Cole em `backend/src/routes/auctions.ts`:

```typescript
import { Router, Request, Response } from "express";
import { extrairDadosLeiloesMS } from "@/services/leiloesScraper";

const router = Router();

router.post("/sync/:source", async (req: Request, res: Response) => {
  const { source } = req.params;

  try {
    console.log(`🔄 Iniciando sync: ${source}`);
    
    let lotes;
    if (source === "leiloes-ms") {
      lotes = await extrairDadosLeiloesMS();
    } else {
      return res.status(400).json({ error: "Source desconhecido" });
    }

    res.json({ 
      success: true, 
      source, 
      count: lotes?.length || 0
    });
  } catch (error: any) {
    console.error(`❌ Erro:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

## 🚀 Passo 8: Criar Server (5 min)

Cole em `backend/src/server.ts`:

```typescript
import express from "express";
import cors from "cors";
import config from "@/config/index";
import auctionsRouter from "@/routes/auctions";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auctions", auctionsRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(config.PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${config.PORT}`);
});
```

---

## 📥 Passo 9: Instalar Deps (10 min)

```bash
# Dentro de backend/
npm install

# Espere... (pode levar 3-5 min)
```

---

## ✅ Passo 10: Testar (5 min)

### Terminal 1: Iniciar backend

```bash
cd backend
npm run dev

# Esperado:
# 🚀 Backend rodando em http://localhost:3001
```

### Terminal 2: Testar endpoint

```bash
# Aguarde 5 segundos...
curl -X POST http://localhost:3001/api/auctions/sync/leiloes-ms

# Esperado:
# {
#   "success": true,
#   "source": "leiloes-ms",
#   "count": 42
# }
```

---

## 🐛 Se Não Funcionar

### Erro: "Module not found: validadorSucata"
```
Solução: Verifique se o arquivo existe em:
backend/src/utils/validadorSucata.ts
```

### Erro: "Port 3001 in use"
```bash
# Mudar porta em backend/src/config/index.ts
PORT: 3002,

# Ou mata processo:
lsof -ti:3001 | xargs kill -9
```

### Erro: "typescript not found"
```bash
cd backend
npm install
```

### Scraper muito lento?
Normal! Primeira vez que roda:
- ✅ Acessa site
- ✅ Faz parsing HTML
- ✅ Extrai 50+ lotes
- ✅ Envia para N8N

Espere 1-2 minutos.

### N8N não recebeu dados?
1. Verifique webhook na linha do scraper
2. Teste com curl:
```bash
curl -X POST {WEBHOOK_URL} -d '{"test": true}'
```

---

## 🎯 Resultado Esperado

```json
{
  "success": true,
  "source": "leiloes-ms",
  "count": 42
}
```

Significa:
- ✅ Backend funcionando
- ✅ Scraper rodou
- ✅ 42 lotes foram extraídos
- ✅ N8N webhook recebeu dados

---

## 🚀 Próximas Fases (Sem Pressa)

Depois de confirmar que funciona:

1. **Adicionar 6 outros scrapers** (copiar + adaptar)
2. **Frontend React** (hook + componente)
3. **Banco de dados** (Supabase)
4. **Automação** (scheduler)

Mas isso é assunto para outro dia! 😄

---

## 📚 Referências Rápidas

| Erro | Solução |
|------|---------|
| Module not found | Verificar imports com `@/` |
| Port in use | Mudar em config ou kill processo |
| Scraper lento | Normal, esperar 1-2 min |
| N8N não recebe | Testar webhook com curl |
| Dependências ruins | `rm -rf node_modules && npm install` |

---

## 🎉 Parabéns!

Você agora tem um **backend funcionando** com **1 scraper ativo**! 

Próximo passo fácil: Adicionar os outros 6 scrapers (copiar + colar).

**Tempo até aqui**: ~45-60 minutos ✅

---

**Hora de começar!**

```bash
cd backend
mkdir -p src/{services,routes,utils,config}
```

Good luck! 🚀
