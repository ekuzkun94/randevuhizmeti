import * as React from 'react'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = '', ...props }, ref) => (
    <label
      ref={ref}
      className={
        'block text-sm font-medium leading-6 text-foreground ' + className
      }
      {...props}
    >
      {props.children}
    </label>
  )
)
Label.displayName = 'Label' 