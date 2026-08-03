import type { Metadata } from "next"

export const metadata: Metadata = { title: "Daftar Venue | Stadione" }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
