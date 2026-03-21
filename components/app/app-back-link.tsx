import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export function AppBackLink({
  href,
  children = 'Regresar',
}: {
  href: string
  children?: string
}) {
  return (
    <Link
      href={href}
      className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
    >
      <ChevronLeft className="size-4 shrink-0" strokeWidth={2.25} />
      {children}
    </Link>
  )
}
