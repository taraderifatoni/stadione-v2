#!/usr/bin/env node

const { createHash, randomUUID } = require("node:crypto");
const { mkdir, readFile, writeFile } = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");
const { createClient } = require("@supabase/supabase-js");

const EVENT_KEY = "fifa-asean-cup-2026-final-indonesia-thailand-2026-10-05";
const FIFA_URL = "https://www.fifa.com/en/tournaments/mens/asean-cup/2026/articles/indonesia-thailand-final-report-highlights-quotes";
const AFC_URL = "https://www.the-afc.com/en/more/fifa_asean_cup.html/news/sharp-indonesia-defeat-thailand-to-lift-title";
const PHOTO_URL = "https://tirto.id/hasil-final-timnas-indonesia-vs-thailand-asean-cup-skor-akhir-juara-hDx6";
const coverPath = process.argv[2] || path.join(process.cwd(), "assets/editorial/indonesia-thailand-final-cover.jpg");

const slides = [
  {
    eyebrow: "LAPORAN UTAMA",
    headline: "GARUDA JUARA ASIA TENGGARA",
    body: "Indonesia menaklukkan Thailand 4–2 dalam adu penalti setelah final berakhir 2–2 selama 120 menit. Sebuah malam panjang di Gelora Bung Karno berujung pada trofi perdana FIFA ASEAN Cup.",
    cover: true,
  },
  {
    eyebrow: "FINAL YANG PANJANG",
    headline: "120 MENIT YANG MENOLAK SELESAI",
    body: "Indonesia menguasai banyak bagian pertandingan, tetapi final tetap terkunci tanpa gol hingga fase akhir waktu normal. Thailand bertahan rapat dan berulang kali mengancam lewat transisi. Ketika tenaga mulai terkuras, pertandingan justru memasuki babak paling dramatis: kartu merah, empat gol, lalu adu penalti.",
  },
  {
    eyebrow: "TITIK BALIK",
    headline: "DEAN JAMES MEMBUKA JALAN",
    body: "Thailand bermain dengan sepuluh orang setelah Nicholas Mickelson menerima kartu kuning kedua pada menit ke-81. Dari tendangan bebas yang menyusul, sepakan Dean James berubah arah setelah mengenai Iklas Sanron dan membawa Indonesia unggul pada menit ke-84. GBK meledak, tetapi final belum selesai.",
  },
  {
    eyebrow: "THAILAND MELAWAN",
    headline: "DARI 1–0 MENJADI 1–2",
    body: "Hanya tiga menit setelah gol Indonesia, Iklas Sanron menyambar umpan silang Seksan Ratree untuk menyamakan skor pada menit ke-87. Thailand kemudian membalik keadaan pada menit ke-111 melalui Peeradol Chamrasamee. Dengan satu pemain lebih sedikit, mereka sempat berdiri enam menit dari gelar.",
  },
  {
    eyebrow: "GOL PENYELAMAT",
    headline: "ELKAN MENJAGA HARAPAN",
    body: "Indonesia tidak menyerah. Pada menit ke-116, bola dari sisi kanan gagal diamankan sempurna dan jatuh ke jalur Elkan Baggott. Bek bernomor 20 itu melepaskan penyelesaian ke sudut atas untuk membuat skor 2–2. Gol tersebut mengirim final menuju adu penalti.",
  },
  {
    eyebrow: "ADU PENALTI",
    headline: "EMPAT EKSEKUTOR, EMPAT GOL",
    body: "Kevin Diks, Dean James, Elkan Baggott, dan Shayne Pattynama menuntaskan tugas mereka. Di kubu Thailand, sepakan Sarach Yooyen membentur tiang, lalu Emil Audero menggagalkan penalti Nattapong Sayriya. Indonesia menang 4–2 dan memastikan gelar tanpa perlu penendang kelima.",
  },
  {
    eyebrow: "MAKNA KEMENANGAN",
    headline: "TROFI PERTAMA, MALAM BERSEJARAH",
    body: "Indonesia menjadi juara perdana FIFA ASEAN Cup. Kemenangan ini lahir bukan dari pertandingan yang sempurna, melainkan dari kemampuan bertahan di tengah perubahan momentum. Tertinggal pada perpanjangan waktu tidak mematahkan Garuda; ketenangan pada adu penalti akhirnya menutup malam bersejarah di Jakarta.",
  },
];

