import * as React from 'react'
import { cn } from '@/lib/utils'
import { cva } from 'class-variance-authority'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'error' | 'success' | 'warning'
}

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "border-blue-200 bg-blue-50 text-blue-900",
        destructive:
          "border-red-200 bg-red-50 text-red-900",
        warning: "border-orange-200 bg-orange-50 text-orange-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export function Alert({ className, variant = 'default', ...props }: AlertProps) {
  return (
    <div
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
} 