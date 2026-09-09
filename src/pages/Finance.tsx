import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { t } from '@/i18n';
import { useAllFinance } from '@/api/finance';
import { useContracts } from '@/api/contracts';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney, formatMoneyShort } from '@/lib/format';

const MONTHS = [
  'Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn',
  'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek',
];

export function Finance() {
  const { data: finance, isLoading } = useAllFinance();
  const { data: contracts } = useContracts();

  const contractMeta = useMemo(() => {
    const m = new Map<
      string,
      { org: string; month: string; status: string }
    >();
    for (const c of contracts ?? []) {
      const d = c.signed_date ? new Date(c.signed_date) : null;
      m.set(c.id, {
        org: c.organization?.name ?? '—',
        month: d
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          : '—',
        status: c.status,
      });
    }
    return m;
  }, [contracts]);

  const totals = useMemo(() => {
    let revenue = 0;
    let spent = 0;
    let profit = 0;
    for (const f of finance ?? []) {
      if (f.currency !== 'UZS') continue;
      revenue += Number(f.revenue);
      spent += Number(f.spent);
      profit += Number(f.profit);
    }
    return { revenue, spent, profit };
  }, [finance]);

  const byMonth = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of finance ?? []) {
      if (f.currency !== 'UZS') continue;
      const meta = contractMeta.get(f.contract_id);
      if (!meta || meta.month === '—') continue;
      m.set(meta.month, (m.get(meta.month) ?? 0) + Number(f.profit));
    }
    return [...m.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, profit]) => {
        const [y, mm] = key.split('-');
        return { label: `${MONTHS[Number(mm) - 1]} ${y.slice(2)}`, profit };
      });
  }, [finance, contractMeta]);

  const byOrg = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of finance ?? []) {
      if (f.currency !== 'UZS') continue;
      const meta = contractMeta.get(f.contract_id);
      m.set(meta?.org ?? '—', (m.get(meta?.org ?? '—') ?? 0) + Number(f.profit));
    }
    return [...m.entries()]
      .map(([label, profit]) => ({ label, profit }))
      .sort((a, b) => Math.abs(b.profit) - Math.abs(a.profit))
      .slice(0, 8);
  }, [finance, contractMeta]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (!finance || finance.length === 0) {
    return (
      <div>
        <PageHeader title={t.finance.title} />
        <EmptyState icon={Wallet} title={t.contract.empty} />
      </div>
    );
  }

  const profitPositive = totals.profit >= 0;

  return (
    <div>
      <PageHeader
        title={t.finance.title}
        description="Faqat soʻmdagi shartnomalar boʻyicha"
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard
          label={t.finance.revenue}
          value={formatMoney(totals.revenue)}
          icon={TrendingUp}
        />
        <StatCard
          label={t.finance.spent}
          value={formatMoney(totals.spent)}
          icon={TrendingDown}
        />
        <StatCard
          label={profitPositive ? t.finance.netProfit : t.finance.loss}
          value={formatMoney(totals.profit)}
          tone={profitPositive ? 'success' : 'destructive'}
          icon={Wallet}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.finance.byMonth}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartFrame data={byMonth} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.finance.byOrganization}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartFrame data={byOrg} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChartFrame({ data }: { data: { label: string; profit: number }[] }) {
  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        {t.common.noData}
      </p>
    );
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-25}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            width={54}
            tickFormatter={(v) => formatMoneyShort(v).replace(" so'm", '')}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))' }}
            contentStyle={{
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 8,
              fontSize: 12,
              color: 'hsl(var(--popover-foreground))',
            }}
            formatter={(v: number) => [formatMoney(v), t.finance.profit]}
          />
          <Bar dataKey="profit" radius={[4, 4, 0, 0]} maxBarSize={44}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={
                  d.profit >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
