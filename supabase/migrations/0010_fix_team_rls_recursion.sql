-- Birja — team_members RLS'dagi cheksiz rekursiyani tuzatish
-- 0010_fix_team_rls_recursion.sql
--
-- Muammo: team_members'ning o'z siyosati team_members'ni so'rar edi
-- ("exists (select 1 from team_members ...)"), bu esa RLS tekshiruvini
-- cheksiz rekursiyaga olib keldi (Postgres xatosi 42P17). Yechim:
-- SECURITY DEFINER funksiyalar — ular RLS'ni chetlab o'tib, xavfsiz
-- tekshiradi.

create or replace function public.is_team_member(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.team_members where user_id = uid
  );
$$;

create or replace function public.is_team_admin(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.team_members where user_id = uid and role = 'admin'
  );
$$;

-- ===== team_members'ning o'z siyosatlari =====
drop policy if exists team_members_select on public.team_members;
create policy team_members_select on public.team_members
  for select
  using (public.is_team_member(auth.uid()));

drop policy if exists team_members_admin_write on public.team_members;
create policy team_members_admin_write on public.team_members
  for all
  using (public.is_team_admin(auth.uid()))
  with check (public.is_team_admin(auth.uid()));

-- ===== Umumiy ma'lumot jadvallari =====
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'companies', 'organizations', 'contracts', 'obligations', 'deliveries',
    'payments', 'costs', 'beneficiary_payouts', 'templates', 'uzex_lots'
  ]
  loop
    execute format('drop policy if exists %I_team_select on public.%I;', tbl, tbl);
    execute format('drop policy if exists %I_team_insert on public.%I;', tbl, tbl);
    execute format('drop policy if exists %I_team_update on public.%I;', tbl, tbl);
    execute format('drop policy if exists %I_team_delete on public.%I;', tbl, tbl);

    execute format(
      'create policy %I_team_select on public.%I for select using (public.is_team_member(auth.uid()));',
      tbl, tbl
    );
    execute format(
      'create policy %I_team_insert on public.%I for insert with check (public.is_team_member(auth.uid()));',
      tbl, tbl
    );
    execute format(
      'create policy %I_team_update on public.%I for update using (public.is_team_member(auth.uid())) with check (public.is_team_member(auth.uid()));',
      tbl, tbl
    );
    execute format(
      'create policy %I_team_delete on public.%I for delete using (public.is_team_admin(auth.uid()));',
      tbl, tbl
    );
  end loop;
end $$;

-- ===== activity_log =====
drop policy if exists activity_team_select on public.activity_log;
create policy activity_team_select on public.activity_log
  for select
  using (public.is_team_member(auth.uid()));
