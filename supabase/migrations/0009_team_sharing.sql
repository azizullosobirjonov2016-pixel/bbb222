-- Birja — jamoa bo'lib ishlash: bir nechta login, umumiy ma'lumotlar
-- 0009_team_sharing.sql
--
-- Muammo: har bir Supabase Auth foydalanuvchisi alohida "user_id" bilan
-- ajratilgan edi (RLS: user_id = auth.uid()). Ro'yxatdan o'tish ochiq
-- bo'lgani uchun, oddiy "hammaga ruxsat" berish xavfli bo'lardi — istalgan
-- notanish odam ro'yxatdan o'tib, butun biznes ma'lumotlariga kirishi
-- mumkin edi.
--
-- Yechim: team_members — qo'lda tasdiqlangan a'zolar ro'yxati. Faqat shu
-- ro'yxatdagi foydalanuvchilar umumiy ma'lumotlarni ko'radi/o'zgartiradi.
-- O'chirish faqat role='admin' bo'lganlarga ruxsat etiladi.
--
-- Yangi xodimni qo'shish (u avval ro'yxatdan o'tgandan keyin):
--   insert into public.team_members (user_id, email, role)
--   select id, email, 'member' from auth.users where email = 'xodim@example.com';

create table if not exists public.team_members (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  email       text,
  role        text not null default 'member' check (role in ('admin', 'member')),
  added_by    uuid references auth.users (id),
  created_at  timestamptz not null default now()
);

-- Joriy ma'lumotlar egasini avtomatik admin qilib qo'shamiz (mavjud
-- shartnomalar/tashkilotlar kimning user_id'si bo'lsa, o'sha admin bo'ladi).
-- Exception handler bilan o'ralgan — skript qayta ishga tushirilsa ham
-- (masalan, birinchi urinish yarim yo'lda to'xtagan bo'lsa) xato bermaydi.
do $$
begin
  insert into public.team_members (user_id, email, role)
  select distinct c.user_id, u.email, 'admin'
  from public.contracts c
  join auth.users u on u.id = c.user_id
  union
  select distinct o.user_id, u.email, 'admin'
  from public.organizations o
  join auth.users u on u.id = o.user_id
  union
  select distinct co.user_id, u.email, 'admin'
  from public.companies co
  join auth.users u on u.id = co.user_id
  on conflict (user_id) do nothing;
exception when unique_violation then
  null;
end $$;

-- Xavfsizlik: agar hech kim admin sifatida topilmasa (masalan, hali
-- shartnoma/tashkilot/kompaniya kiritilmagan bo'sh akkaunt), migratsiyani
-- shu yerda to'xtatamiz — aks holda hamma (shu jumladan haqiqiy egasi)
-- ma'lumotlardan mahrum bo'lib qolardi.
do $$
begin
  if not exists (select 1 from public.team_members) then
    raise exception
      'team_members bo''sh qoldi — avval kamida bitta shartnoma/tashkilot/kompaniya bo''lgan foydalanuvchini qo''lda qo''shing: insert into public.team_members (user_id, email, role) select id, email, ''admin'' from auth.users where email = ''sizning@emailingiz'';';
  end if;
end $$;

alter table public.team_members enable row level security;

drop policy if exists team_members_select on public.team_members;
create policy team_members_select on public.team_members
  for select
  using (exists (
    select 1 from public.team_members tm where tm.user_id = auth.uid()
  ));

drop policy if exists team_members_admin_write on public.team_members;
create policy team_members_admin_write on public.team_members
  for all
  using (exists (
    select 1 from public.team_members tm
    where tm.user_id = auth.uid() and tm.role = 'admin'
  ))
  with check (exists (
    select 1 from public.team_members tm
    where tm.user_id = auth.uid() and tm.role = 'admin'
  ));

-- ===== Umumiy ma'lumot jadvallari: eski "faqat o'zim" siyosati o'rniga
--       "jamoa a'zosi" siyosati (o'chirish — faqat admin) =====
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'companies', 'organizations', 'contracts', 'obligations', 'deliveries',
    'payments', 'costs', 'beneficiary_payouts', 'templates', 'uzex_lots'
  ]
  loop
    execute format('drop policy if exists %I_owner_all on public.%I;', tbl, tbl);
    execute format('drop policy if exists %I_team_select on public.%I;', tbl, tbl);
    execute format('drop policy if exists %I_team_insert on public.%I;', tbl, tbl);
    execute format('drop policy if exists %I_team_update on public.%I;', tbl, tbl);
    execute format('drop policy if exists %I_team_delete on public.%I;', tbl, tbl);

    execute format($p$
      create policy %I_team_select on public.%I
        for select
        using (exists (
          select 1 from public.team_members tm where tm.user_id = auth.uid()
        ));
    $p$, tbl, tbl);

    execute format($p$
      create policy %I_team_insert on public.%I
        for insert
        with check (exists (
          select 1 from public.team_members tm where tm.user_id = auth.uid()
        ));
    $p$, tbl, tbl);

    execute format($p$
      create policy %I_team_update on public.%I
        for update
        using (exists (
          select 1 from public.team_members tm where tm.user_id = auth.uid()
        ))
        with check (exists (
          select 1 from public.team_members tm where tm.user_id = auth.uid()
        ));
    $p$, tbl, tbl);

    execute format($p$
      create policy %I_team_delete on public.%I
        for delete
        using (exists (
          select 1 from public.team_members tm
          where tm.user_id = auth.uid() and tm.role = 'admin'
        ));
    $p$, tbl, tbl);
  end loop;
end $$;

-- ===== activity_log: butun jamoaga umumiy (faqat o'qish) =====
drop policy if exists activity_owner_select on public.activity_log;
drop policy if exists activity_team_select on public.activity_log;
create policy activity_team_select on public.activity_log
  for select
  using (exists (
    select 1 from public.team_members tm where tm.user_id = auth.uid()
  ));
