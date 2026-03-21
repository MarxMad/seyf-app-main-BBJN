'use client'

import AcceslyWalletPanel from '@/components/accesly-wallet-panel'
import HeroSection from '@/components/hero-section'

export default function Home() {
  return (
    <main className="h-screen overflow-y-auto snap-y snap-mandatory">
      <section className="h-screen snap-start">
        <HeroSection />
      </section>
      <section className="min-h-screen snap-start">
        <AcceslyWalletPanel />
      </section>
    </main>
  )
}
