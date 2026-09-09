import {
  FilePlus2,
  FilePenLine,
  FileX2,
  RefreshCw,
  Download,
  Upload,
} from 'lucide-react';
import type { ActivityLog, ActivityAction } from '@/types/db';
import { t } from '@/i18n';
import { formatDateTime, timeAgo } from '@/lib/format';

const iconFor: Record<ActivityAction, typeof FilePlus2> = {
  create: FilePlus2,
  update: FilePenLine,
  delete: FileX2,
  status_change: RefreshCw,
  import: Download,
  export: Upload,
};

export function ActivityItem({ item }: { item: ActivityLog }) {
  const Icon = iconFor[item.action] ?? FilePenLine;
  const entity =
    t.activity.entityLabels[item.entity_type] ?? item.entity_type;
  const action = t.activity.actionLabels[item.action] ?? item.action;

  return (
    <div className="flex items-start gap-3 rounded-md px-2 py-2.5 hover:bg-muted/50">
      <div className="mt-0.5 rounded-md bg-muted p-1.5 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-medium">{entity}</span> {action}
          {item.summary ? (
            <span className="text-muted-foreground"> — {item.summary}</span>
          ) : null}
        </p>
        <p
          className="text-xs text-muted-foreground"
          title={formatDateTime(item.created_at)}
        >
          {timeAgo(item.created_at)}
        </p>
      </div>
    </div>
  );
}
