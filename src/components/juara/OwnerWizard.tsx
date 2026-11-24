"use client"

import { useEffect, useRef, useState } from "react"
import { playbookGenerateSchema } from "@/lib/juara/validation"
import {
  FORMATION_TEMPLATES,
  TACTICAL_DNA_OPTIONS,
  findDna,
  labelFor,
  resolveFormation,
  type DefensiveLine,
  type Mentality,
  type PassingStyle,
  type Pressing,
  type TacticalProfile,
  type Tempo,
  type Width,
} from "@/lib/juara/tactics"
import { Check, Download, Save } from "lucide-react"

type Draft = {
  leagueTier: "LIGA_1" | "LIGA_2" | "LIGA_3" | "ACADEMY_PRO"
  horizonYears: 1 | 3
  targetOutcome: "CHAMPION" | "PROMOTION" | "TOP_4" | "MID_TABLE_SUSTAINABLE"
  tacticalDna: (typeof TACTICAL_DNA_OPTIONS)[number]["code"]
  formationMode: "AUTO" | "MANUAL"
  baseFormation: string
  mentality: Mentality
  tempo: Tempo
  pressing: Pressing
  defensiveLine: DefensiveLine
  width: Width
  passingStyle: PassingStyle
  philosophy: { star: number; competitive: number; academy: number }
  guardrails: { equity: number; scrMax: number }
}

interface Generated {
  totalSlots: number
  horizonYears: number
  tacticalDna: string
  tacticalProfile: TacticalProfile
  baseFormation: string
  ageMatrix: { bracket: string; percent: number; slots: number }[]
  gradeQuota: { A: number[]; B: number[]; C: number[] }
  scrStatus: string
  scrThresholdPct: number
}

const formatRupiah = (value: number) =>
  `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value)}`

const PHILOSOPHY_PRESETS = [
  { label: "Star-Driven", values: { star: 50, competitive: 35, academy: 15 } },
  { label: "Balanced Spine + Akademi (rekomendasi)", values: { star: 25, competitive: 45, academy: 30 } },
  { label: "Academy-First", values: { star: 15, competitive: 35, academy: 50 } },
] as const

const INITIAL: Draft = {
  leagueTier: "LIGA_2",
  horizonYears: 1,
  targetOutcome: "CHAMPION",
  tacticalDna: "HIGH_PRESSING",
  formationMode: "AUTO",
  baseFormation: "",
  mentality: "POSITIVE",
  tempo: "HIGH",
  pressing: "VERY_HIGH",
  defensiveLine: "HIGH",
  width: "WIDE",
  passingStyle: "DIRECT",
  philosophy: { star: 25, competitive: 45, academy: 30 },
  guardrails: { equity: 15_000_000_000, scrMax: 65 },
}

const LABELS = [
  "Profil Kompetisi & Titik Awal",
  "Horizon & Target Prestasi",
  "Identitas Gaya Bermain & Formasi",
  "Filosofi Arsitektur Skuad",
  "Pagu Modal & Disiplin Finansial",
]

