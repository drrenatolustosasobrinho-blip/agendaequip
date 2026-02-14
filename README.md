# Sistema de Reserva de Equipamentos

Aplicação web para gerenciamento de reservas anuais de equipamentos laboratoriais.

## 🎯 Objetivo

Deploy em servidores **HTML/PHP** comuns, sem dependency de Vercel/Netlify. Usa:
- **Frontend:** React + Vite (build estático)
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions)
- **Rotas:** HashRouter (funciona em qualquer subpasta sem rewrite)

---

## 🗄️ Estrutura de Pastas

```
reserva-equipamentos/
├── src/                    # Código fonte React
├── supabase/
│   ├── schema.sql         # Schema + RLS
│   └── functions/
│       └── bootstrap-admin/
│           └── index.ts   # Supabase Edge Function
├── dist/                  # Build estático (deploy)
├── .env.example
├── vite.config.ts
└── README.md
```

---

## 🚀 Deploy em Servidor PHP (Passo a Passo)

### 1) Configurar Supabase

1. Criar projeto em https://app.supabase.com
2. Anotar:
   - **Project URL** (ex: `https://xyz.supabase.co`)
   - **anon key** (começa com `eyJ...`)
3. Aplicar `supabase/schema.sql` no SQL Editor
4. Criar Edge Function `bootstrap-admin`:
   - No Supabase Dashboard → Functions → New function
   - Nome: `bootstrap-admin`
   - Runtime: `deno-1.x`
   - Copie o conteúdo de `supabase/functions/bootstrap-admin/index.ts`
   - Em **Settings** → **Environment Variables**, adicione:
     - `SUPABASE_URL` (sua URL do Supabase)
     - `SUPABASE_SERVICE_ROLE_KEY` (sua service_role key)
     - `BOOTSTRAP_PASSWORD` (senha secreta para bootstrap)
   - Deploy da function

---

### 2) Variáveis de Ambiente Locais

Crie `.env.local` na raiz:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

**Importante:** `VITE_*` são variáveis que o Vite inclui no build.

---

### 3) Build Estático

```bash
cd reserva-equipamentos
npm install
npm run build
```

Isso gera a pasta `dist/` pronta para deploy.

**Configuração do Vite:**
- `base: './'` (caminhos relativos — funciona em qualquer subpasta)
- HashRouter (não precisa de rewrite no servidor)

---

### 4) Deploy no Servidor UEMS

1. Conectar via FTP/SFTP ao servidor UEMS
2. Navegar até a pasta pública (ex: `/public_html/`)
3. Criar pasta `reserva-equipamento` (ou outro nome)
4. Enviar **todo conteúdo de `dist/`** para essa pasta
5. Permissões: 644 arquivos, 755 pastas (normalmente padrão)

---

### 5) Acessar

- URL: `https://uems.br/reserva-equipamento/` (ou o caminho escolhido)
- Usa `#` nas rotas: `index.html#/admin`, `index.html#/equipamento/growth_chamber`

---

## 🔐 Primeiro Setup (Admin)

### Opção A: Usar Edge Function (recomendado)

Após deploy, acesse `https://uems.br/reserva-equipamento/index.html#/admin`

Como `setup_done` estará `false`, você verá a tela "Configuração Inicial".

1. Digite Email do admin (ex: `admin@uems.br`)
2. Senha do admin (escolha uma forte)
3. Senha de bootstrap (definida em `BOOTSTRAP_PASSWORD` na Edge Function)
4. Clique "Criar admin"

A função chamará `/functions/v1/bootstrap-admin` e criará o admin no Supabase.

### Opção B: Criar admin manualmente (se a function falhar)

1. No Supabase Dashboard → Authentication → Users → Create user
   - Email e senha
2. Anote o `id` (UUID) do usuário criado
3. No SQL Editor, execute:

```sql
INSERT INTO admins (user_id) VALUES ('UUID-AQUI');
UPDATE app_config SET setup_done = true WHERE id = 1;
```

4. Agora pode fazer login no `/admin` com esse email/senha

---

## 🧪 Testes Manuais

1. **Usuário anônimo:**
   - Acessar homepage → escolher equipamento
   - Clicar em data futura → preencher formulário → submit
   - Mensagem: "Agendamento realizado, aguarde aprovação do adm"
   - A data **não** fica verde (status PENDING não é público)

2. **Admin:**
   - Acessar `/admin` → login
   - Ver fila de pendências
   - Aprovar → reserva aparece no calendário público (verde)
   - Rejeitar → some
   - Iniciar novo ano (digitar "INICIAR")
   - Ver gráficos e cards de ocupação

3. **Responsividade:**
   - Testar em mobile, tablet, desktop
   - Calendário rola horizontalmente se necessário

---

## 🔧 Manutenção

### Atualizar código

1. Fazer alterações no código-fonte
2. `npm run build`
3. Substituir arquivos na pasta `reserva-equipamento/` no servidor
4. Limpar cache do navegador (ou usar versão nos assets)

### Resetar sistema (caso necessário)

No Supabase SQL Editor:

```sql
-- Deletar todas as reservas
DELETE FROM reservations;
-- Resetar config (opcional)
UPDATE app_config SET active_year = EXTRACT(YEAR FROM NOW())::int, setup_done = false WHERE id = 1;
-- Deletar admin
DELETE FROM admins;
```

---

## 📁 Arquivos Importantes

- `supabase/schema.sql` — Estrutura do banco + RLS
- `supabase/functions/bootstrap-admin/index.ts` — Edge Function
- `dist/` — Pasta para upload no servidor
- `.env.local` — Variáveis de ambiente (não enviar ao servidor!)

---

## ⚠️ Observações

- **Edge Function:** Só funciona no Supabase (não é移植 para outros backends). Mas é opcional — admin pode ser criado manualmente.
- **HashRouter:** Usa `#` na URL (ex: `#/admin`). Não precisa de configuração de servidor.
- **Supabase Auth:** Login funciona client-side. Não há sessão no servidor PHP.
- **RLS:** Garante segurança mesmo com o frontend acessando o banco diretamente.

---

## 🆘 Troubleshooting

### Rotas não funcionam (404 ao acessar /admin)
- Verifique se está usando HashRouter (deve aparecer `#` na URL)
- Se usar BrowserRouter, precisa configurar rewrite no servidor — não recomendado

### Erro de CORS na Edge Function
- Verifique se a function está deployada
- Verifique variáveis de ambiente (SUPABASE_URL, SERVICE_ROLE_KEY)

### Erro de autenticação no admin
- Verificar se o admin foi criado na tabela `admins`
- Verificar email/senha no Supabase Auth

### Reservas não aparecem no calendário
- Verificar se status é `APPROVED` (RLS só mostra aprovadas)
- Verificar se `year` corresponde ao `activeYear` da config

---

## 📞 Contato

Desenvolvido para Renato Homem (UEMS) por Laice (OpenClaw) — Fevereiro 2026

---

**Pronto para deploy em servidor PHP common!** 🚀
