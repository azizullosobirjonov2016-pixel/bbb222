import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { t } from '@/i18n';
import { useContract } from '@/api/contracts';
import { useContractFinance } from '@/api/finance';
import { useObligations } from '@/api/obligations';
import { useDeliveries } from '@/api/deliveries';
import { usePayments } from '@/api/payments';
import { useCosts } from '@/api/costs';
import { useBeneficiaries } from '@/api/beneficiaries';
import { formatDate, formatMoney } from '@/lib/format';

export function ContractPrint() {
  const { id = '' } = useParams();
  const { data: contract, isLoading } = useContract(id);
  const { data: finance } = useContractFinance(id);
  const { data: obligations = [] } = useObligations(id);
  const { data: deliveries = [] } = useDeliveries(id);
  const { data: payments = [] } = usePayments(id);
  const { data: costs = [] } = useCosts(id);
  const { data: beneficiaries = [] } = useBeneficiaries(id);

  const ready = !isLoading && !!contract;

  useEffect(() => {
    if (ready) {
      const timer = setTimeout(() => window.print(), 300);
      return () => clearTimeout(timer);
    }
  }, [ready]);

  if (isLoading || !contract) {
    return (
      <p className="p-8 text-sm text-muted-foreground">{t.common.loading}</p>
    );
  }

  const cur = contract.currency;

  return (
    <div className="mx-auto max-w-3xl p-8 text-sm text-black print:p-0">
      <h1 className="text-xl font-bold">
        {t.contract.one} № {contract.number}
      </h1>
      <p className="mt-1 text-xs text-gray-500">
        {t.app.name} · {formatDate(new Date().toISOString())}
      </p>

      <Section title={t.contract.title}>
        <Row label={t.contract.company} value={contract.company?.name ?? '—'} />
        <Row
          label={t.contract.organization}
          value={contract.organization?.name ?? '—'}
        />
        <Row
          label={t.contract.signedDate}
          value={formatDate(contract.signed_date)}
        />
        <Row
          label={t.contract.deadline}
          value={formatDate(contract.deadline)}
        />
        <Row
          label={t.contract.totalAmount}
          value={formatMoney(contract.total_amount, cur)}
        />
        <Row
          label={t.contract.status}
          value={t.contract.statusLabels[contract.status]}
        />
        {contract.subject && (
          <Row label={t.contract.subject} value={contract.subject} />
        )}
      </Section>

      {obligations.length > 0 && (
        <Section title={t.contract.tabs.obligations}>
          <Table
            head={[
              t.obligation.description,
              t.obligation.qty,
              t.obligation.amount,
            ]}
            rows={obligations.map((o) => [
              o.description,
              o.qty ? `${o.qty} ${o.unit ?? ''}` : '—',
              o.amount ? formatMoney(o.amount, cur) : '—',
            ])}
          />
        </Section>
      )}

      {deliveries.length > 0 && (
        <Section title={t.contract.tabs.deliveries}>
          <Table
            head={[t.delivery.date, t.delivery.documentRef, t.delivery.amount]}
            rows={deliveries.map((d) => [
              formatDate(d.date),
              d.document_ref ?? '—',
              formatMoney(d.amount, cur),
            ])}
          />
        </Section>
      )}

      {payments.length > 0 && (
        <Section title={t.contract.tabs.payments}>
          <Table
            head={[t.payment.date, t.payment.direction, t.payment.amount]}
            rows={payments.map((p) => [
              formatDate(p.date),
              p.direction === 'in' ? t.payment.in : t.payment.out,
              formatMoney(p.amount, p.currency),
            ])}
          />
        </Section>
      )}

      {costs.length > 0 && (
        <Section title={t.contract.tabs.costs}>
          <Table
            head={[t.cost.date, t.cost.category, t.cost.amount]}
            rows={costs.map((c) => [
              formatDate(c.date),
              c.category ?? '—',
              formatMoney(c.amount, c.currency),
            ])}
          />
        </Section>
      )}

      {beneficiaries.length > 0 && (
        <Section title={t.contract.tabs.beneficiaries}>
          <Table
            head={[
              t.beneficiary.date,
              t.beneficiary.name,
              t.beneficiary.amount,
            ]}
            rows={beneficiaries.map((b) => [
              formatDate(b.date),
              b.name,
              formatMoney(b.amount, b.currency),
            ])}
          />
        </Section>
      )}

      {finance && (
        <Section title={t.contract.tabs.finance}>
          <Row
            label={t.finance.revenue}
            value={formatMoney(finance.revenue, cur)}
          />
          <Row
            label={t.finance.spent}
            value={formatMoney(finance.spent, cur)}
          />
          <Row
            label={finance.profit >= 0 ? t.finance.profit : t.finance.loss}
            value={formatMoney(finance.profit, cur)}
          />
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6 break-inside-avoid">
      <h2 className="border-b border-gray-300 pb-1 text-sm font-semibold uppercase tracking-wide text-gray-700">
        {title}
      </h2>
      <div className="mt-2 space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr>
          {head.map((h) => (
            <th
              key={h}
              className="border-b border-gray-300 py-1 text-left font-semibold text-gray-600"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j} className="border-b border-gray-100 py-1">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
