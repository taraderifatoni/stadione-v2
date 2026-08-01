"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { C } from "@/lib/design"
import { Mail, Lock, User, Phone, ChevronLeft } from "lucide-react"
import Link from "next/link"

const Input = ({ label, placeholder, type = "text", icon: Icon, value, onChange }: any) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ fontSize: 12, color: C.textSec, marginBottom: 6, display: "block" }}>{label}</label>
    <div style={{ position: "relative" }}>
      {Icon && <Icon size={16} color={C.textMuted} style={{ position: "absolute", left: 12, top: 12 }} />}
      <input type={type} placeholder={placeholder} value={value} onChange={onChange} style={{ width: "100%", padding: Icon ? "10px 12px 10px 36px" : "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
    </div>
  </div>
)

const Btn = ({ children, primary, full, onClick, style }: any) => (
  <button onClick={onClick} style={{ padding: "12px 20px", borderRadius: 10, border: primary ? "none" : `1px solid ${C.border}`, background: primary ? C.primary : "transparent", color: primary ? "#fff" : C.text, fontSize: 14, fontWeight: 600, cursor: "pointer", width: full ? "100%" : "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, ...style }}>{children}</button>
)

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [msg, setMsg] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setMsg("")
    setLoading(true)
    const { error: err } = await signUp(email, password, name)
    if (err) setError(err.message.includes("already") ? "Email sudah terdaftar" : "Terjadi kesalahan")
    else setMsg("Cek email Anda untuk verifikasi akun.")
    setLoading(false)
  }

  return (
    <div>
      <div style={{ padding: "24px" }}>
        <Link href="/login" style={{ cursor: "pointer", marginBottom: 16, display: "block" }}>
          <ChevronLeft size={20} color={C.text} />
        </Link>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 4 }}>Buat akun</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>Daftar untuk mulai booking</div>
        <form onSubmit={handleSubmit}>
          <Input label="Nama lengkap" placeholder="Nama Anda" icon={User} value={name} onChange={(e: any) => setName(e.target.value)} />
          <Input label="Email" placeholder="nama@email.com" icon={Mail} value={email} onChange={(e: any) => setEmail(e.target.value)} />
          <Input label="No. telepon" placeholder="08xxxxxxxxxx" icon={Phone} value={phone} onChange={(e: any) => setPhone(e.target.value)} />
          <Input label="Kata sandi" placeholder="Min. 8 karakter" type="password" icon={Lock} value={password} onChange={(e: any) => setPassword(e.target.value)} />
          {error && <div style={{ fontSize: 12, color: C.danger, marginBottom: 14 }}>{error}</div>}
          {msg && <div style={{ fontSize: 12, color: C.success, marginBottom: 14 }}>{msg}</div>}
          <Btn primary full onClick={handleSubmit} style={{ marginTop: 8 }}>{loading ? "Mendaftar..." : "Daftar"}</Btn>
        </form>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: C.textMuted }}>
          Sudah punya akun? <Link href="/login" style={{ color: C.primaryLight, textDecoration: "none" }}>Masuk</Link>
        </div>
      </div>
    </div>
  )
}
