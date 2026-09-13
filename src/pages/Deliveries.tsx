import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQueryParamState } from '@/hooks/useQueryParamState';
import { PackageCheck } from 'lucide-react';
import { t } from '@/i18n';
import { useDeliveries } from '@/api/deliveries';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import {
  DateRangeFilter,
  inDateRange,
} from '@/components/common/DateRangeFilter';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatMoney } from '@/lib/format';
import type { CurrencyCode } from '@/types/db';

export function Deliveries() {
  const { data, isLoading, isError } = useDeliveries();
  const [q, setQ] = useQueryParamState('q');
  const [dateFrom, setDateFrom] = useQueryParamState('from');
  const [dateTo, setDateTo] = useQueryParamState('to');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data ?? []).filter((d) => {
      if (!inDateRange(d.date, dateFrom, dateTo)) return false;
      if (!s) return true;
      return (
        (d.contract?.number ?? '').toLowerCase().includes(s) ||
        (d.contract?.organization?.name ?? '').toLowerCase().includes(s) ||
        (d.document_ref ?? '').toLowerCase().includes(s)
      );
    });
  }, [data, q, dateFrom, dateTo]);

  const total = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of filtered) {
      const c = (d.contract?.currency ?? 'UZS') as CurrencyCode;
      m.set(c, (m.get(c) ?? 0) + Number(d.amount));
    }
    return m;
  }, [filtered]);

  return (
    <div>
      <PageHeader
        title={t.delivery.title}
        description={
          [...total.entries()]
            .map(([c, v]) => formatMoney(v, c as CurrencyCode))
            .join(' · ') || undefined
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          className="sm:max-w-xs"
          placeholder={t.common.search}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <DateRangeFilter
          from={dateFrom}
          to={dateTo}
          onFromChange={setDateFrom}
          onToChange={setDateTo}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState title={t.errors.loadFailed} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={PackageCheck} title={t.delivery.empty} />
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => (
            <Card key={d.id} className="p-3 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    to={`/contracts/${d.contract?.id}`}
                    className="text-sm font-medium hover:text-primary hover:underline"
                  >
                    № {d.contract?.number ?? '—'}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {d.contract?.organization?.name ?? '—'} ·{' '}
                    {formatDate(d.date)}
                    {d.document_ref ? ` · ${d.document_ref}` : ''}
                  </p>
                </div>
                <span className="shrink-0 tabular-nums text-sm font-semibold">
                  {formatMoney(
                    d.amount,
                    (d.contract?.currency ?? 'UZS') as CurrencyCode,
                  )}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
