'use client'

import { useEffect } from 'react'
import { AppPageBody } from '@/components/app/app-page-body'
import { Button } from '@/components/ui/button'

export default function IdentidadError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[identidad] route error', error)
  }, [error])

  return (
    <AppPageBody className="space-y-6 pt-6">
      <section className="rounded-[1.5rem] border border-destructive/30 bg-destructive/10 p-5">
        <h1 className="text-xl font-black tracking-tight text-foreground">Algo salió mal</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No pudimos cargar la verificación de identidad en este momento.
        </p>
        <div className="mt-5 flex gap-3">
          <Button type="button" className="rounded-full" onClick={() => reset()}>
            Reintentar
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => {
              window.location.assign('/dashboard')
            }}
          >
            Ir al dashboard
          </Button>
        </div>
      </section>
    </AppPageBody>
  )
}
