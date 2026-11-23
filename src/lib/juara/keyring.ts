import { Buffer } from "node:buffer"

/**
 * Keyring enkripsi JUARA (ARCHITECTURE §6.3).
 * Env: `JUARA_ENCRYPTION_KEYS` = JSON map `{ "v1": "<base64 32 byte>", ... }`,
 * `JUARA_ACTIVE_KEY_ID` = key id yang dipakai untuk enkripsi baru.
 * Nilai kunci tidak pernah dicetak ke log.
 */

export interface KeyringEntry {
  keyId: string
  key: Buffer
}

const KEY_LEN = 32

export function parseKeyring(
  raw: string | undefined,
  activeKeyId: string | undefined
): KeyringEntry {
  if (!raw) throw new Error("JUARA_ENCRYPTION_KEYS belum di-set")
  if (!activeKeyId) throw new Error("JUARA_ACTIVE_KEY_ID belum di-set")

  let map: unknown
  try {
    map = JSON.parse(raw)
  } catch {
    throw new Error("JUARA_ENCRYPTION_KEYS bukan JSON yang valid")
  }
  if (typeof map !== "object" || map === null || Array.isArray(map)) {
    throw new Error("JUARA_ENCRYPTION_KEYS harus berupa objek key_id -> base64")
  }
  const value = (map as Record<string, unknown>)[activeKeyId]
  if (typeof value !== "string") {
    throw new Error(`Key id aktif "${activeKeyId}" tidak ada di JUARA_ENCRYPTION_KEYS`)
  }
  const key = Buffer.from(value, "base64")
  if (key.length !== KEY_LEN) {
    throw new Error(`Kunci "${activeKeyId}" harus ${KEY_LEN} byte (AES-256)`)
  }
  return { keyId: activeKeyId, key }
}

export function getActiveKey(): KeyringEntry | null {
  if (!process.env.JUARA_ENCRYPTION_KEYS || !process.env.JUARA_ACTIVE_KEY_ID) return null
  return parseKeyring(process.env.JUARA_ENCRYPTION_KEYS, process.env.JUARA_ACTIVE_KEY_ID)
}
