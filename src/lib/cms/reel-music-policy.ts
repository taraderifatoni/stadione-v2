export type ReelCatalogAudio = {
  audio_id: string;
  title: string;
  artist: string;
  audio_volume: number;
  video_volume: number;
  checked_at: string;
  discovery: "TRENDING" | "SEARCH";
  source: "INSTAGRAM_CATALOG";
  editorial_override_reason: string;
};
export function catalogAudioIssues(value: unknown, format: string): string[] {
  if (value === undefined) return [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return ["Pilihan musik katalog tidak valid."];
  const audio = value as Partial<ReelCatalogAudio>;
  const errors: string[] = [];
  if (format !== "REEL") errors.push("Musik katalog API hanya untuk Reels.");
  if (!/^\d{5,30}$/.test(audio.audio_id || "")) errors.push("ID lagu katalog tidak valid.");
  if (!audio.title?.trim() || !audio.artist?.trim()) errors.push("Judul dan artis musik katalog wajib dicatat.");
  if (audio.source !== "INSTAGRAM_CATALOG" || !["TRENDING","SEARCH"].includes(audio.discovery || "") ||
      !Number.isFinite(Date.parse(audio.checked_at || ""))) errors.push("Bukti penelusuran katalog musik belum lengkap.");
  if ((audio.editorial_override_reason || "").trim().length < 20)
    errors.push("Musik katalog pada Reel hanya boleh menjadi pengecualian dengan alasan editorial spesifik minimal 20 karakter.");
  for (const key of ["audio_volume","video_volume"] as const)
    if (!Number.isInteger(audio[key]) || audio[key]! < (key === "audio_volume" ? 1 : 0) || audio[key]! > 100)
      errors.push("Volume musik/video harus bilangan bulat 0–100; musik minimal 1.");
  return errors;
}
export function catalogAudioConfiguration(audio: ReelCatalogAudio) {
  const issues = catalogAudioIssues(audio, "REEL");
  if (issues.length) throw new Error(issues.join(" "));
  return {audio_id: audio.audio_id, audio_volume: audio.audio_volume, video_volume: audio.video_volume};
}
