'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'

/**
 * Carga el PollarProvider solo en el browser (ssr: false).
 * El SDK de Pollar usa APIs de browser (window, SubtleCrypto, etc.)
 * que no existen en Node, por eso no puede renderizarse en el servidor.
 *
 * Este wrapper Client Component es necesario porque next/dynamic con
 * ssr: false solo está permitido dentro de Client Components.
 */
const SeyfPollarProvider = dynamic(
  () => import('./pollar-provider'),
  { ssr: false },
)

export default function PollarProviderClient({ children }: { children: ReactNode }) {
  return <SeyfPollarProvider>{children}</SeyfPollarProvider>
}
