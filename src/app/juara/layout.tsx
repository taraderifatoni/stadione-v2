import type { ReactNode } from "react"
import type { Metadata } from "next"
import { SessionProvider } from "@/components/juara/SessionProvider"
import "./juara.css"

export const metadata: Metadata = {
  title: "JUARA — Stadione",
  description: "Ruang kerja eksekutif klub: visi, playbook, dan disiplin finansial.",
}

export default function JuaraLayout({ children }: { children: ReactNode }) {
  return (
    <div className="ju-root">
      <SessionProvider>{children}</SessionProvider>
    </div>
  )
}
