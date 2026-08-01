"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { C } from "@/lib/design"
import { Mail, Lock } from "lucide-react"
import Link from "next/link"

const Input = ({ label, placeholder, type = "text", icon: Icon }: { label: string; placeholder: string; type?: string; icon?: any }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ fontSize: 12, color: C.textSec, marginBottom: 6, display: "block" }}>{label}</label>
    <div style={{ position: "relative" }}>
      {Icon && <Icon size={16} color={C.textMuted} style={{ position: "absolute", left: 12, top: 12 }} />}
      <input type={type} placeholder={placeholder} style={{ width: "100%", padding: Icon ? "10px 12px 10px 36px" : "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
    </div>
  </div>
)

const Btn = ({ children, primary, full, onClick, style }: any) => (
  <button onClick={onClick} style={{ padding: "12px 20px", borderRadius: 10, border: primary ? "none" : `1px solid ${C.border}`, background: primary ? C.primary : "transparent", color: primary ? "#fff" : C.text, fontSize: 14, fontWeight: 600, cursor: "pointer", width: full ? "100%" : "auto", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, ...style }}>{children}</button>
)

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const { error: err } = await signIn(email, password)
    if (err) setError("Email atau kata sandi salah")
    else { router.push("/"); router.refresh() }
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
          <Input label="Email" placeholder="nama@email.com" icon={Mail} />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ display: "none" }} />
          <Input label="Kata sandi" placeholder="Masukkan kata sandi" type="password" icon={Lock} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ display: "none" }} />
          <div style={{ textAlign: "right", marginBottom: 20 }}>
            <Link href="/forgot-password" style={{ fontSize: 12, color: C.primaryLight, textDecoration: "none" }}>Lupa kata sandi?</Link>
          </div>
          {error && <div style={{ fontSize: 12, color: C.danger, marginBottom: 14 }}>{error}</div>}
          <Btn primary full onClick={handleSubmit}>{loading ? "Masuk..." : "Masuk"}</Btn>
        </form>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: C.textMuted }}>
          Belum punya akun? <Link href="/register" style={{ color: C.primaryLight, textDecoration: "none" }}>Daftar</Link>
        </div>
      </div>
    </div>
  )
}
