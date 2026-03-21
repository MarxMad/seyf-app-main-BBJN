'use client'

import { ReactNode } from 'react'
import { AcceslyProvider } from 'accesly'

type Props = {
  children: ReactNode
}

const APP_ID_FALLBACK = 'acc_d14d0c23b0ce196a5b3f8b33'

export default function SeyfAcceslyProvider({ children }: Props) {
  const appId = process.env.NEXT_PUBLIC_ACCESLY_APP_ID ?? APP_ID_FALLBACK
  const network =
    (process.env.NEXT_PUBLIC_ACCESLY_NETWORK as 'testnet' | 'mainnet' | undefined) ??
    'testnet'

  return (
    <AcceslyProvider
      appId={appId}
      network={network}
      theme="dark"
      onConnect={(wallet) => {
        console.log('Accesly connected:', wallet?.stellarAddress)
      }}
      onDisconnect={() => {
        console.log('Accesly disconnected')
      }}
    >
      {children}
    </AcceslyProvider>
  )
}
