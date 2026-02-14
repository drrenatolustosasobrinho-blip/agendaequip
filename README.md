# Sistema de Reserva de Equipamentos

Aplicação web para gerenciamento de reservas anuais de equipamentos laboratoriais.

## Funcionalidades

- **Menu de Equipamentos**: Escolha entre 3 equipamentos (Câmara de crescimento, IRGA, Casa de vegetação)
- **Calendário Interativo**: Visualize reservas aprovadas por dia com cores diferenciadas (passado, futuro, reservado)
- **Solicitação de Reserva**: Formulário para solicitar horários (status PENDING)
- **Painel Admin**: Aprova/rejeita reservas, controle anual, gráficos de uso e taxa de ocupação
- **Responsivo**: Funciona em desktop e mobile
- **Persistência**: Dados salvos no LocalStorage do navegador

## Tecnologias

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Recharts (gráficos)
- React Router DOM

---

## 🚀 Deploy (Escolha uma opção)

### Opção 1: Vercel (recomendada, mais fácil)

1. Faça push do código para o GitHub
2. Acesse https://vercel.com e faça login com GitHub
3. Clique **"Add New... Project"**
4. Selecione o repositório `agendaequip`
5. Vercel detecta automaticamente Vite/React
6. Clique **"Deploy"**
7. Pronto! URL: `https://agendaequip.vercel.app`

**Build Command:** `npm run build`
**Output Directory:** `dist/`

### Opção 2: Netlify

1. Faça push do código para o GitHub
2. Acesse https://netlify.com
3. "New site from Git" → authorize Netlify
4. Selecione o repositório
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Deploy

### Opção 3: GitHub Pages

1. No repositório no GitHub, vá em **Settings** → **Pages**
2. Em "Build and deployment", select source: **GitHub Actions**
3. Crie um arquivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ master ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
        env:
          VITE_BASE_URL: /agendaequip
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

4. Ajuste `vite.config.ts` com `base: '/agendaequip/'`
5. Push → Pages ativo em `https://drrenatolustosasobrinho-blip.github.io/agendaequip`

### Opção 4: Servidor próprio (Apache/Nginx)

1. No servidor, clone o repositório
2. Instale Node.js (v18+)
3. Rode:
   ```bash
   cd reserva-equipamentos
   npm ci --only=production
   npm run build
   ```
4. A pasta `dist/` contém arquivos estáticos (HTML, CSS, JS)
5. Configure o servidor web para servir `dist/` como raiz
   - **Apache**: DocumentRoot → `dist/`
   - **Nginx**: `root /path/to/dist;`
6. Reinicie o servidor web

---

## 🗄️ Backend (Supabase) — PARTE 1/2

Esta seção descreve a configuração do backend com Supabase (PostgreSQL + Auth + Row Level Security).

### Visão geral da arquitetura

- **Frontend**: React (Vite) — faz chamadas diretas ao Supabase usando a `anon key`
- **Backend Serverless**: Vercel Functions (`/api/*`) — operações que exigem `service_role_key` (bootstrap, futuras APIs)
- **Banco**: Supabase PostgreSQL com RLS
- **Auth**: Supabase Auth (email/senha)

### 1) Criar projeto no Supabase

1. Acesse https://app.supabase.com → **New Project**
2. Nome: `reserva-equipamentos` (ou outro)
3. Database: `Postgres` (default)
4. Region: escolha a mais próxima (ex: São Paulo)
5. Senha do banco: guarde (não usaremos diretamente)
6. Aguarde provisionamento (~2 min)

**Anote as credenciais:**
- **Project URL**: `https://xyz.supabase.co`
- **anon/public key**: começa com `eyJ...` (usada no frontend)
- **service_role key**: começa com `eyJ...` (usada apenas serverless, NÃO exponha)

Acesse: **Settings** → **API**

### 2) Aplicar schema SQL

No Supabase Dashboard:
1. Vá em **SQL Editor** → **New query**
2. Cole o conteúdo do arquivo `supabase/schema.sql`
3. Clique **"Run"** (ou Ctrl+Enter)

O schema cria:
- Tabela `app_config` (config global com `id=1`)
- Tabela `admins` (lista de UUIDs administrativos)
- Tabela `reservations` (todas as reservas)
- Índices para performance
- Políticas RLS (segurança em nível de linha)

### 3) Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto (não commitado) baseado no `.env.example`:

```bash
cp .env.example .env.local
```

Abra `.env.local` e preencha:

```env
# === FRONTEND (Vite) — são expostas ao navegador ===
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui

# === SERVERLESS (Vercel Functions) — secretas, só no backend ===
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
BOOTSTRAP_PASSWORD=escolha_uma_senha_secreta_aqui
```

⚠️ **Importante:**
- `SUPABASE_SERVICE_ROLE_KEY` e `BOOTSTRAP_PASSWORD` são usados **somente no backend** (Vercel Functions). Nunca os coloque no código frontend.
- `VITE_*` são variáveis que o Vite expõe ao navegador (são seguras, pois a `anon key` tem permissões limitadas pelo RLS).

### 4) Instalar dependências do Supabase no projeto

```bash
cd reserva-equipamentos
npm install @supabase/supabase-js
```

### 5) Bootstrap de admin (first setup)

Antes de usar o sistema, é necessário criar o primeiro usuário administrador.

**Método A: Usar script helper**

```bash
node scripts/bootstrap-admin.js admin@exemplo.com senhaForte123
```

