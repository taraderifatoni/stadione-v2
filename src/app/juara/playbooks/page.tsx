"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

type Membership = { clubId: string; role: string } | null
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
  const [bootName, setBootName] = useState("")
  const [bootTier, setBootTier] = useState("LIGA_2")
  const [booting, setBooting] = useState(false)

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const me = await fetch("/api/juara/v1/clubs/me", { cache: "no-store", signal })
      if (me.status === 401) {
        setError("Silakan login terlebih dahulu.")
        return
      }
      const meBody = await me.json()
      const m = meBody.membership ?? null
      setMembership(m)
      if (m) {
        const pb = await fetch("/api/juara/v1/playbooks", { cache: "no-store", signal })
        const pbBody = await pb.json()
        setPlaybooks(pbBody.playbooks ?? [])
      } else {
        setPlaybooks([])
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError("Gagal memuat data.")
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    // Defer to avoid sync setState-in-effect lint; load is async anyway.
    void Promise.resolve().then(() => load(ctrl.signal))
    return () => ctrl.abort()
  }, [load])

  async function bootstrap() {
    setBooting(true)
    setError(null)
    try {
      const res = await fetch("/api/juara/v1/clubs/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: bootName, leagueTier: bootTier }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || "Gagal membuat klub")
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat klub")
    } finally {
      setBooting(false)
    }
  }

  return (
    <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Daftar Playbook</h1>
        <Link href="/juara/vision" style={{ background: "#064E3B", color: "#FFFFFF", padding: "8px 14px", borderRadius: 4, fontSize: 13, textDecoration: "none" }}>
          Buat Playbook
        </Link>
      </div>

      {loading && <p style={{ fontSize: 13, color: "#475569" }}>Memuat...</p>}
      {error && <p style={{ fontSize: 13, color: "#B91C1C" }}>{error}</p>}

      {!loading && !membership && !error && (
        <div style={{ border: "1px solid #CBD5E1", padding: 16, borderRadius: 4, maxWidth: 480 }}>
          <p style={{ fontSize: 13, color: "#334155", marginBottom: 12 }}>
            Akun Anda belum terhubung ke klub. Buat klub pertama untuk mulai menyimpan playbook.
          </p>
          <label style={{ display: "block", fontSize: 12, marginBottom: 8 }}>
            Nama klub
            <input value={bootName} onChange={(e) => setBootName(e.target.value)} style={{ display: "block", width: "100%", padding: 8, marginTop: 4, border: "1px solid #CBD5E1" }} />
          </label>
          <label style={{ display: "block", fontSize: 12, marginBottom: 12 }}>
            Tier liga
            <select value={bootTier} onChange={(e) => setBootTier(e.target.value)} style={{ display: "block", width: "100%", padding: 8, marginTop: 4, border: "1px solid #CBD5E1" }}>
              <option value="LIGA_1">LIGA_1</option>
              <option value="LIGA_2">LIGA_2</option>
              <option value="LIGA_3">LIGA_3</option>
              <option value="ACADEMY_PRO">ACADEMY_PRO</option>
            </select>
          </label>
          <button onClick={bootstrap} disabled={booting || bootName.trim().length < 3} style={{ background: "#064E3B", color: "#FFF", padding: "8px 14px", border: 0, borderRadius: 4, fontSize: 13, cursor: "pointer" }}>
            {booting ? "Membuat..." : "Buat Klub"}
          </button>
        </div>
      )}

      {!loading && membership && playbooks.length === 0 && (
        <p style={{ fontSize: 13, color: "#475569" }}>Belum ada playbook. Buat dari Owner Vision Wizard.</p>
      )}

      {!loading && membership && playbooks.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #E2E8F0" }}>
              <th style={{ padding: "8px 4px" }}>Nama</th>
              <th style={{ padding: "8px 4px" }}>Target</th>
              <th style={{ padding: "8px 4px" }}>Horizon</th>
              <th style={{ padding: "8px 4px" }}>Status</th>
              <th style={{ padding: "8px 4px" }}>Dibuat</th>
            </tr>
          </thead>
          <tbody>
            {playbooks.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                <td style={{ padding: "8px 4px" }}>{p.version_name || p.id.slice(0, 8)}</td>
                <td style={{ padding: "8px 4px" }}>{p.target_sporting_outcome}</td>
                <td style={{ padding: "8px 4px" }}>{p.horizon_years}Y</td>
                <td style={{ padding: "8px 4px" }}>{p.status}</td>
                <td style={{ padding: "8px 4px" }}>{new Date(p.created_at).toLocaleDateString("id-ID")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
