import type { Metadata } from "next"

export const metadata: Metadata = { title: "Booking Lapangan | Stadione" }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
