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
