import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'error' | 'success' | 'warning'
}

export function Alert({ className, variant = 'default', ...props }: AlertProps) {
  let color = ''
  if (variant === 'error') color = 'bg-destructive text-destructive-foreground'
  else if (variant === 'success') color = 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100'
  else if (variant === 'warning') color = 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100'
  else color = 'bg-muted text-muted-foreground'
  return (
    <div className={cn('rounded-md p-4 mb-2', color, className)} {...props} />
  )
} 