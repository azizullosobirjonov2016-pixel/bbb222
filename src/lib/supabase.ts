import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

/** Supabase kalitlari haqiqiy qiymatga ega ekanini tekshiradi */
export const isSupabaseConfigured =
  /^https:\/\/.+\.supabase\.co/.test(url) &&
  anonKey.length > 20 &&
  !url.includes('YOUR-PROJECT') &&
  !anonKey.includes('YOUR-ANON');

// Konfiguratsiya bo'lmasa ham import xatoga olib kelmasin — placeholder bilan yaratamiz.
export const supabase = createClient(
  isSupabaseConfigured ? url : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? anonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export const UZEX_FETCH_URL = import.meta.env.VITE_UZEX_FETCH_URL ?? '';
