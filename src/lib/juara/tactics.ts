/**
 * Taktik & formasi JUARA — benchmarking Football Manager.
 * Sumber: SI Games Manual FM24 (dokumentasi), SI Community & FM Scout
 * (komunitas), Wikipedia/id.wikipedia (ensiklopedia), PRD JUARA 8.1 (produk).
 * Catatan riset lengkap: research_notes/Benchmark taktik JUARA Football Manager/
 *
 * Prinsip FM yang dipakai: Mentalitas = baseline; enam parameter lain adalah
 * penyesuaian di atas baseline. False Nine adalah peran, bukan preset tim.
 */

export type TacticalDnaCode =
  | "HIGH_PRESSING"
  | "POSITIONAL_PLAY"
  | "VERTICAL_COUNTER"
  | "BALANCED_HYBRID"
  | "TOTAL_FOOTBALL"
  | "CATENACCIO"
  | "WING_PLAY"
  | "DIAMOND_MIDFIELD"
  | "FALSE_NINE"
  | "DIRECT_PHYSICAL"

export type Mentality = "DEFENSIVE" | "BALANCED" | "POSITIVE" | "ATTACKING"
export type Tempo = "LOW" | "STANDARD" | "HIGH"
export type Pressing = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"
export type DefensiveLine = "DEEP" | "STANDARD" | "HIGH"
export type Width = "NARROW" | "STANDARD" | "WIDE"
export type PassingStyle = "DIRECT" | "MIXED" | "POSSESSION"

export interface PhaseModel {
  inPossession: string
  attackingTransition: string
  outOfPossession: string
  defensiveTransition: string
  recruitment: string
  source: "PRD 8.1 (data terukur)" | "Rasionalisasi PM (kualitatif)"
}

export interface TacticalDnaOption {
  code: TacticalDnaCode
  label: string
  description: string
  fmPreset: string
  suggestedFormations: [string, string, string]
  mentality: Mentality
  tempo: Tempo
  pressing: Pressing
  defensiveLine: DefensiveLine
  width: Width
  passingStyle: PassingStyle
  phaseModel: PhaseModel
}

const PRD_PHASE: Partial<Record<TacticalDnaCode, PhaseModel>> = {
  HIGH_PRESSING: {
    inPossession: "Progresi vertikal cepat, < 4 umpan menembus blok tengah; bek sayap overlapping.",
    attackingTransition: "Serangan balik < 5 detik setelah merebut bola di area lawan.",
    outOfPossession: "Garis 42–48 m dari gawang; PPDA < 8,5.",
    defensiveTransition: "Counter-press langsung oleh 3–4 pemain terdekat; pelanggaran taktis profesional bila gagal.",
    recruitment: "Gelandang & penyerang usia 21–25 dengan HSR > 1.100 m/laga.",
    source: "PRD 8.1 (data terukur)",
  },
  POSITIONAL_PLAY: {
    inPossession: "Sirkulasi sabar dari kiper & bek tengah; penguasaan > 58%; rotasi half-space.",
    attackingTransition: "Konsolidasi umpan sebelum menyerang.",
    outOfPossession: "Counter-press 6 detik, lalu blok tengah rapat; PPDA 9,0–11,0.",
    defensiveTransition: "Rest Defense 2-3 atau 3-2 terkunci di belakang garis bola.",
    recruitment: "Kiper, bek tengah, pivot usia 25–30 dengan umpan progresif > 86%.",
    source: "PRD 8.1 (data terukur)",
  },
  VERTICAL_COUNTER: {
    inPossession: "Umpan langsung ke target man atau ruang belakang bek sayap lawan.",
    attackingTransition: "Eksploitasi ruang < 6 detik via winger > 32,5 km/jam.",
    outOfPossession: "Blok 28–34 m; PPDA > 13,0; jebakan area tengah.",
    defensiveTransition: "Mundur cepat membentuk dua lapis blok 4-4-2 low block.",
    recruitment: "Duet bek tengah senior aerial win > 68% + winger muda eksplosif.",
    source: "PRD 8.1 (data terukur)",
  },
  BALANCED_HYBRID: {
    inPossession: "Dominan build-up di kandang; progresi terukur dan aman di tandang.",
    attackingTransition: "Cepat jika unggul jumlah pemain; tahan tempo jika kalah jumlah.",
    outOfPossession: "Pressing selektif pada pemicu, misal umpan ke bek sayap.",
    defensiveTransition: "Seimbang antara menekan pembawa bola dan mengamankan ruang di belakang bek tengah.",
    recruitment: "Minimum 2 peran posisi per pemain (versatile).",
    source: "PRD 8.1 (data terukur)",
  },
}

