import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ZhortLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 28, text: 'text-base' },
  md: { icon: 32, text: 'text-lg' },
  lg: { icon: 40, text: 'text-xl' },
} as const;

export function ZhortLogo({ size = 'md', showWordmark = true, className }: ZhortLogoProps) {
  const { icon, text } = sizeMap[size];

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Image
        src="/logo.svg"
        alt=""
        width={icon}
        height={icon}
        className="rounded-md shrink-0"
        priority
      />
      {showWordmark && (
        <span className={cn('font-bold text-foreground tracking-tight', text)}>Zhort</span>
      )}
    </span>
  );
}
