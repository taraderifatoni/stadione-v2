export const STADIONE_EDITORIAL_STANDARD = {
  name: "Stadione Sports Desk",
  positioning:
    "Media olahraga lokal yang tajam, kredibel, energik, dan dekat dengan komunitas.",
  pillars: [
    "Sepak Bola Eropa",
    "Sepak Bola Indonesia",
    "Olahraga Indonesia",
    "Tarkam & Komunitas",
  ],
  rules: [
    "Dahulukan fakta dan konteks, bukan sensasi.",
    "Jangan mengarang kutipan, angka, cedera, hasil pertandingan, atau identitas atlet.",
    "Bedakan fakta sumber, analisis redaksi, dan hal yang masih perlu diverifikasi.",
    "Starting XI, hasil, jadwal, rumor, dan UGC wajib diberi label dan sumber yang sesuai.",
    "Banter menyoroti performa, bukan identitas; hindari doxing, penghinaan, atau mempermalukan pemain amatir dan anak.",
    "Jangan menjadikan cedera atau kecelakaan sebagai lelucon; UGC wajib bermoderasi dan punya izin yang tercatat.",
    "Semua draf otomatis wajib ditinjau editor sebelum dijadwalkan atau diterbitkan.",
  ],
} as const;

export type EditorialSlot = {
  key: string;
  day: string;
  time: string;
  label: string;
  theme: string;
  pillar: string;
  angle: string;
  format: "CAROUSEL" | "REEL";
};
export const WEEKLY_MATRIX: EditorialSlot[] = [
  {
    key: "mon-am",
    day: "Senin",
    time: "08:00",
    label: "Highlight / meme Eropa",
    theme:
      "Rekap hasil semalam atau reaction atas hasil yang sudah terkonfirmasi",
    pillar: "Sepak Bola Eropa",
    angle: "Recap / reaction",
    format: "CAROUSEL",
  },
  {
    key: "mid-am",
    day: "Selasa–Kamis",
    time: "08:00",
    label: "Update / nostalgia",
    theme:
      "Hasil kompetisi jika ada; jika tidak, momen bersejarah yang dapat diverifikasi",
    pillar: "Sepak Bola Eropa",
    angle: "Update / nostalgia",
    format: "REEL",
  },
  {
    key: "fri-am",
    day: "Jumat",
    time: "08:00",
    label: "Preview non-bola",
    theme:
      "Preview agenda F1, MotoGP, atau BWF; hasil hanya setelah sesi berlangsung",
    pillar: "Olahraga Indonesia",
    angle: "Preview",
    format: "CAROUSEL",
  },
  {
    key: "match-am",
    day: "Sabtu–Minggu",
    time: "08:00",
    label: "Morning reaction",
    theme:
      "Reaction hasil semalam, momen krusial, atau kontroversi dengan sumber terverifikasi",
    pillar: "Sepak Bola Eropa",
    angle: "Reaction",
    format: "REEL",
  },
  {
    key: "mon-noon",
    day: "Senin",
    time: "13:00",
    label: "Non-bola pride",
    theme:
      "Apresiasi prestasi atlet Indonesia atau momen akhir pekan yang terkonfirmasi",
    pillar: "Olahraga Indonesia",
    angle: "Apresiasi",
    format: "CAROUSEL",
  },
  {
    key: "mid-noon",
    day: "Selasa–Kamis",
    time: "13:00",
    label: "Sepak bola lokal",
    theme:
      "Liga Indonesia, rumor dengan label jelas, atau bedah taktik berbasis data",
    pillar: "Sepak Bola Indonesia",
    angle: "Update / analisis",
    format: "CAROUSEL",
  },
  {
    key: "fri-noon",
    day: "Jumat",
    time: "13:00",
    label: "Trivia / interaksi",
    theme:
      "Polling big match atau tebak pemain dengan jawaban dan sumber internal",
    pillar: "Komunitas",
    angle: "Interaksi",
    format: "CAROUSEL",
  },
  {
    key: "match-noon",
    day: "Sabtu–Minggu",
    time: "13:00",
    label: "Tarkam / kearifan lokal",
    theme:
      "UGC sepak bola komunitas; hanya tayang setelah izin, kredit, dan moderasi lolos",
    pillar: "Tarkam & Komunitas",
    angle: "UGC",
    format: "REEL",
  },
  {
    key: "mon-pm",
    day: "Senin",
    time: "20:00",
    label: "Tarkam of the week",
    theme:
      "Momen komunitas pilihan dengan izin tertulis dan konteks lokasi/tanggal",
    pillar: "Tarkam & Komunitas",
    angle: "UGC / momen",
    format: "REEL",
  },
  {
    key: "mid-pm",
    day: "Selasa–Kamis",
    time: "20:00",
    label: "Hot news / quotes",
    theme:
      "Isu aktual atau kutipan langsung; verifikasi sumber primer dan konteks",
    pillar: "Sepak Bola Indonesia",
    angle: "Kutipan / update",
    format: "REEL",
  },
  {
    key: "fri-pm",
    day: "Jumat",
    time: "20:00",
    label: "Kick-off / preview lokal",
    theme: "Starting XI resmi atau preview laga sesuai jadwal aktual",
    pillar: "Sepak Bola Indonesia",
    angle: "Preview / matchday",
    format: "REEL",
  },
  {
    key: "match-pm",
    day: "Sabtu–Minggu",
    time: "20:00",
    label: "Watchalong / live momen",
    theme:
      "Live momen hanya dengan sumber real-time/editor; snapshot tren bukan feed live",
    pillar: "Sepak Bola Indonesia",
    angle: "Live / reaction",
    format: "REEL",
  },
];

