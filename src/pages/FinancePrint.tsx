import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { t } from '@/i18n';
import { useAllFinance } from '@/api/finance';
import { useContracts } from '@/api/contracts';
import { useCompanies } from '@/api/companies';
import { inDateRange } from '@/components/common/DateRangeFilter';
import { formatDate, formatMoney } from '@/lib/format';

const MONTHS = [
  'Yan',
  'Fev',
  'Mar',
  'Apr',
  'May',
  'Iyn',
  'Iyl',
  'Avg',
  'Sen',
  'Okt',
  'Noy',
  'Dek',
];

export function FinancePrint() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('company') ?? '';
  const dateFrom = searchParams.get('from') ?? '';
  const dateTo = searchParams.get('to') ?? '';

  const { data: allFinance, isLoading } = useAllFinance();
  const { data: contracts } = useContracts();
  const { data: companies } = useCompanies();

  const contractMeta = useMemo(() => {
    const m = new Map<
      string,
      { number: string; org: string; month: string; signedDate: string | null }
    >();
    for (const c of contracts ?? []) {
      const d = c.signed_date ? new Date(c.signed_date) : null;
      m.set(c.id, {
        number: c.number,
        org: c.organization?.name ?? '—',
        month: d
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          : '—',
        signedDate: c.signed_date,
      });
    }
    return m;
  }, [contracts]);

  const companyName = useMemo(() => {
    const c = (companies ?? []).find((c) => c.id === companyId);
    return c?.name ?? null;
  }, [companies, companyId]);

  const finance = useMemo(
    () =>
      (allFinance ?? []).filter((f) => {
        if (f.currency !== 'UZS') return false;
        if (companyId && f.company_id !== companyId) return false;
        const signedDate = contractMeta.get(f.contract_id)?.signedDate;
        if (signedDate && !inDateRange(signedDate, dateFrom, dateTo))
          return false;
        if (!signedDate && (dateFrom || dateTo)) return false;
        return true;
      }),
    [allFinance, companyId, dateFrom, dateTo, contractMeta],
  );

  const totals = useMemo(() => {
    let revenue = 0;
    let spent = 0;
    let profit = 0;
    for (const f of finance) {
      revenue += Number(f.revenue);
      spent += Number(f.spent);
      profit += Number(f.profit);
    }
    return { revenue, spent, profit };
  }, [finance]);

  const byMonth = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of finance) {
      const meta = contractMeta.get(f.contract_id);
      if (!meta || meta.month === '—') continue;
      m.set(meta.month, (m.get(meta.month) ?? 0) + Number(f.profit));
    }
    return [...m.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, profit]) => {
        const [y, mm] = key.split('-');
        return { label: `${MONTHS[Number(mm) - 1]} ${y}`, profit };
      });
  }, [finance, contractMeta]);

  const ready = !isLoading && !!allFinance;

  useEffect(() => {
    if (ready) {
      const timer = setTimeout(() => window.print(), 300);
      return () => clearTimeout(timer);
    }
  }, [ready]);

  if (isLoading) {
    return (
      <p className="p-8 text-sm text-muted-foreground">{t.common.loading}</p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-8 text-sm text-black print:p-0">
      <h1 className="text-xl font-bold">{t.finance.title}</h1>
      <p className="mt-1 text-xs text-gray-500">
        {t.app.name} · {formatDate(new Date().toISOString())}
        {companyName ? ` · ${companyName}` : ''}
        {dateFrom || dateTo
          ? ` · ${dateFrom ? formatDate(dateFrom) : '…'} – ${dateTo ? formatDate(dateTo) : '…'}`
          : ''}
      </p>

      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <Stat label={t.finance.revenue} value={formatMoney(totals.revenue)} />
        <Stat label={t.finance.spent} value={formatMoney(totals.spent)} />
        <Stat
          label={totals.profit >= 0 ? t.finance.profit : t.finance.loss}
          value={formatMoney(totals.profit)}
        />
      </div>

      <div className="mt-6 break-inside-avoid">
        <h2 className="border-b border-gray-300 pb-1 text-sm font-semibold uppercase tracking-wide text-gray-700">
          {t.finance.byMonth}
        </h2>
        <table className="mt-2 w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="border-b border-gray-300 py-1 text-left font-semibold text-gray-600">
                {t.finance.title}
              </th>
              <th className="border-b border-gray-300 py-1 text-right font-semibold text-gray-600">
                {t.finance.profit}
              </th>
            </tr>
          </thead>
          <tbody>
            {byMonth.map((row) => (
              <tr key={row.label}>
                <td className="border-b border-gray-100 py-1">{row.label}</td>
                <td className="border-b border-gray-100 py-1 text-right">
                  {formatMoney(row.profit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 break-inside-avoid">
        <h2 className="border-b border-gray-300 pb-1 text-sm font-semibold uppercase tracking-wide text-gray-700">
          {t.contract.title}
        </h2>
        <table className="mt-2 w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="border-b border-gray-300 py-1 text-left font-semibold text-gray-600">
                №
              </th>
              <th className="border-b border-gray-300 py-1 text-left font-semibold text-gray-600">
                {t.contract.organization}
              </th>
              <th className="border-b border-gray-300 py-1 text-right font-semibold text-gray-600">
                {t.finance.revenue}
              </th>
              <th className="border-b border-gray-300 py-1 text-right font-semibold text-gray-600">
                {t.finance.profit}
              </th>
            </tr>
          </thead>
          <tbody>
            {finance.map((f) => {
              const meta = contractMeta.get(f.contract_id);
              return (
                <tr key={f.contract_id}>
                  <td className="border-b border-gray-100 py-1">
                    {meta?.number ?? '—'}
                  </td>
                  <td className="border-b border-gray-100 py-1">
                    {meta?.org ?? '—'}
                  </td>
                  <td className="border-b border-gray-100 py-1 text-right">
                    {formatMoney(f.revenue)}
                  </td>
                  <td className="border-b border-gray-100 py-1 text-right">
                    {formatMoney(f.profit)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
