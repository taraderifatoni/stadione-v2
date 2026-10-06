import { createHash } from "node:crypto";

export const WRITING_STANDARD = "STADIONE_ARTICLE_FIRST_V1";
export const WRITING_RULES = [
  "Tulis berita atau feature utuh sebelum membagi halaman.",
  "Lead menyampaikan pokok kabar; setiap paragraf berikutnya membawa informasi baru.",
  "Judul menyampaikan isi pernyataan, bukan proses mengutip.",
  "Penalaran ditopang fakta spesifik; jangan memakai label Analisis Stadione atau nasihat umum.",
  "Kutipan persis sumber, narasumber dan konteksnya jelas.",
  "Jika bahan pendek, perkaya riset atau ringkas penyajian; jangan mengejar lima halaman.",
] as const;
export type ArticleParagraph = {
  id: string;
  heading: string;
  text: string;
  claim_ids: string[];
  kind: "FACT" | "QUOTE" | "ANALYSIS";
  quote?: { text: string; source_id: string };
};
export type NewsArticle = {
  version: 1;
  genre: "NEWS" | "FEATURE";
  title: string;
  dek: string;
  caption: string;
  paragraphs: ArticleParagraph[];
  benchmark_ids: string[];
  review: { reviewer_id: string; reviewed_at: string; article_digest: string };
};
export type WritingReference = {
  id: string; url: string; read_at: string; kind: "NEWS" | "FEATURE";
  lessons: string[]; application: string;
};
export type ReferenceJournal = { version: 1; entries: WritingReference[] };
const normalized = (text: string) => text.toLocaleLowerCase("id-ID").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
export function articleDigest(a: NewsArticle) {
  // Fixed field order, independent of PostgreSQL JSONB ordering.
  return sha(JSON.stringify([a.version, a.genre, a.title, a.dek, a.caption,
    a.paragraphs.map(p => [p.id, p.heading, p.text, p.claim_ids, p.kind, p.quote?.text || "", p.quote?.source_id || ""]), a.benchmark_ids]));
}
const editorialLabel = /analisis\s+stadione\s*:|brief redaksi|review wajib|detail utama tetap harus diperiksa|redaksi perlu melengkapi|informasi ini sedang menjadi perhatian publik/i;
const processHeadline = /^(kutipan\b|fakta utama$|urutan kejadian$|apa yang terjadi\??$|apa artinya untuk penggemar\??$)/i;
const padding = /tidak ada kemenangan yang lahir hanya dari ucapan|persiapan yang baik menghubungkan informasi|bukan (?:kepastian|jaminan) (?:tentang )?hasil|bukan bocoran (?:rencana )?pelatih|permainan di lapangan yang akan menentukan hasil/i;
function similar(a: string, b: string) {
  const grams = (s: string) => { const w=normalized(s).split(" "); return new Set(w.slice(0,-1).map((x,i)=>x+" "+w[i+1])); };
  const x=grams(a), y=grams(b), common=[...x].filter(t=>y.has(t)).length;
  return Math.min(x.size,y.size)>=10 && common / Math.min(x.size,y.size) >= 0.82;
}
export function articleIssues(article: NewsArticle | undefined, claims: {id: string}[], sources: {id: string; text: string}[], now=Date.now()): string[] {
  if (!article || article.version !== 1) return ["Tulis artikel utuh terlebih dahulu; paket carousel wajib memuat article versi 1."];
  const errors: string[]=[];
  if (!['NEWS','FEATURE'].includes(article.genre) || !article.title?.trim() || article.title.length>96 || !article.dek?.trim() || !article.caption?.trim()) errors.push("Lengkapi genre, judul substantif, dek dan caption artikel.");
  if (processHeadline.test(article.title || "")) errors.push("Judul harus menyampaikan isi berita, bukan proses mengutip/menulis.");
  const paragraphs=Array.isArray(article.paragraphs)?article.paragraphs:[];
  if (paragraphs.length<2 || new Set(paragraphs.map(p=>p.id)).size!==paragraphs.length) errors.push("Artikel perlu paragraf beridentitas unik; jangan menambah paragraf demi kuota halaman.");
  if (article.genre==='NEWS' && paragraphs[0]?.kind!=='FACT') errors.push("Lead berita langsung harus menyampaikan fakta utama.");
  const ids=new Set(claims.map(c=>c.id));
  const sentences=new Set<string>();
  for (let i=0;i<paragraphs.length;i++) {
    const p=paragraphs[i];
    if (!p.id || !p.heading?.trim() || p.heading.length>96 || !p.text?.trim() || !['FACT','QUOTE','ANALYSIS'].includes(p.kind) || !p.claim_ids?.length || p.claim_ids.some(id=>!ids.has(id))) errors.push(`Paragraf ${i+1}: lengkapi isi, subjudul dan bukti klaim.`);
    if (processHeadline.test(p.heading || '')) errors.push(`Paragraf ${i+1}: subjudul membicarakan proses redaksi.`);
    if (editorialLabel.test(p.text || '') || editorialLabel.test(p.heading || '') || padding.test(p.text || '')) errors.push(`Paragraf ${i+1}: buang label redaksi atau kalimat pengisi yang tidak menambah informasi.`);
    if (p.kind==='ANALYSIS' && new Set(p.claim_ids).size<2) errors.push(`Paragraf ${i+1}: penalaran harus bertumpu pada lebih dari satu fakta spesifik.`);
    const quoted=[...(p.text || '').matchAll(/["“]([^"”]{12,})["”]/g)].map(m=>m[1]);
    if (p.kind==='QUOTE' && (!p.quote?.text || !p.quote.source_id || !p.text.includes(p.quote.text))) errors.push(`Paragraf ${i+1}: petakan kutipan ke narasumber/sumber.`);
    if (p.quote && !sources.some(s=>s.id===p.quote?.source_id && s.text.includes(p.quote.text))) errors.push(`Paragraf ${i+1}: kutipan tidak ditemukan pada teks sumber.`);
    if (quoted.some(q=>!sources.some(s=>s.text.includes(q)))) errors.push(`Paragraf ${i+1}: kutipan langsung berbeda dari sumber.`);
    for(const sentence of (p.text || '').split(/(?<=[.!?])\s+/)) {
      const key=normalized(sentence);
      if(key.split(' ').length>=8){if(sentences.has(key))errors.push(`Paragraf ${i+1}: kalimat yang sama diulang tanpa informasi baru.`);sentences.add(key);}
    }
    for (let j=0;j<i;j++) {
      if (normalized(p.text || '')===normalized(paragraphs[j].text || '') || similar(p.text || '',paragraphs[j].text || '')) errors.push(`Paragraf ${i+1} mengulang isi paragraf ${j+1}; tambah informasi atau hapus.`);
    }
  }
  if (editorialLabel.test(`${article.title} ${article.dek} ${article.caption}`)) errors.push("Judul/dek/caption mengandung label proses redaksi.");
  if (!Array.isArray(article.benchmark_ids) || !article.benchmark_ids.length) errors.push("Gunakan referensi bacaan Goal yang tercatat untuk penulisan ini.");
  const at=Date.parse(article.review?.reviewed_at);
  if (!article.review?.reviewer_id || !Number.isFinite(at) || at>now+300000 || article.review?.article_digest!==articleDigest({...article,paragraphs,benchmark_ids:article.benchmark_ids || []})) errors.push("Review naskah belum terikat pada versi artikel ini; sunting dan review ulang sebelum render.");
  return [...new Set(errors)];
}
// Pure pagination. Never synthesize a closing paragraph or add editorial filler.
export function articleSlides(article: NewsArticle) {
  const slides=[{role:'hook',headline:article.title,body:article.dek,claim_ids:[...new Set(article.paragraphs[0]?.claim_ids || [])],layout:'photo' as 'photo'|'full_text'}];
  let pending:{heading:string;text:string;claims:string[]} | undefined;
  const flush=()=>{if(pending){slides.push({role:'article',headline:pending.heading,body:pending.text,claim_ids:pending.claims,layout:'full_text'});pending=undefined;}};
  for(const p of article.paragraphs) {
    // Split long paragraphs without deleting or rewriting a single word.
    const words=p.text.trim().split(/\s+/), chunks:string[]=[];let chunk='';
    for(const word of words){if(chunk && (chunk+' '+word).length>650){chunks.push(chunk);chunk='';}chunk+=(chunk?' ':'')+word;}if(chunk)chunks.push(chunk);
    for(const text of chunks){
      if(pending && (pending.heading!==p.heading || pending.text.length+text.length+2>650))flush();
      if(!pending)pending={heading:p.heading,text,claims:[...p.claim_ids]};
      else{pending.text+='\n\n'+text;pending.claims=[...new Set([...pending.claims,...p.claim_ids])];}
    }
  }
  flush();if(slides.length<2 || slides.length>10)throw Error("Artikel melebihi kapasitas carousel 2–10 halaman; sunting naskah tanpa pengisi atau kehilangan fakta.");
  return slides;
}
export function articleHtml(article: NewsArticle) {
  const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
  let heading='';return article.paragraphs.map(p=>{const h=p.heading!==heading?`<h2>${esc(p.heading)}</h2>`:'';heading=p.heading;return h+`<p>${esc(p.text)}</p>`;}).join('');
}
export function journalIssues(journal: ReferenceJournal, now=Date.now()) {
  if(!journal || journal.version!==1 || !Array.isArray(journal.entries) || !journal.entries.length)return ['Jurnal bacaan Goal belum tersedia.'];
  const errors:string[]=[];const ids=new Set<string>(),urls=new Set<string>();
  for(const e of journal.entries){let host='';try{host=new URL(e.url).hostname;}catch{}const time=Date.parse(e.read_at);
    if(!e.id || ids.has(e.id) || urls.has(e.url) || !/^https:\/\//.test(e.url || '') || !/(^|\.)goal\.com$/.test(host) || !Number.isFinite(time) || time>now+300000 || !['NEWS','FEATURE'].includes(e.kind) || !Array.isArray(e.lessons) || e.lessons.length<3 || e.lessons.some(x=>typeof x!=='string' || x.trim().length<15) || (e.application || '').length<20) errors.push(`Referensi ${e.id || '?'} tidak lengkap/duplikat; baca artikel utuh dan catat pelajaran konkret.`);
    ids.add(e.id);urls.add(e.url);
  }
  return errors;
}
export function referenceIssues(article: NewsArticle | undefined, journal: ReferenceJournal, now=Date.now()) {
  const errors=journalIssues(journal,now);if(errors.length)return errors;
  if(!journal.entries.some(e=>now-Date.parse(e.read_at)<=36*3600000))errors.push('Bacaan Goal harian melewati 36 jam; perbarui jurnal sebelum produksi/publikasi.');
  for(const id of article?.benchmark_ids || [])if(!journal.entries.some(e=>e.id===id))errors.push(`Referensi penulisan ${id} tidak ditemukan dalam jurnal.`);
  if(article && !journal.entries.some(e=>article.benchmark_ids.includes(e.id) && e.kind===article.genre))errors.push("Referensi bacaan harus mencakup genre tulisan yang dipilih.");
  return errors;
}
