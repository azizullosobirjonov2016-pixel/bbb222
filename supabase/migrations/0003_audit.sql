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
         then '№ ' || (rec ->> 'number') else null end,
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
