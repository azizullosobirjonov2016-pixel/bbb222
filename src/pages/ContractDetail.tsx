import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, Trash2, ExternalLink } from 'lucide-react';
import { t } from '@/i18n';
import { useContract, useDeleteContract } from '@/api/contracts';
import { useContractFinance } from '@/api/finance';
import {
  useObligations,
  useDeleteObligation,
} from '@/api/obligations';
import { useDeliveries, useDeleteDelivery } from '@/api/deliveries';
import { usePayments, useDeletePayment } from '@/api/payments';
import { useCosts, useDeleteCost } from '@/api/costs';
import { useActivity } from '@/api/activity';
import type {
  Cost,
  Delivery,
  Obligation,
  Payment,
} from '@/types/db';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ListRow } from '@/components/common/ListRow';
import {
  ContractStatusBadge,
  ObligationStatusBadge,
} from '@/components/common/StatusBadge';
import { FinancePanel } from '@/components/contract/FinancePanel';
import { ObligationForm } from '@/components/forms/ObligationForm';
import { DeliveryForm } from '@/components/forms/DeliveryForm';
import { PaymentForm } from '@/components/forms/PaymentForm';
import { CostForm } from '@/components/forms/CostForm';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatMoney, daysUntil } from '@/lib/format';
import { ActivityItem } from '@/components/common/ActivityItem';

type TabKey =
  | 'obligations'
  | 'deliveries'
  | 'payments'
  | 'costs'
  | 'finance'
  | 'activity';

