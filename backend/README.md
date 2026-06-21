# Backend - Leilão Hub Brasil

## Setup

```bash
cd backend
npm install
```

## Desenvolvimento

```bash
# Iniciar servidor com watch
npm run dev

# Output esperado:
# 🚀 Backend rodando em http://localhost:3001
# 📊 Ambiente: development
```

## Endpoints

### GET `/health`
Health check do servidor

### POST `/api/auctions/sync/:source`
Sincronizar lotes de um source específico

**Exemplo:**
```bash
curl -X POST http://localhost:3001/api/auctions/sync/leiloes-ms
```

**Response:**
```json
{
  "success": true,
  "source": "leiloes-ms",
  "count": 42,
  "lotes": [...]
}
```

### GET `/api/auctions`
Listar lotes (a implementar com Supabase)

### POST `/api/auctions/webhook/n8n`
Webhook para receber dados do N8N

## Estrutura de Diretórios

```
backend/
├── src/
│   ├── services/      # Scrapers
│   ├── routes/        # Rotas Express
│   ├── utils/         # Utilitários
│   ├── config/        # Configuração
│   ├── scheduler/     # Automação (opcional)
│   └── server.ts      # Servidor Express
├── package.json
├── tsconfig.json
└── .env.example
```

## Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```
PORT=3001
NODE_ENV=development

WEBHOOK_N8N_LEILOES_MS=...
WEBHOOK_N8N_SODRE=...
# etc
```

## Scrapers Disponíveis

- ✅ `leiloes-ms` - Leilões MS
- ⏭️ `sodre` - Sodré Santoro (em desenvolvimento)
- ⏭️ `superbid` - Superbid (em desenvolvimento)
- ⏭️ `copart` - Copart (em desenvolvimento)
- ⏭️ `autotran` - AutoTran (em desenvolvimento)
- ⏭️ `pestana` - Pestana (em desenvolvimento)
- ⏭️ `marca-leiloes` - Marca Leilões (em desenvolvimento)

## Troubleshooting

### Erro: "Port 3001 in use"
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3001 | xargs kill -9
```

### Erro: "Module not found"
```bash
# Limpar node_modules
rm -rf node_modules package-lock.json
npm install
```

### Scraper não encontra dados
- Verificar se URL do site não mudou
- Aumentar pausa entre requisições
- Verificar logs para erros específicos

## Deploy

Será adicionado em fases futuras (Docker, PM2, etc)

---

**Última atualização**: 14/06/2026
