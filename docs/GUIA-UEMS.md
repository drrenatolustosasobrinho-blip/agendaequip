# Guia de Deploy — Sistema de Reserva de Equipamentos (UEMS)

**Objetivo:** Instalar o sistema em `https://uems.br/reserva-equipamento/` (ou outro subdiretório)

---

## 📋 Checklist de Preparação

### No Supabase (uma vez só)

1. Criar projeto em https://app.supabase.com
2. Anotar:
   - Project URL (ex: `https://xyz.supabase.co`)
   - anon public key (começa com `eyJ...`)
3. Aplicar `supabase/schema.sql` no SQL Editor
4. Criar Edge Function `bootstrap-admin`:
   - Nome: `bootstrap-admin`
   - Runtime: `deno-1.x`
   - Código: copiar de `supabase/functions/bootstrap-admin/index.ts`
   - Variáveis de ambiente (Settings → Environment Variables):
     - `SUPABASE_URL` = sua URL
     - `SUPABASE_SERVICE_ROLE_KEY` = service_role key
     - `BOOTSTRAP_PASSWORD` = senha secreta (anote!)
   - Deploy

---

### No seu computador (build)

1. Instalar Node.js (v18+)
2. Clonar o repositório
3. Criar `.env.local`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
```

4. Build:

```bash
npm install
npm run build
```

Isso gera a pasta `dist/`.

---

### No servidor UEMS (FTP/SFTP)

1. Conectar ao servidor (FileZilla, WinSCP, etc.)
2. Navegar até a pasta pública (ex: `/public_html/`)
3. Criar pasta: `reserva-equipamento`
4. Enviar **todo conteúdo de `dist/`** para dentro dessa pasta
5. Permissões: arquivos 644, pastas 755

---

## 🚀 Como Usar

### Acesso público

- **Home:** `https://uems.br/reserva-equipamento/`
- **Calendário:** clicar em equipamento → `.../index.html#/equipamento/growth_chamber`
- **Admin:** `.../index.html#/admin`

### Primeiro acesso admin (setup)

1. Acesse `.../index.html#/admin`
2. Você verá a tela "Configuração Inicial"
3. Preencha:
   - Email do admin: `admin@uems.br` (ou outro)
   - Senha do admin: (escolha uma forte)
   - Senha de bootstrap: (a que você definiu na Edge Function)
4. Clique "Criar admin"
5. Agora pode fazer login com esse email/senha

### Funcionalidades admin

- Aprovar/rejeitar reservas pendentes
- Iniciar novo ano (digitar "INICIAR")
- Ver gráficos de uso e taxa de ocupação
- Sair

---

## 🔧 Manutenção

### Atualizar o sistema

1. Fazer alterações no código
2. `npm run build` (gera nova pasta `dist/`)
3. Substituir arquivos no servidor via FTP
4. Se mudar o nome da pasta, ajuste links

### Resetar (se precisar)

No Supabase SQL Editor:

```sql
-- Apagar todos os dados
DELETE FROM reservations;
DELETE FROM admins;
UPDATE app_config SET active_year = 2026, setup_done = false WHERE id = 1;
```

---

## ⚠️ Problemas Comuns

### "Página não encontrada" ao acessar /admin

- **Causa:** Rotas sem `#` (HashRouter deve estar ativo)
- **Solução:** Acesse `.../index.html#/admin` (com `#`). Se aparecer `.../#/admin`, está correto.

### Reservas não aparecem no calendário

- Verifique se status é `APPROVED` (RLS só mostra aprovadas)
- Verifique se o ano da reserva corresponde ao `activeYear` na config
- Verifique se `equipment_id` está correto

### Erro ao criar admin (bootstrap)

- Verifique se a Edge Function está deployada
- Verifique variáveis de ambiente da function (`SUPABASE_URL`, `SERVICE_ROLE_KEY`, `BOOTSTRAP_PASSWORD`)
- Verifique se `setup_done` ainda é `false` (só roda uma vez)

---

## 📁 Arquivos Enviados ao Servidor

Após `npm run build`, a pasta `dist/` contém:

```
dist/
├── index.html
├── assets/
│   ├── index-xxxx.css
│   ├── index-xxxx.js
│   └── ...
└── (outros arquivos estáticos)
```

Envios **apenas** esses arquivos. O `.env.local` fica no seu PC (não sobe).

---

## 🔄 Fluxo Completo

```
1. Usuário acessa homepage
2. Escolhe equipamento → abre calendário (mostra apenas APPROVED do activeYear)
3. Clica em data → preenche formulário → cria reserva (status PENDING)
4. Admin faz login → vê pendências → aprova → reserva aparece no calendário
5. Admin pode iniciar novo ano (incrementa activeYear)
```

---

## 📞 Suporte

Dúvidas? Contatar: Dr. Renato Lustosa Sobrinho (UEMS)

---

**Versão:** 2.0 (Supabase + HashRouter)  
**Data:** Fevereiro 2026
