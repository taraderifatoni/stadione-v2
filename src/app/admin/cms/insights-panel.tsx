"use client";
import { type InsightSnapshot, type Performance } from "@/lib/cms/performance";
export type ContentInsight = InsightSnapshot & { performance: Performance };
const colors={good:"text-emerald-300 bg-emerald-500/10",poor:"text-red-300 bg-red-500/10",neutral:"text-sky-300 bg-sky-500/10",pending:"text-[#B5AC8A] bg-white/5"};
const percent=(value:number|null|undefined)=>typeof value==="number"?new Intl.NumberFormat("id-ID",{maximumFractionDigits:2}).format(value)+"%":"Belum tersedia";
const number=(value:number|null|undefined)=>typeof value==="number"?new Intl.NumberFormat("id-ID",{maximumFractionDigits:2}).format(value):"Belum tersedia";
export function PerformanceCell({insight,published,onOpen}:{insight?:ContentInsight;published:boolean;onOpen:()=>void}) {
  if(!published)return <span className="text-[10px] text-[#6B6558]">Performa setelah tayang</span>;
  return <button onClick={onOpen} className="text-left rounded-lg p-2 hover:bg-white/5" aria-label="Lihat detail insight dan performa">
    <span className={`rounded px-2 py-1 text-[10px] font-bold ${colors[insight?.performance.tone || "pending"]}`}>{insight?.performance.label || "Belum tersedia"}</span>
    <span className="mt-2 block text-[10px] text-[#B5AC8A]">{insight?.fetched_at?`${number(insight.metrics.reach)} akun · ${percent(insight.performance.engagement_rate)} interaksi`:"Lihat detail"}</span>
  </button>;
}
export function InsightsPanel({insight,loading,onRefresh}:{insight?:ContentInsight;loading:boolean;onRefresh:()=>void}) {
  const metrics=insight?.metrics || {},performance=insight?.performance;
  const cards=[
    ["views","Tayangan","Jumlah tampilan/pemutaran; satu akun dapat dihitung beberapa kali."],
    ["reach","Jangkauan","Perkiraan jumlah akun unik yang melihat posting."],
    ["likes","Suka","Suka pada posting."],["comments","Komentar","Komentar pada posting."],
    ["saved","Disimpan","Berapa kali posting disimpan."],["shares","Dibagikan","Berapa kali posting dibagikan."],
  ];
  return <div className="space-y-5">
    <div className="flex items-center justify-between gap-3"><span className={`rounded-lg px-3 py-2 text-xs font-bold ${colors[performance?.tone || "pending"]}`}>{performance?.label || "Insight belum tersedia"}</span><button disabled={loading} onClick={onRefresh} className="rounded-lg bg-[#84102D] px-3 py-2 text-xs font-bold disabled:opacity-40">{loading?"Memperbarui…":"Refresh insight"}</button></div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{cards.map(([key,title,description])=><div key={key} className="rounded-xl border border-[#2E2C28] bg-[#0D0D0D] p-3"><p className="text-xs text-[#B5AC8A]">{title}</p><p className="mt-2 text-lg font-bold text-[#F5F0E8]">{number(metrics[key])}</p><p className="mt-2 text-[10px] leading-relaxed text-[#8A8375]">{description}</p></div>)}</div>
    <div className="rounded-xl border border-[#2E2C28] p-4"><p className="text-xs font-bold">Engagement rate {percent(performance?.engagement_rate)}</p><p className="mt-2 text-[11px] leading-relaxed text-[#B5AC8A]">Interaksi ({number(performance?.interaction_count)}) ÷ akun terjangkau × 100. Meta total interactions dipakai bila tersedia; alternatifnya jumlah suka, komentar, simpan dan bagikan yang lengkap. Ini jumlah interaksi, bukan persentase orang unik yang berinteraksi.</p></div>
    {insight?.format==="REEL" && <div className="rounded-xl border border-[#2E2C28] p-4"><p className="text-xs font-bold">Waktu tonton Reels</p><p className="mt-2 text-sm">Rata-rata {number(typeof metrics.ig_reels_avg_watch_time==="number"?metrics.ig_reels_avg_watch_time/1000:null)} detik</p><p className="mt-1 text-sm">Total {number(typeof metrics.ig_reels_video_view_total_time==="number"?metrics.ig_reels_video_view_total_time/1000:null)} detik</p><p className="mt-2 text-[10px] text-[#8A8375]">Belum tersedia berarti Meta belum mengembalikan metrik; bukan nol atau bukti penonton tidak menonton.</p></div>}
    <div><h3 className="text-xs font-bold">Kenapa mendapat penilaian ini?</h3><ul className="mt-3 list-disc space-y-2 pl-4 text-xs leading-relaxed text-[#B5AC8A]">{(performance?.reasons || ["Menunggu data Instagram."]).map(reason=><li key={reason}>{reason}</li>)}</ul></div>
    {performance?.benchmark && <div className="rounded-xl border border-[#2E2C28] p-4 text-xs leading-relaxed">Pembanding: {performance.benchmark.count} posting Stadione dengan format sama, umur {performance.benchmark.age_band}. Median jangkauan {number(performance.benchmark.reach)} akun dan engagement rate {percent(performance.benchmark.engagement_rate)}.</div>}
    <details className="text-[11px] leading-relaxed text-[#8A8375]"><summary className="cursor-pointer font-bold text-[#B5AC8A]">Cara membaca penilaian</summary><p className="mt-2">Penilaian internal Stadione, bukan skor dari Instagram. Minimal umur 24 jam, jangkauan 100 akun, dan 5 pembanding dengan format serta kelompok umur sama. Bagus bila jangkauan atau engagement setidaknya 20% di atas median dan indikator lainnya tidak lebih dari 20% di bawah median. Perlu ditingkatkan bila keduanya lebih dari 20% di bawah median. Selain itu normal. Data kurang, basi, atau median engagement nol belum diberi penilaian bagus/buruk.</p></details>
    {insight?.unavailable?.length ? <p className="text-[10px] leading-relaxed text-[#8A8375]">Metrik yang belum diberikan Meta: {insight.unavailable.join(", ")}.</p>:null}
    <p className="text-[10px] leading-relaxed text-[#8A8375]">Sumber Meta Insights · angka kumulatif organik, tidak mencakup interaksi iklan. Terakhir berhasil diperbarui {insight?.fetched_at?new Date(insight.fetched_at).toLocaleString("id-ID",{timeZone:"Asia/Jakarta"})+" WIB":"belum tersedia"}. Cache diperbarui saat CMS dibuka, paling sering 15 menit; tombol refresh mengambil ulang. Insight tidak mengubah jadwal posting.</p>
    {insight?.permalink && <a href={insight.permalink} target="_blank" rel="noreferrer" className="inline-block text-xs font-bold text-[#B5AC8A] underline">Buka posting Instagram</a>}
  </div>;
}
