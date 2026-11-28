import type { ReactNode } from "react"
import type { Metadata } from "next"
import { Barlow, Barlow_Condensed } from "next/font/google"
import { SessionProvider } from "@/components/juara/SessionProvider"
import "./juara.css"

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
})

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
})

export const metadata: Metadata = {
  title: "JUARA — Stadione",
  description: "Ruang kerja eksekutif klub: visi, playbook, dan disiplin finansial.",
}

export default function JuaraLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`ju-root ${barlow.variable} ${barlowCondensed.variable}`} style={{ minHeight: "100dvh", background: "var(--canvas)", color: "var(--text)", fontFamily: "var(--font-body)" }}>
      <SessionProvider>{children}</SessionProvider>
    </div>
  )
}
