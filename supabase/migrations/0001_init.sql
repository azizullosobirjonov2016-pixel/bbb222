-- Birja — asosiy sxema
-- 0001_init.sql

create extension if not exists pgcrypto;

-- ===== organizations =====
create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  inn_stir    text,
  type        text not null default 'customer'
                check (type in ('customer', 'supplier', 'both')),
  phone       text,
  email       text,
  address     text,
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists organizations_user_idx on public.organizations (user_id);

-- ===== contracts =====
create table if not exists public.contracts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  number        text not null,
  organization_id uuid references public.organizations (id) on delete set null,
  signed_date   date,
  subject       text,
  our_role      text not null default 'seller'
                  check (our_role in ('seller', 'buyer')),
  total_amount  numeric(18, 2) not null default 0,
  currency      text not null default 'UZS'
                  check (currency in ('UZS', 'USD')),
  status        text not null default 'draft'
                  check (status in ('draft', 'active', 'partially_fulfilled',
                                    'fulfilled', 'cancelled')),
  deadline      date,
  source        text not null default 'manual'
                  check (source in ('manual', 'uzex')),
  external_ref  text,
  external_url  text,
  template_id   uuid,
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists contracts_user_idx on public.contracts (user_id);
create index if not exists contracts_org_idx on public.contracts (organization_id);
create index if not exists contracts_status_idx on public.contracts (status);

-- ===== obligations (bajarish talablari) =====
create table if not exists public.obligations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  contract_id  uuid not null references public.contracts (id) on delete cascade,
  description  text not null,
  qty          numeric(18, 3),
  unit         text,
  unit_price   numeric(18, 2),
  amount       numeric(18, 2),
  due_date     date,
  status       text not null default 'pending'
                 check (status in ('pending', 'partial', 'done')),
  done_date    date,
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists obligations_contract_idx on public.obligations (contract_id);
create index if not exists obligations_user_idx on public.obligations (user_id);

-- ===== deliveries (topshirishlar) =====
create table if not exists public.deliveries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  contract_id   uuid not null references public.contracts (id) on delete cascade,
  obligation_id uuid references public.obligations (id) on delete set null,
  date          date not null default current_date,
  qty           numeric(18, 3),
  amount        numeric(18, 2) not null default 0,
  document_ref  text,
  note          text,
  created_at    timestamptz not null default now()
);
create index if not exists deliveries_contract_idx on public.deliveries (contract_id);
create index if not exists deliveries_user_idx on public.deliveries (user_id);

-- ===== payments (to'lovlar) =====
create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  contract_id  uuid not null references public.contracts (id) on delete cascade,
  direction    text not null check (direction in ('in', 'out')),
  date         date not null default current_date,
  amount       numeric(18, 2) not null default 0,
  currency     text not null default 'UZS' check (currency in ('UZS', 'USD')),
  purpose      text,
  created_at   timestamptz not null default now()
);
create index if not exists payments_contract_idx on public.payments (contract_id);
create index if not exists payments_user_idx on public.payments (user_id);

-- ===== costs (xarajatlar) =====
create table if not exists public.costs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  contract_id  uuid not null references public.contracts (id) on delete cascade,
  category     text,
  date         date not null default current_date,
  amount       numeric(18, 2) not null default 0,
  currency     text not null default 'UZS' check (currency in ('UZS', 'USD')),
  description  text,
  created_at   timestamptz not null default now()
);
create index if not exists costs_contract_idx on public.costs (contract_id);
create index if not exists costs_user_idx on public.costs (user_id);

-- ===== templates (andazalar) — 2-bosqichda UI ulanadi =====
create table if not exists public.templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  kind        text not null default 'contract'
                check (kind in ('contract', 'obligation_set', 'checklist')),
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists templates_user_idx on public.templates (user_id);

-- ===== uzex_lots (tashqi lot keshi) — 2-bosqich =====
create table if not exists public.uzex_lots (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  lot_number    text not null,
  source        text not null default 'xarid.uzex.uz',
  url           text,
  title         text,
  customer_name text,
  start_price   numeric(18, 2),
  currency      text check (currency in ('UZS', 'USD')),
  status        text,
  deadline      timestamptz,
  raw           jsonb,
  fetched_at    timestamptz not null default now(),
  contract_id   uuid references public.contracts (id) on delete set null
);
create index if not exists uzex_lots_user_idx on public.uzex_lots (user_id);
create unique index if not exists uzex_lots_uni
  on public.uzex_lots (user_id, source, lot_number);

-- ===== activity_log (harakatlar jurnali) =====
create table if not exists public.activity_log (
  id           bigint generated always as identity primary key,
  user_id      uuid not null,
  entity_type  text not null,
  entity_id    uuid,
  contract_id  uuid,
  action       text not null
                 check (action in ('create', 'update', 'delete',
                                   'status_change', 'import', 'export')),
  summary      text,
  diff         jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists activity_user_idx on public.activity_log (user_id, created_at desc);
create index if not exists activity_entity_idx on public.activity_log (entity_type, entity_id);
create index if not exists activity_contract_idx on public.activity_log (contract_id);
