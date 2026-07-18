# WhatsApp Group Summarizer

Captura, sumariza e aprova mensagens de grupos WhatsApp usando IA.

## Arquitetura

```
Z-API (WhatsApp) 
    ↓
Supabase Edge Functions (webhook-whatsapp)
    ↓
Supabase PostgreSQL (banco de dados)
    ↓
Frontend React (GitHub Pages)
```

## Stack

- **Frontend**: React + Vite + TypeScript + Tailwind
- **Backend**: Supabase Edge Functions (serverless)
- **Database**: Supabase PostgreSQL
- **AI**: Claude 3.5 Sonnet
- **Deploy**: GitHub Pages + Supabase

## Estrutura

```
├── frontend/              # React app (GitHub Pages)
│   ├── src/
│   │   ├── pages/        # Dashboard, Messages, Topics
│   │   ├── services/     # API client, Zustand store
│   │   └── App.tsx
│   ├── vite.config.ts    # Configurado para GitHub Pages
│   └── package.json
│
├── supabase/            # Edge Functions (serverless)
│   ├── config.toml
│   └── functions/
│       ├── webhook-whatsapp/        # Recebe mensagens Z-API
│       ├── summarize-messages/      # Chama Claude IA
│       ├── get-messages/            # Lista mensagens
│       ├── get-topics/              # Lista tópicos
│       └── update-topic/            # Aprova/rejeita
│
└── database/            # Referência do schema
    └── schema.sql       # Tabelas, índices, RLS
```

## Setup (Rápido)

### 1. Clonar e instalar frontend

```bash
cd frontend
npm install
npm run dev
```

### 2. Deploy Edge Functions

```bash
npm install -g supabase
supabase login
supabase functions deploy
```

### 3. Deploy GitHub Pages

Crie um repositório no GitHub e faça push:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/SEU-USER/whatsapp-summarizer.git
git push -u origin main
```

Ative GitHub Pages em **Settings → Pages → Build and deployment → GitHub Actions → React (Configure)**

### 4. Configurar Secrets

No Supabase Dashboard → Settings → Secrets:

```
ANTHROPIC_API_KEY=sk-ant-...
ZAPI_INSTANCE_ID=...
ZAPI_TOKEN=...
ZAPI_CLIENT_TOKEN=...
```

### 5. Atualizar Z-API Webhook

URL: `https://xtrvojnauvkkterogrst.supabase.co/functions/v1/webhook-whatsapp`

## URLs Finais

- **Frontend**: `https://seu-usuario.github.io/whatsapp-summarizer/`
- **Backend**: `https://xtrvojnauvkkterogrst.supabase.co/functions/v1/*`

## Fluxo

1. Mensagem chega no WhatsApp
2. Z-API envia webhook → `webhook-whatsapp`
3. Edge Function insere em `raw_messages`
4. Frontend exibe mensagens
5. Clica "Summarize" → `summarize-messages`
6. Claude IA cria tópicos
7. Aprova/rejeita em "Topics"

## Desenvolvimento

**Frontend local:**
```bash
cd frontend
npm run dev
```

**Edge Functions local:**
```bash
supabase start
supabase functions serve
```

## Deploy automático

Após fazer push para `main`:
- GitHub Actions constrói e deploy no GitHub Pages
- Use `supabase functions deploy` para atualizar backend

## Documentação

- `database/schema.sql` - Schema PostgreSQL completo
- `supabase/functions/*/index.ts` - Código das Edge Functions
- `frontend/src/services/api.ts` - Cliente HTTP

## Suporte

Erros nas Edge Functions:
```bash
supabase functions fetch webhook-whatsapp --logs
```

---

**Pronto para produção!** 🚀
