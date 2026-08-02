"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { C } from "@/lib/design"
import { UserPlus, X } from "lucide-react"

export default function WorkspaceStaff() {
  const { slug } = useParams<{ slug: string }>()
  const [staff, setStaff] = useState<any[]>([])
  const [showInvite, setShowInvite] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("staff")
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState("")
  const [venue, setVenue] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.from("venues").select("id").eq("slug", slug).single().then(({ data: v }: any) => {
      if (!v) return; setVenue(v)
      supabase.from("venue_roles").select("user_id, role").eq("venue_id", v.id).then(({ data }: any) => setStaff(data || []))
    })
  }, [slug])

  async function handleInvite() {
    if (!email || !venue) return
    setSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    await fetch("/api/staff/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, venueId: venue.id, role, invitedBy: user?.id }),
    })
    setMsg(`Undangan dikirim ke ${email}`)
    setEmail(""); setSending(false); setShowInvite(false)
    setTimeout(() => setMsg(""), 3000)
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 10 }}>{staff.length} staff</div>

      {staff.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>Belum ada staff</div> :
        staff.map((s: any, i: number) => (
          <div key={i} style={{ background: C.surface, borderRadius: 14, padding: 12, border: `1px solid ${C.border}`, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{s.user_id?.slice(0, 8)}...</div></div>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: C.primary + "22", color: C.primaryLight }}>{s.role}</span>
          </div>
        ))}

      {msg && <div style={{ fontSize: 12, color: "#4CAF50", marginBottom: 12, textAlign: "center" }}>{msg}</div>}

      {showInvite && (
        <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Undang staff</span>
            <X size={16} color={C.textMuted} onClick={() => setShowInvite(false)} style={{ cursor: "pointer" }} />
          </div>
          <input placeholder="Email staff" value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%", padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
          <select value={role} onChange={e => setRole(e.target.value)} style={{ width: "100%", padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 8 }}>
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="coach">Coach</option>
          </select>
          <button onClick={handleInvite} disabled={sending || !email} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: sending || !email ? 0.7 : 1 }}>
            {sending ? "Mengirim..." : "Kirim undangan"}
          </button>
        </div>
      )}

      <button onClick={() => setShowInvite(true)} style={{ width: "100%", padding: "12px 20px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12 }}><UserPlus size={16} />Undang staff baru</button>
    </div>
  )
}
