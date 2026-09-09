# Arxitektura

## Umumiy ko'rinish

```
Brauzer (React SPA, PWA)
   │  @supabase/supabase-js (HTTPS + JWT)
   ▼
Supabase
   ├─ Auth (email + parol)
   ├─ Postgres + RLS (user_id = auth.uid())
   ├─ Trigger'lar: updated_at, activity_log
   ├─ View: contract_finance (security_invoker)
   └─ Edge Functions: uzex-fetch (2-bosqich)
```

Alohida backend server yo'q — barcha biznes-logika ikki joyda:
1. **Postgres** (cheklovlar, trigger'lar, view) — ma'lumot yaxlitligi va audit.
2. **React** (TanStack Query hook'lari) — UI holati va so'rovlar.

## Frontend qatlamlari

| Qatlam | Papka | Mas'uliyat |
|---|---|---|
| Sahifalar | `src/pages` | Marshrut + kompozitsiya |
| Formalar | `src/components/forms` | Modal CRUD formalar (RHF + Zod) |
| Data hook'lar | `src/api` | `useQuery`/`useMutation`, Supabase so'rovlari, kesh invalidatsiyasi |
| UI | `src/components/ui` | Primitivlar (dizayn tizimi) |
| Umumiy | `src/components/common` | `PageHeader`, `EmptyState`, `ListRow`, ... |
| Yordamchi | `src/lib` | `supabase`, `format` (pul/sana, o'zbekcha), `export` |
| Kontekst | `src/hooks` | `useAuth`, `useTheme` |

## Ma'lumot oqimi (misol: yangi to'lov)

1. `PaymentForm` → `useSavePayment(contractId).mutate(values)`
2. hook `supabase.from('payments').insert({ ...values, contract_id, user_id })`
3. Postgres: RLS tekshiradi → `log_activity` trigger `activity_log` ga yozadi
4. `onSuccess` → tegishli query kalitlari invalidatsiya qilinadi
   (`payments`, `contract`, `contract_finance`, `activity`)
5. TanStack Query qayta yuklaydi → `FinancePanel` va Dashboard yangilanadi

## Autentifikatsiya

- `AuthProvider` (`src/hooks/useAuth.tsx`) — `supabase.auth` sessiyasini kuzatadi.
- Sessiya yo'q → `Login` sahifasi. Bor → `AppLayout` + marshrutlar.
- Supabase kalitlari sozlanmagan → `SetupScreen`.
- Yagona foydalanuvchi (shaxsiy), lekin RLS baribir yoqilgan — kelajakka tayyor
  va ma'lumot himoyasi uchun.

## Mavzu (tema)

CSS o'zgaruvchilari (`src/index.css`) + `class="dark"` almashtirish.
Palitra: 1 asosiy (indigo), neytral off-white/slate fon, 1 urg'u (teal).
Kontrast WCAG AA. `light` / `dark` / `system`.

## PWA

`vite-plugin-pwa` (`generateSW`). `dist/sw.js` statik resurslarni keshlaydi.
Manifest — `vite.config.ts` ichida. Ikona: `public/icon.svg` (SVG, `any` +
`maskable`). PNG ikonalar kerak bo'lsa:
`npx @vite-pwa/assets-generator --preset minimal public/icon.svg`.

## Nega shunday

Batafsil: [`DECISIONS.md`](DECISIONS.md).
