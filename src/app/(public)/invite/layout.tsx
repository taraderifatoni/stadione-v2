import type { Metadata } from "next"

export const metadata: Metadata = { title: "Undangan Staff | Stadione" }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