export function ContractDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: contract, isLoading, isError } = useContract(id);
  const { data: finance } = useContractFinance(id);
  const { data: obligations = [] } = useObligations(id);
  const { data: deliveries = [] } = useDeliveries(id);
  const { data: payments = [] } = usePayments(id);
  const { data: costs = [] } = useCosts(id);
  const { data: activity = [] } = useActivity({ contractId: id, limit: 50 });

  const delContract = useDeleteContract();
  const delObligation = useDeleteObligation(id);
  const delDelivery = useDeleteDelivery(id);
  const delPayment = useDeletePayment(id);
  const delCost = useDeleteCost(id);

  const [tab, setTab] = useState<TabKey>('obligations');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [obligationForm, setObligationForm] = useState<{
    open: boolean;
    row: Obligation | null;
  }>({ open: false, row: null });
  const [deliveryForm, setDeliveryForm] = useState<{
    open: boolean;
    row: Delivery | null;
  }>({ open: false, row: null });
  const [paymentForm, setPaymentForm] = useState<{
    open: boolean;
    row: Payment | null;
  }>({ open: false, row: null });
  const [costForm, setCostForm] = useState<{ open: boolean; row: Cost | null }>({
    open: false,
    row: null,
  });

  const [rowDelete, setRowDelete] = useState<
    | { kind: 'obligation' | 'delivery' | 'payment' | 'cost'; id: string }
    | null
  >(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (isError || !contract) {
    return <EmptyState title={t.errors.loadFailed} />;
  }

  const cur = contract.currency;
  const dLeft = daysUntil(contract.deadline);

  const runRowDelete = () => {
    if (!rowDelete) return;
    const done = () => {
      toast(t.common.deleted);
      setRowDelete(null);
    };
    const err = (e: Error) => toast(e.message, 'error');
    if (rowDelete.kind === 'obligation')
      delObligation.mutate(rowDelete.id, { onSuccess: done, onError: err });
    if (rowDelete.kind === 'delivery')
      delDelivery.mutate(rowDelete.id, { onSuccess: done, onError: err });
    if (rowDelete.kind === 'payment')
      delPayment.mutate(rowDelete.id, { onSuccess: done, onError: err });
    if (rowDelete.kind === 'cost')
      delCost.mutate(rowDelete.id, { onSuccess: done, onError: err });
  };

  const tabs: { value: TabKey; label: string; badge?: number }[] = [
    {
      value: 'obligations',
      label: t.contract.tabs.obligations,
      badge: obligations.length,
    },
    {
      value: 'deliveries',
      label: t.contract.tabs.deliveries,
      badge: deliveries.length,
    },
    {
      value: 'payments',
      label: t.contract.tabs.payments,
      badge: payments.length,
    },
    { value: 'costs', label: t.contract.tabs.costs, badge: costs.length },
    { value: 'finance', label: t.contract.tabs.finance },
    { value: 'activity', label: t.contract.tabs.activity },
  ];

  return (
    <div>
      <PageHeader
        title={`${t.contract.one} № ${contract.number}`}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/contracts')}>
              <ArrowLeft className="h-4 w-4" />
              {t.common.back}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/contracts/${id}/edit`)}
            >
              <Pencil className="h-4 w-4" />
              {t.common.edit}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => setConfirmDelete(true)}
              aria-label={t.common.delete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        }
      />

      <Card className="mb-5 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <ContractStatusBadge status={contract.status} />
          <Badge tone="muted">
            {contract.our_role === 'seller'
              ? t.contract.roleSeller
              : t.contract.roleBuyer}
          </Badge>
          {contract.source === 'uzex' && <Badge tone="primary">UzEX</Badge>}
          {dLeft !== null && contract.status !== 'fulfilled' && (
            <Badge tone={dLeft < 0 ? 'destructive' : dLeft <= 7 ? 'warning' : 'muted'}>
              {dLeft < 0
                ? t.contract.overduePast(dLeft)
                : t.contract.overdueIn(dLeft)}
            </Badge>
          )}
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">{t.contract.company}</dt>
            <dd className="mt-0.5 font-medium">
              {contract.company?.name ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t.contract.organization}</dt>
            <dd className="mt-0.5 font-medium">
              {contract.organization?.name ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t.contract.signedDate}</dt>
            <dd className="mt-0.5 font-medium">
              {formatDate(contract.signed_date)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t.contract.deadline}</dt>
            <dd className="mt-0.5 font-medium">
              {formatDate(contract.deadline)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t.contract.totalAmount}</dt>
            <dd className="mt-0.5 font-semibold tabular-nums">
              {formatMoney(contract.total_amount, cur)}
            </dd>
          </div>
        </dl>
        {contract.subject && (
          <p className="mt-4 text-sm">
            <span className="text-muted-foreground">
              {t.contract.subject}:{' '}
            </span>
            {contract.subject}
          </p>
        )}
        {contract.note && (
          <p className="mt-2 text-sm text-muted-foreground">{contract.note}</p>
        )}
        {contract.external_url && (
          <a
            href={contract.external_url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {contract.external_ref || contract.external_url}
          </a>
        )}
      </Card>

      <Tabs tabs={tabs} value={tab} onChange={setTab} className="mb-4" />

      {tab === 'obligations' && (
        <Section
          onAdd={() => setObligationForm({ open: true, row: null })}
          empty={obligations.length === 0}
          emptyText={t.obligation.empty}
        >
          {obligations.map((o) => (
            <ListRow
              key={o.id}
              onEdit={() => setObligationForm({ open: true, row: o })}
              onDelete={() =>
                setRowDelete({ kind: 'obligation', id: o.id })
              }
            >
              <div className="flex items-center gap-2">
                <ObligationStatusBadge status={o.status} />
                {o.due_date && (
                  <span className="text-xs text-muted-foreground">
                    {formatDate(o.due_date)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm">{o.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {o.qty ? `${o.qty} ${o.unit ?? ''} · ` : ''}
                {o.amount ? formatMoney(o.amount, cur) : ''}
              </p>
            </ListRow>
          ))}
        </Section>
      )}

      {tab === 'deliveries' && (
        <Section
          onAdd={() => setDeliveryForm({ open: true, row: null })}
          empty={deliveries.length === 0}
          emptyText={t.delivery.empty}
        >
          {deliveries.map((d) => (
            <ListRow
              key={d.id}
              onEdit={() => setDeliveryForm({ open: true, row: d })}
              onDelete={() => setRowDelete({ kind: 'delivery', id: d.id })}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  {formatDate(d.date)}
                </span>
                <span className="tabular-nums text-sm font-semibold">
                  {formatMoney(d.amount, cur)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {d.qty ? `${d.qty} · ` : ''}
                {d.document_ref ?? ''} {d.note ? `· ${d.note}` : ''}
              </p>
            </ListRow>
          ))}
        </Section>
      )}

      {tab === 'payments' && (
        <Section
          onAdd={() => setPaymentForm({ open: true, row: null })}
          empty={payments.length === 0}
          emptyText={t.payment.empty}
        >
          {payments.map((p) => (
            <ListRow
              key={p.id}
              onEdit={() => setPaymentForm({ open: true, row: p })}
              onDelete={() => setRowDelete({ kind: 'payment', id: p.id })}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge tone={p.direction === 'in' ? 'success' : 'warning'}>
                    {p.direction === 'in' ? t.payment.in : t.payment.out}
                  </Badge>
                  <span className="text-sm">{formatDate(p.date)}</span>
                </div>
                <span className="tabular-nums text-sm font-semibold">
                  {formatMoney(p.amount, p.currency)}
                </span>
              </div>
              {p.purpose && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.purpose}
                </p>
              )}
            </ListRow>
          ))}
        </Section>
      )}

      {tab === 'costs' && (
        <Section
          onAdd={() => setCostForm({ open: true, row: null })}
          empty={costs.length === 0}
          emptyText={t.cost.empty}
        >
          {costs.map((c) => (
            <ListRow
              key={c.id}
              onEdit={() => setCostForm({ open: true, row: c })}
              onDelete={() => setRowDelete({ kind: 'cost', id: c.id })}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  {c.category ?? t.cost.one}
                </span>
                <span className="tabular-nums text-sm font-semibold text-destructive">
                  −{formatMoney(c.amount, c.currency)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(c.date)}
                {c.description ? ` · ${c.description}` : ''}
              </p>
            </ListRow>
          ))}
        </Section>
      )}

      {tab === 'finance' && <FinancePanel finance={finance} currency={cur} />}

      {tab === 'activity' && (
        <div className="space-y-1">
          {activity.length === 0 ? (
            <EmptyState title={t.activity.empty} />
          ) : (
            activity.map((a) => <ActivityItem key={a.id} item={a} />)
          )}
        </div>
      )}

      {/* Forms */}
      <ObligationForm
        open={obligationForm.open}
        onClose={() => setObligationForm({ open: false, row: null })}
        contractId={id}
        obligation={obligationForm.row}
      />
      <DeliveryForm
        open={deliveryForm.open}
        onClose={() => setDeliveryForm({ open: false, row: null })}
        contractId={id}
        obligations={obligations}
        delivery={deliveryForm.row}
      />
      <PaymentForm
        open={paymentForm.open}
        onClose={() => setPaymentForm({ open: false, row: null })}
        contractId={id}
        defaultCurrency={cur}
        payment={paymentForm.row}
      />
      <CostForm
        open={costForm.open}
        onClose={() => setCostForm({ open: false, row: null })}
        contractId={id}
        defaultCurrency={cur}
        cost={costForm.row}
      />

      <ConfirmDialog
        open={!!rowDelete}
        message={t.common.delete + '?'}
        loading={
          delObligation.isPending ||
          delDelivery.isPending ||
          delPayment.isPending ||
          delCost.isPending
        }
        onCancel={() => setRowDelete(null)}
        onConfirm={runRowDelete}
      />

      <ConfirmDialog
        open={confirmDelete}
        message={t.contract.deleteConfirm}
        loading={delContract.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          delContract.mutate(id, {
            onSuccess: () => {
              toast(t.common.deleted);
              navigate('/contracts');
            },
            onError: (e) => toast(e.message, 'error'),
          })
        }
      />
    </div>
  );
}

function Section({
  onAdd,
  empty,
  emptyText,
  children,
}: {
  onAdd: () => void;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          {t.common.add}
        </Button>
      </div>
      {empty ? (
        <EmptyState title={emptyText} />
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </div>
  );
}
