import { encrypt, decrypt, pack, unpack } from "./crypto.ts"

export function encryptField(
  plaintext: string,
  key: Buffer,
  keyId: string,
  clubId: string,
  table: string,
  column: string,
  rowId: string
): Buffer {
  const aad = Buffer.from(`${clubId}|${table}|${column}|${rowId}|${keyId}`, "utf8")
  const blob = encrypt(plaintext, key, keyId, aad)
  return pack(blob)
}

export function decryptField(
  blob: Buffer,
  key: Buffer,
  clubId: string,
  table: string,
  column: string,
  rowId: string
): string {
  const unpacked = unpack(blob)
  const aad = Buffer.from(`${clubId}|${table}|${column}|${rowId}|${unpacked.keyId}`, "utf8")
  return decrypt(unpacked, key, aad)
}
