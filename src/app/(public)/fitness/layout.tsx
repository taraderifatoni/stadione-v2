import type { Metadata } from "next"

export const metadata: Metadata = { title: "Fitness & Membership | Stadione" }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
