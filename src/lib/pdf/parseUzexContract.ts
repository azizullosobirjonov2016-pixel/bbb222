/**
 * xarid.uzex.uz / "Milliy do'kon" davlat xaridlari shartnomasi PDF'ini tahlil qilish.
 * Shablon qat'iy bo'lgani uchun anchor + regex yetarli.
 * Natija — ko'rib-tasdiqlash formasi uchun boshlang'ich qiymatlar.
 */
import type { PdfText } from './extractText';

export interface ParsedParty {
  name: string | null;
  stir: string | null;
  phone: string | null;
  address: string | null;
  bank: string | null;
  account: string | null;
  mfo: string | null;
}

export interface ParsedItem {
  name: string | null;
  unit: string | null;
  qty: number | null;
  start_price: number | null;
  agreed_price: number | null;
  amount: number | null;
  specs: string | null;
}

export interface ParsedContract {
  number: string | null;
  signed_date: string | null; // YYYY-MM-DD
  place: string | null;
  lot_number: string | null;
  portal: string | null;
  total_amount: number | null;
  currency: 'UZS' | 'USD';
  subject: string | null;
  delivery_region: string | null;
  warranty: string | null;
  penalty_delivery: string | null;
  penalty_payment: string | null;
  executor: ParsedParty; // "Ijrochi" = biz (mening tashkilotim)
  customer: ParsedParty; // "Buyurtmachi" = kontragent
  items: ParsedItem[];
  warnings: string[];
  isUzexTemplate: boolean;
}

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  январь: 1, января: 1, февраль: 2, февраля: 2, март: 3, марта: 3,
  апрель: 4, апреля: 4, мая: 5, июнь: 6, июня: 6, июль: 7, июля: 7,
  август: 8, августа: 8, сентябрь: 9, сентября: 9, октябрь: 10, октября: 10,
  ноябрь: 11, ноября: 11, декабрь: 12, декабря: 12,
  yanvar: 1, fevral: 2, mart: 3, aprel: 4, iyun: 6, iyul: 7,
  avgust: 8, sentabr: 9, sentyabr: 9, oktabr: 10, noyabr: 11, dekabr: 12,
};

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

