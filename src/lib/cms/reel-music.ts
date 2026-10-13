import "server-only";
import {catalogAudioIssues, type ReelCatalogAudio} from "./reel-music-policy";
const graph = "https://graph.facebook.com/v25.0";
type Track = {audio_id?: string; title?: string; display_artist?: string; duration_in_ms?: number; audio_type?: string; download_url?: string};
function credentials() {
  const token = process.env.META_ACCESS_TOKEN, igId = process.env.INSTAGRAM_USER_ID;
  if (!token || !igId) throw new Error("Koneksi Instagram untuk katalog musik belum tersedia.");
  return {token, igId};
}
async function read(url: URL) {
  const {token} = credentials();
  const response = await fetch(url, {headers:{Authorization:"Bearer "+token},cache:"no-store",signal:AbortSignal.timeout(20000)});
  const body = await response.json().catch(()=>({}));
  if (!response.ok || body.error || body.status >= 400)
    throw new Error("Katalog musik Meta: "+String(body.error?.message || body.detail || "HTTP "+response.status).replaceAll(token,"[REDACTED]"));
  return body;
}
export async function getReelMusicPool(query?: string) {
  const {igId} = credentials(), url = new URL(graph+"/ig_audio");
  url.searchParams.set("ig_user_id", igId);
  url.searchParams.set("audio_type", "music");
  if (query?.trim()) url.searchParams.set("search_query", query.trim());
  const body = await read(url);
  if (!Array.isArray(body.audio)) throw new Error("Respons katalog musik Meta tidak memiliki daftar audio.");
  const tracks = (body.audio as Track[]).filter(x=>/^\d{5,30}$/.test(x.audio_id || "") && x.audio_type === "music")
    .map(x=>({audio_id:x.audio_id!,title:x.title || "",artist:x.display_artist || "",duration_ms:x.duration_in_ms || 0,preview_url:x.download_url || null}));
  return {checked_at:new Date().toISOString(),source:"INSTAGRAM_CATALOG" as const,discovery:query?.trim()?"SEARCH" as const:"TRENDING" as const,query:query?.trim() || null,tracks};
}
export async function verifyReelCatalogAudio(audio: ReelCatalogAudio) {
  const issues = catalogAudioIssues(audio,"REEL");if (issues.length) throw new Error(issues.join(" "));
  const {igId} = credentials(), url = new URL(graph+"/"+audio.audio_id);
  // The specific-asset endpoint currently requires user_id; search accepts ig_user_id.
  url.searchParams.set("user_id",igId);
  const track = await read(url) as Track;
  if (track.audio_id !== audio.audio_id || track.audio_type !== "music" ||
      track.title !== audio.title || track.display_artist !== audio.artist)
    throw new Error("Lagu katalog sudah tidak tersedia atau metadata berubah; pilih dan review lagu lain.");
  return {audio_id:track.audio_id,title:track.title,artist:track.display_artist,checked_at:new Date().toISOString()};
}
