export const STADIONE_EDITORIAL_STANDARD = {
  name: "Stadione Sports Desk",
  positioning: "Media olahraga lokal yang tajam, kredibel, energik, dan dekat dengan komunitas.",
  pillars: ["Sepak Bola Eropa", "Sepak Bola Indonesia", "Olahraga Indonesia", "Tarkam & Komunitas"],
  rules: [
    "Dahulukan fakta dan konteks, bukan sensasi.",
    "Jangan mengarang kutipan, angka, cedera, hasil pertandingan, atau identitas atlet.",
    "Bedakan fakta sumber, analisis redaksi, dan hal yang masih perlu diverifikasi.",
    "Starting XI, hasil, jadwal, rumor, dan UGC wajib diberi label dan sumber yang sesuai.",
    "Banter menyoroti performa, bukan identitas; hindari doxing, penghinaan, atau mempermalukan pemain amatir dan anak.",
    "Jangan menjadikan cedera atau kecelakaan sebagai lelucon; UGC wajib bermoderasi dan punya izin yang tercatat.",
    "Semua draf otomatis wajib ditinjau editor sebelum dijadwalkan atau diterbitkan.",
  ],
} as const

export type EditorialSlot = { key: string; day: string; time: string; label: string; theme: string; pillar: string; angle: string }
export const WEEKLY_MATRIX: EditorialSlot[] = [
  { key: "mon-am", day: "Senin", time: "08:00", label: "Highlight / meme Eropa", theme: "Rekap hasil semalam atau reaction atas hasil yang sudah terkonfirmasi", pillar: "Sepak Bola Eropa", angle: "Recap / reaction" },
  { key: "mid-am", day: "Selasa–Kamis", time: "08:00", label: "Update / nostalgia", theme: "Hasil kompetisi jika ada; jika tidak, momen bersejarah yang dapat diverifikasi", pillar: "Sepak Bola Eropa", angle: "Update / nostalgia" },
  { key: "fri-am", day: "Jumat", time: "08:00", label: "Preview non-bola", theme: "Preview agenda F1, MotoGP, atau BWF; hasil hanya setelah sesi berlangsung", pillar: "Olahraga Indonesia", angle: "Preview" },
  { key: "match-am", day: "Sabtu–Minggu", time: "08:00", label: "Morning reaction", theme: "Reaction hasil semalam, momen krusial, atau kontroversi dengan sumber terverifikasi", pillar: "Sepak Bola Eropa", angle: "Reaction" },
  { key: "mon-noon", day: "Senin", time: "13:00", label: "Non-bola pride", theme: "Apresiasi prestasi atlet Indonesia atau momen akhir pekan yang terkonfirmasi", pillar: "Olahraga Indonesia", angle: "Apresiasi" },
  { key: "mid-noon", day: "Selasa–Kamis", time: "13:00", label: "Sepak bola lokal", theme: "Liga Indonesia, rumor dengan label jelas, atau bedah taktik berbasis data", pillar: "Sepak Bola Indonesia", angle: "Update / analisis" },
  { key: "fri-noon", day: "Jumat", time: "13:00", label: "Trivia / interaksi", theme: "Polling big match atau tebak pemain dengan jawaban dan sumber internal", pillar: "Komunitas", angle: "Interaksi" },
  { key: "match-noon", day: "Sabtu–Minggu", time: "13:00", label: "Tarkam / kearifan lokal", theme: "UGC sepak bola komunitas; hanya tayang setelah izin, kredit, dan moderasi lolos", pillar: "Tarkam & Komunitas", angle: "UGC" },
  { key: "mon-pm", day: "Senin", time: "20:00", label: "Tarkam of the week", theme: "Momen komunitas pilihan dengan izin tertulis dan konteks lokasi/tanggal", pillar: "Tarkam & Komunitas", angle: "UGC / momen" },
  { key: "mid-pm", day: "Selasa–Kamis", time: "20:00", label: "Hot news / quotes", theme: "Isu aktual atau kutipan langsung; verifikasi sumber primer dan konteks", pillar: "Sepak Bola Indonesia", angle: "Kutipan / update" },
  { key: "fri-pm", day: "Jumat", time: "20:00", label: "Kick-off / preview lokal", theme: "Starting XI resmi atau preview laga sesuai jadwal aktual", pillar: "Sepak Bola Indonesia", angle: "Preview / matchday" },
  { key: "match-pm", day: "Sabtu–Minggu", time: "20:00", label: "Watchalong / live momen", theme: "Live momen hanya dengan sumber real-time/editor; snapshot tren bukan feed live", pillar: "Sepak Bola Indonesia", angle: "Live / reaction" },
]

export type EditorialCandidate = {
  id?: string; title: string; snippet?: string | null; source?: string | null; sourceUrl?: string | null
  imageUrl?: string | null; publishedAt?: string | null; engine?: string | null
  metrics?: Record<string, number | string | null>
}
const clean = (value?: string | null) => String(value || "").replace(/\s+/g, " ").trim()
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char)
export function slugifyCms(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90) || `stadione-${Date.now()}`
}

// A source-led newsroom brief, not fabricated article copy. Editors add verified facts before review.
export function buildEditorialPackage(candidate: EditorialCandidate) {
  const title = clean(candidate.title).slice(0, 96)
  const snippet = clean(candidate.snippet)
  const source = clean(candidate.source) || "Sumber belum diidentifikasi"
  const body = [
    `<p><strong>BRIEF REDAKSI — BELUM UNTUK PUBLIKASI</strong></p>`,
    `<h2>Isu yang terpantau</h2><p>${escapeHtml(title)}</p>`,
    snippet ? `<h2>Cuplikan dari sumber</h2><blockquote>${escapeHtml(snippet)}</blockquote>` : `<p>Belum ada cuplikan sumber. Cari dan catat konfirmasi primer sebelum menyusun naskah.</p>`,
    `<h2>Checklist editor</h2><ul><li>Pastikan waktu dan konteks kejadian.</li><li>Konfirmasi nama, angka, hasil, dan kutipan ke sumber primer.</li><li>Tambahkan konteks dan sudut pandang redaksi setelah fakta terverifikasi.</li><li>Periksa izin foto/video dan catat kredit.</li></ul>`,
  ].join("\n")
  const caption = `${title}\n\nBrief redaksi dari ${source}. Detail dan sumber primer masih harus diverifikasi sebelum tayang.`
  return {
    article: { title, slug: slugifyCms(title), excerpt: snippet.slice(0, 210), body },
    social: { title, caption, hashtags: ["Stadione", "OlahragaIndonesia"], slides: [{ role: "cover", eyebrow: "BRIEF REDAKSI · REVIEW WAJIB", headline: title, body: "Gunakan foto asli berizin. Lengkapi fakta, kredit, dan konteks sebelum publikasi.", image_url: null, tone: "burgundy" }] },
  }
}
