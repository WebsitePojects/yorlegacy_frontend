import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAccountTypeLabel(accountType: string, paymentStatus?: string): string {
  if (accountType === 'CD') {
    return paymentStatus === 'unpaid' ? 'CD - Unpaid' : 'CD - Paid';
  }
  return accountType;
}

// All timestamps are stored in UTC but the business operates in Manila time
// (UTC+8). Display dates/times must be rendered in Asia/Manila so a 21:10 UTC
// record on the 14th reads as 05:10 on the 15th — never slice the raw ISO string.
export const APP_TIME_ZONE = 'Asia/Manila';

export function formatManilaDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

export function formatManilaDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date).replace(',', '');
}
