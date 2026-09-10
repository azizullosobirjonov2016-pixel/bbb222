# Ma'lumotlar bazasi

Postgres (Supabase). Barcha jadvallarda `user_id` va **RLS** —
`user_id = auth.uid()`. Bir foydalanuvchi faqat o'z ma'lumotini ko'radi.

Migratsiyalar `supabase/migrations/` da; hammasi birlashtirilgan holda
`docs/supabase-setup.sql` (SQL Editor'ga bir marta joylashtirish uchun).

## Jadvallar

| Jadval | Vazifa | Muhim ustunlar |
|---|---|---|
| `companies` | **Mening tashkilotlarim** — siz nomidan shartnoma tuziladigan yuridik shaxslar (4 tagacha) | `name, inn_stir, note` |
| `organizations` | **Kontragentlar** (buyurtmachilar) | `name, inn_stir, type(customer/supplier/both)` |
| `contracts` | Shartnomalar. Ikki taraf: `company_id` (biz) + `organization_id` (kontragent) | `number, company_id, organization_id, signed_date, our_role(seller/buyer), total_amount, currency, status, deadline, source(manual/uzex), external_ref/url` |
| `obligations` | Bajarish talablari | `contract_id, description, qty, unit, unit_price, amount, due_date, status(pending/partial/done)` |
| `deliveries` | Topshirilgan ishlar | `contract_id, obligation_id?, date, qty, amount, document_ref` |
| `payments` | To'lovlar | `contract_id, direction(in/out), date, amount, currency, purpose` |
| `costs` | Xarajatlar (foyda/zarar uchun) | `contract_id, category, date, amount, currency` |
| `templates` | Andazalar (2-bosqich) | `name, kind, payload jsonb` |
| `uzex_lots` | Tashqi lot keshi (2-bosqich) | `lot_number, source, url, title, start_price, raw jsonb, contract_id?` |
| `activity_log` | Harakatlar jurnali | `entity_type, entity_id, contract_id, action, summary, diff jsonb` |

Bog'lanishlar: `contracts.organization_id → organizations` (`on delete set null`);
`obligations/deliveries/payments/costs.contract_id → contracts`
(`on delete cascade`). Ya'ni shartnoma o'chsa — barcha bolalari ham o'chadi.

## Trigger'lar (`0003_audit.sql`)

- **`set_updated_at()`** — `organizations, contracts, obligations, templates`
  jadvallarida `updated_at` ni avtomatik yangilaydi.
- **`log_activity()`** (`security definer`) — yuqoridagi 7 ta jadvalda
  `INSERT/UPDATE/DELETE` bo'lganda `activity_log` ga yozuv qo'shadi:
  - `action`: `create` / `update` / `delete`; agar `status` o'zgargan bo'lsa
    `status_change`.
  - `contract_id`: `contracts` uchun — o'zining `id`; bolalar uchun —
    `contract_id`. Shu tufayli shartnoma sahifasidagi "Tarix" tabida
    barcha tegishli o'zgarishlar ko'rinadi.
  - `diff`: `{ old, new }` — to'liq qator holati (shaxsiy hajm uchun yetarli).

`import` / `export` amallari kelgusida ilova tomonidan yoziladi.

## `contract_finance` view (`0004_finance.sql`)

`security_invoker = true` — RLS chaqiruvchi foydalanuvchi bo'yicha ishlaydi.

```
paid_in         = Σ payments(direction='in')
paid_out        = Σ payments(direction='out')
costs_total     = Σ costs
delivered_total = Σ deliveries.amount
revenue  = our_role='seller' ? contract.total_amount : paid_in
spent    = paid_out + costs_total
profit   = revenue - spent
outstanding = our_role='seller' ? total_amount - paid_in : 0
progress = min(delivered_total / total_amount, 1)
```

**Soddalashtirish:** to'lov/xarajat valyutasi shartnoma valyutasidan farq qilsa
ham summalar qo'shiladi. Ilovadagi Dashboard/Moliya sahifalari faqat **UZS**
shartnomalarni jamlaydi (aralashib ketmasligi uchun). Ko'p valyutali aniq
hisob kerak bo'lsa — kelgusida kurs jadvali qo'shiladi.

## Tiplar bilan sinxron

`src/types/db.ts` qo'lda yozilган va sxema bilan mos. SQL o'zgarsa — shu faylni
ham yangilang. (Ixtiyoriy: `supabase gen types typescript` bilan avtomatik
generatsiya.)

## Namuna ma'lumot

Ro'yxatdan o'tgach ilovaning o'zidan bir tashkilot va shartnoma qo'shib ko'ring.
SQL orqali test ma'lumot kerak bo'lsa, `auth.users` dan o'z `id` ingizni oling
va `user_id` sifatida `insert` qiling (RLS SQL Editor'da `postgres` roli uchun
qo'llanmaydi).
