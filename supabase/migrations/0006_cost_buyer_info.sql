-- Birja — xarajatga xarid ma'lumotlari (kimdan/kim xarid qildi)
-- 0006_cost_buyer_info.sql
--
-- Topshirish uchun tannarxni kiritishda "olgan inson"ning ismi va
-- telefon raqamini ham qayd etish uchun.

alter table public.costs
  add column if not exists buyer_name text,
  add column if not exists buyer_phone text;
