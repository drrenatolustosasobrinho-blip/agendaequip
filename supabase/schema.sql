-- =====================================================
-- SCHEMA DO SISTEMA DE RESERVA DE EQUIPAMENTOS
-- Supabase (PostgreSQL)
-- =====================================================

-- Habilitar extensão pgcrypto para gen_random_uuid()
create extension if not exists pgcrypto;

-- =====================================================
-- TABELA: app_config
-- Configuração global da aplicação
-- =====================================================
create table if not exists public.app_config (
  id integer primary key check (id = 1), -- sempre 1
  active_year int not null,
  setup_done boolean not null default false,
  constraint unique_active_year unique (id)
);

-- Seed inicial se não existir
insert into public.app_config (id, active_year, setup_done)
select 1, extract(year from now())::int, false
where not exists (select 1 from public.app_config where id = 1);

-- =====================================================
-- TABELA: admins
-- Usuários com privilégios administrativos
-- =====================================================
create table if not exists public.admins (
  user_id uuid primary key references auth.users not null
);

-- =====================================================
-- TABELA: reservations
-- Reservas de equipamentos
-- =====================================================
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  equipment_id text not null check (equipment_id in ('growth_chamber','irga','greenhouse')),
  date date not null,
  start_time time,
  end_time time,
  requester_name text not null,
  requester_email text,
  purpose text,
  status text not null check (status in ('PENDING','APPROVED','REJECTED')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.admins(user_id),
  decision_note text
);

-- Índices para performance
create index if not exists idx_reservations_equipment_year_date
  on public.reservations(equipment_id, year, date);

create index if not exists idx_reservations_status_year
  on public.reservations(status, year);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
alter table public.app_config enable row level security;
alter table public.admins enable row level security;
alter table public.reservations enable row level security;

-- -----------------------------------------------------
-- POLICIES: app_config
-- -----------------------------------------------------

-- SELECT público: qualquer um pode ler a config
create policy "Allow public read access to app_config"
  on public.app_config for select
  using (true);

-- UPDATE apenas admin
create policy "Allow admin update to app_config"
  on public.app_config for update
  using (
    exists (
      select 1 from public.admins
      where admins.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------
-- POLICIES: admins
-- -----------------------------------------------------
-- Apenas admin pode gerenciar a tabela admins
create policy "Allow admin full access to admins"
  on public.admins for all
  using (
    exists (
      select 1 from public.admins
      where admins.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------
-- POLICIES: reservations
-- -----------------------------------------------------

-- SELECT público: apenas reservas APROVadas
create policy "Public can view approved reservations"
  on public.reservations for select
  using (status = 'APPROVED');

-- SELECT admin: admin pode ver tudo
create policy "Admin can view all reservations"
  on public.reservations for select
  using (
    exists (
      select 1 from public.admins
      where admins.user_id = auth.uid()
    )
  );

-- INSERT público: qualquer um pode criar reserva, mas só PENDING
create policy "Public can insert reservations (PENDING only)"
  on public.reservations for insert
  with check (
    status = 'PENDING' and
    decided_at is null and
    decided_by is null and
    decision_note is null
  );

-- UPDATE admin: admin pode aprovar/rejeitar
create policy "Admin can update reservations"
  on public.reservations for update
  using (
    exists (
      select 1 from public.admins
      where admins.user_id = auth.uid()
    )
  );

-- DELETE: não permitido (opcional: permitir admin se quiser)
-- create policy "Admin can delete reservations"
--   on public.reservations for delete
--   using (
--     exists (
--       select 1 from public.admins
--       where admins.user_id = auth.uid()
--     )
--   );