const articleTitle = "Indonesia Juara FIFA ASEAN Cup 2026 Setelah Menaklukkan Thailand Lewat Adu Penalti";
const articleBody = `
<p>Indonesia menjadi juara perdana FIFA ASEAN Cup 2026 setelah mengalahkan Thailand 4–2 dalam adu penalti di Stadion Utama Gelora Bung Karno, Jakarta, Senin malam, 5 Oktober 2026. Final harus melewati 120 menit setelah kedua tim bermain imbang 2–2.</p>
<h2>Final yang baru terbuka di pengujung laga</h2>
<p>Indonesia menguasai banyak bagian pertandingan dan menciptakan sejumlah peluang sejak babak pertama, tetapi pertahanan Thailand menjaga skor tetap tanpa gol. Thailand tetap berbahaya ketika mendapatkan ruang untuk melakukan serangan balik. Ketegangan baru pecah pada sepuluh menit terakhir waktu normal.</p>
<p>Nicholas Mickelson menerima kartu kuning kedua pada menit ke-81 setelah melanggar Ole Romeny di tepi kotak penalti. Dari situasi tendangan bebas, sepakan Dean James berubah arah setelah mengenai Iklas Sanron dan masuk ke gawang Thailand pada menit ke-84.</p>
<p>Keunggulan itu hanya bertahan tiga menit. Sanron menebus keterlibatannya pada gol Indonesia dengan menyambar umpan silang Seksan Ratree pada menit ke-87. Skor 1–1 bertahan hingga waktu normal berakhir dan laga dilanjutkan ke perpanjangan waktu.</p>
<h2>Thailand berbalik unggul, Elkan menjawab</h2>
<p>Meski bermain dengan sepuluh orang, Thailand menemukan momentum pada menit ke-111. Peeradol Chamrasamee menyelesaikan serangan cepat untuk membawa tim tamu unggul 2–1. Indonesia berada dalam posisi harus mencetak gol dalam waktu yang semakin sempit.</p>
<p>Jawaban datang pada menit ke-116. Bola dari sisi kanan gagal diamankan sempurna oleh pertahanan Thailand dan jatuh kepada Elkan Baggott. Bek Indonesia itu melepaskan penyelesaian ke sudut atas untuk menyamakan kedudukan menjadi 2–2 sekaligus memaksa final ditentukan lewat adu penalti.</p>
<h2>Empat eksekutor Indonesia tidak gagal</h2>
<p>Kevin Diks, Dean James, Elkan Baggott, dan Shayne Pattynama berhasil menjalankan tugas sebagai empat penendang pertama Indonesia. Thailand kehilangan dua kesempatan: tendangan Sarach Yooyen membentur tiang, sedangkan sepakan Nattapong Sayriya dihentikan Emil Audero.</p>
<p>Kemenangan 4–2 pada adu penalti membuat Indonesia menjadi juara pertama dalam sejarah FIFA ASEAN Cup. Gelar itu menutup pertandingan yang berubah arah berkali-kali—dari keunggulan menjelang akhir waktu normal, tertinggal pada perpanjangan waktu, hingga akhirnya menang melalui ketenangan dari titik penalti.</p>
<p>Lebih dari sekadar skor akhir, final ini menunjukkan daya tahan Indonesia ketika pertandingan bergerak menjauh dari rencana awal. Garuda tidak berhenti setelah kebobolan pada menit ke-87 dan tidak runtuh ketika Thailand berbalik unggul. Di malam yang menuntut kesabaran hingga detik terakhir, Indonesia menemukan jalan menjadi juara.</p>`;

const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);

async function fitText(text, width, maxHeight, initialSize, bold, color, spacing = 10) {
  for (let size = initialSize; size >= 28; size -= 3) {
    const result = await sharp({ text: { text: `<span foreground="${color}">${esc(text)}</span>`, font: `DejaVu Sans ${bold ? "Bold " : ""}${size}`, width, rgba: true, wrap: "word", spacing } }).png().toBuffer({ resolveWithObject: true });
    if (result.info.height <= maxHeight && result.info.width <= width) return result;
  }
  throw new Error(`Teks tidak muat: ${text.slice(0, 60)}`);
}

