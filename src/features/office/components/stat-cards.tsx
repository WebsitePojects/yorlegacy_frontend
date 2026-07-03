import type { ReactNode } from 'react';

export type NogaColor = 'amber' | 'blue' | 'emerald' | 'violet';

export const nogaColorMap: Record<NogaColor, { bg: string; text: string; glow: string; border: string }> = {
  amber:   { bg: 'bg-[var(--office-tone-amber-bg)]',   text: 'text-[var(--office-tone-amber-text)]',   glow: 'shadow-[0_16px_34px_var(--office-tone-amber-shadow)]',   border: 'border-[var(--office-tone-amber-border)]' },
  blue:    { bg: 'bg-[var(--office-tone-blue-bg)]',    text: 'text-[var(--office-tone-blue-text)]',    glow: 'shadow-[0_16px_34px_var(--office-tone-blue-shadow)]',    border: 'border-[var(--office-tone-blue-border)]' },
  emerald: { bg: 'bg-[var(--office-tone-emerald-bg)]', text: 'text-[var(--office-tone-emerald-text)]', glow: 'shadow-[0_16px_34px_var(--office-tone-emerald-shadow)]', border: 'border-[var(--office-tone-emerald-border)]' },
  violet:  { bg: 'bg-[var(--office-tone-violet-bg)]',  text: 'text-[var(--office-tone-violet-text)]',  glow: 'shadow-[0_16px_34px_var(--office-tone-violet-shadow)]',  border: 'border-[var(--office-tone-violet-border)]' }
};

export function NogaStatCard({
  icon,
  color,
  label,
  value,
  sub
}: {
  icon: ReactNode;
  color: NogaColor;
  label: string;
  value: string;
  sub?: string;
}) {
  const { bg, text, glow, border } = nogaColorMap[color];
  return (
    <div className={`flex items-start gap-3 rounded-2xl border ${border} bg-[var(--card)] p-4 shadow-md ${glow}`}>
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${bg} ${text}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
        <p className={`mt-0.5 truncate text-base font-semibold ${text}`}>{value}</p>
        {sub ? <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">{sub}</p> : null}
      </div>
    </div>
  );
}

export function InfoRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm odd:bg-[var(--accent)]/40">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <strong className={highlight ? 'font-semibold text-amber-600 dark:text-amber-300' : 'font-medium text-[var(--foreground)]'}>{value}</strong>
    </div>
  );
}
