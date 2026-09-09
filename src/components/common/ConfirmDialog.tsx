import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';

interface Props {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title = t.common.confirm,
  message,
  confirmText = t.common.delete,
  loading,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Dialog open={open} onClose={onCancel} title={title} size="sm">
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          {t.common.cancel}
        </Button>
        <Button variant="destructive" onClick={onConfirm} loading={loading}>
          {confirmText}
        </Button>
      </div>
    </Dialog>
  );
}
