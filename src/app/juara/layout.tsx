import type { ReactNode } from "react"
import { SessionProvider } from "@/components/juara/SessionProvider"

const WORKSPACES = [
  "Boardroom Inbox",
  "Owner Vision & Playbook",
  "Squad & Depth Chart",
  "Tactics & DNA Matrix",
  "Academy & Pathway",
  "Scouting & Recruitment",
  "Finances & SCR Monitor",
  "Commercial & Sponsors",
  "Club Vault & Governance",
]

const TICKER = [
  "Playbook Alignment",
  "SCR",
  "Transfer CapEx",
  "Wage Budget",
  "Weighted Age",
  "Horizon",
]

export default function JuaraLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
    <div style={{ minHeight: "100vh", background: "#F8FAFC", color: "#0F172A", fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <aside style={{ width: 220, background: "#0F172A", color: "#F8FAFC", padding: 16, flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: "#D97706", marginBottom: 20 }}>JUARA</div>
          <nav>
            {WORKSPACES.map((name) => (
              <div key={name} style={{ padding: "8px 6px", fontSize: 12, opacity: 0.9 }}>
                {name}
              </div>
            ))}
          </nav>
        </aside>
        <div style={{ flex: 1, minWidth: 0 }}>
          <header style={{ height: 56, background: "#064E3B", color: "#F8FAFC", display: "flex", alignItems: "center", gap: 24, padding: "0 16px" }}>
            {TICKER.map((label) => (
              <span key={label} style={{ fontSize: 11, opacity: 0.85 }}>{label}: —</span>
            ))}
          </header>
          <div style={{ height: 40, background: "#FFFFFF", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", padding: "0 16px", gap: 16, fontSize: 12 }}>
            <span style={{ fontWeight: 600 }}>Ringkasan</span>
            <span>Skuad</span>
            <span>Keuangan</span>
          </div>
          <main style={{ padding: 16 }}>{children}</main>
          <footer style={{ height: 48, background: "#FFFFFF", borderTop: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 12, padding: "0 16px", fontSize: 12 }}>
            <button type="button" disabled style={{ opacity: 0.5 }}>What-If Sandbox</button>
            <button type="button" disabled style={{ opacity: 0.5 }}>Compare Baseline</button>
            <button type="button" disabled style={{ opacity: 0.5 }}>Lock Snapshot</button>
            <button type="button" disabled style={{ opacity: 0.5 }}>Generate Boardroom PDF</button>
          </footer>
        </div>
      </div>
    </div>
    </SessionProvider>
  )
}
