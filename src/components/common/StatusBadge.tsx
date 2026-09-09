import { Badge } from '@/components/ui/badge';
import { t } from '@/i18n';
import type { ContractStatus, ObligationStatus } from '@/types/db';

const contractTone: Record<
  ContractStatus,
  'muted' | 'primary' | 'warning' | 'success' | 'destructive'
> = {
  draft: 'muted',
  active: 'primary',
  partially_fulfilled: 'warning',
  fulfilled: 'success',
  cancelled: 'destructive',
};

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  return (
    <Badge tone={contractTone[status]}>
      {t.contract.statusLabels[status]}
    </Badge>
  );
}

const obligationTone: Record<ObligationStatus, 'muted' | 'warning' | 'success'> = {
  pending: 'muted',
  partial: 'warning',
  done: 'success',
};

export function ObligationStatusBadge({
  status,
}: {
  status: ObligationStatus;
}) {
  return (
    <Badge tone={obligationTone[status]}>
      {t.obligation.statusLabels[status]}
    </Badge>
  );
}
