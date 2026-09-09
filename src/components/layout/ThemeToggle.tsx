import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

const options = [
  { value: 'light', icon: Sun, label: 'Yorugʻ' },
  { value: 'dark', icon: Moon, label: 'Qorongʻi' },
  { value: 'system', icon: Monitor, label: 'Tizim' },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="inline-flex rounded-md border bg-card p-0.5">
      {options.map((o) => {
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            onClick={() => setTheme(o.value)}
            title={o.label}
            aria-label={o.label}
            aria-pressed={theme === o.value}
            className={cn(
              'rounded p-1.5 transition-colors',
              theme === o.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
