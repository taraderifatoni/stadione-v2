import { TopBar } from "@/components/shared/TopBar"
import { BottomNav } from "@/components/shared/BottomNav"

export const dynamic = "force-dynamic"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto w-full" style={{ borderLeft: "1px solid #2E2C2811", borderRight: "1px solid #2E2C2811" }}>
      <main className="flex-1">{children}</main>
      <BottomNav />
    </div>
  )
}
