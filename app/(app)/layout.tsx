import BottomNav from '@/components/app/bottom-nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-foreground">
      <main className="pb-28">{children}</main>
      <BottomNav />
    </div>
  )
}
