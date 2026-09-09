# Birja

Shaxsiy web-ilova: **tashkilotlar bilan tuzilgan shartnomalar**, ularning
**bajarish talablari**, **topshirilgan ishlar**, hamda har bir shartnoma va
umumiy **foyda/zarar** hisob-kitobi. Kelgusida — UzEX (`xarid.uzex.uz`) lotlari
bilan integratsiya.

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Supabase (Postgres + Auth + RLS)
- **Platforma:** responsive web + PWA (telefon va desktop)
- **Til:** o'zbekcha (lotin)

---

## 1-bosqich (tayyor)

| Modul | Holati |
|---|---|
| Autentifikatsiya (email + parol) | ✅ |
| Tashkilotlar — CRUD | ✅ |
| Shartnomalar — CRUD, filtr, status | ✅ |
| Bajarish talablari (obligations) | ✅ |
| Topshirishlar (deliveries) | ✅ |
| To'lovlar va xarajatlar | ✅ |
| Foyda/zarar — shartnoma va umumiy | ✅ |
| Boshqaruv paneli + diagrammalar | ✅ |
| Harakatlar jurnali (audit, avtomatik) | ✅ |
| Ma'lumot eksporti (JSON / CSV) | ✅ |
| Light / Dark rejim, PWA | ✅ |

## 2-bosqich (rejalashtirilgan)

- Andazalar (`templates`) — andazadan shartnoma yaratish
- UzEX integratsiyasi — lot ma'lumotini olish va shartnomaga bog'lash
  (baza jadvali va Edge Function skeleti tayyor — [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md))

---

## Ishga tushirish

### 1. Talablar
- Node.js 20+ (`node -v`)
- Bepul [Supabase](https://supabase.com) akkaunti

### 2. Supabase loyihasini yarating
1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Loyiha ochilgach: **SQL Editor → New query**, so'ng
   [`docs/supabase-setup.sql`](docs/supabase-setup.sql) faylining butun matnini
   joylashtiring va **Run** bosing. (Bu barcha jadval, RLS, trigger va
   `contract_finance` view'ni yaratadi.)
3. **Project Settings → API** bo'limidan `Project URL` va `anon public` kalitini
   oling.
4. **Authentication → Providers → Email** yoqilganiga ishonch hosil qiling.
   Tez sinash uchun **Authentication → Sign In / Providers → Confirm email** ni
   vaqtincha o'chirib qo'yishingiz mumkin.

### 3. Muhit o'zgaruvchilari
`.env.local` faylini oching va qiymatlarni qo'ying:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 4. O'rnatish va ishga tushirish
```bash
npm install
npm run dev
```
Brauzerda: http://localhost:5173

Birinchi kirishda **Ro'yxatdan o'ting** (email + parol) — bu sizning yagona
akkauntingiz bo'ladi.

---

## Skriptlar

| Buyruq | Vazifa |
|---|---|
| `npm run dev` | Dev server (Vite) |
| `npm run build` | Type-check + ishlab chiqarish uchun qurish (`dist/`) |
| `npm run preview` | `dist/` ni lokal ko'rish |
| `npm run typecheck` | Faqat TypeScript tekshiruvi |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

---

## Loyiha tuzilmasi

```
src/
  api/            TanStack Query hook'lari (Supabase so'rovlari)
  components/
    ui/           Asosiy UI primitivlari (button, input, dialog, ...)
    common/       Umumiy komponentlar (PageHeader, EmptyState, ...)
    forms/        Modal formalar (tashkilot, shartnoma, to'lov, ...)
    layout/       AppLayout (sidebar + mobil bottom nav)
    contract/     FinancePanel
  hooks/          useAuth, useTheme
  i18n/           uz.ts — barcha matnlar
  lib/            supabase, format (pul/sana), export
  pages/          Sahifalar (marshrutlar bo'yicha)
  types/db.ts     Baza tiplari (SQL bilan sinxron)
supabase/
  migrations/     0001..0004 SQL migratsiyalari
  functions/      uzex-fetch Edge Function (2-bosqich)
docs/             Hujjatlar
```

---

## Deploy

Qisqacha: frontend → **Vercel**, baza → **Supabase**.
To'liq yo'riqnoma: [`docs/DEPLOY.md`](docs/DEPLOY.md).

---

## Hujjatlar

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — arxitektura
- [`docs/DATABASE.md`](docs/DATABASE.md) — sxema, RLS, moliyaviy formula
- [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md) — UzEX integratsiyasi va cheklovlar
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — joylashtirish
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — texnik qarorlar
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md) — o'zgarishlar tarixi
