# UzEX integratsiyasi (`xarid.uzex.uz` va shu kabilar)

> Holati: **2-bosqich.** Baza jadvali (`uzex_lots`) va Edge Function skeleti
> (`supabase/functions/uzex-fetch/`) tayyor; UI hali ulanmagan.

## Muammo

`xarid.uzex.uz` — Angular SPA. **Rasmiy, hujjatlashtirilgan ochiq API yo'q.**
Sahifa ma'lumotni ichki (nomsiz) JSON endpoint'lardan yuklaydi. Bundan tashqari:

- Brauzerdan to'g'ridan-to'g'ri so'rov — **CORS** bilan bloklanadi.
- Endpoint'lar va javob strukturasi rasman kafolatlanmagan, o'zgarishi mumkin.
- UzEX manbasidan foydalanilганda `www.uzex.uz` ga havola ko'rsatish talab etiladi.

## Yechim — pluggable connector + server proksi

```
Frontend  ──POST {lotNumber, source}──►  Edge Function `uzex-fetch`
                                             │  (Deno, server-side fetch — CORS yo'q)
                                             ▼
                                     xarid.uzex.uz / uzex.uz
                                             │
                            normalize → NormalizedLot → uzex_lots (kesh)
```

- **Connector interfeysi** (`src/integrations/` — 2-bosqichda yaratiladi):
  `fetchByNumber(lotNumber)`, `fetchList(params)`, `normalize(raw)`.
  Har bir manba (xarid, birja savdolari, ...) alohida connector.
- **`uzex-fetch` Edge Function** — hozircha faqat lot sahifa URL'ini va
  `<title>` ni qaytaradi. Haqiqiy endpoint'lar quyidagicha aniqlanadi:
  1. `xarid.uzex.uz/auction/list` ni brauzerda oching → DevTools → Network → XHR.
  2. `application/json` qaytaradigan so'rovlarni belgilang (URL, query, javob shakli).
  3. `fetchXaridLot()` ichida shu endpoint'ni chaqiring va maydonlarni
     `NormalizedLot` ga moslang.

## Fallback (doim ishlaydi)

Connector ishlamasa ilova **qo'lda import** rejimida:

- Shartnoma formasida `Manba = UzEX`, `Tashqi raqam (lot)` va `Havola` maydonlari
  (bu 1-bosqichda ham bor).
- 2-bosqichda `/uzex` sahifasi: lot URL/raqamini yoki CSV/JSON joylashtirish,
  `uzex_lots` ga saqlash, keyin shartnomaga bog'lash.

## Huquqiy eslatma

Ochiq ma'lumotdan shaxsiy hisobyuritish uchun foydalaniladi. Ommaviy joylashtirish
yoki qayta tarqatishdan oldin UzEX foydalanish shartlarini tekshiring va manbaga
havola qoldiring.