export type EditorialCandidate = {
  id?: string;
  title: string;
  snippet?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
  imageUrl?: string | null;
  publishedAt?: string | null;
  engine?: string | null;
  metrics?: Record<string, number | string | null>;
};
const clean = (value?: string | null) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();
const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ] || char,
  );
export function slugifyCms(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 90) || `stadione-${Date.now()}`
  );
}

// Draft public copy from the candidate's known facts only. Source provenance stays in
// the content item's private metadata; the public copy must not imply original reporting.
export function buildEditorialPackage(candidate: EditorialCandidate) {
  const title = clean(candidate.title).slice(0, 96);
  const snippet = clean(candidate.snippet);
  const summary =
    snippet ||
    "Informasi ini sedang menjadi perhatian publik olahraga. Detail utama tetap harus diperiksa redaksi sebelum diterbitkan.";
  const context = snippet
    ? "Perkembangan ini memberi konteks baru bagi penikmat olahraga dan layak diikuti setelah fakta utamanya dikonfirmasi."
    : "Redaksi perlu melengkapi waktu, lokasi, nama, angka, dan konteks kejadian sebelum naskah diterbitkan.";
  const body = [
    `<p>${escapeHtml(summary)}</p>`,
    `<h2>Apa yang terjadi?</h2><p>${escapeHtml(summary)}</p>`,
    `<h2>Mengapa ini penting?</h2><p>${escapeHtml(context)}</p>`,
    `<h2>Yang perlu ditunggu</h2><p>Perkembangan berikutnya perlu dilihat dari keterangan resmi dan data terbaru. Naskah ini tidak menambahkan kutipan, angka, atau kesimpulan yang belum tersedia pada bahan awal.</p>`,
  ].join("\n");
  const caption = `${title}\n\n${summary}\n\nGeser untuk melihat ringkasannya. Menurut kamu, apa dampak terbesarnya?`;
  return {
    article: {
      title,
      slug: slugifyCms(title),
      excerpt: summary.slice(0, 210),
      body,
    },
    social: {
      title,
      caption,
      hashtags: ["Stadione", "OlahragaIndonesia"],
      slides: [
        {
          role: "cover",
          eyebrow: "STADIONE UPDATE",
          headline: title,
          body: "Geser untuk ringkasan",
          image_url: null,
          tone: "burgundy",
        },
        {
          role: "summary",
          eyebrow: "APA YANG TERJADI?",
          headline: "Ringkasan",
          body: summary,
          image_url: null,
          tone: "burgundy",
        },
        {
          role: "context",
          eyebrow: "KONTEKS",
          headline: "Mengapa penting?",
          body: context,
          image_url: null,
          tone: "burgundy",
        },
        {
          role: "watch",
          eyebrow: "BERIKUTNYA",
          headline: "Yang perlu ditunggu",
          body: "Keterangan resmi dan perkembangan terbaru akan menentukan gambaran lengkapnya.",
          image_url: null,
          tone: "burgundy",
        },
        {
          role: "engagement",
          eyebrow: "DISKUSI",
          headline: "Bagaimana menurutmu?",
          body: "Tulis pendapatmu di kolom komentar dan ikuti pembaruan olahraga lainnya di Stadione.",
          image_url: null,
          tone: "burgundy",
        },
      ],
    },
  };
}
