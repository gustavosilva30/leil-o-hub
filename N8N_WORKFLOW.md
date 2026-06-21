# N8N Workflow para buscar leilões e lotes

Este documento descreve como configurar o N8N para acionar os scrapers do backend e receber os lotes.

## 1. Objetivo

- Disparar a busca de leilões no backend
- Receber a lista de lotes no N8N
- Processar e salvar/atualizar no banco de dados
- (Opcional) reenviar para o backend via webhook

## 2. Endpoints do backend

### `POST /api/auctions/sync/:source`
Aciona o scraper para um site específico.

- `source`: `leiloes-ms`, `sodre`, `superbid`, `copart`, `autotran`, `pestana`, `marca-leiloes`

Exemplo:

```bash
curl -X POST http://<backend-host>:3001/api/auctions/sync/leiloes-ms
```

### `POST /api/auctions/webhook/n8n`
Recebe payload do N8N quando os dados estiverem processados e prontos.

## 3. Fluxo recomendado no N8N

### 3.1 Workflow principal

1. **Trigger Cron**
   - Agendamento diário, horário fixo ou intervalo desejado.

2. **HTTP Request**
   - Método: `POST`
   - URL: `http://<backend-host>:3001/api/auctions/sync/leiloes-ms`
   - Header: `Content-Type: application/json`
   - Body: `{}`

3. **Processar retorno**
   - O backend retorna JSON com `lotes: []`.
   - Use um nó `Set` ou `Function` para ajustar o formato.

4. **Salvar em banco**
   - Exemplo: `PostgreSQL`, `MySQL` ou outro.
   - Cada lote deve ser inserido/atualizado.

5. **Resposta final**
   - Retornar `success: true` no workflow N8N.

### 3.2 Webhook de retorno (opcional)

Se você preferir processar no N8N e depois avisar o backend:

1. Criar webhook N8N de entrada, ex: `/webhook/auctions-processed`
2. No final do workflow, chamar:
   - `POST http://<backend-host>:3001/api/auctions/webhook/n8n`
   - Body:
     ```json
     {
       "lotes": [ ... ]
     }
     ```

## 4. Configuração de variáveis de ambiente

No backend, use `backend/.env` com suas URLs reais do N8N.

```env
PORT=3001
NODE_ENV=production
WEBHOOK_N8N_LEILOES_MS=https://seu-n8n.com/webhook/receber-leiloes-ms
WEBHOOK_N8N_SODRE=https://seu-n8n.com/webhook/receber-sodre
WEBHOOK_N8N_SUPERBID=https://seu-n8n.com/webhook/receber-superbid
WEBHOOK_N8N_COPART=https://seu-n8n.com/webhook/receber-copart
WEBHOOK_N8N_AUTOTRAN=https://seu-n8n.com/webhook/receber-autotran
WEBHOOK_N8N_PESTANA=https://seu-n8n.com/webhook/receber-pestana
WEBHOOK_N8N_MARCA_LEILOES=https://seu-n8n.com/webhook/receber-marca-leiloes
```

## 5. Testes básicos

### 5.1 Testar backend direto

```bash
curl -X POST http://<backend-host>:3001/api/auctions/sync/leiloes-ms
```

### 5.2 Testar N8N recebendo dados

- Crie um Webhook de entrada no N8N
- No backend, use a URL do webhook em `backend/.env`
- Execute manualmente o workflow

## 6. Observações

- Atualmente o backend implementa apenas `leiloes-ms` de forma completa.
- Outros scrapers estão em `501 Not Implemented` no backend e precisam ser desenvolvidos.
- O endpoint `GET /api/auctions` ainda precisa de integração com banco de dados.

## 7. Melhorias futuras

- Adicionar persistência em PostgreSQL
- Criar workflow N8N para cada fonte separadamente
- Implementar retry e filas no backend
