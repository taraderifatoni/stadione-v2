"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { C } from "@/lib/design"
import { TopBar } from "@/components/shared/TopBar"
import { ChevronLeft, CheckCircle, Building2, Users, LogIn } from "lucide-react"
import Link from "next/link"

export default function InvitePage() {
  const [user, setUser] = useState<any>(null)
  const [invite, setInvite] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  useEffect(() => {
    if (!token) { setError("Token undangan tidak ditemukan"); setLoading(false); return }
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user)
      // Fetch invite info
      supabase.from("staff_invites").select("*, venues(name, slug)").eq("token", token).eq("status", "pending").single().then(({ data: inv }: any) => {
        setInvite(inv || null)
        setLoading(false)
      })
    })
  }, [token])

  async function handleAccept() {
    if (!user || !invite) return
    setAccepting(true)
    const res = await fetch("/api/staff/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, userId: user.id }),
    })
    const data = await res.json()
    if (data.success) {
      setDone(true)
      setTimeout(() => router.push(`/admin/w/${invite.venues.slug}`), 2000)
    } else {
      setError(data.error || "Gagal menerima undangan")
    }
    setAccepting(false)
  }

  if (loading) return <div><TopBar title="Undangan Staff" /><div style={{ textAlign: "center", padding: 60, color: C.textMuted }}>Loading...</div></div>

  return (
    <div>
      <TopBar title="Undangan Staff" left={<ChevronLeft size={20} color={C.text} onClick={() => router.push("/")} style={{ cursor: "pointer" }} />} />
      <div style={{ padding: "0 16px 16px", maxWidth: 400, margin: "0 auto" }}>
        {error && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 8 }}>{error}</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>Token undangan tidak valid atau sudah kadaluarsa.</div>
            <Link href="/" style={{ display: "inline-block", marginTop: 16, padding: "10px 24px", borderRadius: 10, background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Kembali ke Beranda</Link>
          </div>
        )}

        {done && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <CheckCircle size={48} color="#4CAF50" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>Undangan Diterima!</div>
            <div style={{ fontSize: 13, color: C.textMuted }}>Mengarahkan ke dashboard venue...</div>
          </div>
        )}

        {invite && !done && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: C.primary + "18", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={28} color={C.primaryLight} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>{invite.venues?.name}</div>
            <div style={{ fontSize: 14, color: C.accent }}>Sebagai <strong>{invite.role}</strong></div>

            {!user ? (
              <div style={{ marginTop: 24, padding: "16px", background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 12 }}>Login dulu untuk menerima undangan ini.</div>
                <Link href={`/login?redirect=/invite?token=${token}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "12px", borderRadius: 10, background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                  <LogIn size={16} />Login
                </Link>
              </div>
            ) : (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 4 }}>Login sebagai</div>
                <div style={{ fontSize: 14, color: C.text, marginBottom: 16 }}>{user.email}</div>
                <button onClick={handleAccept} disabled={accepting} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "#2E7D32", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <CheckCircle size={16} />{accepting ? "Menerima..." : "Terima Undangan"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