const qualitativePhase = (summary: string): PhaseModel => ({
  inPossession: summary,
  attackingTransition: "Penyesuaian transisi mengikuti mentalitas tim.",
  outOfPossession: "Blok dan intensitas press menyesuaikan preset FM.",
  defensiveTransition: "Regroup atau counter-press sesuai preset FM.",
  recruitment: "Belum diturunkan ke angka; menunggu kalibrasi Divisi 1.",
  source: "Rasionalisasi PM (kualitatif)",
})

export const TACTICAL_DNA_OPTIONS: TacticalDnaOption[] = [
  {
    code: "HIGH_PRESSING", label: "Gegenpress",
    description: "Press balik seketika setelah kehilangan bola; intensitas dan garis tinggi.",
    fmPreset: "Gegenpress", suggestedFormations: ["4-3-3", "4-2-3-1", "4-1-4-1"],
    mentality: "POSITIVE", tempo: "HIGH", pressing: "VERY_HIGH", defensiveLine: "HIGH",
    width: "NARROW", passingStyle: "DIRECT", phaseModel: PRD_PHASE.HIGH_PRESSING!,
  },
  {
    code: "POSITIONAL_PLAY", label: "Tiki-Taka",
    description: "Operan pendek bergantung dan penguasaan bola dengan rotasi half-space.",
    fmPreset: "Tiki-Taka", suggestedFormations: ["4-3-3", "4-2-3-1", "4-1-4-1"],
    mentality: "POSITIVE", tempo: "LOW", pressing: "HIGH", defensiveLine: "HIGH",
    width: "NARROW", passingStyle: "POSSESSION", phaseModel: PRD_PHASE.POSITIONAL_PLAY!,
  },
  {
    code: "VERTICAL_COUNTER", label: "Serangan Balik Vertikal",
    description: "Blok ringkas, bypass press, dan serangan balik cepat ke ruang belakang.",
    fmPreset: "Fluid Counter-attack / Vertical Tiki-Taka",
    suggestedFormations: ["4-4-2", "5-3-2", "4-3-3"],
    mentality: "POSITIVE", tempo: "HIGH", pressing: "HIGH", defensiveLine: "STANDARD",
    width: "STANDARD", passingStyle: "DIRECT", phaseModel: PRD_PHASE.VERTICAL_COUNTER!,
  },
  {
    code: "BALANCED_HYBRID", label: "Hybrid Seimbang",
    description: "Adaptif kandang-tandang: progresi aman, pressing selektif.",
    fmPreset: "Control Possession (hybrid)",
    suggestedFormations: ["4-2-3-1", "4-3-3", "4-4-2"],
    mentality: "BALANCED", tempo: "STANDARD", pressing: "MEDIUM", defensiveLine: "STANDARD",
    width: "STANDARD", passingStyle: "MIXED", phaseModel: PRD_PHASE.BALANCED_HYBRID!,
  },
  {
    code: "TOTAL_FOOTBALL", label: "Total Football",
    description: "Rotasi posisi tanpa kehilangan struktur; setiap pemain mengisi peran.",
    fmPreset: "Control Possession", suggestedFormations: ["4-3-3", "4-2-3-1", "4-1-4-1"],
    mentality: "POSITIVE", tempo: "LOW", pressing: "HIGH", defensiveLine: "HIGH",
    width: "NARROW", passingStyle: "POSSESSION",
    phaseModel: qualitativePhase("Sirkulasi dan rotasi posisi mirip Tiki-Taka."),
  },
  {
    code: "CATENACCIO", label: "Catenaccio / Blok Rendah",
    description: "Tiga bek tengah, blok rendah, umpan langsung, dan disiplin posisi.",
    fmPreset: "Catenaccio", suggestedFormations: ["5-3-2", "4-1-4-1", "4-4-1-1"],
    mentality: "DEFENSIVE", tempo: "LOW", pressing: "LOW", defensiveLine: "DEEP",
    width: "NARROW", passingStyle: "DIRECT",
    phaseModel: qualitativePhase("Blok rendah, trigger press jarang, regroup setelah kehilangan bola."),
  },
  {
    code: "WING_PLAY", label: "Wing Play",
    description: "Lebar maksimal, overlap fullback, umpan silang ke kotak penalti.",
    fmPreset: "Wing Play", suggestedFormations: ["4-4-2", "4-2-3-1", "4-3-3"],
    mentality: "POSITIVE", tempo: "HIGH", pressing: "MEDIUM", defensiveLine: "STANDARD",
    width: "WIDE", passingStyle: "DIRECT",
    phaseModel: qualitativePhase("Serangan lewat sayap dan umpan silang; lebar saat menyerang."),
  },
  {
    code: "DIAMOND_MIDFIELD", label: "Diamond Midfield",
    description: "Lini tengah belah ketupat dengan satu deep-lying playmaker.",
    fmPreset: "Control Possession", suggestedFormations: ["4-4-2", "4-1-2-1-2", "4-3-3"],
    mentality: "POSITIVE", tempo: "LOW", pressing: "MEDIUM", defensiveLine: "STANDARD",
    width: "NARROW", passingStyle: "POSSESSION",
    phaseModel: qualitativePhase("Kontrol tengah sempit; lebar datang dari fullback yang maju."),
  },
  {
    code: "FALSE_NINE", label: "Control Possession (False 9)",
    description: "False Nine adalah peran striker yang turun, bukan preset tim.",
    fmPreset: "Control Possession", suggestedFormations: ["4-3-3", "4-2-3-1", "4-5-1"],
    mentality: "POSITIVE", tempo: "LOW", pressing: "HIGH", defensiveLine: "HIGH",
    width: "NARROW", passingStyle: "POSSESSION",
    phaseModel: qualitativePhase("Striker turun membuat overload tengah; gelandang mengisi ruang."),
  },
  {
    code: "DIRECT_PHYSICAL", label: "Route One / Langsung",
    description: "Umpan panjang, duel udara, dan transisi cepat ke depan.",
    fmPreset: "Route One", suggestedFormations: ["4-4-2", "5-3-2", "4-3-3"],
    mentality: "ATTACKING", tempo: "HIGH", pressing: "HIGH", defensiveLine: "STANDARD",
    width: "WIDE", passingStyle: "DIRECT",
    phaseModel: qualitativePhase("Bypass press dengan umpan langsung ke target man."),
  },
]

