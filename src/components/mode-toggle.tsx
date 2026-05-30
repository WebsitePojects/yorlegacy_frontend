import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const themeOptions = [
  { key: 'light', label: 'Light', icon: Sun },
  { key: 'dark', label: 'Dark', icon: Moon }
] as const;

export function ModeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--card)] p-1 shadow-sm">
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const active = theme === option.key;
        return (
          <Button
            key={option.key}
            type="button"
            size={compact ? 'icon' : 'sm'}
            variant={active ? 'secondary' : 'ghost'}
            className={cn('h-8 gap-1.5 px-2.5', compact && 'w-8 px-0')}
            onClick={() => setTheme(option.key)}
          >
            <Icon className="size-4" />
            {compact ? <span className="sr-only">{option.label}</span> : <span>{option.label}</span>}
          </Button>
        );
      })}
    </div>
  );
}
