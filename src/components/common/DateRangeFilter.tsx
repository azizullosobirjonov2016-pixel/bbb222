import { t } from '@/i18n';
import { Input } from '@/components/ui/input';

interface Props {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  className?: string;
}

export function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
  className,
}: Props) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}>
      <Input
        type="date"
        value={from}
        onChange={(e) => onFromChange(e.target.value)}
        aria-label={t.common.from}
        className="w-[132px] min-w-0 flex-1 sm:w-[150px] sm:flex-none"
      />
      <span className="shrink-0 text-sm text-muted-foreground">
        {t.common.to}
      </span>
      <Input
        type="date"
        value={to}
        onChange={(e) => onToChange(e.target.value)}
        aria-label={t.common.to}
        className="w-[132px] min-w-0 flex-1 sm:w-[150px] sm:flex-none"
      />
    </div>
  );
}

/**
 * `date` (YYYY-MM-DD yoki to'liq ISO timestamp) maydoni bo'yicha oraliq
 * filtri. Timestamp berilsa, faqat sana qismi solishtiriladi.
 */
export function inDateRange(date: string, from: string, to: string): boolean {
  const d = date.slice(0, 10);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}
