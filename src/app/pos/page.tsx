"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"

export default function PosPage() {
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { supabase, signOut } = useAuth()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) setUser(data.user) })
  }, [])

  if (!user) return (
    <div style={{ minHeight: "100vh", background: "#0D0D0D" }}>
      <div style={{ background: "#84102D", padding: "12px 16px", textAlign: "center" }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: 2 }}>STADIONE POS</span>
      </div>
      <div style={{ maxWidth: 400, margin: "40px auto", padding: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#F5F0E8" }}>Masuk POS</div>
          <div style={{ fontSize: 13, color: "#6B6558", marginTop: 4 }}>Login untuk akses kasir</div>
        </div>
        <form onSubmit={async (e) => {
          e.preventDefault()
          const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
          if (err) setError("Email atau kata sandi salah")
          else { const { data } = await supabase.auth.getUser(); if (data.user) setUser(data.user) }
        }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: "100%", padding: "10px 12px", background: "#242220", border: "1px solid #2E2C28", borderRadius: 10, color: "#F5F0E8", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
          <input type="password" placeholder="Kata sandi" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: "100%", padding: "10px 12px", background: "#242220", border: "1px solid #2E2C28", borderRadius: 10, color: "#F5F0E8", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
          {error && <div style={{ fontSize: 12, color: "#C62828", marginBottom: 8, textAlign: "center" }}>{error}</div>}
          <button type="submit" style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "#84102D", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Masuk</button>
        </form>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "#0D0D0D" }}>
      <div style={{ background: "#84102D", padding: "12px 16px" }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: 2 }}>STADIONE POS</span>
      </div>
      <div style={{ padding: 40, textAlign: "center", color: "#6B6558" }}>
        <div style={{ fontSize: 16, color: "#F5F0E8", marginBottom: 8 }}>Selamat datang</div>
        <div style={{ fontSize: 13 }}>{user.email}</div>
        <button onClick={async () => { await signOut(); setUser(null) }} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 10, border: "1px solid #C6282844", background: "transparent", color: "#C62828", fontSize: 13, cursor: "pointer" }}>Keluar</button>
      </div>
    </div>
  )
}
