"use client"

import { useState } from "react"
import { playbookGenerateSchema } from "@/lib/juara/validation"
import { Check, Download, Save } from "lucide-react"

type Draft = {
  leagueTier: "LIGA_1" | "LIGA_2" | "LIGA_3" | "ACADEMY_PRO"
  horizonYears: 1 | 3
  targetOutcome: "CHAMPION" | "PROMOTION" | "TOP_4" | "MID_TABLE_SUSTAINABLE"
  tacticalDna: "HIGH_PRESSING" | "POSITIONAL_PLAY" | "VERTICAL_COUNTER" | "BALANCED_HYBRID"
  baseFormation: string
  philosophy: { star: number; competitive: number; academy: number }
  guardrails: { equity: number; scrMax: number }
}

interface Generated {
  totalSlots: number
  horizonYears: number
  tacticalDna: string
  baseFormation: string
  ageMatrix: { bracket: string; percent: number; slots: number }[]
  gradeQuota: { A: number[]; B: number[]; C: number[] }
  scrStatus: string
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

const OUTCOME_LABEL: Record<Draft["targetOutcome"], string> = {
  CHAMPION: "Juara",
  PROMOTION: "Promosi",
  TOP_4: "Top 4",
  MID_TABLE_SUSTAINABLE: "Stabil papan tengah",
}

const DNA_LABEL: Record<Draft["tacticalDna"], string> = {
  HIGH_PRESSING: "High-pressing",
  POSITIONAL_PLAY: "Positional play",
  VERTICAL_COUNTER: "Vertical counter",
  BALANCED_HYBRID: "Balanced hybrid",
}

const SCR_LABEL: Record<string, string> = {
  GREEN: "Hijau — aman",
  YELLOW_WATCHLIST: "Kuning — waspada",
  RED_BREACH: "Merah — dilanggar",
}

export default function OwnerWizard() {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>(INITIAL)
  const [result, setResult] = useState<Generated | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveResult, setSaveResult] = useState<string | null>(null)

  const philosophyTotal =
    draft.philosophy.star + draft.philosophy.competitive + draft.philosophy.academy

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  async function submit() {
    const parsed = playbookGenerateSchema.safeParse(draft)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Input tidak valid")
      return
    }
    setError(null)
    setSaveResult(null)
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

