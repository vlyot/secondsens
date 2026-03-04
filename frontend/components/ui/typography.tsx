import { cn } from '@/lib/utils';
import type { ComponentPropsWithoutRef } from 'react';

/**
 * Typography Components - Composable text styling following shadcn/ui patterns
 *
 * These components provide semantic, reusable typography styles using Tailwind CSS.
 * Each component combines multiple utility classes for consistent spacing and styling.
 *
 * Reference: https://ui.shadcn.com/docs/components/typography
 */

export function H1({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'h1'>) {
  return (
    <h1
      className={cn(
        'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

export function H2({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'h2'>) {
  return (
    <h2
      className={cn(
        'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

export function H3({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'h3'>) {
  return (
    <h3
      className={cn('scroll-m-20 text-2xl font-semibold tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function H4({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'h4'>) {
  return (
    <h4
      className={cn('scroll-m-20 text-xl font-semibold tracking-tight', className)}
      {...props}
    >
      {children}
    </h4>
  );
}

export function P({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'p'>) {
  return (
    <p
      className={cn('leading-7 [&:not(:first-child)]:mt-6', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function Lead({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'p'>) {
  return (
    <p
      className={cn('text-xl text-muted-foreground', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function Large({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn('text-lg font-semibold', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function Small({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'small'>) {
  return (
    <small
      className={cn('text-sm font-medium leading-none', className)}
      {...props}
    >
      {children}
    </small>
  );
}

export function Muted({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'p'>) {
  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function Code({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'code'>) {
  return (
    <code
      className={cn(
        'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
        className
      )}
      {...props}
    >
      {children}
    </code>
  );
}

export function Blockquote({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'blockquote'>) {
  return (
    <blockquote
      className={cn('mt-6 border-l-2 pl-6 italic', className)}
      {...props}
    >
      {children}
    </blockquote>
  );
}

export function List({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'ul'>) {
  return (
    <ul
      className={cn('my-6 ml-6 list-disc [&>li]:mt-2', className)}
      {...props}
    >
      {children}
    </ul>
  );
}

export function ListItem({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'li'>) {
  return (
    <li className={cn('', className)} {...props}>
      {children}
    </li>
  );
}

export function Display({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'h2'>) {
  return (
    <h2
      className={cn('text-3xl font-bold tracking-tight', className)}
      {...props}
    >
      {children}
    </h2>
  );
}

export function PriceDisplay({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      className={cn('text-2xl font-bold text-primary', className)}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatDisplay({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn('text-lg font-bold text-primary', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function Medium({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'span'>) {
  return (
    <span className={cn('font-medium', className)} {...props}>
      {children}
    </span>
  );
}

export function Emoji({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'span'>) {
  return (
    <span className={cn('text-2xl', className)} {...props}>
      {children}
    </span>
  );
}
