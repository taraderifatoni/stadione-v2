"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { createClient } from "@/lib/supabase/client"
import { C } from "@/lib/design"
import { Mail, Lock } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const { error: err } = await signIn(email, password)
    if (err) setError("Email atau kata sandi salah")
    else {
      const redirectTo = searchParams.get("redirect")
      const allowed = ["/", "/booking", "/my-bookings", "/fitness", "/academy", "/profile", "/notifications"]
      const safe = redirectTo && allowed.some(a => redirectTo === a || redirectTo.startsWith(a + "/")) ? redirectTo : "/"
      router.push(safe)
      router.refresh()
    }
    setLoading(false)
  }

  async function handleGoogleLogin() {
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (err) setError("Gagal login dengan Google")
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
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 11, color: C.textMuted }}>atau</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>
          <button onClick={handleGoogleLogin} disabled={loading} style={{ width: "100%", padding: "12px 20px", borderRadius: 10, border: `1px solid ${C.border}`, background: "#fff", color: "#333", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.5 : 1 }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Masuk dengan Google
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: C.textMuted }}>
          Belum punya akun? <Link href="/register" style={{ color: C.primaryLight, textDecoration: "none" }}>Daftar</Link>
        </div>
      </div>
    </div>
  )
}