export interface FormationTemplate {
  code: string
  label: string
  description: string
}

export const FORMATION_TEMPLATES: FormationTemplate[] = [
  { code: "4-2-3-1", label: "4-2-3-1", description: "Kontrol modern, dua pivot" },
  { code: "4-3-3", label: "4-3-3", description: "Trident, pressing tinggi" },
  { code: "4-4-2", label: "4-4-2", description: "Klasik, dua striker" },
  { code: "3-4-3", label: "3-4-3", description: "Wing-back menyerang" },
  { code: "3-5-2", label: "3-5-2", description: "Diamond, tiga bek" },
  { code: "4-1-4-1", label: "4-1-4-1", description: "Single pivot, empat gelandang" },
  { code: "5-3-2", label: "5-3-2", description: "Blok rendah, kontra" },
  { code: "4-2-2-2", label: "4-2-2-2", description: "Persegi ajaib" },
  { code: "4-3-2-1", label: "4-3-2-1", description: "Pohon Natal" },
  { code: "3-4-1-2", label: "3-4-1-2", description: "Sempit, nomor 10" },
  { code: "4-4-1-1", label: "4-4-1-1", description: "Penyerang lubang" },
  { code: "4-1-2-1-2", label: "4-1-2-1-2", description: "Diamond 4-4-2" },
  { code: "5-4-1", label: "5-4-1", description: "Sweeper + target man" },
]

