-- ============================================================
-- Birja — to'liq Supabase o'rnatish (bitta fayl)
-- SQL Editor > New query > shu matnni to'liq joylang > Run.
-- Qayta ishga tushirish xavfsiz (idempotent).
-- ============================================================

-- >>> supabase/migrations/0001_init.sql
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

-- >>> supabase/migrations/0002_rls.sql
-- Birja — Row Level Security
-- 0002_rls.sql
-- Har bir foydalanuvchi faqat o'z yozuvlarini ko'radi/o'zgartiradi.

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'organizations', 'contracts', 'obligations', 'deliveries',
    'payments', 'costs', 'templates', 'uzex_lots'
  ]
  loop
    execute format('alter table public.%I enable row level security;', tbl);
    execute format('drop policy if exists %I_owner_all on public.%I;', tbl, tbl);
    execute format($p$
      create policy %I_owner_all on public.%I
        for all
        using (user_id = auth.uid())
        with check (user_id = auth.uid());
    $p$, tbl, tbl);
  end loop;
end $$;

-- activity_log: faqat o'qish (yozuv trigger orqali, security definer)
alter table public.activity_log enable row level security;
drop policy if exists activity_owner_select on public.activity_log;
create policy activity_owner_select on public.activity_log
  for select using (user_id = auth.uid());

-- >>> supabase/migrations/0003_audit.sql
-- Birja — updated_at va audit (harakatlar) triggerlari
-- 0003_audit.sql

-- ===== updated_at avtomatik =====
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'organizations', 'contracts', 'obligations', 'templates'
  ]
  loop
    execute format('drop trigger if exists trg_%s_updated on public.%I;', tbl, tbl);
    execute format($t$
      create trigger trg_%s_updated
        before update on public.%I
        for each row execute function public.set_updated_at();
    $t$, tbl, tbl);
  end loop;
end $$;

-- ===== harakatlar jurnali =====
create or replace function public.log_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rec        jsonb := to_jsonb(coalesce(new, old));
  v_user     uuid  := nullif(rec ->> 'user_id', '')::uuid;
  v_action   text;
  v_contract uuid;
  v_summary  text;
begin
  if v_user is null then
    return coalesce(new, old);
  end if;

  -- amal turi
  if tg_op = 'INSERT' then
    v_action := 'create';
  elsif tg_op = 'DELETE' then
    v_action := 'delete';
  elsif (to_jsonb(old) ->> 'status') is distinct from (to_jsonb(new) ->> 'status') then
    v_action := 'status_change';
  else
    v_action := 'update';
  end if;

  -- bog'liq shartnoma
  if tg_table_name = 'contracts' then
    v_contract := (rec ->> 'id')::uuid;
  else
    v_contract := nullif(rec ->> 'contract_id', '')::uuid;
  end if;

  -- qisqa izoh
  v_summary := coalesce(
    case when tg_table_name = 'contracts'
         then 'Shartnoma ' || (rec ->> 'number') else null end,
    rec ->> 'name',
    rec ->> 'description',
    rec ->> 'purpose',
    rec ->> 'category',
    rec ->> 'number'
  );

  insert into public.activity_log
    (user_id, entity_type, entity_id, contract_id, action, summary, diff)
  values (
    v_user,
    tg_table_name,
    nullif(rec ->> 'id', '')::uuid,
    v_contract,
    v_action,
    left(v_summary, 200),
    jsonb_build_object(
      'old', case when tg_op <> 'INSERT' then to_jsonb(old) end,
      'new', case when tg_op <> 'DELETE' then to_jsonb(new) end
    )
  );

  return coalesce(new, old);
end;
$$;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'organizations', 'contracts', 'obligations', 'deliveries',
    'payments', 'costs', 'templates'
  ]
  loop
    execute format('drop trigger if exists trg_%s_audit on public.%I;', tbl, tbl);
    execute format($t$
      create trigger trg_%s_audit
        after insert or update or delete on public.%I
        for each row execute function public.log_activity();
    $t$, tbl, tbl);
  end loop;
end $$;

-- >>> supabase/migrations/0004_finance.sql
-- Birja — moliyaviy ko'rsatkichlar view
-- 0004_finance.sql
--
-- Eslatma: to'lov va xarajatlar valyutasi shartnoma valyutasidan farq qilsa ham
-- summalar qo'shiladi (shaxsiy foydalanish uchun soddalashtirilgan).
-- security_invoker = true — RLS chaqiruvchi foydalanuvchi bo'yicha qo'llanadi.