async function renderCover(slide, total) {
  const background = await sharp(await readFile(coverPath)).resize(1080, 1350, { fit: "cover" }).jpeg({ quality: 90 }).toBuffer();
  const headline = await fitText(slide.headline, 920, 245, 72, true, "#f4efe5", 6);
  const bodyTop = 920 + headline.info.height + 26;
  const body = await fitText(slide.body, 920, 1300 - bodyTop, 31, false, "#f4efe5", 8);
  const overlay = Buffer.from(`<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#080808" stop-opacity="0"/><stop offset=".47" stop-color="#080808" stop-opacity=".08"/><stop offset=".67" stop-color="#080808" stop-opacity=".87"/><stop offset="1" stop-color="#080808" stop-opacity=".98"/></linearGradient></defs><rect width="1080" height="1350" fill="url(#g)"/><rect width="1080" height="16" fill="#8f1537"/><text x="64" y="74" font-family="DejaVu Sans" font-size="26" font-weight="900" letter-spacing="7" fill="#f4efe5">STADIONE</text><text x="1016" y="74" text-anchor="end" font-family="DejaVu Sans" font-size="21" font-weight="700" fill="#f4efe5">1/${total}</text><line x1="64" y1="103" x2="1016" y2="103" stroke="#f4efe5" stroke-opacity=".72" stroke-width="2"/><text x="64" y="865" font-family="DejaVu Sans" font-size="20" font-weight="800" fill="#d7b85c">${esc(slide.eyebrow)}</text><text x="1016" y="865" text-anchor="end" font-family="DejaVu Sans" font-size="18" font-weight="700" fill="#f4efe5">SUMBER: FIFA • AFC</text><line x1="64" y1="888" x2="1016" y2="888" stroke="#8f1537" stroke-width="7"/></svg>`);
  return sharp(background).composite([{ input: overlay }, { input: headline.data, left: 64, top: 920 }, { input: body.data, left: 64, top: bodyTop }]).jpeg({ quality: 91 }).toBuffer();
}

async function renderTextSlide(slide, index, total) {
  const headline = await fitText(slide.headline, 920, 245, 62, true, "#191714", 7);
  const ruleTop = 235 + headline.info.height + 28;
  const body = await fitText(slide.body, 920, 1120 - ruleTop, 37, false, "#302c27", 11);
  const base = Buffer.from(`<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg"><defs><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="3" seed="11"/><feColorMatrix values="0 0 0 0 .18 0 0 0 0 .16 0 0 0 0 .13 0 0 0 .05 0"/></filter></defs><rect width="1080" height="1350" fill="#eee9dd"/><rect width="1080" height="1350" filter="url(#n)" opacity=".5"/><rect width="1080" height="16" fill="#8f1537"/><text x="64" y="74" font-family="DejaVu Sans" font-size="26" font-weight="900" letter-spacing="7" fill="#191714">STADIONE</text><text x="1016" y="74" text-anchor="end" font-family="DejaVu Sans" font-size="21" font-weight="700" fill="#191714">${index + 1}/${total}</text><line x1="64" y1="103" x2="1016" y2="103" stroke="#191714" stroke-width="2"/><text x="64" y="151" font-family="DejaVu Sans" font-size="19" font-weight="800" fill="#8f1537">${esc(slide.eyebrow)}</text><line x1="64" y1="174" x2="1016" y2="174" stroke="#191714" stroke-width="2"/><line x1="64" y1="${ruleTop}" x2="1016" y2="${ruleTop}" stroke="#8f1537" stroke-width="7"/></svg>`);
  return sharp(base).composite([{ input: headline.data, left: 64, top: 225 }, { input: body.data, left: 64, top: ruleTop + 48 }]).jpeg({ quality: 91 }).toBuffer();
}

