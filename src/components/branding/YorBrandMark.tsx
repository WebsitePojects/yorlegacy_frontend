import { cn } from '@/lib/utils';
import { pageAssets } from '@/config/pagePresets';

type YorBrandMarkProps = {
  alt?: string;
  className?: string;
  variant?: 'round' | 'showcase';
};

export function YorBrandMark({
  alt = 'Yor International logo',
  className,
  variant = 'round'
}: YorBrandMarkProps) {
  const src = variant === 'showcase' ? pageAssets.showcaseLogo : pageAssets.roundLogo;

  return <img alt={alt} className={cn('yor-brand-mark', `yor-brand-mark--${variant}`, className)} src={src} />;
}
