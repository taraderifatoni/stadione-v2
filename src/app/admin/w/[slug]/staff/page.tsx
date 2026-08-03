"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { C } from "@/lib/design"
import { UserPlus, X, Users } from "lucide-react"

export default function WorkspaceStaff() {
  const { slug } = useParams<{ slug: string }>()
  const [staff, setStaff] = useState<any[]>([])
  const [showInvite, setShowInvite] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("staff")
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState("")
  const [venue, setVenue] = useState<any>(null)
  const [userNames, setUserNames] = useState<Record<string, string>>({})
  const supabase = createClient()

  useEffect(() => {
    supabase.from("venues").select("id").eq("slug", slug).single().then(async ({ data: v }: any) => {
      if (!v) return; setVenue(v)
      const { data: roles } = await supabase.from("venue_roles").select("user_id, role").eq("venue_id", v.id)
      setStaff(roles || [])
      // Try to get user emails via the REST API
      if (roles?.length) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          for (const r of roles) {
            const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/auth/users?select=email,raw_user_meta_data&id=eq.${r.user_id}`, {
              headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${session.access_token}` }
            })
            const users = await res.json()
            if (users?.[0]) {
              setUserNames(prev => ({ ...prev, [r.user_id]: users[0].raw_user_meta_data?.name || users[0].email || r.user_id.slice(0, 8) }))
            }
          }
        }
      }
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
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <Users size={14} color={C.primaryLight} />
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{staff.length} staff</span>
      </div>

      {staff.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>Belum ada staff. Undang staff baru untuk membantu mengelola venue.</div> :
        staff.map((s: any, i: number) => (
          <div key={i} style={{ background: C.surface, borderRadius: 14, padding: 12, border: `1px solid ${C.border}`, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{userNames[s.user_id] || "User"}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: s.role === "owner" ? C.dangerBg : s.role === "manager" ? C.successBg : C.primary + "22", color: s.role === "owner" ? C.danger : s.role === "manager" ? "#4CAF50" : C.primaryLight }}>{s.role}</span>
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
