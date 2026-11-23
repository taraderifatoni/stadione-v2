"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

function SignupForm() {
  const params = useSearchParams()
  const token = params.get("token")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [clubName, setClubName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <section style={{ maxWidth: 420, margin: "40px auto", background: "#FFFFFF", border: "1px solid #E2E8F0", padding: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Signup — JUARA.STADIONE.PRO</h1>
        <p style={{ color: "#DC2626", fontSize: 13 }}>Invite token diperlukan. Minta undangan dari Club Owner.</p>
      </section>
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { club_name: clubName, invite_token: token } },
    })
    setLoading(false)
    setPassword("")
    if (err) {
      setError(err.message)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <section style={{ maxWidth: 420, margin: "40px auto", background: "#FFFFFF", border: "1px solid #E2E8F0", padding: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Signup — JUARA.STADIONE.PRO</h1>
        <p style={{ color: "#059669", fontSize: 13 }}>Akun dibuat. Periksa email untuk konfirmasi, lalu masuk.</p>
      </section>
    )
  }

  return (
    <section style={{ maxWidth: 420, margin: "40px auto", background: "#FFFFFF", border: "1px solid #E2E8F0", padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Signup — JUARA.STADIONE.PRO</h1>
      <p style={{ fontSize: 12, color: "#475569", marginBottom: 12 }}>Hanya via undangan (invite-only).</p>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
          Nama klub
          <input value={clubName} onChange={(e) => setClubName(e.target.value)} required style={{ padding: 8, border: "1px solid #CBD5E1", borderRadius: 4 }} />
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: 8, border: "1px solid #CBD5E1", borderRadius: 4 }} />
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
          Kata sandi
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: 8, border: "1px solid #CBD5E1", borderRadius: 4 }} />
        </label>
        {error && <div style={{ color: "#DC2626", fontSize: 12 }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ padding: "10px 14px", background: "#064E3B", color: "#FFFFFF", border: "none", borderRadius: 4, fontSize: 13 }}>
          {loading ? "Memproses..." : "Buat akun"}
        </button>
      </form>
    </section>
  )
}

export default function JuaraSignupPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Memuat...</div>}>
      <SignupForm />
    </Suspense>
  )
}
