"use client"

import { useState } from "react"
import { useVenue } from "../layout"
import { createClient } from "@/lib/supabase/client"
import { C } from "@/lib/design"
import { Settings, Users, Share2, Send } from "lucide-react"

export default function WorkspaceSettings() {
  const ctx = useVenue()
  const supabase = createClient()
  const [msg, setMsg] = useState("")
  const [err, setErr] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("staff")
  const [sending, setSending] = useState(false)

  if (!ctx) return null

  async function sendInvite() {
    if (!inviteEmail) { setErr("Masukkan email"); return }
    setSending(true); setErr("")
    const { data: { user } } = await supabase.auth.getUser()
    const res = await fetch("/api/staff/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, venueId: ctx.venue.id, role: inviteRole, invitedBy: user?.id }),
    })
    const data = await res.json()
    if (data.success) {
      setMsg(`Undangan dikirim ke ${inviteEmail}`)
      setInviteEmail("")
    } else {
      setErr(data.error || "Gagal mengirim undangan")
    }
    setSending(false)
    setTimeout(() => setMsg(""), 4000)
  }

  return (
    <div style={{ padding: 16 }}>
      {msg && <div style={{ background: "#1B3A1D", color: "#4CAF50", padding: 10, borderRadius: 10, fontSize: 13, textAlign: "center", marginBottom: 12 }}>{msg}</div>}
      {err && <div style={{ background: "#3A1515", color: "#C62828", padding: 10, borderRadius: 10, fontSize: 13, textAlign: "center", marginBottom: 12 }}>{err}</div>}

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

      <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Users size={18} color={C.primaryLight} />
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Undang Staff</span>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 12, color: C.textSec, marginBottom: 4, display: "block" }}>Email</label>
          <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="staff@example.com" style={{ width: "100%", padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, color: C.textSec, marginBottom: 4, display: "block" }}>Role</label>
          <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{ width: "100%", padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }}>
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
          </select>
        </div>
        <button onClick={sendInvite} disabled={sending} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Send size={14} />{sending ? "Mengirim..." : "Kirim Undangan"}
        </button>
      </div>
    </div>
  )
}
