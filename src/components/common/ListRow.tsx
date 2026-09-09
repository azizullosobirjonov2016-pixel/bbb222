import type { ReactNode } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { t } from '@/i18n';

interface Props {
  children: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ListRow({ children, onEdit, onDelete }: Props) {
  return (
    <Card className="flex items-start justify-between gap-3 p-3 sm:p-4">
      <div className="min-w-0 flex-1">{children}</div>
      {(onEdit || onDelete) && (
        <div className="flex shrink-0 gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onEdit}
              aria-label={t.common.edit}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={onDelete}
              aria-label={t.common.delete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
