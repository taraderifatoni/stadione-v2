"use client"

import { C } from "@/lib/design"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg }}>
      {children}
    </div>
  )
}
