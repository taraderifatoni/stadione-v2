"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { C } from "@/lib/design"
import { Mail, Lock } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const { error: err } = await signIn(email, password)
    if (err) setError("Email atau kata sandi salah")
    else {
      const redirectTo = searchParams.get("redirect") || "/"
      router.push(redirectTo)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div>
      <div style={{ padding: "40px 24px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: C.primary, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "#fff" }}>S</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Selamat datang</div>
          <div style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>Masuk ke akun Stadione</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: C.textSec, marginBottom: 6, display: "block" }}>Email</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} color={C.textMuted} style={{ position: "absolute", left: 12, top: 12 }} />
              <input type="email" name="email" placeholder="nama@email.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: "100%", padding: "10px 12px 10px 36px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: C.textSec, marginBottom: 6, display: "block" }}>Kata sandi</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} color={C.textMuted} style={{ position: "absolute", left: 12, top: 12 }} />
              <input type="password" name="password" placeholder="Masukkan kata sandi" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: "100%", padding: "10px 12px 10px 36px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ textAlign: "right", marginBottom: 20 }}>
            <Link href="/forgot-password" style={{ fontSize: 12, color: C.primaryLight, textDecoration: "none" }}>Lupa kata sandi?</Link>
          </div>
          {error && <div style={{ fontSize: 12, color: C.danger, marginBottom: 14 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px 20px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>{loading ? "Masuk..." : "Masuk"}</button>
        </form>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: C.textMuted }}>
          Belum punya akun? <Link href="/register" style={{ color: C.primaryLight, textDecoration: "none" }}>Daftar</Link>
        </div>
      </div>
    </div>
  )
}
