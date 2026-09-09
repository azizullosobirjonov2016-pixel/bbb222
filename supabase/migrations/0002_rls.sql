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
