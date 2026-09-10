import type { ContractFinance, CurrencyCode } from '@/types/db';
import { t } from '@/i18n';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface Props {
  finance: ContractFinance | null | undefined;
  currency: CurrencyCode;
}

function Line({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: 'success' | 'destructive';
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span
        className={cn(
          'text-sm',
          strong ? 'font-medium text-foreground' : 'text-muted-foreground',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'tabular-nums',
          strong ? 'text-base font-semibold' : 'text-sm',
          tone === 'success' && 'text-success',
          tone === 'destructive' && 'text-destructive',
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function FinancePanel({ finance, currency }: Props) {
  const f: ContractFinance = finance ?? {
    contract_id: '',
    user_id: '',
    company_id: null,
    our_role: 'seller',
    currency,
    contract_value: 0,
    paid_in: 0,
    paid_out: 0,
    costs_total: 0,
    delivered_total: 0,
    revenue: 0,
    spent: 0,
    profit: 0,
    outstanding: 0,
    progress: 0,
  };
  const profitPositive = f.profit >= 0;
  const margin = f.revenue > 0 ? (f.profit / f.revenue) * 100 : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="p-4 sm:p-5">
        <p className="text-sm text-muted-foreground">
          {profitPositive ? t.finance.profit : t.finance.loss}
        </p>
        <p
          className={cn(
            'mt-1 text-2xl font-semibold tabular-nums',
            profitPositive ? 'text-success' : 'text-destructive',
          )}
        >
          {formatMoney(f.profit, currency)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t.finance.profitMargin}: {margin.toFixed(1)}%
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{
              width: `${Math.max(0, Math.min(100, f.progress * 100))}%`,
            }}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {t.finance.progress}: {(f.progress * 100).toFixed(0)}%
        </p>
      </Card>

      <Card className="divide-y p-4 sm:p-5">
        <Line
          label={t.finance.revenue}
          value={formatMoney(f.revenue, currency)}
          strong
        />
        <Line
          label={t.finance.paidIn}
          value={formatMoney(f.paid_in, currency)}
        />
        <Line
          label={t.finance.outstanding}
          value={formatMoney(f.outstanding, currency)}
          tone={f.outstanding > 0 ? 'destructive' : undefined}
        />
        <Line
          label={t.finance.costs}
          value={formatMoney(f.costs_total, currency)}
        />
        <Line
          label={t.finance.paidOut}
          value={formatMoney(f.paid_out, currency)}
        />
        <Line
          label={t.finance.spent}
          value={formatMoney(f.spent, currency)}
          strong
        />
      </Card>
    </div>
  );
}