const OUTCOME_LABEL: Record<Draft["targetOutcome"], string> = {
  CHAMPION: "Juara",
  PROMOTION: "Promosi",
  TOP_4: "Top 4",
  MID_TABLE_SUSTAINABLE: "Stabil papan tengah",
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
  const [draftStatus, setDraftStatus] = useState<string | null>(null)
  const [draftVersion, setDraftVersion] = useState("0")

  const philosophyTotal =
    draft.philosophy.star + draft.philosophy.competitive + draft.philosophy.academy

  const autoFormation = resolveFormation({
    formationMode: "AUTO",
    baseFormation: "",
    tacticalDna: draft.tacticalDna,
    targetOutcome: draft.targetOutcome,
  }).formation

  const starRef = useRef<HTMLInputElement>(null)
  const philosophyValid = philosophyTotal === 100
  const philosophyRemainder = 100 - philosophyTotal

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function applyPhilosophyPreset(values: { star: number; competitive: number; academy: number }) {
    setError(null)
    setDraft((d) => ({ ...d, philosophy: { ...values } }))
  }

  function autoBalancePhilosophy() {
    const academy = 100 - draft.philosophy.star - draft.philosophy.competitive
    if (academy < 0 || academy > 100) {
      setError("Bintang + kompetitif tidak boleh lebih dari 100%.")
      return
    }
    setError(null)
    setDraft((d) => ({ ...d, philosophy: { ...d.philosophy, academy } }))
  }

  function goNext() {
    if (step === 3 && !philosophyValid) {
      setError(
        philosophyRemainder > 0
          ? `Total masih ${philosophyTotal}%. Sisa ${philosophyRemainder}% belum dialokasikan.`
          : `Total ${philosophyTotal}%. Kurangi ${-philosophyRemainder}% dari salah satu komponen.`
      )
      starRef.current?.focus()
      return
    }
    setError(null)
    setStep((s) => s + 1)
  }

  function chooseDna(code: Draft["tacticalDna"]) {
    const preset = TACTICAL_DNA_OPTIONS.find((d) => d.code === code)
    if (!preset) return
    setDraft((d) => ({
      ...d,
      tacticalDna: code,
      mentality: preset.mentality,
      tempo: preset.tempo,
      pressing: preset.pressing,
      defensiveLine: preset.defensiveLine,
      width: preset.width,
      passingStyle: preset.passingStyle,
      baseFormation: d.formationMode === "MANUAL" ? d.baseFormation : "",
    }))
  }

  async function persistDraft() {
    setDraftStatus("Menyimpan draf...")
    try {
      const res = await fetch("/api/juara/v1/vision/draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft, expectedHash: draftVersion }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? "Gagal menyimpan draf")
      if (body.version) setDraftVersion(body.version)
      setDraftStatus("Draf tersimpan")
    } catch (e) {
      setDraftStatus(e instanceof Error ? e.message : "Gagal menyimpan draf")
    }
  }

  useEffect(() => {
    const ctrl = new AbortController()
    void Promise.resolve().then(async () => {
      try {
        const res = await fetch("/api/juara/v1/vision/draft", { cache: "no-store", signal: ctrl.signal })
        if (!res.ok) return
        const body = await res.json()
        if (body.draft && typeof body.draft === "object") {
          const d = body.draft as Partial<Draft>
          setDraft({
            ...INITIAL,
            ...d,
            philosophy: { ...INITIAL.philosophy, ...(d.philosophy ?? {}) },
            guardrails: { ...INITIAL.guardrails, ...(d.guardrails ?? {}) },
          })
          setDraftVersion(body.version ?? "0")
          setDraftStatus("Draf dimuat")
        }
      } catch {
        // no draft yet — normal for a new club
      }
    })
    return () => ctrl.abort()
  }, [])

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
        {LABELS.map((label, i) => (
          <div key={label} className="ju-step-dot" data-on={i <= step} title={label} />
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
            <div className="ju-field">
              Gaya bermain
              <div className="ju-option-grid">
                {TACTICAL_DNA_OPTIONS.map((o) => (
                  <button key={o.code} type="button" className="ju-option"
                    data-on={draft.tacticalDna === o.code}
                    aria-pressed={draft.tacticalDna === o.code}
                    onClick={() => chooseDna(o.code)}>
                    <b>{o.label}</b><small>{o.description}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="ju-field">
              Formasi
              <div className="ju-segmented" role="group" aria-label="Sumber formasi">
                <button type="button" data-on={draft.formationMode === "AUTO"}
                  aria-pressed={draft.formationMode === "AUTO"}
                  onClick={() => set("formationMode", "AUTO")}>Auto</button>
                <button type="button" data-on={draft.formationMode === "MANUAL"}
                  aria-pressed={draft.formationMode === "MANUAL"}
                  onClick={() => set("formationMode", "MANUAL")}>Manual</button>
              </div>
              {draft.formationMode === "AUTO" ? (
                <div className="ju-auto-note">
                  Formasi dipilih otomatis dari preset FM & target: <b>{autoFormation}</b>.
                  Alternatif untuk gaya ini: {findDna(draft.tacticalDna)?.suggestedFormations.join(" · ")}.
                  Preset: <b>{findDna(draft.tacticalDna)?.fmPreset}</b>.
                </div>
              ) : (
                <>
                  <label className="ju-field">
                    Template formasi
                    <select className="ju-input" value={FORMATION_TEMPLATES.some((f) => f.code === draft.baseFormation) ? draft.baseFormation : ""}
                      onChange={(e) => set("baseFormation", e.target.value)}>
                      <option value="">— Pilih template —</option>
                      {FORMATION_TEMPLATES.map((f) => (
                        <option key={f.code} value={f.code}>{f.label} — {f.description}</option>
                      ))}
                    </select>
                  </label>
                  <label className="ju-field">
                    Atau ketik formasi khusus
                    <input className="ju-input" value={draft.baseFormation} maxLength={20}
                      onChange={(e) => set("baseFormation", e.target.value)} placeholder="Contoh: 4-2-2-2" />
                  </label>
                </>
              )}
            </div>

            <div className="ju-field">
              <span>Detail taktik <small className="ju-inline-note">(mentalitas = baseline; enam parameter lain adalah penyesuaian)</small></span>
              <div className="ju-param-grid">
                <label className="ju-field">Mentalitas
                  <select className="ju-input" value={draft.mentality} onChange={(e) => set("mentality", e.target.value as Mentality)}>
                    {["DEFENSIVE", "BALANCED", "POSITIVE", "ATTACKING"].map((v) => <option key={v} value={v}>{labelFor("mentality", v)}</option>)}
                  </select>
                </label>
                <label className="ju-field">Tempo
                  <select className="ju-input" value={draft.tempo} onChange={(e) => set("tempo", e.target.value as Tempo)}>
                    {["LOW", "STANDARD", "HIGH"].map((v) => <option key={v} value={v}>{labelFor("tempo", v)}</option>)}
                  </select>
                </label>
                <label className="ju-field">Pressing
                  <select className="ju-input" value={draft.pressing} onChange={(e) => set("pressing", e.target.value as Pressing)}>
                    {["LOW", "MEDIUM", "HIGH", "VERY_HIGH"].map((v) => <option key={v} value={v}>{labelFor("pressing", v)}</option>)}
                  </select>
                </label>
                <label className="ju-field">Garis pertahanan
                  <select className="ju-input" value={draft.defensiveLine} onChange={(e) => set("defensiveLine", e.target.value as DefensiveLine)}>
                    {["DEEP", "STANDARD", "HIGH"].map((v) => <option key={v} value={v}>{labelFor("defensiveLine", v)}</option>)}
                  </select>
                </label>
                <label className="ju-field">Lebar
                  <select className="ju-input" value={draft.width} onChange={(e) => set("width", e.target.value as Width)}>
                    {["NARROW", "STANDARD", "WIDE"].map((v) => <option key={v} value={v}>{labelFor("width", v)}</option>)}
                  </select>
                </label>
                <label className="ju-field">Arah umpan
                  <select className="ju-input" value={draft.passingStyle} onChange={(e) => set("passingStyle", e.target.value as PassingStyle)}>
                    {["DIRECT", "MIXED", "POSSESSION"].map((v) => <option key={v} value={v}>{labelFor("passingStyle", v)}</option>)}
                  </select>
                </label>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="ju-field">
              <span>Preset arsitektur</span>
              <div className="ju-option-grid">
                {PHILOSOPHY_PRESETS.map((preset) => (
                  <button key={preset.label} type="button" className="ju-option"
                    data-on={
                      draft.philosophy.star === preset.values.star &&
                      draft.philosophy.competitive === preset.values.competitive &&
                      draft.philosophy.academy === preset.values.academy
                    }
                    onClick={() => applyPhilosophyPreset(preset.values)}>
                    <b>{preset.label}</b>
                    <small>{preset.values.star}% / {preset.values.competitive}% / {preset.values.academy}%</small>
                  </button>
                ))}
              </div>
            </div>

            {(["star", "competitive", "academy"] as const).map((k, index) => (
              <label className="ju-field" key={k}>
                {k === "star" ? "Pemain bintang (%)" : k === "competitive" ? "Pemain kompetitif (%)" : "Produk akademi (%)"}
                <input
                  ref={index === 0 ? starRef : undefined}
                  className="ju-input"
                  type="number"
                  min={0}
                  max={100}
                  aria-invalid={!philosophyValid}
                  aria-describedby="philosophy-total"
                  value={draft.philosophy[k]}
                  onChange={(e) => {
                    setError(null)
                    setDraft((d) => ({
                      ...d, philosophy: { ...d.philosophy, [k]: Number(e.target.value) },
                    }))
                  }} />
              </label>
            ))}

            <div id="philosophy-total" role="status" aria-live="polite"
              className={philosophyValid ? "ju-notice" : "ju-error"}>
              Total {philosophyTotal}% — {philosophyValid ? "tepat 100%, siap lanjut." :
                philosophyRemainder > 0 ? `kurang ${philosophyRemainder}%.` : `lebih ${-philosophyRemainder}%.`}
            </div>
            {!philosophyValid && (
              <button type="button" className="ju-btn" onClick={autoBalancePhilosophy}
                disabled={draft.philosophy.star + draft.philosophy.competitive > 100}>
                Isi sisa ke produk akademi
              </button>
            )}
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
            <div className="ju-card"><div className="ju-kpi-label">Formasi</div><div className="ju-kpi-value" style={{ fontSize: 20 }}>{result.baseFormation}</div></div>
            <div className="ju-card"><div className="ju-kpi-label">Gaya main</div><div className="ju-kpi-value" style={{ fontSize: 15 }}>{result.tacticalDna}</div></div>
            <div className="ju-card"><div className="ju-kpi-label">Total slot</div><div className="ju-kpi-value">{result.totalSlots}</div></div>
            <div className="ju-card"><div className="ju-kpi-label">Ambang SCR Anda</div><div className="ju-kpi-value" style={{ fontSize: 20 }}>{result.scrThresholdPct}%</div><div className="ju-kpi-foot">Engine SCR penuh belum terhubung</div></div>
          </div>

          <div className="ju-auto-note" style={{ marginTop: 14 }}>
            Profil taktik: mentalitas <b>{labelFor("mentality", result.tacticalProfile.mentality)}</b>,
            tempo <b>{labelFor("tempo", result.tacticalProfile.tempo)}</b>,
            pressing <b>{labelFor("pressing", result.tacticalProfile.pressing)}</b>,
            garis <b>{labelFor("defensiveLine", result.tacticalProfile.defensiveLine)}</b>,
            lebar <b>{labelFor("width", result.tacticalProfile.width)}</b>,
            arah umpan <b>{labelFor("passingStyle", result.tacticalProfile.passingStyle)}</b>.
            Formasi saat menguasai bola <b>{result.tacticalProfile.formationInPossession}</b>,
            saat bertahan <b>{result.tacticalProfile.formationOutOfPossession}</b>.
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

          <div className="ju-section-title">Kuota grade</div>
          <div className="ju-card">
            <table className="ju-table">
              <thead><tr><th>Grade</th><th>Kuota</th><th>Beban gaji</th></tr></thead>
              <tbody>
                <tr><td>A</td><td>{result.gradeQuota.A[0]}–{result.gradeQuota.A[1]}</td><td>45–50%</td></tr>
                <tr><td>B</td><td>{result.gradeQuota.B[0]}–{result.gradeQuota.B[1]}</td><td>35–40%</td></tr>
                <tr><td>C</td><td>{result.gradeQuota.C[0]}–{result.gradeQuota.C[1]}</td><td>10–15%</td></tr>
              </tbody>
            </table>
          </div>

          <div className="ju-auto-note" style={{ marginTop: 14 }}>
            Equity yang Anda input: <b>{formatRupiah(draft.guardrails.equity)}</b>.
            Ilustrasi amortisasi: Rp 1.650.000.000 / 36 bulan = Rp 550.000.000 per tahun
            (contoh RULEBOOK, bukan hasil klub Anda).
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
        </div>
      )}

      <div className="ju-wizard-nav">
        <button className="ju-btn" type="button" onClick={persistDraft}>Simpan draf</button>
        {draftStatus && <span className="ju-inline-note" role="status">{draftStatus}</span>}
        <button className="ju-btn" type="button" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Kembali</button>
        {step < 4 ? (
          <button className="ju-btn ju-btn-primary" type="button"
            data-muted={step === 3 && !philosophyValid}
            onClick={goNext}>Lanjut</button>
        ) : (
          <button className="ju-btn ju-btn-primary" type="button" onClick={submit}>Generate Playbook</button>
        )}
      </div>
    </div>
  )
}
