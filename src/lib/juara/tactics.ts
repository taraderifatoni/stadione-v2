/**
 * Taktik & formasi ala Football Manager — sumber label dan preset.
 * Dipakai wizard, engine ringkas, dan penyimpanan profil terenkripsi.
 * Tidak mengandung data klub nyata; semua nilai adalah konfigurasi produk.
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

export interface TacticalDnaOption {
  code: TacticalDnaCode
  label: string
  description: string
  formation: string
  mentality: Mentality
  tempo: Tempo
  pressing: Pressing
  defensiveLine: DefensiveLine
  width: Width
  passingStyle: PassingStyle
}

export const TACTICAL_DNA_OPTIONS: TacticalDnaOption[] = [
  {
    code: "HIGH_PRESSING", label: "Gegenpress",
    description: "Rebut bola tinggi, transisi cepat, bertahan dengan garis tinggi.",
    formation: "4-2-3-1", mentality: "POSITIVE", tempo: "HIGH", pressing: "VERY_HIGH",
    defensiveLine: "HIGH", width: "WIDE", passingStyle: "DIRECT",
  },
  {
    code: "POSITIONAL_PLAY", label: "Tiki-Taka",
    description: "Kuasai bola lewat kombinasi pendek dan redistribusi posisi.",
    formation: "4-3-3", mentality: "POSITIVE", tempo: "LOW", pressing: "HIGH",
    defensiveLine: "HIGH", width: "WIDE", passingStyle: "POSSESSION",
  },
  {
    code: "VERTICAL_COUNTER", label: "Vertical Counter",
    description: "Blok tengah ringkas, serangan langsung ke depan setelah rebound.",
    formation: "4-4-2", mentality: "BALANCED", tempo: "HIGH", pressing: "MEDIUM",
    defensiveLine: "STANDARD", width: "STANDARD", passingStyle: "DIRECT",
  },
  {
    code: "BALANCED_HYBRID", label: "Seimbang",
    description: "Default aman: kontrol sedang, transisi adaptif lawan.",
    formation: "4-2-3-1", mentality: "BALANCED", tempo: "STANDARD", pressing: "MEDIUM",
    defensiveLine: "STANDARD", width: "STANDARD", passingStyle: "MIXED",
  },
  {
    code: "TOTAL_FOOTBALL", label: "Total Football",
    description: "Setiap pemain bisa mengisi peran; rotasi posisi tanpa kehilangan struktur.",
    formation: "4-3-3", mentality: "POSITIVE", tempo: "STANDARD", pressing: "HIGH",
    defensiveLine: "HIGH", width: "WIDE", passingStyle: "POSSESSION",
  },
  {
    code: "CATENACCIO", label: "Low Block / Catenaccio",
    description: "Barisan pertahanan dalam, disiplin, dan serangan dari set-piece.",
    formation: "5-3-2", mentality: "DEFENSIVE", tempo: "LOW", pressing: "LOW",
    defensiveLine: "DEEP", width: "NARROW", passingStyle: "DIRECT",
  },
  {
    code: "WING_PLAY", label: "Wing Play",
    description: "Lebar maksimal, overlap fullback, umpan silang ke kotak.",
    formation: "4-4-2", mentality: "POSITIVE", tempo: "HIGH", pressing: "MEDIUM",
    defensiveLine: "STANDARD", width: "WIDE", passingStyle: "DIRECT",
  },
  {
    code: "DIAMOND_MIDFIELD", label: "Diamond Midfield",
    description: "Kontrol lini tengah sempit dengan satu playmaker di puncak diamond.",
    formation: "4-4-2", mentality: "POSITIVE", tempo: "LOW", pressing: "MEDIUM",
    defensiveLine: "STANDARD", width: "NARROW", passingStyle: "POSSESSION",
  },
  {
    code: "FALSE_NINE", label: "False Nine",
    description: "Striker turun menghubungkan lini, membuka ruang untuk gelandang serang.",
    formation: "4-3-3", mentality: "POSITIVE", tempo: "LOW", pressing: "HIGH",
    defensiveLine: "HIGH", width: "STANDARD", passingStyle: "POSSESSION",
  },
  {
    code: "DIRECT_PHYSICAL", label: "Direct / Physical",
    description: "Umpan panjang, duel udara, dan intensitas tinggi di area lawan.",
    formation: "4-4-2", mentality: "ATTACKING", tempo: "HIGH", pressing: "HIGH",
    defensiveLine: "STANDARD", width: "WIDE", passingStyle: "DIRECT",
  },
]

export interface FormationTemplate {
  code: string
  label: string
  description: string
}

export const FORMATION_TEMPLATES: FormationTemplate[] = [
  { code: "4-2-3-1", label: "4-2-3-1", description: "Kontrol modern, dua pivot" },
  { code: "4-3-3", label: "4-3-3", description: "Trident, lebar dan pressing" },
  { code: "4-4-2", label: "4-4-2", description: "Klasik, dua striker" },
  { code: "3-4-3", label: "3-4-3", description: "Wing-back menyerang" },
  { code: "3-5-2", label: "3-5-2", description: "Diamond, tiga bek" },
  { code: "4-1-4-1", label: "4-1-4-1", description: "Single pivot, empat gelandang" },
  { code: "5-3-2", label: "5-3-2", description: "Low block, kontra" },
  { code: "4-2-2-2", label: "4-2-2-2", description: "Wide diamond" },
  { code: "4-3-2-1", label: "4-3-2-1", description: "Pohon Natal" },
  { code: "3-4-1-2", label: "3-4-1-2", description: "Sempit, angka 10" },
]

export interface TacticalProfile {
  formation: string
  formationSource: "AUTO" | "MANUAL"
  dnaLabel: string
  dnaDescription: string
  mentality: Mentality
  tempo: Tempo
  pressing: Pressing
  defensiveLine: DefensiveLine
  width: Width
  passingStyle: PassingStyle
}

export function findDna(code: string): TacticalDnaOption | undefined {
  return TACTICAL_DNA_OPTIONS.find((d) => d.code === code)
}

const LABELS: Record<string, Record<string, string>> = {
  mentality: {
    DEFENSIVE: "Defensive", BALANCED: "Balanced", POSITIVE: "Positive", ATTACKING: "Attacking",
  },
  tempo: { LOW: "Rendah", STANDARD: "Standar", HIGH: "Tinggi" },
  pressing: {
    LOW: "Rendah", MEDIUM: "Sedang", HIGH: "Tinggi", VERY_HIGH: "Sangat tinggi",
  },
  defensiveLine: { DEEP: "Dalam", STANDARD: "Standar", HIGH: "Tinggi" },
  width: { NARROW: "Sempit", STANDARD: "Standar", WIDE: "Lebar" },
  passingStyle: { DIRECT: "Langsung", MIXED: "Campuran", POSSESSION: "Penguasaan bola" },
}

export function labelFor(group: keyof typeof LABELS, code: string): string {
  return LABELS[group][code] ?? code
}

/**
 * Formasi otomatis berdasarkan DNA + target. Untuk target stabil, formasi
 * agresif diredam ke 4-2-3-1 supaya SCR tetap realistis.
 */
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
  const conservative = input.targetOutcome === "MID_TABLE_SUSTAINABLE"
  return {
    formation: conservative && preset.mentality === "ATTACKING" ? "4-2-3-1" : preset.formation,
    source: "AUTO",
  }
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
  const dna = findDna(input.tacticalDna)
  return {
    formation,
    formationSource: source,
    dnaLabel: dna?.label ?? input.tacticalDna,
    dnaDescription: dna?.description ?? "",
    mentality: input.mentality ?? dna?.mentality ?? "BALANCED",
    tempo: input.tempo ?? dna?.tempo ?? "STANDARD",
    pressing: input.pressing ?? dna?.pressing ?? "MEDIUM",
    defensiveLine: input.defensiveLine ?? dna?.defensiveLine ?? "STANDARD",
    width: input.width ?? dna?.width ?? "STANDARD",
    passingStyle: input.passingStyle ?? dna?.passingStyle ?? "MIXED",
  }
}
