"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function JuaraLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    router.push("/juara")
  }

  return (
    <section style={{ maxWidth: 420, margin: "40px auto", background: "#FFFFFF", border: "1px solid #E2E8F0", padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Masuk — JUARA.STADIONE.PRO</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
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
          {loading ? "Memproses..." : "Masuk"}
        </button>
      </form>
    </section>
  )
}