export interface TacticalProfile {
  formation: string
  formationSource: "AUTO" | "MANUAL"
  formationInPossession: string
  formationOutOfPossession: string
  fmPreset: string
  dnaLabel: string
  dnaDescription: string
  mentality: Mentality
  tempo: Tempo
  pressing: Pressing
  defensiveLine: DefensiveLine
  width: Width
  passingStyle: PassingStyle
  phaseModel: PhaseModel
}

export function findDna(code: string): TacticalDnaOption | undefined {
  return TACTICAL_DNA_OPTIONS.find((d) => d.code === code)
}

const LABELS: Record<string, Record<string, string>> = {
  mentality: {
    DEFENSIVE: "Bertahan", BALANCED: "Seimbang", POSITIVE: "Positif", ATTACKING: "Menyerang",
  },
  tempo: { LOW: "Rendah", STANDARD: "Standar", HIGH: "Tinggi" },
  pressing: { LOW: "Jarang", MEDIUM: "Sedang", HIGH: "Tinggi", VERY_HIGH: "Sangat tinggi" },
  defensiveLine: { DEEP: "Dalam", STANDARD: "Standar", HIGH: "Tinggi" },
  width: { NARROW: "Sempit", STANDARD: "Standar", WIDE: "Lebar" },
  passingStyle: { DIRECT: "Langsung", MIXED: "Campuran", POSSESSION: "Penguasaan bola" },
}

export function labelFor(group: keyof typeof LABELS, code: string): string {
  return LABELS[group][code] ?? code
}

/** Auto: pilih salah satu dari 3 formasi saran FM sesuai target. */
export function resolveFormation(input: {
  formationMode: "AUTO" | "MANUAL"
  baseFormation: string
  tacticalDna: string
  targetOutcome: string
}): { formation: string; source: "AUTO" | "MANUAL" } {
  if (input.formationMode === "MANUAL") {
    const custom = input.baseFormation.trim()
    if (custom.length < 3 || custom.length > 20) {
      throw new Error("Formasi manual wajib diisi (3–20 karakter)")
    }
    return { formation: custom, source: "MANUAL" }
  }
  const preset = findDna(input.tacticalDna)
  if (!preset) throw new Error("Gaya bermain tidak dikenal")
  const index = input.targetOutcome === "MID_TABLE_SUSTAINABLE" ? 2
    : input.targetOutcome === "TOP_4" ? 1 : 0
  return { formation: preset.suggestedFormations[index], source: "AUTO" }
}

export function buildTacticalProfile(input: {
  formationMode: "AUTO" | "MANUAL"
  baseFormation: string
  tacticalDna: string
  targetOutcome: string
  mentality?: Mentality
  tempo?: Tempo
  pressing?: Pressing
  defensiveLine?: DefensiveLine
  width?: Width
  passingStyle?: PassingStyle
}): TacticalProfile {
  const { formation, source } = resolveFormation(input)
  const preset = findDna(input.tacticalDna)
  return {
    formation,
    formationSource: source,
    formationInPossession: formation,
    formationOutOfPossession: preset?.suggestedFormations[2] ?? formation,
    fmPreset: preset?.fmPreset ?? "Tidak tersedia",
    dnaLabel: preset?.label ?? input.tacticalDna,
    dnaDescription: preset?.description ?? "",
    mentality: input.mentality ?? preset?.mentality ?? "BALANCED",
    tempo: input.tempo ?? preset?.tempo ?? "STANDARD",
    pressing: input.pressing ?? preset?.pressing ?? "MEDIUM",
    defensiveLine: input.defensiveLine ?? preset?.defensiveLine ?? "STANDARD",
    width: input.width ?? preset?.width ?? "STANDARD",
    passingStyle: input.passingStyle ?? preset?.passingStyle ?? "MIXED",
    phaseModel: preset?.phaseModel ?? qualitativePhase("Profil tidak dikenal."),
  }
}
