import type { ReactNode } from 'react';

export type NogaColor = 'amber' | 'blue' | 'emerald' | 'violet';

export const nogaColorMap: Record<NogaColor, { bg: string; text: string; glow: string; border: string }> = {
  amber:   { bg: 'bg-amber-500/15',   text: 'text-amber-600 dark:text-amber-400',   glow: 'shadow-amber-500/20',   border: 'border-amber-500/25' },
  blue:    { bg: 'bg-blue-500/15',    text: 'text-blue-600 dark:text-blue-400',    glow: 'shadow-blue-500/20',    border: 'border-blue-500/25' },
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', glow: 'shadow-emerald-500/20', border: 'border-emerald-500/25' },
  violet:  { bg: 'bg-violet-500/15',  text: 'text-violet-600 dark:text-violet-400',  glow: 'shadow-violet-500/20',  border: 'border-violet-500/25' }
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
