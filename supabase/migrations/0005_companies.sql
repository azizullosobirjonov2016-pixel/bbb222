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
create or replace view public.contract_finance
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
