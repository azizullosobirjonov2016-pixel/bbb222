import { useMemo, useState } from 'react';
import { Briefcase, Pencil, Plus, Trash2 } from 'lucide-react';
import { t } from '@/i18n';
import type { Company } from '@/types/db';
import {
  useCompanies,
  useDeleteCompany,
  type CompanyWithStats,
} from '@/api/companies';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { CompanyForm } from '@/components/forms/CompanyForm';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export function Companies() {
  const { data, isLoading, isError } = useCompanies();
  const del = useDeleteCompany();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [toDelete, setToDelete] = useState<CompanyWithStats | null>(null);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data ?? [];
    return (data ?? []).filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        (c.inn_stir ?? '').toLowerCase().includes(s),
    );
  }, [data, q]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (c: Company) => {
    setEditing(c);
    setFormOpen(true);
  };

  return (
    <div>
      <PageHeader
        title={t.company.title}
        description="Siz nomidan shartnoma tuziladigan yuridik shaxslar"
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            {t.common.add}
          </Button>
        }
      />

      {(data ?? []).length > 0 && (
        <div className="mb-4">
          <Input
            className="sm:max-w-xs"
            placeholder={t.common.search}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState title={t.errors.loadFailed} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={t.company.empty}
          action={
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              {t.company.new}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((c) => (
            <Card key={c.id} className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.name}</p>
                  {c.inn_stir && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {t.company.innStir}: {c.inn_stir}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(c)}
                    aria-label={t.common.edit}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setToDelete(c)}
                    aria-label={t.common.delete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {c.note && (
                <p className="mt-2 text-sm text-muted-foreground">{c.note}</p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                {t.company.contractsCount}: {c.contracts_count}
              </p>
            </Card>
          ))}
        </div>
      )}

      <CompanyForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        company={editing}
      />

      <ConfirmDialog
        open={!!toDelete}
        message={t.company.deleteConfirm}
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
