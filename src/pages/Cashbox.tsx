import { Wallet, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { t } from '@/i18n';
import { useCashbox } from '@/api/cashbox';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/format';

export function Cashbox() {
  const { data, isLoading, isError } = useCashbox();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }
  if (isError) {
    return <EmptyState title={t.errors.loadFailed} />;
  }
  const balances = data ?? [];
  const hasAny = balances.some(
    (b) => b.paidIn || b.paidOut || b.paidCosts || b.beneficiaryPayouts,
  );

  return (
    <div>
      <PageHeader title={t.cashbox.title} description={t.cashbox.subtitle} />

      {!hasAny ? (
        <EmptyState icon={Wallet} title={t.cashbox.empty} />
      ) : (
        <div className="space-y-6">
          {balances
            .filter(
              (b) =>
                b.paidIn || b.paidOut || b.paidCosts || b.beneficiaryPayouts,
            )
            .map((b) => (
              <Card key={b.currency}>
                <CardHeader>
                  <CardTitle>
                    {b.currency === 'UZS' ? "so'm" : b.currency}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <StatCard
                      label={t.cashbox.balance}
                      value={formatMoney(b.balance, b.currency)}
                      tone={b.balance >= 0 ? 'success' : 'destructive'}
                      icon={Wallet}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                      label={t.cashbox.paidIn}
                      value={formatMoney(b.paidIn, b.currency)}
                      icon={TrendingUp}
                    />
                    <StatCard
                      label={t.cashbox.paidOut}
                      value={formatMoney(b.paidOut, b.currency)}
                      icon={TrendingDown}
                    />
                    <StatCard
                      label={t.cashbox.paidCosts}
                      value={formatMoney(b.paidCosts, b.currency)}
                      icon={TrendingDown}
                    />
                    <StatCard
                      label={t.cashbox.beneficiaryPayouts}
                      value={formatMoney(b.beneficiaryPayouts, b.currency)}
                      icon={Users}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
