import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  FileText,
  Plus,
  Wallet,
} from 'lucide-react';
import { t } from '@/i18n';
import { useContracts } from '@/api/contracts';
import { useAllFinance } from '@/api/finance';
import { useCashbox } from '@/api/cashbox';
import { useActivity } from '@/api/activity';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { EmptyState } from '@/components/common/EmptyState';
import { ActivityItem } from '@/components/common/ActivityItem';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney, daysUntil } from '@/lib/format';

export function Dashboard() {
  const navigate = useNavigate();
  const {
    data: contracts,
    isLoading: cLoading,
    isError: cError,
  } = useContracts();
  const {
    data: finance,
    isLoading: fLoading,
    isError: fError,
  } = useAllFinance();
  const { data: cashbox } = useCashbox();
  const { data: activity } = useActivity({ limit: 8 });

  const cashboxBalance =
    cashbox?.find((b) => b.currency === 'UZS')?.balance ?? 0;

  const totalProfit = useMemo(
    () =>
      (finance ?? [])
        .filter((f) => f.currency === 'UZS')
        .reduce((s, f) => s + Number(f.profit), 0),
    [finance],
  );

  const stats = useMemo(() => {
    const list = contracts ?? [];
    const active = list.filter(
      (c) => c.status === 'active' || c.status === 'partially_fulfilled',
    ).length;
    let overdue = 0;
    let dueSoon = 0;
    for (const c of list) {
      if (c.status === 'fulfilled' || c.status === 'cancelled') continue;
      const d = daysUntil(c.deadline);
      if (d === null) continue;
      if (d < 0) overdue += 1;
      else if (d <= 7) dueSoon += 1;
    }
    return { active, overdue, dueSoon };
  }, [contracts]);

  const loading = cLoading || fLoading;

  return (
    <div>
      <PageHeader
        title={t.dashboard.title}
        actions={
          <Button onClick={() => navigate('/contracts/new')}>
            <Plus className="h-4 w-4" />
            {t.contract.new}
          </Button>
        }
      />

      {cError || fError ? (
        <EmptyState
          icon={AlertTriangle}
          title={t.common.error}
          description="Ma'lumot yuklanmadi. Sahifani qayta yuklang."
        />
      ) : loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t.dashboard.totalProfit}
            value={formatMoney(totalProfit)}
            tone={totalProfit >= 0 ? 'success' : 'destructive'}
            icon={Wallet}
          />
          <StatCard
            label={t.cashbox.balance}
            value={formatMoney(cashboxBalance)}
            tone={cashboxBalance >= 0 ? 'success' : 'destructive'}
            icon={Banknote}
          />
          <StatCard
            label={t.dashboard.activeContracts}
            value={String(stats.active)}
            icon={FileText}
          />
          <StatCard
            label={t.dashboard.overdue}
            value={String(stats.overdue)}
            tone={stats.overdue > 0 ? 'destructive' : 'default'}
            icon={AlertTriangle}
          />
          <StatCard
            label={t.dashboard.dueSoon}
            value={String(stats.dueSoon)}
            tone={stats.dueSoon > 0 ? 'warning' : 'default'}
            icon={CalendarClock}
          />
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.recentActivity}</CardTitle>
          </CardHeader>
          <CardContent>
            {!activity || activity.length === 0 ? (
              <EmptyState title={t.dashboard.emptyActivity} />
            ) : (
              <div className="-mx-2">
                {activity.map((a) => (
                  <ActivityItem key={a.id} item={a} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.quickAdd}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-auto flex-col gap-1 py-4"
              onClick={() => navigate('/contracts/new')}
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs">{t.contract.new}</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-1 py-4"
              onClick={() => navigate('/organizations')}
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs">{t.org.new}</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-1 py-4"
              onClick={() => navigate('/finance')}
            >
              <Wallet className="h-5 w-5" />
              <span className="text-xs">{t.nav.finance}</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-1 py-4"
              onClick={() => navigate('/deliveries')}
            >
              <CalendarClock className="h-5 w-5" />
              <span className="text-xs">{t.nav.deliveries}</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
