import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { t } from '@/i18n';
import type { ContractStatus } from '@/types/db';
import { useContracts } from '@/api/contracts';
import { useAllFinance } from '@/api/finance';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ContractStatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatMoney, formatMoneyShort } from '@/lib/format';
import { cn } from '@/lib/utils';

const statusFilterOptions = [
  { value: '', label: t.common.all },
  ...(
    ['draft', 'active', 'partially_fulfilled', 'fulfilled', 'cancelled'] as const
  ).map((s) => ({ value: s, label: t.contract.statusLabels[s] })),
];

export function Contracts() {
  const { data, isLoading, isError } = useContracts();
  const { data: finance } = useAllFinance();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<ContractStatus | ''>('');

  const profitByContract = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of finance ?? []) m.set(f.contract_id, f.profit);
    return m;
  }, [finance]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data ?? []).filter((c) => {
      if (status && c.status !== status) return false;
      if (!s) return true;
      return (
        c.number.toLowerCase().includes(s) ||
        (c.subject ?? '').toLowerCase().includes(s) ||
        (c.organization?.name ?? '').toLowerCase().includes(s) ||
        (c.external_ref ?? '').toLowerCase().includes(s)
      );
    });
  }, [data, q, status]);

  return (
    <div>
      <PageHeader
        title={t.contract.title}
        description={`${data?.length ?? 0} ${t.contract.one.toLowerCase()}`}
        actions={
          <Button onClick={() => navigate('/contracts/new')}>
            <Plus className="h-4 w-4" />
            {t.common.add}
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          className="sm:max-w-xs"
          placeholder={t.common.search}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Select
          className="sm:max-w-[200px]"
          options={statusFilterOptions}
          value={status}
          onChange={(e) => setStatus(e.target.value as ContractStatus | '')}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState title={t.errors.loadFailed} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t.contract.empty}
          action={
            <Button onClick={() => navigate('/contracts/new')}>
              <Plus className="h-4 w-4" />
              {t.contract.new}
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const profit = profitByContract.get(c.id);
            return (
              <Link key={c.id} to={`/contracts/${c.id}`}>
                <Card className="p-4 transition-colors hover:border-primary/40 hover:bg-muted/40">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">№ {c.number}</span>
                        <ContractStatusBadge status={c.status} />
                        {c.source === 'uzex' && (
                          <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[11px] font-medium text-accent">
                            UzEX
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {c.organization?.name ?? '—'}
                        {c.subject ? ` · ${c.subject}` : ''}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t.contract.signedDate}: {formatDate(c.signed_date)}
                        {c.deadline
                          ? ` · ${t.contract.deadline}: ${formatDate(c.deadline)}`
                          : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">
                        {formatMoney(c.total_amount, c.currency)}
                      </p>
                      {profit !== undefined && (
                        <p
                          className={cn(
                            'text-xs tabular-nums',
                            profit >= 0 ? 'text-success' : 'text-destructive',
                          )}
                        >
                          {profit >= 0 ? t.finance.profit : t.finance.loss}:{' '}
                          {formatMoneyShort(profit, c.currency)}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