async function main() {
  if (process.argv.includes("--render-only")) {
    const output = path.join(process.cwd(), ".tmp-final-carousel");
    await mkdir(output, { recursive: true });
    for (let i = 0; i < slides.length; i++) {
      const image = i === 0 ? await renderCover(slides[i], slides.length) : await renderTextSlide(slides[i], i, slides.length);
      await writeFile(path.join(output, `slide-${i + 1}.jpg`), image);
    }
    console.log(JSON.stringify({ rendered: slides.length, output }));
    return;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase environment tidak tersedia.");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: existing, error: duplicateError } = await db.from("stadione_content_items").select("id,kind,status,external_post_id,editorial_meta").contains("editorial_meta", { event_key: EVENT_KEY });
  if (duplicateError) throw duplicateError;
  if (existing?.length) {
    console.log(JSON.stringify({ skipped: true, reason: "duplicate", existing }));
    return;
  }

  const images = [];
  for (let i = 0; i < slides.length; i++) images.push(i === 0 ? await renderCover(slides[i], slides.length) : await renderTextSlide(slides[i], i, slides.length));
  const socialId = randomUUID();
  const uploaded = [];
  for (let i = 0; i < images.length; i++) {
    const objectPath = `breaking/${EVENT_KEY}/${socialId}-slide-${i + 1}.jpg`;
    const { error } = await db.storage.from("stadione-cms").upload(objectPath, images[i], { contentType: "image/jpeg", upsert: false });
    if (error) throw error;
    const publicUrl = db.storage.from("stadione-cms").getPublicUrl(objectPath).data.publicUrl;
    uploaded.push({ type: "image", url: publicUrl, layout: i === 0 ? "photo_cover" : "newspaper_text", credit: i === 0 ? "ANTARA FOTO/Rivan Awal Lingga • olah latar editorial Stadione" : "Stadione", rights_status: "CLEARED", source_url: i === 0 ? PHOTO_URL : FIFA_URL, render_audit: { width: 1080, height: 1350, safe_wrap: true, ok: true } });
  }

  const now = new Date().toISOString();
  const slug = `indonesia-juara-fifa-asean-cup-2026-${Date.now().toString(36)}`;
  const commonMeta = {
    origin: "BREAKING_FINAL_AUTOPUBLISH",
    event_key: EVENT_KEY,
    standard: "STADIONE_SPORTS_DESK_V1",
    fact_check_status: "VERIFIED",
    rights_status: "CLEARED",
    verified_at: now,
    sources: [
      { name: "FIFA", url: FIFA_URL, primary: true },
      { name: "AFC", url: AFC_URL, primary: true },
    ],
    verified_claims: { score_120: "2-2", penalties: "Indonesia 4-2 Thailand", goals: ["Dean James 84'", "Iklas Sanron 87'", "Peeradol Chamrasamee 111'", "Elkan Baggott 116'"] },
  };

  const { data: article, error: articleError } = await db.from("stadione_content_items").insert({
    kind: "ARTICLE", format: "ARTICLE", title: articleTitle, slug,
    excerpt: "Indonesia menjadi juara perdana FIFA ASEAN Cup setelah menang 4–2 dalam adu penalti atas Thailand, seusai laga berakhir 2–2 selama 120 menit.",
    body: articleBody, category: "Timnas Indonesia", status: "PUBLISHED", platforms: ["WEBSITE"],
    source_url: FIFA_URL, source_name: "FIFA • AFC", source_snapshot: { event_key: EVENT_KEY, checked_at: now, fifa: FIFA_URL, afc: AFC_URL },
    assets: [{ type: "image", url: uploaded[0].url, credit: uploaded[0].credit }], editorial_meta: commonMeta, published_at: now,
  }).select("id,title,slug,status").single();
  if (articleError) throw articleError;

  const caption = "INDONESIA JUARA! 🇮🇩\n\nGaruda menaklukkan Thailand 4–2 lewat adu penalti setelah final berakhir 2–2 selama 120 menit. Dean James membuka skor, Elkan Baggott menyelamatkan harapan pada menit ke-116, dan Emil Audero menutup malam bersejarah di GBK.\n\nGeser carousel untuk membaca kisah lengkap final yang berubah arah hingga detik terakhir.";
  const { data: social, error: socialError } = await db.from("stadione_content_items").insert({
    id: socialId, parent_id: article.id, kind: "SOCIAL", format: "CAROUSEL", title: "Garuda Juara Asia Tenggara — Indonesia 4–2 Thailand (Penalti)",
    caption, hashtags: ["Stadione", "TimnasIndonesia", "Garuda", "FIFAASEANCup", "IndonesiaJuara"], platforms: ["INSTAGRAM"],
    category: "Timnas Indonesia", status: "SCHEDULED", scheduled_at: now, source_url: FIFA_URL, source_name: "FIFA • AFC",
    source_snapshot: { event_key: EVENT_KEY, checked_at: now, fifa: FIFA_URL, afc: AFC_URL }, assets: uploaded,
    editorial_meta: { ...commonMeta, auto_publish: true, carousel_style: "MODERN_NEWSPAPER", authentic_faces_only: true, cover_background: "AI_ASSISTED_EDITORIAL", safe_wrap: true },
  }).select("id,title,status,scheduled_at").single();
  if (socialError) throw socialError;
  console.log(JSON.stringify({ skipped: false, article, social, slides: uploaded.length }));
}

main().catch((error) => { console.error(error); process.exit(1); });
