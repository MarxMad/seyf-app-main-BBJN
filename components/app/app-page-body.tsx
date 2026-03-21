import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function AppPageBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mx-auto max-w-lg px-6 pb-8 pt-3 text-foreground', className)}>
      {children}
    </div>
  )
}
