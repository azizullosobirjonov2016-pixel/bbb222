import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

export type Currency = 'UZS' | 'USD';

const nfUZS = new Intl.NumberFormat('uz-UZ', {
  maximumFractionDigits: 0,
});
const nfUSD = new Intl.NumberFormat('uz-UZ', {
  maximumFractionDigits: 2,
});

/** Pul summasini o'qiladigan ko'rinishda: "1 250 000 so'm" */
export function formatMoney(
  amount: number | null | undefined,
  currency: Currency = 'UZS',
): string {
  const value = Number(amount ?? 0);
  if (currency === 'USD') return `$${nfUSD.format(value)}`;
  return `${nfUZS.format(value)} so'm`;
}

/** Qisqa ko'rinish: 1 250 000 -> "1,25 mln" */
export function formatMoneyShort(
  amount: number | null | undefined,
  currency: Currency = 'UZS',
): string {
  const value = Number(amount ?? 0);
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const unit = currency === 'USD' ? '$' : '';
  const suffix = currency === 'USD' ? '' : " so'm";
  if (abs >= 1e9) return `${sign}${unit}${(abs / 1e9).toFixed(2)} mlrd${suffix}`;
  if (abs >= 1e6) return `${sign}${unit}${(abs / 1e6).toFixed(2)} mln${suffix}`;
  if (abs >= 1e3) return `${sign}${unit}${(abs / 1e3).toFixed(1)} ming${suffix}`;
  return formatMoney(value, currency);
}

export function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = typeof value === 'string' ? parseISO(value) : value;
  return isValid(d) ? d : null;
}

/** "12.03.2026" */
export function formatDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? format(d, 'dd.MM.yyyy') : '—';
}

/** "12.03.2026, 14:30" */
export function formatDateTime(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? format(d, 'dd.MM.yyyy, HH:mm') : '—';
}

/** "3 kun oldin" ko'rinishidagi nisbiy vaqt (soddalashtirilgan, o'zbekcha) */
export function timeAgo(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  const raw = formatDistanceToNow(d, { addSuffix: false });
  return uzRelative(raw) + ' oldin';
}

function uzRelative(en: string): string {
  return en
    .replace(/about /, '')
    .replace(/less than a minute/, 'bir daqiqadan kam')
    .replace(/(\d+) minutes?/, '$1 daqiqa')
    .replace(/(\d+) hours?/, '$1 soat')
    .replace(/(\d+) days?/, '$1 kun')
    .replace(/(\d+) months?/, '$1 oy')
    .replace(/(\d+) years?/, '$1 yil')
    .replace(/a minute/, '1 daqiqa')
    .replace(/an hour/, '1 soat')
    .replace(/a day/, '1 kun')
    .replace(/a month/, '1 oy')
    .replace(/a year/, '1 yil');
}

export function daysUntil(value: string | Date | null | undefined): number | null {
  const d = toDate(value);
  if (!d) return null;
  const ms = d.getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}
