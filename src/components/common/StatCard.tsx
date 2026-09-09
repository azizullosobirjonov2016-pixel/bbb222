import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface Props {
  label: string;
  value: string;
  hint?: string;
  icon?: ComponentType<{ className?: string }>;
  tone?: 'default' | 'success' | 'destructive' | 'warning' | 'primary';
}

const toneText: Record<NonNullable<Props['tone']>, string> = {
  default: 'text-foreground',
  success: 'text-success',
  destructive: 'text-destructive',
  warning: 'text-warning',
  primary: 'text-primary',
};

export function StatCard({ label, value, hint, icon: Icon, tone = 'default' }: Props) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p
            className={cn(
              'mt-1 text-xl font-semibold tabular-nums sm:text-2xl',
              toneText[tone],
            )}
          >
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        {Icon && (
          <div className="rounded-md bg-muted p-2 text-muted-foreground">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </Card>
  );
}
