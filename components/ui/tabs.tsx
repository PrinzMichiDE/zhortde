'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const Tabs = React.forwardRef<
  HTMLDivElement,
  { value: string; onValueChange: (value: string) => void; children: React.ReactNode; className?: string }
>(({ value, onValueChange, children, className }) => (
  <div className={cn('', className)} data-value={value}>
    {React.Children.map(children, child =>
      React.isValidElement(child)
        ? React.cloneElement(child as React.ReactElement<{ value: string; onValueChange?: (value: string) => void }>, { value, onValueChange })
        : child
    )}
  </div>
));

const TabsList = React.forwardRef<
  HTMLDivElement,
  { children: React.ReactNode; className?: string }
>(({ className, children }) => (
  <div
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
      className
    )}
  >
    {children}
  </div>
));

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  { value: string; children: React.ReactNode; className?: string; 'data-value'?: string; 'onValueChange'?: (value: string) => void; [key: string]: any }
>(({ value, children, className, 'data-value': parentValue, 'onValueChange': parentOnChange, ...props }) => {
  const handleClick = () => {
    parentOnChange?.(value);
  };

  return (
    <button
      type="button"
      role="tab"
      aria-selected={parentValue === value}
      data-state={parentValue === value ? 'active' : 'inactive'}
      onClick={handleClick}
      {...props}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        parentValue === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
        className
      )}
    >
      {children}
    </button>
  );
});

const TabsContent = React.forwardRef<
  HTMLDivElement,
  { value: string; children: React.ReactNode; className?: string; 'data-value'?: string; 'onValueChange'?: (value: string) => void; [key: string]: any }
>(({ value, children, className, 'data-value': parentValue, 'onValueChange': parentOnChange, ...props }) => {
  const isActive = parentValue === value;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      data-state="active"
      {...props}
      className={cn('mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', className)}
    >
      {children}
    </div>
  );
});

export { Tabs, TabsList, TabsTrigger, TabsContent };
