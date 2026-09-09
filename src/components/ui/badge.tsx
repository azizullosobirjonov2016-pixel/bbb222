import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Tone =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'muted';

const tones: Record<Tone, string> = {
  default: 'bg-secondary text-secondary-foreground',
  primary: 'bg-primary/10 text-primary ring-1 ring-inset ring-primary/20',
  success: 'bg-success/10 text-success ring-1 ring-inset ring-success/20',
  warning: 'bg-warning/10 text-warning ring-1 ring-inset ring-warning/25',
  destructive:
    'bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20',
  muted: 'bg-muted text-muted-foreground',
};

export function Badge({
  tone = 'default',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
