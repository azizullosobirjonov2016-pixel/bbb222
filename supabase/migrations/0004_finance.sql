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