  async function downloadPdf() {
    const parsed = playbookGenerateSchema.safeParse(draft)
    if (!parsed.success) return
    setPdfLoading(true)
    setPdfError(null)
    try {
      const res = await fetch("/api/juara/v1/playbooks/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsed.data,
          meta: { downloader: "Owner", role: "OWNER", timestamp: new Date().toLocaleString("id-ID") },
        }),
      })
      if (!res.ok) throw new Error("Gagal mengunduh PDF")
      const url = URL.createObjectURL(await res.blob())
      const a = document.createElement("a")
      a.href = url
      a.download = "club-playbook.pdf"
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : "Gagal mengunduh PDF")
    } finally {
      setPdfLoading(false)
    }
  }

  async function savePlaybook() {
    const parsed = playbookGenerateSchema.safeParse(draft)
    if (!parsed.success) return
    setSaveLoading(true)
    setSaveError(null)
    setSaveResult(null)
    try {
      const res = await fetch("/api/juara/v1/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? "Gagal menyimpan Playbook")
      setSaveResult("Playbook tersimpan di klub Anda.")
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Gagal menyimpan Playbook")
    } finally {
      setSaveLoading(false)
    }
  }

  return (
    <div className="ju-card">
      <div className="ju-steps" aria-label={`Langkah ${step + 1} dari 5`}>
        {LABELS.map((_, i) => (
          <div key={i} className="ju-step-dot" data-on={i <= step} title={LABELS[i]} />
        ))}
      </div>
      <div className="ju-inline-note" style={{ marginBottom: 18 }}>
        Langkah {step + 1} dari 5 — <strong>{LABELS[step]}</strong>
      </div>

      <div className="ju-field-grid">
        {step === 0 && (
          <label className="ju-field">
            Kasta kompetisi
            <select className="ju-input" value={draft.leagueTier}
              onChange={(e) => set("leagueTier", e.target.value as Draft["leagueTier"])}>
              <option value="LIGA_1">Liga 1</option>
              <option value="LIGA_2">Liga 2</option>
              <option value="LIGA_3">Liga 3</option>
              <option value="ACADEMY_PRO">Akademi</option>
            </select>
          </label>
        )}

        {step === 1 && (
          <>
            <label className="ju-field">
              Horizon proyek
              <select className="ju-input" value={draft.horizonYears}
                onChange={(e) => set("horizonYears", Number(e.target.value) as 1 | 3)}>
                <option value={1}>1 tahun — akselerasi</option>
                <option value={3}>3 tahun — berkelanjutan</option>
              </select>
            </label>
            <label className="ju-field">
              Target prestasi
              <select className="ju-input" value={draft.targetOutcome}
                onChange={(e) => set("targetOutcome", e.target.value as Draft["targetOutcome"])}>
                {Object.entries(OUTCOME_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
          </>
        )}

        {step === 2 && (
          <>
            <label className="ju-field">
              Identitas gaya bermain
              <select className="ju-input" value={draft.tacticalDna}
                onChange={(e) => set("tacticalDna", e.target.value as Draft["tacticalDna"])}>
                {Object.entries(DNA_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="ju-field">
              Formasi dasar
              <input className="ju-input" value={draft.baseFormation} maxLength={20} minLength={3}
                onChange={(e) => set("baseFormation", e.target.value)} placeholder="4-3-3" />
            </label>
          </>
        )}

        {step === 3 && (
          <>
            {(["star", "competitive", "academy"] as const).map((k) => (
              <label className="ju-field" key={k}>
                {k === "star" ? "Pemain bintang (%)" : k === "competitive" ? "Pemain kompetitif (%)" : "Produk akademi (%)"}
                <input className="ju-input" type="number" min={0} max={100}
                  value={draft.philosophy[k]}
                  onChange={(e) => setDraft((d) => ({
                    ...d,
                    philosophy: { ...d.philosophy, [k]: Number(e.target.value) },
                  }))} />
              </label>
            ))}
            <div className={`ju-inline-note ${philosophyTotal === 100 ? "ju-notice" : "ju-error"}`}>
              Total {philosophyTotal}% — wajib tepat 100%.
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <label className="ju-field">
              Equity pemilik (Rp)
              <input className="ju-input" type="number" min={1} value={draft.guardrails.equity}
                onChange={(e) => setDraft((d) => ({
                  ...d, guardrails: { ...d.guardrails, equity: Number(e.target.value) },
                }))} />
            </label>
            <label className="ju-field">
              Ambang SCR maksimum (%)
              <input className="ju-input" type="number" min={58} max={100} value={draft.guardrails.scrMax}
                onChange={(e) => setDraft((d) => ({
                  ...d, guardrails: { ...d.guardrails, scrMax: Number(e.target.value) },
                }))} />
              <small className="ju-inline-note">Batas minimum 58% (zone hijau).</small>
            </label>
          </>
        )}
      </div>

      {error && <div className="ju-error" role="alert" style={{ marginTop: 16 }}>{error}</div>}

      {result && (
        <div style={{ marginTop: 22 }}>
          <div className="ju-grid ju-grid-4">
            <div className="ju-card"><div className="ju-kpi-label">Total slot</div><div className="ju-kpi-value">{result.totalSlots}</div></div>
            <div className="ju-card"><div className="ju-kpi-label">Formasi</div><div className="ju-kpi-value" style={{ fontSize: 20 }}>{result.baseFormation}</div></div>
            <div className="ju-card"><div className="ju-kpi-label">Gaya main</div><div className="ju-kpi-value" style={{ fontSize: 15 }}>{DNA_LABEL[result.tacticalDna as Draft["tacticalDna"]] ?? result.tacticalDna}</div></div>
            <div className="ju-card"><div className="ju-kpi-label">Status SCR</div><div className="ju-kpi-value" style={{ fontSize: 15 }}>{SCR_LABEL[result.scrStatus] ?? result.scrStatus}</div></div>
          </div>

          <div className="ju-section-title">Matriks usia</div>
          <div className="ju-card">
            <table className="ju-table">
              <thead><tr><th>Bracket</th><th>Porsi</th><th>Slot</th></tr></thead>
              <tbody>
                {result.ageMatrix.map((a) => (
                  <tr key={a.bracket}><td>{a.bracket}</td><td>{a.percent}%</td><td>{a.slots}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ju-actions" style={{ marginTop: 18 }}>
            <button className="ju-btn ju-btn-primary" type="button" onClick={downloadPdf} disabled={pdfLoading}>
              <Download size={15} aria-hidden="true" /> {pdfLoading ? "Mengunduh..." : "Unduh PDF"}
            </button>
            <button className="ju-btn" type="button" onClick={savePlaybook} disabled={saveLoading}>
              <Save size={15} aria-hidden="true" /> {saveLoading ? "Menyimpan..." : "Simpan Playbook"}
            </button>
            {saveResult && <span className="ju-notice" role="status"><Check size={14} aria-hidden="true" /> {saveResult}</span>}
            {pdfError && <span className="ju-error" role="alert">{pdfError}</span>}
            {saveError && <span className="ju-error" role="alert">{saveError}</span>}
          </div>
          <details style={{ marginTop: 16 }}>
            <summary className="ju-inline-note" style={{ cursor: "pointer" }}>Lihat data mentah hasil engine</summary>
            <pre className="ju-result">{JSON.stringify(result, null, 2)}</pre>
          </details>
        </div>
      )}

      <div className="ju-wizard-nav">
        <button className="ju-btn" type="button" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Kembali</button>
        {step < 4 ? (
          <button className="ju-btn ju-btn-primary" type="button"
            disabled={step === 3 && philosophyTotal !== 100}
            onClick={() => setStep((s) => s + 1)}>Lanjut</button>
        ) : (
          <button className="ju-btn ju-btn-primary" type="button" onClick={submit}>Generate Playbook</button>
        )}
      </div>
    </div>
  )
}
