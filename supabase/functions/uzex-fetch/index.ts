// Birja — UzEX lot ma'lumotini olish (Edge Function skeleti, 2-bosqich)
//
// Maqsad: brauzer CORS cheklovini chetlab o'tib, server tomonda
// xarid.uzex.uz / uzex.uz dan lot ma'lumotini olib, normalizatsiya qilish.
//
// Deploy:  supabase functions deploy uzex-fetch
// Chaqirish (frontend):  POST { lotNumber: "8037", source: "xarid" }
//
// DIQQAT: xarid.uzex.uz rasmiy ochiq API bermaydi. Quyidagi endpointlar
// Network paneli orqali aniqlanishi va tekshirilishi kerak. Ishlamasa,
// ilova "qo'lda import" rejimiga tushadi (docs/INTEGRATIONS.md).

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface NormalizedLot {
  lot_number: string;
  source: string;
  url: string | null;
  title: string | null;
  customer_name: string | null;
  start_price: number | null;
  currency: 'UZS' | 'USD' | null;
  status: string | null;
  deadline: string | null;
  raw: unknown;
}

async function fetchXaridLot(lotNumber: string): Promise<NormalizedLot> {
  // TODO: haqiqiy endpointni tasdiqlang. Ehtimoliy variantlar:
  //   https://xarid.uzex.uz/api/... (auksion detali)
  // Hozircha faqat public sahifa URL'ini qaytaramiz.
  const url = `https://xarid.uzex.uz/auction/detail/${encodeURIComponent(lotNumber)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 BirjaBot/0.1' },
  });
  const html = await res.text();
  const title =
    html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() ?? null;

  return {
    lot_number: lotNumber,
    source: 'xarid.uzex.uz',
    url,
    title,
    customer_name: null,
    start_price: null,
    currency: null,
    status: null,
    deadline: null,
    raw: { fetchedHtmlLength: html.length },
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }
  try {
    const { lotNumber } = await req.json();
    if (!lotNumber) {
      return new Response(
        JSON.stringify({ error: "lotNumber majburiy" }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }
    const lot = await fetchXaridLot(String(lotNumber));
    return new Response(JSON.stringify({ lot }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'xatolik' }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  }
});
