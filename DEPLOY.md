# Deploy na Vercel — Guia Passo a Passo

## 📋 Pré-requisitos

- Conta no GitHub (código já pushed)
- Conta no Supabase (backend configurado)
- Node.js instalado localmente (para build tests)

---

## 🚀 Deploy Automático (Recomendado)

### 1) Prepare as variáveis de ambiente na Vercel

Após importar o projeto, vá em **Project Settings** → **Environment Variables** e adicione:

| Key | Value | Target |
|-----|-------|--------|
| `VITE_SUPABASE_URL` | `https://seu-projeto.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `sua_anon_key` | Production, Preview, Development |
| `SUPABASE_URL` | `https://seu-projeto.supabase.co` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `sua_service_role_key` | Production, Preview, Development |
| `BOOTSTRAP_PASSWORD` | `senha_secreta_escolhida` | Production, Preview, Development |

⚠️ **Importante:** `SUPABASE_SERVICE_ROLE_KEY` e `BOOTSTRAP_PASSWORD` são **server-side only** e serão usados apenas pelas Vercel Functions (`/api/*`). O Vite só expõe as `VITE_*` ao frontend.

### 2) Build Settings

A Vercel detecta automaticamente Vite:

- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm ci`

Deixe como padrão.

### 3) Deploy

Clique em **Deploy**. A Vercel vai:

1. Instalar dependências (`npm ci`)
2. Executar `npm run build` (TypeScript + Vite)
3. Servir a pasta `dist/` + Functions

Aguard ~1 minuto e você terá uma URL como:

```
https://agendaequip.vercel.app
```

---

## 🔧 Pós-Deploy

### 1) Executar bootstrap do admin

No primeiro uso, é necessário criar o administrador.

Como o endpoint serverless está ativo, faça:

```bash
curl -X POST https://agendaequip.vercel.app/api/bootstrap-admin \
  -H "Content-Type: application/json" \
  -d '{
    "bootstrapPassword": "a_senha_definida_em_BOOTSTRAP_PASSWORD",
    "adminEmail": "admin@exemplo.com",
    "adminPassword": "senha_forte_123"
  }'
```

Resposta esperada: `{ "ok": true }`

⚠️ **Só funciona uma vez!** Se precisar resetar, delete manualmente no Supabase:
- Delete registro da `app_config` (id=1) ou marque `setup_done = false`
- Delete usuário na tabela `admins`
- Tente novamente.

### 2) Testar a aplicação

Acesse `https://agendaequip.vercel.app`:

- `/` → Menu de equipamentos
- `/admin` → Login (email/senha do admin criado)
- Criar reservas, aprovar, ver gráficos

### 3) (Opcional) Domínio customizado

Em **Project Settings** → **Domains**:

- Adicone seu domínio (ex: `reserva.universidade.edu.br`)
- A Vercel fornece DNS target
- No provedor do domínio, crie um registro CNAME apontando para o target
- Aguarde propagação

---

## 🛠️ Troubleshooting

### Build falha: "Cannot find module '@supabase/supabase-js'"

```bash
# Commit faltando? Certifique-se de que a dependência está no package.json
git add package.json package-lock.json
git commit -m "chore: add supabase js"
git push
```

### Environment variables não funcionam

- Verifique se todas estão definidas em **All** (Production, Preview, Development)
- Reinicie o deploy (Redeploy)
- As `VITE_*` são usadas apenas no frontend; `SUPABASE_*` e `BOOTSTRAP_PASSWORD` são serverless-only

### Endpoint bootstrap retorna 404

- Verifique se a função está em `api/bootstrap-admin.ts` (extensão `.ts`)
- Vercel auto-detecta funções em `/api` com `ts` ou `js`
- Faça um novo deploy após adicionar o arquivo

### RLS bloqueando inserts

Verifique no Supabase SQL Editor se as policies estão corretas:

```sql
SELECT * FROM pg_policies WHERE tablename = 'reservations';
```

Deve existir:
- `"Public can insert reservations (PENDING only)"` → com `WITH CHECK (status = 'PENDING' ...)`

---

## 📦 Estrutura do projeto para Vercel

```
.
├── api/
│   └── bootstrap-admin.ts    # Vercel Serverless Function
├── supabase/
│   └── schema.sql            # SQL para rodar manualmente no Supabase
├── src/                      # Frontend React
├── package.json
├── vite.config.ts
├── tsconfig.json
├── .env.example
└── README.md
```

A Vercel irá:
- Build do frontend (`dist/`)
- Deploy das functions em `/api` automaticamente

---

## 🔄 Atualizações futuras

Para adicionar novas APIs serverless:

1. Crie novo arquivo em `api/` (ex: `api/update-config.ts`)
2. Use `createClient` com `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy automático no push

---

**Pronto!** Seu sistema estará online com backend Supabase + Segurança RLS + Bootstrap admin.

Dúvidas? Consulte o `README.md` principal.
