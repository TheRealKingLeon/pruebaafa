import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SectionTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export function SectionTitle({ as: Comp = 'h2', className, children, ...props }: SectionTitleProps) {
  return (
    <Comp
      className={cn(
        'uppercase tracking-wide text-3xl font-bold font-headline text-foreground mb-6 pb-2 border-b-2 border-primary',
        Comp === 'h1' && 'text-4xl',
        Comp === 'h3' && 'text-2xl',
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
