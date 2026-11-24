"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { FileText, Plus } from "lucide-react"

type Membership = { clubId: string; role: string; clubName: string } | null
type Playbook = {
  id: string
  version_name: string | null
  horizon_years: number
  target_sporting_outcome: string
  tactical_dna_type: string
  status: string
  created_at: string
}

export default function PlaybookListPage() {
  const [loading, setLoading] = useState(true)
  const [membership, setMembership] = useState<Membership>(null)
  const [playbooks, setPlaybooks] = useState<Playbook[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const me = await fetch("/api/juara/v1/clubs/me", { cache: "no-store" })
      if (me.status === 401) {
        setError("Silakan masuk terlebih dahulu.")
        return
      }
      const meBody = await me.json()
      const m = meBody.membership ?? null
      setMembership(m)
      if (m) {
        const pb = await fetch("/api/juara/v1/playbooks", { cache: "no-store" })
        const pbBody = await pb.json()
        setPlaybooks(pbBody.playbooks ?? [])
      }
    } catch {
      setError("Gagal memuat data.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(() => load())
  }, [load])

  return (
    <>
      <div className="ju-pagehead" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
        <div>
          <h2>Arsip Playbook</h2>
          <p>Playbook yang tersimpan untuk {membership?.clubName ?? "klub Anda"}.</p>
        </div>
        <Link className="ju-btn ju-btn-primary" href="/juara/vision"><Plus size={15} aria-hidden="true" /> Buat playbook</Link>
      </div>

      {error && <div className="ju-error" role="alert">{error}</div>}

      <div className="ju-card">
        {loading ? (
          <div className="ju-empty" role="status">Memuat arsip...</div>
        ) : playbooks.length === 0 ? (
          <div className="ju-empty">
            <FileText size={28} aria-hidden="true" />
            <p>Belum ada playbook tersimpan.</p>
            <Link className="ju-btn ju-btn-primary" href="/juara/vision">Buat playbook pertama</Link>
          </div>
        ) : (
          <table className="ju-table">
            <thead>
              <tr><th>Nama</th><th>Target</th><th>Horizon</th><th>Status</th><th>Dibuat</th></tr>
            </thead>
            <tbody>
              {playbooks.map((p) => (
                <tr key={p.id}>
                  <td>{p.version_name ?? p.id.slice(0, 8)}</td>
                  <td>{p.target_sporting_outcome}</td>
                  <td>{p.horizon_years} tahun</td>
                  <td><span className={`ju-badge ${p.status === "LOCKED_ACTIVE" ? "ju-badge-active" : ""}`}>{p.status}</span></td>
                  <td>{new Date(p.created_at).toLocaleDateString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
