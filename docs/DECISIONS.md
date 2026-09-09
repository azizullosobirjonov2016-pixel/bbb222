# Texnik qarorlar

## Joylashuv: lokal disk + GitHub (Google Drive emas)
Loyiha dastlab `G:\Мой диск\Birja` (Google Drive) da edi. `npm install` u yerda
`EPERM`/`EBADF` xatolari bilan uzildi — Google Drive virtual FS `node_modules`
(o'n minglab mayda fayl) bilan ishlay olmaydi. Yechim: kod `C:\dev\Birja` da,
zaxira/sinxron uchun maxfiy GitHub repo.

## Stack: Vite + React + TS + Tailwind
Keng qo'llanadigan, bepul deploy, tez HMR. shadcn/ui CLI o'rniga kichik qo'lda
yozilgan primitivlar (`src/components/ui`) — kam bog'liqlik, to'liq nazorat.

## Supabase (bulut)
Bir foydalanuvchi telefondan ham, kompyuterdan ham kirishi kerak → bulut baza
kerak. Supabase: Postgres + Auth + RLS + bepul tarif. Lokal Docker faqat
oflayn ishlab chiqish uchun (hozir shart emas).

## Auth: email + parol, lekin RLS baribir yoqilgan
Shaxsiy ilova, bir akkaunt. Shunga qaramay har jadvalda
`user_id = auth.uid()` RLS — ma'lumot himoyasi va kelajakda ko'p foydalanuvchiga
o'tish uchun.

## Moliyaviy model: `our_role` (seller/buyer)
Asosan sotuvchi. `revenue = seller ? contract_value : paid_in`,
`spent = paid_out + costs`, `profit = revenue - spent`. `buyer` opsiya sifatida
qoldirilgan.

## Audit: Postgres trigger (ilova emas)
`log_activity()` trigger 7 jadvalda ishlaydi → hech qanday yozuv o'tkazib
yuborilmaydi, hatto SQL orqali o'zgartirilса ham. `contract_id` ustuni bilan
bolalar o'zgarishi ham shartnoma sahifasida ko'rinadi.

## `contract_finance` — view (jadval yoki RPC emas)
Har safar joriy holatdan hisoblanadi, sinxronlash muammosi yo'q.
`security_invoker = true` — RLS chaqiruvchi bo'yicha (aks holda view egasi
huquqi bilan ishlab, ma'lumot chиqib ketardi).

## Til: faqat o'zbekcha, lekin markazlashtirilган
Barcha matn `src/i18n/uz.ts` da. Ruscha qo'shish = `ru.ts` nusxa + tanlash.
Komponentlarda qattiq matn yozilmaydi.

## Andaza + UzEX — 2-bosqich
Foydalanuvchi "avval ishlaydigan yadro (A–D)" ni tanladi. Baza sxemasi to'liq
(kelajakda migratsiya kam bo'lsin), lekin UI faqat A–D.

## PWA ikonasi: SVG
Binar PNG generatsiya qilish uchun vosita yo'q edi. `icon.svg` (`sizes: any`,
`purpose: any + maskable`) zamonaviy brauzerlarda o'rnatishга yetarli. PNG kerak
bo'lsa `@vite-pwa/assets-generator`.

## supabase-js: Database generiksiz
Qo'lda yozilgan `Database` tipi supabase-js generic cheklovlariga to'liq mos
kelmади (`never` xatolari). Yechim: klient generiksiz, natijalar ilova
tiplariga (`src/types/db.ts`) aniq `cast` qilinadi (`unwrap<T>`).
