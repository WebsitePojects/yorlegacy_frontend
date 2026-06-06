import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export function ModeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="office-theme-pill"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {/* Sliding thumb — absolutely positioned inside the pill padding box */}
      <span
        className="office-theme-pill-thumb"
        aria-hidden="true"
        data-state={isDark ? 'dark' : 'light'}
      />

      <span className={`office-theme-pill-option${!isDark ? ' is-active' : ''}`}>
        <Sun className="office-theme-icon" aria-hidden="true" />
        {!compact && <span>Light</span>}
      </span>

      <span className={`office-theme-pill-option${isDark ? ' is-active' : ''}`}>
        <Moon className="office-theme-icon" aria-hidden="true" />
        {!compact && <span>Dark</span>}
      </span>
    </button>
  );
}
