import crypto from "node:crypto"

export interface EncryptedBlob {
  version: number
  keyId: string
  nonce: Buffer
  ciphertext: Buffer
}

const VERSION = 1
const NONCE_LEN = 12
const TAG_LEN = 16
const KEY_LEN = 32

export function encrypt(plaintext: string, key: Buffer, keyId: string, aad?: Buffer): EncryptedBlob {
  if (key.length !== KEY_LEN) throw new Error("encryption key must be 32 bytes (AES-256)")
  const nonce = crypto.randomBytes(NONCE_LEN)
  const cipher = crypto.createCipheriv("aes-256-gcm", key, nonce)
  if (aad) cipher.setAAD(aad)
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return { version: VERSION, keyId, nonce, ciphertext: Buffer.concat([ct, tag]) }
}

export function decrypt(blob: EncryptedBlob, key: Buffer, aad?: Buffer): string {
  if (key.length !== KEY_LEN) throw new Error("encryption key must be 32 bytes (AES-256)")
  if (blob.nonce.length !== NONCE_LEN) throw new Error("invalid nonce length")
  if (blob.ciphertext.length < TAG_LEN) throw new Error("ciphertext too short")
  const ct = blob.ciphertext.subarray(0, blob.ciphertext.length - TAG_LEN)
  const tag = blob.ciphertext.subarray(blob.ciphertext.length - TAG_LEN)
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, blob.nonce)
  decipher.setAuthTag(tag)
  if (aad) decipher.setAAD(aad)
  try {
    const pt = Buffer.concat([decipher.update(ct), decipher.final()])
    return pt.toString("utf8")
  } catch {
    throw new Error("decryption failed: authentication tag mismatch")
  }
}

export function pack(blob: EncryptedBlob): Buffer {
  const keyIdBuf = Buffer.from(blob.keyId, "utf8")
  if (keyIdBuf.length > 255) throw new Error("keyId too long")
  return Buffer.concat([
    Buffer.from([blob.version]),
    Buffer.from([keyIdBuf.length]),
    keyIdBuf,
    blob.nonce,
    blob.ciphertext,
  ])
}

export function unpack(buf: Buffer): EncryptedBlob {
  if (buf.length < 1 + 1 + NONCE_LEN + TAG_LEN) throw new Error("buffer too short")
  let off = 0
  const version = buf[off++]
  const keyIdLen = buf[off++]
  if (off + keyIdLen + NONCE_LEN + TAG_LEN > buf.length) throw new Error("buffer truncated")
  const keyId = buf.subarray(off, off + keyIdLen).toString("utf8")
  off += keyIdLen
  const nonce = Buffer.from(buf.subarray(off, off + NONCE_LEN))
  off += NONCE_LEN
  const ciphertext = Buffer.from(buf.subarray(off))
  return { version, keyId, nonce, ciphertext }
}
