import "server-only"

export const STADIONE_EDITORIAL_STANDARD = {
  name: "Stadione Sports Desk",
  positioning: "Media olahraga lokal yang tajam, kredibel, energik, dan dekat dengan komunitas.",
  pillars: ["Sepak Bola", "Olahraga Raket", "Running", "Fitness", "Komunitas", "Venue & Bisnis Olahraga"],
  rules: [
    "Dahulukan fakta dan konteks, bukan sensasi.",
    "Jangan mengarang kutipan, angka, cedera, hasil pertandingan, atau identitas atlet.",
    "Gunakan bahasa Indonesia yang mengalir dan ringkas; hindari frasa generik khas tulisan AI.",
    "Bedakan fakta sumber, analisis redaksi, dan hal yang masih perlu diverifikasi.",
    "Semua draf otomatis wajib ditinjau editor sebelum dijadwalkan atau diterbitkan.",
  ],
} as const

export type EditorialCandidate = {
  id?: string
  title: string
  snippet?: string | null
  source?: string | null
  sourceUrl?: string | null
  imageUrl?: string | null
  publishedAt?: string | null
  engine?: string | null
  metrics?: Record<string, number | string | null>
}

const clean = (value?: string | null) => String(value || "").replace(/\s+/g, " ").trim()

export function slugifyCms(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90) || `stadione-${Date.now()}`
}

function sourceLine(candidate: EditorialCandidate) {
  const source = clean(candidate.source) || "sumber terpilih"
  const date = candidate.publishedAt ? new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric",
  }).format(new Date(candidate.publishedAt)) : "hari ini"
  return `${source}, ${date}`
}

export function buildEditorialPackage(candidate: EditorialCandidate) {
  const rawTitle = clean(candidate.title)
  const title = rawTitle.length > 96 ? `${rawTitle.slice(0, 93).trim()}…` : rawTitle
  const snippet = clean(candidate.snippet)
  const context = snippet || `Topik “${title}” sedang mendapat perhatian. Redaksi perlu memeriksa konteks, sumber primer, dan dampaknya sebelum naskah diterbitkan.`
  const attribution = sourceLine(candidate)
  const articleTitle = title
  const excerpt = context.slice(0, 210)
  const body = [
    `<p><strong>${articleTitle}</strong> menjadi salah satu percakapan olahraga yang perlu dicermati hari ini. ${context}</p>`,
    `<h2>Apa yang sudah diketahui?</h2>`,
    `<p>Berdasarkan ${attribution}, informasi awal mengarah pada perkembangan tersebut. Bagian ini sengaja dipertahankan sebagai draf: editor perlu mencocokkan detail dengan sumber primer sebelum menambahkan angka, kutipan, atau kesimpulan.</p>`,
    `<h2>Mengapa relevan bagi pembaca Stadione?</h2>`,
    `<p>Nilai beritanya tidak berhenti pada momentum. Redaksi perlu menjelaskan dampaknya bagi atlet, pengelola venue, komunitas, dan penikmat olahraga Indonesia agar pembaca memperoleh konteks yang bisa digunakan.</p>`,
    `<h2>Yang masih harus diverifikasi</h2>`,
    `<ul><li>Sumber primer dan waktu kejadian.</li><li>Angka, nama, serta konteks kompetisi.</li><li>Tanggapan pihak yang terlibat bila tersedia.</li></ul>`,
    `<blockquote>Catatan editor: jangan menerbitkan naskah ini sebelum seluruh fakta kunci dan hak penggunaan visual diperiksa.</blockquote>`,
  ].join("\n")

  const slides = [
    { role: "cover", eyebrow: "STADIONE UPDATE", headline: articleTitle, body: "Konteks utama dari kabar olahraga yang sedang ramai.", image_url: candidate.imageUrl || null, tone: "burgundy" },
    { role: "bridge", eyebrow: "APA YANG TERJADI", headline: "Mulai dari faktanya", body: context.slice(0, 250), image_url: candidate.imageUrl || null, tone: "charcoal" },
    { role: "fact", eyebrow: "KONTEKS", headline: "Jangan berhenti di judul", body: `Informasi awal berasal dari ${attribution}. Detail penting tetap harus dicocokkan dengan sumber primer.`, tone: "sand" },
    { role: "analysis", eyebrow: "KENAPA PENTING", headline: "Dampaknya lebih luas", body: "Lihat pengaruhnya bagi atlet, kompetisi, komunitas, venue, dan ekosistem olahraga Indonesia.", tone: "burgundy" },
    { role: "check", eyebrow: "CEK SEBELUM TAYANG", headline: "Tiga hal yang wajib pasti", body: "Waktu kejadian. Identitas pihak terkait. Angka dan kutipan yang digunakan.", tone: "charcoal" },
    { role: "closing", eyebrow: "STADIONE", headline: "Olahraga butuh konteks", body: "Ikuti kabar olahraga dengan fakta yang utuh, bukan sekadar ramai.", tone: "sand" },
  ]

  const caption = `${articleTitle}\n\n${excerpt}\n\nSumber: ${attribution}. Draf otomatis ini wajib melewati verifikasi editor sebelum tayang.`

  return {
    article: { title: articleTitle, slug: slugifyCms(articleTitle), excerpt, body },
    social: {
      title: articleTitle,
      caption,
      hashtags: ["Stadione", "OlahragaIndonesia", "SportsUpdate"],
      slides,
    },
  }
}
