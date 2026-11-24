import { encryptField } from "./field-crypto.ts"
import type { KeyringEntry } from "./keyring.ts"
import type { PlaybookGenerateInput } from "./validation.ts"
import { buildTacticalProfile } from "./tactics.ts"

/** Payload baris `juara_playbooks` yang siap dikirim ke PostgREST. */
export interface PlaybookInsertRow {
  id: string
  club_id: string
  version_name: string
  horizon_years: number
  target_sporting_outcome: PlaybookGenerateInput["targetOutcome"]
  tactical_dna_type: PlaybookGenerateInput["tacticalDna"]
  base_formation: string
  philosophy_star_pct: number
  philosophy_prime_pct: number
  philosophy_academy_pct: number
  owner_equity_injection_enc: string
  tactical_profile_enc: string
  scr_max_threshold_pct: number
  status: "DRAFT"
}

const TABLE = "juara_playbooks"

/**
 * Bangun baris insert. `rowId` harus dipakai sebagai `id` baris sekaligus AAD
 * enkripsi, supaya ciphertext terikat ke barisnya (ARCHITECTURE §6.2).
 */
export function buildPlaybookInsertRow(
  input: PlaybookGenerateInput,
  clubId: string,
  rowId: string,
  keyring: KeyringEntry
): PlaybookInsertRow {
  const equity = encryptField(
    String(input.guardrails.equity),
    keyring.key,
    keyring.keyId,
    clubId,
    TABLE,
    "owner_equity_injection_enc",
    rowId
  )
  const profile = encryptField(
    JSON.stringify(buildTacticalProfile(input)),
    keyring.key,
    keyring.keyId,
    clubId,
    TABLE,
    "tactical_profile_enc",
    rowId
  )

  return {
    id: rowId,
    club_id: clubId,
    version_name: `${input.targetOutcome} ${input.horizonYears}Y`,
    horizon_years: input.horizonYears,
    target_sporting_outcome: input.targetOutcome,
    tactical_dna_type: input.tacticalDna,
    base_formation: buildTacticalProfile(input).formation,
    philosophy_star_pct: input.philosophy.star,
    philosophy_prime_pct: input.philosophy.competitive,
    philosophy_academy_pct: input.philosophy.academy,
    owner_equity_injection_enc: `\\x${equity.toString("hex")}`,
    tactical_profile_enc: `\\x${profile.toString("hex")}`,
    scr_max_threshold_pct: input.guardrails.scrMax,
    status: "DRAFT",
  }
}
