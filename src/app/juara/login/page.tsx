"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowRight, ShieldCheck, Gauge, FileSpreadsheet } from "lucide-react"

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
      setError("Email atau kata sandi salah. Coba lagi.")
      return
    }
    router.push("/juara")
    router.refresh()
  }

  return (
    <div className="ju-auth">
      <section className="ju-auth-brand">
        <div className="ju-brandmark"><span>J</span> JUARA</div>
        <div className="ju-auth-pitch">
          <div className="ju-eyebrow">Stadione for Clubs</div>
          <h1>Keputusan besar butuh angka yang jujur.</h1>
          <p>
            Satu ruang kerja untuk visi klub, arsitektur skuad, dan disiplin finansial.
            Dari niat juara sampai playbook yang bisa dipertanggungjawabkan.
          </p>
          <ul className="ju-feature-list">
            <li><span className="ju-feature-dot">01</span><span><b>Owner Vision</b> — 5 langkah menyusun arah klub.</span></li>
            <li><span className="ju-feature-dot">02</span><span><b>Playbook & PDF</b> — dokumen siap untuk rapat pengurus.</span></li>
            <li><span className="ju-feature-dot">03</span><span><b>SCR Monitor</b> — batas aman keuangan, bukan tebakan.</span></li>
          </ul>
        </div>
        <div className="ju-auth-foot">© 2026 Stadione · Ruang kerja eksekutif klub</div>
      </section>

      <section className="ju-auth-side">
        <div className="ju-auth-card">
          <h2>Masuk ke JUARA</h2>
          <p>Kelola klub Anda dari satu tempat.</p>
          <form className="ju-form" onSubmit={submit}>
            <label className="ju-label">
              Email
              <input className="ju-input" type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@klub.id" />
            </label>
            <label className="ju-label">
              Kata sandi
              <input className="ju-input" type="password" autoComplete="current-password" required
                value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 8 karakter" />
            </label>
            {error && <div className="ju-error" role="alert">{error}</div>}
            <button className="ju-btn ju-btn-primary ju-btn-wide" type="submit" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"} <ArrowRight size={16} aria-hidden="true" />
            </button>
          </form>
          <div className="ju-auth-switch">
            Belum punya akun? <Link className="ju-link" href="/juara/signup">Daftarkan klub</Link>
          </div>
          <div className="ju-hint">
            <ShieldCheck size={13} aria-hidden="true" /> Akses dibatasi RLS: Anda hanya melihat data klub sendiri.
            <br /><Gauge size={13} aria-hidden="true" /> <FileSpreadsheet size={13} aria-hidden="true" /> Kredensial demo diberikan terpisah oleh tim JUARA.
          </div>
        </div>
      </section>
    </div>
  )
}
