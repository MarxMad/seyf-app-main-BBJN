import { notFound } from 'next/navigation'
import { isEtherfuseDevPanelEnabled } from '@/lib/seyf/etherfuse-dev-panel'
import EtherfuseOfframpDevClient from './etherfuse-offramp-dev-client'

export default function EtherfuseOfframpDevPage() {
  if (!isEtherfuseDevPanelEnabled()) {
    notFound()
  }
  return <EtherfuseOfframpDevClient />
}
