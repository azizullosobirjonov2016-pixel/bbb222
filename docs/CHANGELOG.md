# O'zgarishlar tarixi

Format: [Keep a Changelog](https://keepachangelog.com/), sana — YYYY-MM-DD.

## [0.3.0] — 2026-09-10

### Qo'shildi
- **PDF dan shartnoma import** (`/contracts/import`) — xarid.uzex.uz /
  "Milliy do'kon" davlat xaridlari shartnoma PDF'ini yuklab, barcha maydonlar
  avtomatik to'ldiriladi; foydalanuvchi ko'rib-tasdiqlab saqlaydi.
  - `src/lib/pdf/extractText.ts` — brauzerда `pdf.js` orqali matn ajratish
    (fayl hech qayoqqa yuborilmaydi).
  - `src/lib/pdf/parseUzexContract.ts` — shablon-parser (anchor + regex).
  - `src/api/importContract.ts` — company/kontragent'ni STIR bo'yicha topadi
    yoki yaratadi, shartnoma + bajarish talabini yozadi (`source = 'uzex'`).
  - `scripts/test-parse.ts` — parserни haqiqiy PDF'da sinash uchun.
- "Shartnomalar" sahifasida **PDF dan import** tugmasi.
- Bog'liqliklar: `pdfjs-dist`; dev: `tsx`.

## [0.2.0] — 2026-09-10

### Qo'shildi
- **Mening tashkilotlarim** (`companies`) — foydalanuvchining o'z yuridik shaxslari
  (4 tagacha). Har shartnomada endi ikki taraf: `company_id` (biz, yetkazib
  beruvchi) + `organization_id` (kontragent/buyurtmachi).
- `/companies` sahifasi — CRUD.
- Shartnoma formasi: "Mening tashkilotim" tanlash; ro'yxat va detalda ikkala
  taraf ko'rsatiladi ("Bizniki → Kontragent").
- Moliya sahifasi: "Mening tashkilotlarim" bo'yicha filtr va alohida kesim
  (chart).
- Migratsiya `0005_companies.sql` (mavjud bazaga qo'shimcha; `contract_finance`
  view'ga `company_id` qo'shildi).
- Atamalar aniqlashtirildi: "Tashkilotlar" → **Kontragentlar**.

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
