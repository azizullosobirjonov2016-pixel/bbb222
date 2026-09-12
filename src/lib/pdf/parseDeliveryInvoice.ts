/**
 * "Ҳисобварақ-фактура" (didox.uz / roaming.uz uslubidagi topshirish hujjati)
 * PDF'ini tahlil qilish. Shartnoma PDF'idan butunlay boshqa shablon —
 * mustaqil parser sifatida yozilgan. Natija — topshirish (delivery)
 * formasi uchun boshlang'ich qiymatlar; foydalanuvchi ko'rib tasdiqlaydi.
 */
import type { PdfText } from './extractText';

export interface ParsedDeliveryItem {
  unit: string | null;
  qty: number | null;
  unit_price: number | null;
  amount: number | null;
}

export interface ParsedDeliveryInvoice {
  /** Hujjatda ko'rsatilgan shartnoma raqami (joriy shartnoma bilan solishtirish uchun) */
  contract_number: string | null;
  /** Faktura/hisobvaraq raqami — topshirishning "hujjat" maydoniga tushadi */
  document_ref: string | null;
  /** Faktura sanasi (YYYY-MM-DD) — topshirish sanasi sifatida ishlatiladi */
  date: string | null;
  lot_number: string | null;
  total_amount: number | null;
  items: ParsedDeliveryItem[];
  warnings: string[];
  isRecognizedTemplate: boolean;
}

const MONEY = '[0-9]{1,3}(?:[\\s\\u00a0]?[0-9]{3})*[.,][0-9]{2}';

function parseNum(s: string | null | undefined): number | null {
  if (s == null) return null;
  const cleaned = String(s)
    .replace(/\p{White_Space}/gu, '')
    .replace(',', '.')
    .replace(/[^\d.]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseDotDate(raw: string | null): string | null {
  if (!raw) return null;
  const m = raw.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (!day || !month || !year || month > 12 || day > 31) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function pick(re: RegExp, text: string): string | null {
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

export function parseDeliveryInvoice(pdf: PdfText): ParsedDeliveryInvoice {
  const text = pdf.full;
  const warnings: string[] = [];

  const isRecognizedTemplate = /Ҳисобварақ-?\s*фактура/i.test(text);
  if (!isRecognizedTemplate) {
    warnings.push(
      "Bu hisobvaraq-faktura shabloniga o'xshamaydi — maydonlarni diqqat bilan tekshiring.",
    );
  }

  const contract_number = pick(
    /даги\s+([0-9A-Za-z.\-/]+)-сонли\s+шартномага/i,
    text,
  );

  const invoiceHeader = text.match(
    /(\d{1,2}\.\d{1,2}\.\d{4})\s*даги\s+([0-9A-Za-z.\-/]+)-сонли\s*\n?\s*Ҳисобварақ-?\s*фактура/i,
  );
  const date = parseDotDate(invoiceHeader?.[1] ?? null);
  const document_ref = invoiceHeader?.[2]?.trim() ?? null;
  if (!date) warnings.push("Faktura sanasi o'qilmadi — qo'lda kiriting.");

  const lot_number = pick(/Лот\s*ID\s*:?\s*([A-Za-z0-9-]+)/i, text);

  const total_amount = parseNum(
    pick(new RegExp(`Жами\\s+(${MONEY})`, 'i'), text),
  );
  if (!total_amount) warnings.push("Umumiy summa o'qilmadi — qo'lda kiriting.");

  const items: ParsedDeliveryItem[] = [];
  // Ba'zi hujjatlarda o'lchov birligi lotin alifbosida yozilgan (masalan
  // "dona" kirillcha "дона" o'rniga) — ikkalasini ham qabul qilamiz.
  // \b bilan qisqa tokenlar (masalan "kg", "ta") boshqa so'z ichida
  // tasodifan mos kelib qolishining oldi olinadi.
  const rowRe = new RegExp(
    `\\b(дона|dona|шт\\.?|sht\\.?|кг|kg|литр|litr|л|метр|metr|м2|м3|м|соат|soat|кун|kun|компл\\.?|kompl\\.?|та|ta)\\b\\s+` +
      `([0-9]+(?:[.,][0-9]+)?)\\s+(${MONEY})\\s+(${MONEY})`,
    'gi',
  );
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(text))) {
    items.push({
      unit: m[1].trim(),
      qty: parseNum(m[2]),
      unit_price: parseNum(m[3]),
      amount: parseNum(m[4]),
    });
  }
  if (items.length === 0)
    warnings.push("Miqdor/narx qatori o'qilmadi — qo'lda kiriting.");

  return {
    contract_number,
    document_ref,
    date,
    lot_number,
    total_amount,
    items,
    warnings,
    isRecognizedTemplate,
  };
}
