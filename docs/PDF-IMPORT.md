# PDF dan shartnoma import

`/contracts/import` — xarid.uzex.uz / "Milliy do'kon" davlat xaridlari
shartnomasi PDF'ini yuklab, ma'lumotlarni avtomatik kiritish.

## Oqim

1. Foydalanuvchi PDF tanlaydi.
2. `extractText.ts` — brauzerда `pdf.js` matn qatlamini ajratadi
   (y-koordinata bo'yicha qatorlarga guruhlaydi). **Fayl serverga
   yuborilmaydi.**
3. `parseUzexContract.ts` — anchor + regex bilan maydonlarni tanib oladi.
4. Ko'rib-tasdiqlash formasi to'ldiriladi; foydalanuvchi tekshiradi/tuzatadi.
5. `importContract.ts`:
   - **Mening tashkilotim** (Ijrochi) — STIR bo'yicha mavjud `companies`
     ichidan qidiradi; topilmasa yangi yaratadi.
   - **Kontragent** (Buyurtmachi) — xuddi shunday `organizations`
     (`type = 'customer'`).
   - `contracts` yozuvi (`source = 'uzex'`, `our_role = 'seller'`,
     `external_ref = lot №`).
   - `obligations` — PDF jadvalidagi qatorlar.

## Nima ajratiladi

| Maydon | Manba (anchor) |
|---|---|
| Shartnoma № | `ШАРТНОМА №` |
| Sana | `(шартнома тузилган сана)` |
| Tuzilgan joy | `(шартнома тузилган жой)` |
| Lot № | `лот №` |
| Portal | `порталида (...)` |
| Summa | `Шартноманинг умумий суммаси` |
| Predmet | `Техник параметрлар ...` |
| Boshlang'ich / kelishilgan narx | jadval qatori: `<birlik> <soni> <narx> <narx>` |
| Yetkazish hududi | `Етказиб бериш ҳудудлари ва туманлари` |
| Kafolat, peня | 4-bo'lim |
| Ijrochi / Buyurtmachi (nomi, STIR, tel, manzil, bank) | 8-bo'lim (ikki ustunli) |

## Cheklovlar

- Faqat **matn qatlami bor** PDF (skaner emas). Skaner uchun OCR kerak.
- Shablon xarid.uzex.uz formatiga bog'liq. Boshqa ko'rinishда ogohlantirish
  chiqadi va maydonlar bo'sh/noto'g'ri bo'lishi mumkin — shu sabab har doim
  **ko'rib-tasdiqlash** bosqichi bor.
- Ko'p qatorli jadvallar: hozircha 1-qator olinadi; qolganlarini qo'lda
  qo'shish mumkin. (Kelajakда AI-parser — CHANGELOG "keyingi bosqich".)

## Parserни sinash

```
npx tsx scripts/test-parse.ts "<yo'l>/shartnoma.pdf"
```
Ajratilgan matn + `ParsedContract` obyektini chiqaradi. Yangi shablon
qo'shganda shu bilan tekshiring.
