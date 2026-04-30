'use client'

import { AppPageBody } from '@/components/app/app-page-body'
import { AppBackLink } from '@/components/app/app-back-link'
import { ClabeDisplayCard } from '@/components/app/clabe-display-card'

export default function DepositarPage() {
  return (
    <AppPageBody>
      <AppBackLink href="/dashboard" />

      <div className="mb-6">
        <h1 className="text-4xl font-black tracking-tight text-foreground leading-none">
          Depositar
          <br />
          vía SPEI
        </h1>
        <p className="mt-4 text-base text-muted-foreground font-normal">
          Usa tu CLABE personal para recibir transferencias desde cualquier banco mexicano.
        </p>
      </div>

      <ClabeDisplayCard />
    </AppPageBody>
  )
}
