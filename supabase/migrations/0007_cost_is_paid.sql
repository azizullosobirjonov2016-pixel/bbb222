-- Birja — xarajat to'landi/to'lanmadi holati
-- 0007_cost_is_paid.sql

alter table public.costs
  add column if not exists is_paid boolean not null default false;
