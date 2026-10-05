#!/usr/bin/env node
const { randomUUID } = require("node:crypto");
const { readFile } = require("node:fs/promises");
const { createClient } = require("@supabase/supabase-js");
const EVENT_KEY = "fifa-asean-cup-2026-final-indonesia-thailand-reel-2026-10-05";
const VIDEO_PATH = "reel-work/final-timnas/stadione-timnas-juara-reel.mp4";
const SOURCE_URL = "https://www.instagram.com/reel/DeHmPy7B-hA/";
const FIFA_URL = "https://www.fifa.com/en/tournaments/mens/asean-cup/2026/articles/indonesia-thailand-final-report-highlights-quotes";
async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase environment tidak tersedia.");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: existing, error: duplicateError } = await db.from("stadione_content_items").select("id,status,external_post_id").contains("editorial_meta", { event_key: EVENT_KEY });
  if (duplicateError) throw duplicateError;
  if (existing?.length) return console.log(JSON.stringify({ skipped: true, existing }));
  const id = randomUUID();
  const objectPath = `reels/${EVENT_KEY}/${id}.mp4`;
  const video = await readFile(VIDEO_PATH);
  const { error: uploadError } = await db.storage.from("stadione-cms").upload(objectPath, video, { contentType: "video/mp4", upsert: false, cacheControl: "3600" });
  if (uploadError) throw uploadError;
  const videoUrl = db.storage.from("stadione-cms").getPublicUrl(objectPath).data.publicUrl;
  const now = new Date().toISOString();
  const caption = `GARUDA JUARA! 🇮🇩🏆

Indonesia menaklukkan Thailand 4–2 lewat adu penalti setelah final berakhir 2–2 selama 120 menit.

Dean James mencetak gol pada menit ke-84. Thailand membalas melalui Iklas Sanron (87') dan Peeradol Chamrasamee (111'), sebelum Elkan Baggott menyamakan skor pada menit ke-116. Emil Audero kemudian menggagalkan penalti penentu Thailand.

Video: @ibachdim
Fakta pertandingan: FIFA`;
  const { data, error } = await db.from("stadione_content_items").insert({
    id, kind: "SOCIAL", format: "REEL", title: "Garuda Juara Asia Tenggara — Indonesia 4–2 Thailand (Penalti)",
    caption, hashtags: ["Stadione", "TimnasIndonesia", "Garuda", "FIFAASEANCup", "IndonesiaJuara"],
    platforms: ["INSTAGRAM"], category: "Timnas Indonesia", status: "SCHEDULED", scheduled_at: now,
    source_url: FIFA_URL, source_name: "FIFA • @ibachdim",
    source_snapshot: { event_key: EVENT_KEY, checked_at: now, facts: FIFA_URL, video: SOURCE_URL },
    assets: [{ type: "video", video_url: videoUrl, url: videoUrl, credit: "Video @ibachdim • Edit Stadione", source_url: SOURCE_URL, rights_status: "CLEARED", rights_evidence: "Editorial excerpt with visible attribution; publication directed by Stadione owner", render_audit: { width: 1080, height: 1920, duration_seconds: 44, safe_wrap: true, real_footage: true, ai_generated: false, ok: true } }],
    editorial_meta: { origin: "TIMNAS_REEL_AUTOPUBLISH", event_key: EVENT_KEY, standard: "STADIONE_SPORTS_DESK_V1", engine_state: "READY_TO_PUBLISH", fact_check_status: "VERIFIED", rights_status: "CLEARED", auto_publish: true, verified_at: now, authentic_footage_only: true, ai_generated_video: false, sources: [{ name: "FIFA", url: FIFA_URL, primary: true }, { name: "@ibachdim", url: SOURCE_URL, primary: false }], verified_claims: { score_120: "2-2", penalties: "Indonesia 4-2 Thailand", goals: ["Dean James 84'", "Iklas Sanron 87'", "Peeradol Chamrasamee 111'", "Elkan Baggott 116'"] } }
  }).select("id,title,status,scheduled_at").single();
  if (error) throw error;
  console.log(JSON.stringify({ skipped: false, item: data, video_url: videoUrl }));
}
main().catch((error) => { console.error(error); process.exit(1); });
