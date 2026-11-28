"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { ArrowRight, Compass, FileText, Layers3, ShieldCheck } from "lucide-react"

type Membership = {
  clubId: string
  role: string
  clubName: string
  leagueTier: string | null
} | null

type Playbook = {
  id: string
  version_name: string | null
  target_sporting_outcome: string
  status: string
  created_at: string
}

export default function JuaraDashboard() {
  const [membership, setMembership] = useState<Membership>(null)
  const [playbooks, setPlaybooks] = useState<Playbook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const meRes = await fetch("/api/juara/v1/clubs/me", { cache: "no-store" })
      if (!meRes.ok) throw new Error("Gagal memuat klub")
      const me = await meRes.json()
      setMembership(me.membership ?? null)
      const pbRes = await fetch("/api/juara/v1/playbooks", { cache: "no-store" })
      const pb = await pbRes.json()
      setPlaybooks(pb.playbooks ?? [])
    } catch {
      setError("Data belum bisa dimuat. Muat ulang halaman.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void Promise.resolve().then(() => load()) }, [load])

  const tierLabel: Record<string, string> = { LIGA_1: "Liga 1", LIGA_2: "Liga 2", LIGA_3: "Liga 3", ACADEMY_PRO: "Akademi" }

  return (
    <>
      <div className="ju-pagehead">
        <h1 style={{ font: "700 36px/1.1 var(--font-display)", margin: "0 0 4px" }}>Ruang Direksi</h1>
        <p className="muted">{loading ? "Memuat ringkasan..." : `Klub ${membership?.clubName ?? "contoh"} · keputusan yang perlu perhatian klub.`}</p>
      </div>

      {error && <div className="ju-error" role="alert">{error}</div>}

      <section className="card hero">
        <small className="muted">PRIORITAS KEPUTUSAN</small>
        <h1 style={{ marginTop: 8 }}>Tetapkan arah klub.</h1>
        <p className="muted">Susun visi dan keputusan olahraga sebelum menetapkan pagu. Ini adalah checkpoint implementasi v0.2.1 — data nyata terhubung bertahap.</p>
        <Link href="/juara/vision" className="ju-btn ju-btn-primary" style={{ marginTop: 8 }}>Buka Visi Owner <ArrowRight size={14} aria-hidden="true" /></Link>
      </section>

      <div className="ju-grid ju-grid-4" style={{ marginTop: 12 }}>
        <div className="ju-card">
          <div className="ju-kpi-label">Klub</div>
          <div className="ju-kpi-value" style={{ fontSize: 22 }}>{membership?.clubName ?? "—"}</div>
          <div className="ju-kpi-foot">{membership ? `Peran: ${membership.role}` : "Belum ada klub"}</div>
        </div>
        <div className="ju-card">
          <div className="ju-kpi-label">Kompetisi</div>
          <div className="ju-kpi-value" style={{ fontSize: 22 }}>{membership?.leagueTier ? tierLabel[membership.leagueTier] ?? membership.leagueTier : "—"}</div>
          <div className="ju-kpi-foot">Tier liga aktif</div>
        </div>
        <div className="ju-card">
          <div className="ju-kpi-label">Playbook</div>
          <div className="ju-kpi-value">{playbooks.length}</div>
          <div className="ju-kpi-foot">Dokumen tersimpan</div>
        </div>
        <div className="ju-card">
          <div className="ju-kpi-label">Keamanan data</div>
          <div className="ju-kpi-value" style={{ fontSize: 22, color: "var(--positive)" }}>Aktif</div>
          <div className="ju-kpi-foot"><ShieldCheck size={12} aria-hidden="true" /> RLS per klub</div>
        </div>
      </div>

      <h3 className="ju-section-title">Langkah berikutnya</h3>
      <div className="ju-grid ju-grid-2">
        <Link href="/juara/vision" className="ju-card" style={{ textDecoration: "none", color: "inherit" }}>
          <h3><Compass size={16} aria-hidden="true" /> Owner Vision Wizard</h3>
          <p className="ju-inline-note">Susun target, identitas skuad, dan pagu finansial dalam 5 langkah. Hasilnya bisa disimpan dan diunduh sebagai PDF.</p>
          <span className="ju-link" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 13 }}>Buka wizard <ArrowRight size={14} aria-hidden="true" /></span>
        </Link>
        <Link href="/juara/playbooks" className="ju-card" style={{ textDecoration: "none", color: "inherit" }}>
          <h3><Layers3 size={16} aria-hidden="true" /> Arsip Playbook</h3>
          <p className="ju-inline-note">Lihat playbook yang sudah dibuat, statusnya, dan tanggal penyusunannya.</p>
          <span className="ju-link" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 13 }}>Lihat arsip <ArrowRight size={14} aria-hidden="true" /></span>
        </Link>
      </div>

      <h3 className="ju-section-title">Playbook terbaru</h3>
      <div className="ju-card">
        {playbooks.length === 0 ? (
          <div className="ju-empty">
            <FileText size={26} aria-hidden="true" />
            <p>Belum ada playbook. Mulai dari Owner Vision Wizard.</p>
            <Link className="ju-btn ju-btn-primary" href="/juara/vision">Buat playbook pertama</Link>
          </div>
        ) : (
          <div className="table">
            <table className="ju-table">
              <thead><tr><th>Nama</th><th>Target</th><th>Status</th><th>Dibuat</th></tr></thead>
              <tbody>
                {playbooks.slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td>{p.version_name ?? p.id.slice(0, 8)}</td>
                    <td>{p.target_sporting_outcome}</td>
                    <td><span className="ju-badge">{p.status}</span></td>
                    <td>{new Date(p.created_at).toLocaleDateString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
