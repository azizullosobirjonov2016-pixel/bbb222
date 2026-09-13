-- Birja — jamoa a'zolarini ilova ichidan boshqarish (SQL Editor'siz)
-- 0011_team_management_rpc.sql
--
-- Bu funksiyalar orqali admin ilovaning o'zidan turib:
--   - yangi a'zo qo'sha oladi (ular avval saytda ro'yxatdan o'tgan bo'lsa)
--   - a'zoni o'chira oladi
--   - a'zo rolini o'zgartira oladi
-- Har biri ichida admin ekanligi tekshiriladi (security definer orqali,
-- RLS'ni chetlab o'tib, lekin ruxsatni o'zi qo'lda tekshiradi).

create or replace function public.add_team_member(
  member_email text,
  member_role text default 'member'
)
returns public.team_members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid;
  v_row  public.team_members;
begin
  if not public.is_team_admin(auth.uid()) then
    raise exception 'Faqat administrator yangi a''zo qo''sha oladi.';
  end if;
  if member_role not in ('admin', 'member') then
    raise exception 'Noto''g''ri rol: %', member_role;
  end if;

  select id into v_uid from auth.users where email = member_email;
  if v_uid is null then
    raise exception
      'Bunday email bilan ro''yxatdan o''tgan foydalanuvchi topilmadi. Avval u saytda ro''yxatdan o''tishi kerak.';
  end if;

  insert into public.team_members (user_id, email, role, added_by)
  values (v_uid, member_email, member_role, auth.uid())
  on conflict (user_id) do update set role = excluded.role
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.add_team_member(text, text) to authenticated;

create or replace function public.remove_team_member(member_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_team_admin(auth.uid()) then
    raise exception 'Faqat administrator a''zoni o''chira oladi.';
  end if;
  if member_user_id = auth.uid() then
    raise exception 'O''zingizni jamoadan o''chira olmaysiz.';
  end if;
  delete from public.team_members where user_id = member_user_id;
end;
$$;

grant execute on function public.remove_team_member(uuid) to authenticated;

create or replace function public.set_team_member_role(
  member_user_id uuid,
  new_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_team_admin(auth.uid()) then
    raise exception 'Faqat administrator rolni o''zgartira oladi.';
  end if;
  if new_role not in ('admin', 'member') then
    raise exception 'Noto''g''ri rol: %', new_role;
  end if;
  update public.team_members set role = new_role where user_id = member_user_id;
end;
$$;

grant execute on function public.set_team_member_role(uuid, text) to authenticated;
