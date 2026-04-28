'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AppPageBody } from '@/components/app/app-page-body'
import { AppBackLink } from '@/components/app/app-back-link'

const CLABE = '646180157000001234'
const BANCO = 'STP'
const BENEFICIARIO = 'Seyf SAPI de CV'
const REFERENCIA = 'SEYF-00142'

export default function DepositarPage() {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <AppPageBody>
      <AppBackLink href="/dashboard" />

      <div className="mb-8">
        <div className="mb-3 inline-flex rounded-full border border-[#d9e7e0] bg-white px-3 py-1.5 shadow-sm">
          <Image src="/SEYF.png" alt="Seyf" width={60} height={22} className="h-5 w-auto" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-foreground leading-none">
          Depositar
          <br />
          vía SPEI
        </h1>
        <p className="mt-4 text-base text-muted-foreground font-normal">
          Haz una transferencia desde tu banco con estos datos. Tu saldo se acreditará en minutos.
        </p>
      </div>

      <div className="mb-8 space-y-3">
        <DataRow label="Banco receptor" value={BANCO} />
        <DataRow label="Beneficiario" value={BENEFICIARIO} />

        <div className="rounded-[1.25rem] border border-[#c8ddd2] bg-[#edf6f2] p-4">
          <p className="mb-1 text-xs font-medium text-muted-foreground">CLABE interbancaria</p>
          <p className="text-xl font-bold tracking-widest text-foreground">{CLABE}</p>
          <button
            type="button"
            onClick={() => copy(CLABE, 'clabe')}
            className="mt-3 rounded-full bg-[#4f655b] px-4 py-2 text-xs font-bold text-white transition-all hover:bg-[#44584f]"
          >
            {copiedField === 'clabe' ? 'Copiado' : 'Copiar CLABE'}
          </button>
        </div>

        <div className="rounded-[1.25rem] border border-[#c8ddd2] bg-[#edf6f2] p-4">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Referencia / concepto</p>
          <p className="text-xl font-bold tracking-widest text-foreground">{REFERENCIA}</p>
          <button
            type="button"
            onClick={() => copy(REFERENCIA, 'ref')}
            className="mt-3 rounded-full bg-[#4f655b] px-4 py-2 text-xs font-bold text-white transition-all hover:bg-[#44584f]"
          >
            {copiedField === 'ref' ? 'Copiado' : 'Copiar referencia'}
          </button>
        </div>
      </div>

      <div className="mb-8 space-y-3 rounded-[1.5rem] border border-border bg-card/50 p-5">
        <p className="text-sm font-bold text-foreground">Cómo hacer la transferencia</p>
        {[
          'Abre la app de tu banco.',
          'Ve a «Transferir» o «Pagar».',
          'Ingresa la CLABE y la referencia.',
          'El monto mínimo es $500 MXN.',
          'Tu saldo aparecerá en minutos.',
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground ring-1 ring-border">
              {i + 1}
            </span>
            <p className="text-sm text-muted-foreground">{step}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Los depósitos SPEI pueden tardar hasta el siguiente día hábil en fines de semana o días festivos.
      </p>
    </AppPageBody>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[1.25rem] border border-border bg-card p-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-base font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}
