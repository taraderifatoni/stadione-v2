export type InsightSnapshot = {
  content_id: string; media_id: string; format: string; published_at: string | null;
  metrics: Record<string, number | null>; unavailable?: string[]; fetched_at: string | null;
  last_error?: string | null; last_attempt_at?: string | null; permalink?: string | null;
};
export type Performance = {
  label: "Bagus" | "Normal" | "Perlu ditingkatkan" | "Belum cukup data" | "Belum tersedia";
  tone: "good" | "neutral" | "poor" | "pending"; reasons: string[];
  engagement_rate: number | null; interaction_count: number | null;
  benchmark: { count: number; reach: number; engagement_rate: number; age_band: string } | null;
};
function ageHours(snapshot: InsightSnapshot) { return (Date.parse(snapshot.fetched_at || "") - Date.parse(snapshot.published_at || "")) / 3600000; }
function ageBand(hours: number) { return hours < 6 ? "0–6 jam" : hours < 24 ? "6–24 jam" : hours < 72 ? "1–3 hari" : hours < 168 ? "3–7 hari" : hours < 336 ? "7–14 hari" : hours < 720 ? "14–30 hari" : "30 hari atau lebih"; }
function interactions(s: InsightSnapshot) {
  if (typeof s.metrics.total_interactions === "number") return s.metrics.total_interactions;
  const values = ["likes", "comments", "saved", "shares"].map(name => s.metrics[name]);
  return values.every(v => typeof v === "number") ? (values as number[]).reduce((a,b) => a+b, 0) : null;
}
function rate(s: InsightSnapshot) { const count=interactions(s),reach=s.metrics.reach; return count !== null && typeof reach === "number" && reach > 0 ? count / reach * 100 : null; }
function median(values: number[]) { const sorted=[...values].sort((a,b)=>a-b), mid=Math.floor(sorted.length/2); return sorted.length%2 ? sorted[mid] : (sorted[mid-1]+sorted[mid])/2; }
export function assessPerformance(s: InsightSnapshot, all: InsightSnapshot[], now = Date.now()): Performance {
  const er=rate(s), age=ageHours(s), reach=s.metrics.reach;
  const result: Performance={label:"Belum cukup data",tone:"pending",reasons:[],engagement_rate:er,interaction_count:interactions(s),benchmark:null};
  if (!s.fetched_at || Object.values(s.metrics).every(value => value === null)) { result.label="Belum tersedia"; result.reasons.push(s.last_error || "Insight belum berhasil diambil dari Meta."); return result; }
  if (s.last_error || now - Date.parse(s.fetched_at) > 3600000) { result.reasons.push("Data terakhir belum diperbarui; refresh insight sebelum menilai performa."); if(s.last_error)result.reasons.push(s.last_error); return result; }
  if (!Number.isFinite(age) || age < 0) { result.reasons.push("Waktu publikasi belum terverifikasi."); return result; }
  if (age < 24) result.reasons.push("Posting belum berumur 24 jam; beri waktu untuk distribusi.");
  if (typeof reach !== "number" || reach < 100) result.reasons.push(`Jangkauan ${reach ?? "belum tersedia"}; penilaian menunggu minimal 100 akun agar sampel lebih layak.`);
  if (er === null) result.reasons.push("Jangkauan atau interaksi belum lengkap; engagement rate belum bisa dihitung.");
  const band=ageBand(age);
  const peers=all.filter(p=>p.content_id!==s.content_id && p.format===s.format && p.fetched_at && !p.last_error && now-Date.parse(p.fetched_at)<=3600000 && Number.isFinite(ageHours(p)) && ageBand(ageHours(p))===band && (p.metrics.reach ?? 0)>=100 && rate(p)!==null);
  if (peers.length < 5) result.reasons.push(`Baru ${peers.length} pembanding dengan format dan umur serupa; diperlukan minimal 5 posting Stadione.`);
  if(result.reasons.length) return result;
  const medianReach=median(peers.map(p=>p.metrics.reach!)),medianEr=median(peers.map(p=>rate(p)!));
  result.benchmark={count:peers.length,reach:medianReach,engagement_rate:medianEr,age_band:band};
  if (medianEr===0) { result.reasons.push("Median engagement pembanding masih nol; belum cukup sinyal untuk label bagus atau buruk."); return result; }
  const reachRatio=reach!/medianReach,erRatio=er!/medianEr;
  if ((reachRatio>=1.2 && erRatio>=0.8) || (erRatio>=1.2 && reachRatio>=0.8)) { result.label="Bagus";result.tone="good"; }
  else if (reachRatio<0.8 && erRatio<0.8) { result.label="Perlu ditingkatkan";result.tone="poor"; }
  else { result.label="Normal";result.tone="neutral"; }
  result.reasons.push(`Jangkauan ${Math.round(reachRatio*100)}% dari median ${peers.length} posting ${s.format} berumur ${band}.`, `Engagement rate ${er!.toFixed(2)}%, dibanding median ${medianEr.toFixed(2)}%.`);
  result.reasons.push(result.tone==="good" ? "Salah satu indikator setidaknya 20% di atas median, dengan indikator lain tidak lebih dari 20% di bawah median." : result.tone==="poor" ? "Jangkauan dan engagement rate sama-sama lebih dari 20% di bawah median. Tinjau hook, sudut cerita dan distribusi." : "Performa belum memenuhi batas bagus atau kedua indikator rendah; bandingkan perubahan pada refresh berikutnya.");
  return result;
}
