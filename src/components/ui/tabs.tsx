import { cn } from '@/lib/utils';

interface TabsProps<T extends string> {
  tabs: { value: T; label: string; badge?: number }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: TabsProps<T>) {
  return (
    <div
      className={cn(
        'flex gap-1 overflow-x-auto border-b pb-px',
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            '-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors',
            value === tab.value
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.label}
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[11px] tabular-nums">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
