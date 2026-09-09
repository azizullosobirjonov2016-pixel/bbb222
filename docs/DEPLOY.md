# Joylashtirish (Deploy)

## 1. Supabase (baza)

Allaqachon `README.md` bo'yicha loyiha ochilgan bo'lsa — qo'shimcha ish yo'q.
Bu sizning "production" bazangiz.

- Migratsiya o'zgarsa: yangi `supabase/migrations/000X_*.sql` yozing va SQL
  Editor'da ishga tushiring. (Yoki Supabase CLI: `supabase db push`.)
- Zaxira: Supabase avtomatik kunlik backup (bepul tarifda cheklangan).
  Qo'shimcha: ilova ichidagi **Sozlamalar → JSON eksport**.

## 2. Frontend — Vercel (tavsiya, bepul)

1. Kodni GitHub'ga yuklang (pastga qarang).
2. [vercel.com](https://vercel.com) → **Add New → Project** → repo'ni tanlang.
3. Framework: **Vite** (avtomatik aniqlanadi). Build: `npm run build`,
   Output: `dist`.
4. **Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. **Deploy**. Har `git push` da avtomatik qayta quriladi.

SPA marshrutlash uchun `vercel.json` (ixtiyoriy, ag'ar 404 bo'lsa):

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

### Muqobil: Netlify / Cloudflare Pages
Xuddi shu: build `npm run build`, publish `dist`, env o'zgaruvchilar o'sha.
Netlify uchun `public/_redirects` ga: `/*  /index.html  200`.

## 3. GitHub'ga yuklash

`gh` CLI o'rnatilmagan, shuning uchun qo'lda:

1. github.com → **New repository** → nomi `birja` → **Private** →
   *README, .gitignore, license QO'SHMANG* (bo'sh repo) → Create.
2. Terminalda (loyiha papkasida):

```bash
git remote add origin https://github.com/<foydalanuvchi>/birja.git
git push -u origin main
```

Keyingi safar shunchaki `git push`.

## 4. Edge Function (2-bosqich)

```bash
npm i -g supabase
supabase login
supabase link --project-ref <loyiha-ref>
supabase functions deploy uzex-fetch
```

So'ng `.env.local` (va Vercel env) ga:
`VITE_UZEX_FETCH_URL=https://<ref>.supabase.co/functions/v1/uzex-fetch`
