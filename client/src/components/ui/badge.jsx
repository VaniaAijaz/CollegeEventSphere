import { cva } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-violet-100 text-violet-700',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-red-100 text-red-700',
        outline: 'text-foreground',
        success: 'border-transparent bg-green-100 text-green-700',
        warning: 'border-transparent bg-amber-100 text-amber-700',
        info: 'border-transparent bg-blue-100 text-blue-700',
        technical: 'border-transparent bg-blue-100 text-blue-700',
        cultural: 'border-transparent bg-pink-100 text-pink-700',
        sports: 'border-transparent bg-green-100 text-green-700',
        seminar: 'border-transparent bg-amber-100 text-amber-700',
        workshop: 'border-transparent bg-orange-100 text-orange-700',
        annual: 'border-transparent bg-purple-100 text-purple-700',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
