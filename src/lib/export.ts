import { supabase } from './supabase';

const TABLES = [
  'organizations',
  'contracts',
  'obligations',
  'deliveries',
  'payments',
  'costs',
  'templates',
] as const;

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const stamp = () => new Date().toISOString().slice(0, 10);

/** Barcha ma'lumotni bitta JSON faylga */
export async function exportAllJson() {
  const dump: Record<string, unknown[]> = {};
  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) throw new Error(`${table}: ${error.message}`);
    dump[table] = data ?? [];
  }
  download(
    `birja-export-${stamp()}.json`,
    JSON.stringify(
      { exported_at: new Date().toISOString(), data: dump },
      null,
      2,
    ),
    'application/json',
  );
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    cols.join(';'),
    ...rows.map((r) => cols.map((c) => esc(r[c])).join(';')),
  ].join('\n');
}

export async function exportContractsCsv() {
  const { data, error } = await supabase
    .from('contracts')
    .select('*, organization:organizations(name)')
    .order('signed_date', { ascending: false });
  if (error) throw new Error(error.message);
  interface ContractExportRow {
    number: string;
    organization: { name: string } | null;
    signed_date: string | null;
    subject: string | null;
    our_role: string;
    total_amount: number;
    currency: string;
    status: string;
    deadline: string | null;
    source: string;
    external_ref: string | null;
  }
  const flat = ((data ?? []) as ContractExportRow[]).map((c) => ({
    number: c.number,
    organization: c.organization?.name ?? '',
    signed_date: c.signed_date ?? '',
    subject: c.subject ?? '',
    our_role: c.our_role,
    total_amount: c.total_amount,
    currency: c.currency,
    status: c.status,
    deadline: c.deadline ?? '',
    source: c.source,
    external_ref: c.external_ref ?? '',
  }));
  download(
    `birja-shartnomalar-${stamp()}.csv`,
    '﻿' + toCsv(flat),
    'text/csv;charset=utf-8',
  );
}
