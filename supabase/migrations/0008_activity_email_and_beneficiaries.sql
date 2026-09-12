-- Birja — harakatlar tarixida kim kiritgani (email) + "Foyda oluvchilar"
-- 0008_activity_email_and_beneficiaries.sql

-- ===== 1) activity_log: kiritgan foydalanuvchi emaili =====
alter table public.activity_log add column if not exists user_email text;

create or replace function public.log_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rec        jsonb := to_jsonb(coalesce(new, old));
  v_user     uuid  := nullif(rec ->> 'user_id', '')::uuid;
  v_email    text;
  v_action   text;
  v_contract uuid;
  v_summary  text;
begin
  if v_user is null then
    return coalesce(new, old);
  end if;

  select email into v_email from auth.users where id = v_user;

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
    (user_id, user_email, entity_type, entity_id, contract_id, action, summary, diff)
  values (
    v_user,
    v_email,
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

-- ===== 2) beneficiary_payouts ("Foyda oluvchilar") =====
create table if not exists public.beneficiary_payouts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  contract_id  uuid not null references public.contracts (id) on delete cascade,
  name         text not null,
  phone        text,
  amount       numeric(18, 2) not null default 0,
  currency     text not null default 'UZS' check (currency in ('UZS', 'USD')),
  date         date not null default current_date,
  note         text,
  created_at   timestamptz not null default now()
);
create index if not exists beneficiary_payouts_contract_idx on public.beneficiary_payouts (contract_id);
create index if not exists beneficiary_payouts_user_idx on public.beneficiary_payouts (user_id);

alter table public.beneficiary_payouts enable row level security;
drop policy if exists beneficiary_payouts_owner_all on public.beneficiary_payouts;
create policy beneficiary_payouts_owner_all on public.beneficiary_payouts
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop trigger if exists trg_beneficiary_payouts_audit on public.beneficiary_payouts;
create trigger trg_beneficiary_payouts_audit
  after insert or update or delete on public.beneficiary_payouts
  for each row execute function public.log_activity();
