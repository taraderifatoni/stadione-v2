import type { DraftObject } from "./draft-dto.ts"

export interface RecoveryChoice {
  /** Draft yang ditampilkan setelah user memilih. */
  draft: DraftObject
  /** Salinan edit lokal tetap tersedia sampai user memilih memulihkannya. */
  localBackup: DraftObject | null
  restoredLocal: boolean
  status: string
}

export function cloneDraft(draft: DraftObject): DraftObject {
  return JSON.parse(JSON.stringify(draft)) as DraftObject
}

/** Memuat versi server: form mengikuti server, edit lokal hanya disimpan sebagai backup. */
export function chooseServerDraft(server: DraftObject, localBackup: DraftObject | null): RecoveryChoice {
  return {
    draft: cloneDraft(server),
    localBackup: localBackup ? cloneDraft(localBackup) : null,
    restoredLocal: false,
    status: "Versi server dimuat. Salinan edit lokal tersimpan; pulihkan secara eksplisit bila ingin memakainya.",
  }
}

/** Memulihkan edit lokal secara sadar, pada revision server yang sudah dimuat. */
export function chooseLocalDraft(localBackup: DraftObject, server: DraftObject): RecoveryChoice {
  return {
    draft: cloneDraft(localBackup),
    localBackup: cloneDraft(localBackup),
    restoredLocal: true,
    status: "Edit lokal dipulihkan di atas revision server. Menyimpan akan menimpa perubahan server yang belum Anda lihat.",
  }
}
