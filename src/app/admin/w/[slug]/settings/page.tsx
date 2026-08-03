"use client"

import { useState } from "react"
import { useVenue } from "../layout"
import { C } from "@/lib/design"
import { Settings, Users, Share2 } from "lucide-react"

export default function WorkspaceSettings() {
  const ctx = useVenue()
  const [msg, setMsg] = useState("")

  if (!ctx) return null

  function copyInviteLink() {
    const link = `https://stadione.pro/invite?venue=${ctx?.venue?.slug}`
    navigator.clipboard.writeText(link).then(() => {
      setMsg("Link invite disalin!")
      setTimeout(() => setMsg(""), 3000)
    })
  }

  return (
    <div style={{ padding: 16 }}>
      {msg && <div style={{ background: "#1B3A1D", color: "#4CAF50", padding: 10, borderRadius: 10, fontSize: 13, textAlign: "center", marginBottom: 12 }}>{msg}</div>}

      <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Settings size={18} color={C.primaryLight} />
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Informasi Venue</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12, color: C.textMuted }}>Nama</span><span style={{ fontSize: 13, color: C.text }}>{ctx.venue.name}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12, color: C.textMuted }}>Slug</span><span style={{ fontSize: 13, color: C.text }}>{ctx.venue.slug}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12, color: C.textMuted }}>Kota</span><span style={{ fontSize: 13, color: C.text }}>{ctx.venue.city || "-"}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12, color: C.textMuted }}>Role Anda</span><span style={{ fontSize: 13, color: C.accent }}>{ctx.role}</span></div>
      </div>

      <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Users size={18} color={C.primaryLight} />
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Undang Staff</span>
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>Bagikan link ini untuk mengundang staff ke venue Anda:</div>
        <button onClick={copyInviteLink} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Share2 size={14} />Salin Link Invite
        </button>
      </div>
    </div>
  )
}
