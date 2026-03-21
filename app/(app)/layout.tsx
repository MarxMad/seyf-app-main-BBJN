import AppTopBar from '@/components/app/app-top-bar'
import BottomNav from '@/components/app/bottom-nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased">
      <AppTopBar />
      <main className="pb-28">{children}</main>
      <BottomNav />
    </div>
  )
}
