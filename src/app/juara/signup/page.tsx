"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, CheckCircle2 } from "lucide-react"

type Tier = "LIGA_1" | "LIGA_2" | "LIGA_3" | "ACADEMY_PRO"

export default function JuaraSignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [tier, setTier] = useState<Tier>("LIGA_2")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/juara/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, leagueTier: tier, email, password }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? "Gagal mendaftar")
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mendaftar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ju-auth">
      <section className="ju-auth-brand">
        <div className="ju-brandmark"><span>J</span> JUARA</div>
        <div className="ju-auth-pitch">
          <div className="ju-eyebrow">Mulai sekarang</div>
          <h1>Satu akun. Satu klub. Satu arah.</h1>
          <p>
            Buat ruang kerja klub Anda dalam hitungan menit. Pemilik akun otomatis
            menjadi Owner dengan akses penuh ke playbook dan keuangan.
          </p>
          <ul className="ju-feature-list">
            <li><span className="ju-feature-dot">01</span><span><b>Klub langsung aktif</b> — tanpa menunggu undangan manual.</span></li>
            <li><span className="ju-feature-dot">02</span><span><b>Aman by design</b> — data dipisah per klub sejak baris pertama.</span></li>
            <li><span className="ju-feature-dot">03</span><span><b>Siap pakai</b> — wizard 5 langkah ke playbook pertama.</span></li>
          </ul>
        </div>
        <div className="ju-auth-foot">© 2026 Stadione · Ruang kerja eksekutif klub</div>
      </section>

      <section className="ju-auth-side">
        <div className="ju-auth-card">
          {done ? (
            <>
              <h2>Akun dibuat</h2>
              <p>Klub Anda sudah aktif dan siap dipakai.</p>
              <div className="ju-notice" role="status">
                <CheckCircle2 size={14} aria-hidden="true" /> Pendaftaran berhasil.
              </div>
              <button className="ju-btn ju-btn-primary ju-btn-wide" style={{ marginTop: 20 }} onClick={() => router.push("/juara/login")}>
                Lanjut ke Masuk <ArrowRight size={16} aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <h2>Daftarkan klub</h2>
              <p>Buat akun Owner untuk klub Anda.</p>
              <form className="ju-form" onSubmit={submit}>
                <label className="ju-label">
                  Nama klub
                  <input className="ju-input" required minLength={3} value={name}
                    onChange={(e) => setName(e.target.value)} placeholder="Contoh: Persiba Nusantara" />
                </label>
                <label className="ju-label">
                  Kasta kompetisi
                  <select className="ju-input" value={tier} onChange={(e) => setTier(e.target.value as Tier)}>
                    <option value="LIGA_1">Liga 1</option>
                    <option value="LIGA_2">Liga 2</option>
                    <option value="LIGA_3">Liga 3</option>
                    <option value="ACADEMY_PRO">Akademi / Liga profesional</option>
                  </select>
                </label>
                <label className="ju-label">
                  Email
                  <input className="ju-input" type="email" autoComplete="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@klub.id" />
                </label>
                <label className="ju-label">
                  Kata sandi
                  <input className="ju-input" type="password" autoComplete="new-password" required minLength={8}
                    value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 8 karakter" />
                </label>
                {error && <div className="ju-error" role="alert">{error}</div>}
                <button className="ju-btn ju-btn-primary ju-btn-wide" type="submit" disabled={loading}>
                  {loading ? "Membuat akun..." : "Buat akun & klub"} <ArrowRight size={16} aria-hidden="true" />
                </button>
              </form>
              <div className="ju-auth-switch">
                Sudah punya akun? <Link className="ju-link" href="/juara/login">Masuk</Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