create or replace view public.contract_finance
with (security_invoker = true) as
select
  c.id                                           as contract_id,
  c.user_id                                      as user_id,
  c.our_role                                     as our_role,
  c.currency                                     as currency,
  c.total_amount                                 as contract_value,
  coalesce(pin.s, 0)                             as paid_in,
  coalesce(pout.s, 0)                            as paid_out,
  coalesce(ct.s, 0)                              as costs_total,
  coalesce(dl.s, 0)                              as delivered_total,
  case when c.our_role = 'seller'
       then c.total_amount else coalesce(pin.s, 0) end        as revenue,
  coalesce(pout.s, 0) + coalesce(ct.s, 0)                     as spent,
  (case when c.our_role = 'seller'
        then c.total_amount else coalesce(pin.s, 0) end)
    - (coalesce(pout.s, 0) + coalesce(ct.s, 0))               as profit,
  case when c.our_role = 'seller'
       then c.total_amount - coalesce(pin.s, 0) else 0 end    as outstanding,
  case when c.total_amount > 0
       then least(coalesce(dl.s, 0) / c.total_amount, 1) else 0 end as progress
from public.contracts c
left join (
  select contract_id, sum(amount) s from public.payments
  where direction = 'in' group by contract_id
) pin on pin.contract_id = c.id
left join (
  select contract_id, sum(amount) s from public.payments
  where direction = 'out' group by contract_id
) pout on pout.contract_id = c.id
left join (
  select contract_id, sum(amount) s from public.costs group by contract_id
) ct on ct.contract_id = c.id
left join (
  select contract_id, sum(amount) s from public.deliveries group by contract_id
) dl on dl.contract_id = c.id;

-- >>> supabase/migrations/0005_companies.sql
-- Birja — "Mening tashkilotlarim" (o'z yuridik shaxslarim)
-- 0005_companies.sql
--
-- Model: har bir shartnomada ikki taraf bor —
--   company_id      = MENING tashkilotim (siz nomidan tuziladi, yetkazib beruvchi)
--   organization_id = KONTRAGENT (buyurtmachi)

create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  inn_stir    text,
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists companies_user_idx on public.companies (user_id);

alter table public.contracts
  add column if not exists company_id uuid
  references public.companies (id) on delete set null;
create index if not exists contracts_company_idx on public.contracts (company_id);

-- ===== RLS =====
alter table public.companies enable row level security;
drop policy if exists companies_owner_all on public.companies;
create policy companies_owner_all on public.companies
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ===== trigger'lar =====
drop trigger if exists trg_companies_updated on public.companies;
create trigger trg_companies_updated
  before update on public.companies
  for each row execute function public.set_updated_at();

drop trigger if exists trg_companies_audit on public.companies;
create trigger trg_companies_audit
  after insert or update or delete on public.companies
  for each row execute function public.log_activity();

-- ===== contract_finance view — company_id qo'shildi =====
-- CREATE OR REPLACE ustun tartibini o'zgartira olmaydi, shuning uchun avval drop.
drop view if exists public.contract_finance;
create view public.contract_finance
with (security_invoker = true) as
select
  c.id                                           as contract_id,
  c.user_id                                      as user_id,
  c.company_id                                   as company_id,
  c.our_role                                     as our_role,
  c.currency                                     as currency,
  c.total_amount                                 as contract_value,
  coalesce(pin.s, 0)                             as paid_in,
  coalesce(pout.s, 0)                            as paid_out,
  coalesce(ct.s, 0)                              as costs_total,
  coalesce(dl.s, 0)                              as delivered_total,
  case when c.our_role = 'seller'
       then c.total_amount else coalesce(pin.s, 0) end        as revenue,
  coalesce(pout.s, 0) + coalesce(ct.s, 0)                     as spent,
  (case when c.our_role = 'seller'
        then c.total_amount else coalesce(pin.s, 0) end)
    - (coalesce(pout.s, 0) + coalesce(ct.s, 0))               as profit,
  case when c.our_role = 'seller'
       then c.total_amount - coalesce(pin.s, 0) else 0 end    as outstanding,
  case when c.total_amount > 0
       then least(coalesce(dl.s, 0) / c.total_amount, 1) else 0 end as progress
from public.contracts c
left join (
  select contract_id, sum(amount) s from public.payments
  where direction = 'in' group by contract_id
) pin on pin.contract_id = c.id
left join (
  select contract_id, sum(amount) s from public.payments
  where direction = 'out' group by contract_id
) pout on pout.contract_id = c.id
left join (
  select contract_id, sum(amount) s from public.costs group by contract_id
) ct on ct.contract_id = c.id
left join (
  select contract_id, sum(amount) s from public.deliveries group by contract_id
) dl on dl.contract_id = c.id;

