import { useMemo, useState } from 'react';
import { t } from '@/i18n';
import { useActivity } from '@/api/activity';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ActivityItem } from '@/components/common/ActivityItem';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const entityOptions = [
  { value: '', label: t.common.all },
  { value: 'contracts', label: t.activity.entityLabels.contracts },
  { value: 'organizations', label: t.activity.entityLabels.organizations },
  { value: 'obligations', label: t.activity.entityLabels.obligations },
  { value: 'deliveries', label: t.activity.entityLabels.deliveries },
  { value: 'payments', label: t.activity.entityLabels.payments },
  { value: 'costs', label: t.activity.entityLabels.costs },
];

export function Activity() {
  const [entity, setEntity] = useState('');
  const [q, setQ] = useState('');
  const { data, isLoading, isError } = useActivity({
    entityType: entity || undefined,
    limit: 200,
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data ?? [];
    return (data ?? []).filter((a) =>
      (a.summary ?? '').toLowerCase().includes(s),
    );
  }, [data, q]);

  return (
    <div>
      <PageHeader title={t.activity.title} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          className="sm:max-w-xs"
          placeholder={t.common.search}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Select
          className="sm:max-w-[200px]"
          options={entityOptions}
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState title={t.errors.loadFailed} />
      ) : filtered.length === 0 ? (
        <EmptyState title={t.activity.empty} />
      ) : (
        <Card className="divide-y p-2">
          {filtered.map((a) => (
            <ActivityItem key={a.id} item={a} />
          ))}
        </Card>
      )}
    </div>
  );
}