function parseDate(raw: string | null): string | null {
  if (!raw) return null;
  const m = raw
    .trim()
    .match(/(\d{1,2})[\s.]+([A-Za-zА-Яа-яЁёʼ']+|\d{1,2})[\s.]+(\d{4})/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = /^\d+$/.test(m[2])
    ? Number(m[2])
    : (MONTHS[m[2].toLowerCase()] ?? NaN);
  const year = Number(m[3]);
  if (!day || !month || !year || month > 12 || day > 31) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function pick(re: RegExp, text: string): string | null {
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

const EMPTY_PARTY: ParsedParty = {
  name: null, stir: null, phone: null, address: null,
  bank: null, account: null, mfo: null,
};

/** "Label: <chap>   Label: <o'ng>" satridan chap/o'ng qiymatni ajratadi. */
function splitTwoCol(
  zone: string,
  label: RegExp,
): [string | null, string | null] {
  const line =
    zone.split('\n').find((l) => new RegExp(label.source, 'i').test(l)) ?? '';
  const both = line.match(
    new RegExp(
      `${label.source}\\s*(.+?)\\s+${label.source}\\s*(.+?)\\s*$`,
      'i',
    ),
  );
  if (both) return [both[1].trim(), both[2].trim()];
  const one = line.match(new RegExp(`${label.source}\\s*(.+?)\\s*$`, 'i'));
  return [one ? one[1].trim() : null, null];
}

const firstMatch = (s: string | null, re: RegExp): string | null =>
  s?.match(re)?.[0]?.trim() ?? null;

function parseRequisites(zone: string): {
  executor: ParsedParty;
  customer: ParsedParty;
} {
  const ex: ParsedParty = { ...EMPTY_PARTY };
  const cu: ParsedParty = { ...EMPTY_PARTY };

  [ex.name, cu.name] = splitTwoCol(zone, /Номи:/);
  const [exStir, cuStir] = splitTwoCol(zone, /СТИР(?:и)?\s*:?/);
  ex.stir = firstMatch(exStir, /\d{6,14}/);
  cu.stir = firstMatch(cuStir, /\d{6,14}/);
  const [exTel, cuTel] = splitTwoCol(zone, /Тел\.?\s*:?/);
  ex.phone = firstMatch(exTel, /[\d()+\-\s]{5,}/);
  cu.phone = firstMatch(cuTel, /[\d()+\-\s]{5,}/);
  [ex.address, cu.address] = splitTwoCol(zone, /Манзил(?:и)?:/);

  ex.bank = pick(/Банк:\s*(.+?)(?:\s{2,}|\s+(?:Буюртмачи|Ғазначилик)|\n|$)/i, zone);
  ex.account = pick(/Банк\s*ҳисоб\s*рақам\s*:?\s*(\d{16,24})/i, zone);
  ex.mfo = pick(/МФО:\s*(\d{3,6})/i, zone);
  return { executor: ex, customer: cu };
}

const clean = (s: string | null): string | null =>
  s ? s.replace(/\s+/g, ' ').trim() : null;

export function parseUzexContract(pdf: PdfText): ParsedContract {
  const text = pdf.full;
  const warnings: string[] = [];

  const isUzexTemplate =
    /ШАРТНОМА\s*№/i.test(text) &&
    /(Махсус\s+ахборот\s+портали|лот\s*№|давлат\s+харид)/i.test(text);
  if (!isUzexTemplate) {
    warnings.push(
      "Bu xarid.uzex.uz shabloniga o'xshamaydi — maydonlarni diqqat bilan tekshiring.",
    );
  }

  const number = pick(/ШАРТНОМА\s*№\s*\n?\s*(\d{3,})/i, text);
  const signed_date = parseDate(
    pick(
      /(\d{1,2}\s+[A-Za-zА-Яа-я]+\s+\d{4})\s*г?\.?\s*\n?\s*\(шартнома\s+тузилган\s+сана\)/i,
      text,
    ) ?? pick(/\(шартнома\s+тузилган\s+жой\)\s*\n?\s*(\d{1,2}\s+[A-Za-zА-Яа-я]+\s+\d{4})/i, text)
      ?? pick(/(\d{1,2}\.\d{1,2}\.\d{4})\s*й/i, text),
  );
  const place = pick(/([^\n(]+?)\s*\n\s*\(шартнома\s+тузилган\s+жой\)/i, text);
  const lot_number = pick(/лот\s*№\s*\)?\s*\n?\s*(\d{6,})/i, text);
  const portal = pick(/порталида\s*\(([^)]+)\)/i, text);

  const total_amount = parseNum(
    pick(/умумий\s*суммаси\s*\n?\s*([\d\s.,]+?)\s*\(/i, text) ??
      pick(/Шартноманинг\s*умумий\s*суммаси\s*([\d\s.,]+)/i, text),
  );
  if (!total_amount)
    warnings.push("Shartnoma summasi o'qilmadi — qo'lda kiriting.");

  let subject =
    pick(
      /Техник\s+параметрлар\s+(.+?)\s*(?:\.\s|\.\d|\d+\s*(?:услуга|шт)|Товар\s*\()/is,
      text,
    ) ??
    pick(
      /\d\s+(Услуга\s+по\s+.+?|Товар[^\n]+?)\s+(?:усл\.?\s*ед|шт|дона|компл)/i,
      text,
    );
  subject = clean(subject)?.replace(/[.\s]+$/, '') ?? null;

  const drm = text.match(
    /([^\n]*?область)?\s*\n?\s*Етказиб\s*бериш\s*ҳудудлари[^\n]*\n?\s*([^;\n]+);/is,
  );
  const delivery_region = drm
    ? [drm[1], drm[2]].map((s) => clean(s ?? '')).filter(Boolean).join(', ') ||
      null
    : null;

  const warranty = clean(
    pick(/Кафолат\s*муддати\s*\n?\s*([0-9]+\s*[A-Za-zА-Яа-я]+)/i, text),
  );
  const penalty_delivery = pick(
    /бажарилмаган\s*қисмининг\s*\n?\s*([0-9]+[.,][0-9]+)/i,
    text,
  );
  const penalty_payment = pick(
    /муддати\s*ўтган\s*тўлов\s*суммасининг\s*\n?\s*([0-9]+[.,][0-9]+)/i,
    text,
  );

  // Narx qatori: "<birlik> <soni> <boshlang'ich> <kelishilgan>"
  const MONEY = '[0-9]{1,3}(?:[\\s\\u00a0]?[0-9]{3})*[.,][0-9]{2}';
  const priceRow = text.match(
    new RegExp(
      `(усл\\.?\\s*ед|шт\\.?|дона|компл\\.?|кг|литр|л|метр|м2|м3|м|соат|кун|та)\\s+` +
        `([0-9]+(?:[.,][0-9]+)?)\\s+(${MONEY})\\s+(${MONEY})`,
      'i',
    ),
  );
  const unit = clean(priceRow?.[1] ?? null) ?? 'усл. ед';
  const qty = parseNum(priceRow?.[2]) ?? 1;
  const start_price = parseNum(priceRow?.[3]);
  const agreed_price = parseNum(priceRow?.[4]);
  const line_amount =
    agreed_price != null ? agreed_price * qty : total_amount;

  const reqZone = text.match(/ТАРАФЛАРНИНГ\s+МАНЗИЛЛАРИ[\s\S]+/i)?.[0] ?? text;
  const { executor, customer } = parseRequisites(reqZone);

  if (!executor.name) {
    executor.name = pick(
      /Ижрочи[”"’ʼ']?\s*\n?\s*деб\s*\n?\s*аталувчи\s*\n?\s*(.+?)\s*(?:номидан|\n)/i,
      text,
    );
  }
  if (!customer.name) {
    customer.name = pick(
      /(?:Бюджет\s*\n?\s*буюртмачиси\s*\n?\s*бўлган|Буюртмачи[”"’ʼ']?\s*деб\s*аталувчи)\s*,?\s*\n?\s*(.+?)\s*(?:,|\n?\s*номидан)/is,
      text,
    );
  }
  executor.name = clean(executor.name);
  customer.name = clean(customer.name);
  executor.address = clean(executor.address);
  customer.address = clean(customer.address);

  if (!executor.stir)
    warnings.push("Ijrochi (mening tashkilotim) STIR o'qilmadi — qo'lda tanlang.");
  if (!customer.stir)
    warnings.push("Buyurtmachi (kontragent) STIR o'qilmadi — qo'lda tanlang.");
  if (!subject) warnings.push("Shartnoma predmeti o'qilmadi.");

  return {
    number,
    signed_date,
    place: clean(place),
    lot_number,
    portal: clean(portal),
    total_amount,
    currency: 'UZS',
    subject,
    delivery_region: clean(delivery_region),
    warranty,
    penalty_delivery,
    penalty_payment,
    executor,
    customer,
    items: [
      {
        name: subject,
        unit,
        qty,
        start_price,
        agreed_price,
        amount: line_amount,
        specs:
          [
            delivery_region && `Hudud: ${clean(delivery_region)}`,
            warranty && `Kafolat: ${warranty}`,
            penalty_delivery && `Peня (yetkazish): ${penalty_delivery}%/kun`,
          ]
            .filter(Boolean)
            .join(' · ') || null,
      },
    ],
    warnings,
    isUzexTemplate,
  };
}
