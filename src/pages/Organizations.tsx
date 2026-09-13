import { useMemo, useState } from 'react';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import { t } from '@/i18n';
import type { Organization } from '@/types/db';
import {
  useOrganizations,
  useDeleteOrganization,
  type OrgWithStats,
} from '@/api/organizations';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { OrganizationForm } from '@/components/forms/OrganizationForm';
import { useIsAdmin } from '@/hooks/useTeamRole';
import { useQueryParamState } from '@/hooks/useQueryParamState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const typeLabel: Record<string, string> = {
  customer: t.org.typeCustomer,
  supplier: t.org.typeSupplier,
  both: t.org.typeBoth,
};

export function Organizations() {
  const { data, isLoading, isError } = useOrganizations();
  const del = useDeleteOrganization();
  const { toast } = useToast();
  const isAdmin = useIsAdmin();
  const [q, setQ] = useQueryParamState('q');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [toDelete, setToDelete] = useState<OrgWithStats | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data ?? [];
    return (data ?? []).filter(
      (o) =>
        o.name.toLowerCase().includes(s) ||
        (o.inn_stir ?? '').includes(s) ||
        (o.phone ?? '').includes(s),
    );
  }, [data, q]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (o: Organization) => {
    setEditing(o);
    setFormOpen(true);
  };

  return (
    <div>
      <PageHeader
        title={t.org.title}
        description={`${data?.length ?? 0} ${t.org.one.toLowerCase()}`}
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            {t.common.add}
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <Input
          placeholder={t.common.search}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState title={t.errors.loadFailed} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t.org.empty}
          action={
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              {t.org.new}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o) => (
            <Card key={o.id} className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{o.name}</p>
                  <Badge tone="muted" className="mt-1">
                    {typeLabel[o.type]}
                  </Badge>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(o)}
                    aria-label={t.common.edit}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setToDelete(o)}
                      aria-label={t.common.delete}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <dl className="mt-3 space-y-1 text-sm text-muted-foreground">
                {o.inn_stir && (
                  <div className="flex justify-between gap-2">
                    <dt>{t.org.innStir}</dt>
                    <dd className="text-foreground">{o.inn_stir}</dd>
                  </div>
                )}
                {o.phone && (
                  <div className="flex justify-between gap-2">
                    <dt>{t.org.phone}</dt>
                    <dd className="text-foreground">{o.phone}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <dt>{t.org.contractsCount}</dt>
                  <dd className="text-foreground">{o.contracts_count}</dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
      )}

      <OrganizationForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        organization={editing}
      />

      <ConfirmDialog
        open={!!toDelete}
        message={t.org.deleteConfirm}
        loading={del.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return;
          del.mutate(toDelete.id, {
            onSuccess: () => {
              toast(t.common.deleted);
              setToDelete(null);
            },
            onError: (e) => toast(e.message, 'error'),
          });
        }}
      />
    </div>
  );
}