O script lê `.env.local` e chama o endpoint serverless.

**Método B: cURL manual**

```bash
curl -X POST http://localhost:3000/api/bootstrap-admin \
  -H "Content-Type: application/json" \
  -d '{
    "bootstrapPassword": "a_senha_definida_em_BOOTSTRAP_PASSWORD",
    "adminEmail": "admin@exemplo.com",
    "adminPassword": "senha_forte_do_admin"
  }'
```

**O que acontece:**
1. Valida a `bootstrapPassword`
2. Verifica se `setup_done` ainda é `false` na `app_config`
3. Cria usuário no Supabase Auth
4. Insere `user_id` na tabela `admins`
5. Marca `setup_done = true`

A partir daí, o admin pode acessar `/admin` com o email/senha criados.

### 6) Estrutura de pastas do backend

```
supabase/
  └── schema.sql          # Schema + RLS
api/
  └── bootstrap-admin.ts  # Endpoint serverless (Vercel Functions)
scripts/
  └── bootstrap-admin.js  # Helper CLI
.env.example              # Variáveis de ambiente (exemplo)
```

### 7) Deploy na Vercel com serverless functions

1. Faça push para o GitHub
2. Na Vercel, importe o repositório
3. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `BOOTSTRAP_PASSWORD`
   - *(Marque todas como "Plain text", não "Environment variable group")*
4. Deploy automático no push
5. Após deploy, execute o bootstrap (passo 5) na URL da Vercel

---

## 📋 Como rodar localmente

### Desenvolvimento (hot reload)

```bash
cd reserva-equipamentos
npm install
npm run dev
```

Acesse `http://localhost:5173/`

### Build para produção

```bash
npm run build
```

Os arquivos otimizados estarão em `dist/`.

### Preview do build

```bash
npx serve dist
```

---

## 🔐 Admin

- Rota: `/admin`
- Senha: `admin123` (altere em `src/pages/AdminDashboard.tsx` se necessário)
- Funcionalidades:
  - Aprovar/rejeitar reservas pendentes
  - Iniciar novo ano (ação destrutiva, confirmação dupla)
  - Visualizar gráficos de uso e taxa de ocupação
  - Cancelar reservas aprovadas

---

## 📊 Estrutura de pastas

```
src/
├── components/
│   ├── DayCard.tsx          # Célula do calendário
│   ├── DayDetailsPanel.tsx  # Painel lateral de detalhes
│   ├── EquipmentCard.tsx    # Card do menu inicial
│   ├── EquipmentOccupancyCard.tsx  # Card de taxa de ocupação (donut)
│   └── ReservationForm.tsx  # Formulário de solicitação
├── data/
│   └── equipments.ts        # Definição dos equipamentos
├── pages/
│   ├── AdminDashboard.tsx   # Painel administrativo
│   ├── EquipmentCalendarPage.tsx  # Calendário por equipamento
│   └── HomeMenu.tsx         # Menu principal
├── services/
│   └── storage.ts           # LocalStorage + helpers
├── types/
│   ├── equipment.ts
│   └── reservation.ts
├── App.tsx
├── index.css                # Estilos globais + responsividade
└── main.tsx
```

---

## 🗄️ Modelo de dados

### Reservation
```typescript
{
  id: string;
  year: number;           // Ano ativo
  equipmentId: 'growth_chamber' | 'irga' | 'greenhouse';
  date: string;           // YYYY-MM-DD
  startTime?: string;     // HH:mm
  endTime?: string;       // HH:mm
  requesterName: string;
  requesterEmail?: string;
  purpose?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: ISO string;
  decidedAt?: ISO string;
  decidedBy?: string;
  decisionNote?: string;
}
```

### Config (LocalStorage)
```typescript
{
  activeYear: number;
}
```

---

## 🔧 Personalizações importantes

### Alterar senha do admin

Edite `src/pages/AdminDashboard.tsx`:
```typescript
const ADMIN_PASSWORD = 'admin123'; // ⬅️ mude aqui
```

### Adicionar equipamentos

Edite `src/data/equipments.ts`:
```typescript
{
  id: 'novo_equipamento',
  name: 'Nome do Equipamento',
  description: 'Descrição opcional'
}
```

### Cores do calendário

Edite `src/index.css`:
```css
.calendar-day-cell.past { background-color: #f1c40f !important; }      /* amarelo */
.calendar-day-cell.reserved-future { background-color: #2ecc71 !important; } /* verde */
.calendar-day-cell.reserved-past { background-color: #e74c3c !important; }   /* vermelho */
```

---

## 🚨 Ação "Iniciar novo ano"

- Botão posicionado no topo da admin, em faixa amarela de alerta
- Requer digitar `INICIAR` para confirmar
- Incrementa `activeYear` e limpa pendências
- **Aviso**: Coletar estatísticas do ano anterior antes de executar

---

## 🛠️ Solução de problemas

### Build falha: "Cannot find module '...'"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Dados sumiram
- Dados estão no LocalStorage do navegador
- Limpar LocalStorage apaga tudo
- Para backup: exporte `app_config`, `reservations` do DevTools → Application → Local Storage

### Gráfico não aparece
- Verifique console do navegador (F12)
- Precisa ter reservas APROVADAS no ano selecionado
- `chartData` vazio = sem dados

---

## 📄 Licença

Projeto desenvolvido para uso interno da universidade.

---

**Desenvolvido para Renato Homem** ✨