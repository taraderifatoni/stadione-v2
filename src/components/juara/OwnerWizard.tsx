"use client"

import { useState } from "react"
import { playbookGenerateSchema } from "@/lib/juara/validation"

type Draft = {
  leagueTier: "LIGA_1" | "LIGA_2" | "LIGA_3" | "ACADEMY_PRO"
  horizonYears: 1 | 3
  targetOutcome: "CHAMPION" | "PROMOTION" | "TOP_4" | "MID_TABLE_SUSTAINABLE"
  tacticalDna: "HIGH_PRESSING" | "POSITIONAL_PLAY" | "VERTICAL_COUNTER" | "BALANCED_HYBRID"
  baseFormation: string
  philosophy: { star: number; competitive: number; academy: number }
  guardrails: { equity: number; scrMax: number }
}

const INITIAL: Draft = {
  leagueTier: "LIGA_2",
  horizonYears: 1,
  targetOutcome: "CHAMPION",
  tacticalDna: "HIGH_PRESSING",
  baseFormation: "4-3-3",
  philosophy: { star: 25, competitive: 45, academy: 30 },
  guardrails: { equity: 15_000_000_000, scrMax: 65 },
}

const LABELS = [
  "Profil Kompetisi & Titik Awal",
  "Horizon & Target Prestasi",
  "Identitas Gaya Bermain",
  "Filosofi Arsitektur Skuad",
  "Pagu Modal & Disiplin Finansial",
]

export default function OwnerWizard() {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>(INITIAL)
  const [result, setResult] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)

  const philosophyTotal =
    draft.philosophy.star + draft.philosophy.competitive + draft.philosophy.academy

  async function submit() {
    const parsed = playbookGenerateSchema.safeParse(draft)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Input tidak valid")
      return
    }
    setError(null)
    const res = await fetch("/api/juara/v1/playbooks/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    })
    if (!res.ok) {
      setError("Gagal menghasilkan Playbook")
      return
    }
    setResult(await res.json())
  }

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", padding: 16 }}>
      <div style={{ fontSize: 12, color: "#B45309", marginBottom: 8 }}>
        Langkah {step + 1} dari 5 — {LABELS[step]}
      </div>

      {step === 0 && (
        <label style={field}>
          Kasta kompetisi
          <select style={input} value={draft.leagueTier} onChange={(e) => set("leagueTier", e.target.value as Draft["leagueTier"])}>
            <option value="LIGA_1">Liga 1</option>
            <option value="LIGA_2">Liga 2</option>
            <option value="LIGA_3">Liga 3</option>
            <option value="ACADEMY_PRO">Akademi</option>
          </select>
        </label>
      )}

      {step === 1 && (
        <label style={field}>
          Horizon proyek
          <select style={input} value={draft.horizonYears} onChange={(e) => set("horizonYears", Number(e.target.value) as 1 | 3)}>
            <option value={1}>1 tahun — akselerasi</option>
            <option value={3}>3 tahun — berkelanjutan</option>
          </select>
        </label>
      )}

      {step === 2 && (
        <label style={field}>
          Identitas gaya bermain
          <select style={input} value={draft.tacticalDna} onChange={(e) => set("tacticalDna", e.target.value as Draft["tacticalDna"])}>
            <option value="HIGH_PRESSING">High-Pressing</option>
            <option value="POSITIONAL_PLAY">Positional Play</option>
            <option value="VERTICAL_COUNTER">Vertical Counter</option>
            <option value="BALANCED_HYBRID">Balanced Hybrid</option>
          </select>
        </label>
      )}

      {step === 3 && (
        <div style={{ display: "grid", gap: 8 }}>
          {(["star", "competitive", "academy"] as const).map((k) => (
            <label key={k} style={field}>
              {k}
              <input style={input} type="number" value={draft.philosophy[k]}
                onChange={(e) => setDraft((d) => ({ ...d, philosophy: { ...d.philosophy, [k]: Number(e.target.value) } }))} />
            </label>
          ))}
          <div style={{ fontSize: 12, color: philosophyTotal === 100 ? "#059669" : "#DC2626" }}>
            Total {philosophyTotal}% — wajib 100%
          </div>
        </div>
      )}

      {step === 4 && (
        <div style={{ display: "grid", gap: 8 }}>
          <label style={field}>
            Equity pemilik (Rp)
            <input style={input} type="number" value={draft.guardrails.equity}
              onChange={(e) => setDraft((d) => ({ ...d, guardrails: { ...d.guardrails, equity: Number(e.target.value) } }))} />
          </label>
          <label style={field}>
            Ambang SCR maks (%)
            <input style={input} type="number" value={draft.guardrails.scrMax}
              onChange={(e) => setDraft((d) => ({ ...d, guardrails: { ...d.guardrails, scrMax: Number(e.target.value) } }))} />
          </label>
        </div>
      )}

      {error && <div style={{ color: "#DC2626", fontSize: 12, marginTop: 8 }}>{String(error)}</div>}
      {result !== null && <pre style={{ fontSize: 11, background: "#F8FAFC", padding: 8, overflow: "auto" }}>{JSON.stringify(result, null, 2)}</pre>}

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button type="button" disabled={step === 0} onClick={() => setStep((s) => s - 1)} style={button}>Kembali</button>
        {step < 4 ? (
          <button type="button" disabled={step === 3 && philosophyTotal !== 100} onClick={() => setStep((s) => s + 1)} style={button}>Lanjut</button>
        ) : (
          <button type="button" onClick={submit} style={{ ...button, background: "#064E3B", color: "#FFFFFF" }}>Generate Playbook</button>
        )}
      </div>
    </div>
  )
}

const field: React.CSSProperties = { display: "grid", gap: 4, fontSize: 13 }
const input: React.CSSProperties = { padding: 8, border: "1px solid #CBD5E1", borderRadius: 4, background: "#FFFFFF" }
const button: React.CSSProperties = { padding: "8px 14px", border: "1px solid #CBD5E1", borderRadius: 4, background: "#FFFFFF", fontSize: 13 }
