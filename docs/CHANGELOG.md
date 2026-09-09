# O'zgarishlar tarixi

Format: [Keep a Changelog](https://keepachangelog.com/), sana — YYYY-MM-DD.

## [0.1.0] — 2026-09-09

### Qo'shildi (1-bosqich, A–D)
- Loyiha skeleti: Vite + React 18 + TypeScript + Tailwind CSS, PWA, light/dark.
- Autentifikatsiya: email + parol (Supabase Auth), `SetupScreen` sozlanmagan holat uchun.
- Supabase migratsiyalari `0001`–`0004`: jadvallar, indekslar, RLS,
  `updated_at` va `activity_log` trigger'lari, `contract_finance` view.
- Modullar:
  - **Tashkilotlar** — CRUD, qidiruv, shartnomalar soni.
  - **Shartnomalar** — CRUD, status/qidiruv filtri, ro'yxatda foyda/zarar.
  - **Bajarish talablari** (obligations) — miqdor × narx, status, muddat.
  - **Topshirishlar** (deliveries) — shartnoma bo'yicha va umumiy ro'yxat.
  - **To'lovlar** (kirim/chiqim) va **Xarajatlar** (turkumli).
  - **Foyda/Zarar** — shartnoma paneli + `/finance` sahifasi (Recharts).
  - **Boshqaruv paneli** — KPI, so'nggi harakatlar, tez qo'shish.
  - **Harakatlar jurnali** — avtomatik audit, filtr.
  - **Sozlamalar** — tema, JSON/CSV eksport, ulanish holati.
- Hujjatlar: `README`, `ARCHITECTURE`, `DATABASE`, `INTEGRATIONS`, `DEPLOY`,
  `DECISIONS`, `docs/supabase-setup.sql`.
- UzEX integratsiyasi uchun `uzex-fetch` Edge Function skeleti (2-bosqich).

### Ma'lum cheklovlar
- `templates` va `/uzex` UI — 2-bosqichda.
- `contract_finance` valyutani aralashtirib qo'shadi; Dashboard/Moliya faqat UZS.
- PWA ikonasi SVG (PNG generatsiya qilinmagan).
