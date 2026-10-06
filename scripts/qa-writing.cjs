#!/usr/bin/env node
const assert=require('node:assert/strict'),fs=require('node:fs'),load=require('./cms-load.cjs');
const w=load('src/lib/cms/news-writing.ts'),core=load('src/lib/cms/engine.ts');
const journal=JSON.parse(fs.readFileSync('editorial/goal-readings.json'));
const article={version:1,genre:'NEWS',title:'Persib Pelajari Port FC, Menalo Bidik Tiga Poin',dek:'Persib mempelajari rekaman permainan Port FC sebelum laga pembuka Shopee Cup.',caption:'Luka Menalo menyampaikan kesiapan Persib menjelang laga pembuka melawan Port FC.',benchmark_ids:[journal.entries[1].id],paragraphs:[
 {id:'lead',heading:'MENALO BIDIK TIGA POIN',kind:'FACT',claim_ids:['fixture','target'],text:'Luka Menalo ingin Persib mengawali Shopee Cup dengan kemenangan. Persib dijadwalkan menghadapi Port FC di Thailand pada Kamis, 8 Oktober.'},
 {id:'quote',heading:'MENALO BIDIK TIGA POIN',kind:'QUOTE',claim_ids:['ready'],text:'"Persiapan berjalan sangat baik. Kami siap," kata Menalo dalam keterangan di laman resmi klub.',quote:{text:'Persiapan berjalan sangat baik. Kami siap,',source_id:'club'}},
 {id:'video',heading:'MEMPELAJARI PERMAINAN LAWAN',kind:'FACT',claim_ids:['study'],text:'Persib mempelajari rekaman pertandingan Port FC untuk memahami permainan calon lawan. Menalo menyampaikan respek terhadap kualitas liga Thailand.'}
],review:{reviewer_id:'QA_EDITOR',reviewed_at:new Date().toISOString(),article_digest:''}};
const claims=['fixture','target','ready','study'].map(id=>({id})),sources=[{id:'club',text:'Persiapan berjalan sangat baik. Kami siap, demikian pernyataan Menalo pada laman resmi klub.'}];
const seal=a=>{a.review.article_digest=w.articleDigest(a);return a;};seal(article);
assert.deepEqual(w.articleIssues(article,claims,sources),[]);
const pages=w.articleSlides(article);assert.equal(pages.length,3);assert.equal(pages[1].headline,'MENALO BIDIK TIGA POIN');
const norm=s=>s.replace(/\s+/g,' ').trim();assert.equal(norm(pages.slice(1).map(p=>p.body).join(' ')),norm(article.paragraphs.map(p=>p.text).join(' ')));
const small=structuredClone(article);small.paragraphs=small.paragraphs.slice(0,2);seal(small);assert.equal(w.articleSlides(small).length,2);assert.deepEqual(w.articleIssues(small,claims,sources),[]);
const bad=f=>{const a=structuredClone(article);f(a);seal(a);return w.articleIssues(a,claims,sources);};
assert(bad(a=>a.paragraphs[2].text='Analisis Stadione: persiapan yang baik menghubungkan informasi tentang lawan dengan kerja bersama para pemain.').some(x=>x.includes('pengisi')));
assert(bad(a=>a.paragraphs[2].text=a.paragraphs[0].text).some(x=>x.includes('mengulang')));
assert(bad(a=>a.title='Kutipan Menalo, Bukan Janji Hasil').some(x=>x.includes('Judul')));
assert(bad(a=>{a.paragraphs[2].kind='ANALYSIS';a.paragraphs[2].claim_ids=['ready']}).some(x=>x.includes('lebih dari satu')));
assert(bad(a=>a.paragraphs[1].quote.text='Kami pasti menang,').some(x=>x.includes('kutipan')));
assert(bad(a=>a.paragraphs[1].text='"Persiapan kami buruk dan semua pemain cedera," kata Menalo.').some(x=>x.includes('berbeda')));
const edited=structuredClone(article);edited.paragraphs[0].text+=' Mereka menyiapkan pertandingan.';assert(w.articleIssues(edited,claims,sources).some(x=>x.includes('versi artikel')));
const repeat=structuredClone(article);repeat.paragraphs[2].text+=' '+repeat.paragraphs[2].text;seal(repeat);assert(w.articleIssues(repeat,claims,sources).some(x=>x.includes('kalimat')));
const reversed=v=>Array.isArray(v)?v.map(reversed):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).reverse().map(([k,x])=>[k,reversed(x)])):v;assert.equal(w.articleDigest(article),w.articleDigest(reversed(article)));
const fresh=structuredClone(journal);fresh.entries.forEach(e=>e.read_at=new Date().toISOString());assert.deepEqual(w.referenceIssues(article,fresh),[]);
const stale=structuredClone(fresh);stale.entries.forEach(e=>e.read_at=new Date(Date.now()-37*3600000).toISOString());assert(w.referenceIssues(article,stale).some(x=>x.includes('36 jam')));
assert(w.referenceIssues({...article,benchmark_ids:['missing']},fresh).some(x=>x.includes('tidak ditemukan')));
const dup=structuredClone(fresh);dup.entries.push(dup.entries[0]);assert(w.journalIssues(dup).length);
const html=w.articleHtml(article);assert(html.includes('<h2>MENALO BIDIK TIGA POIN</h2>'));assert.equal((html.match(/<p>/g)||[]).length,3);assert(!html.includes(article.dek));
const old={version:3,narrative_reviewed:true,context:{},sources:[],claims:[],slides:pages,media:{}};assert(core.auditPacket(old,'CAROUSEL').some(x=>x.includes('artikel utuh')));
console.log(JSON.stringify({ok:true,tests:['article_before_pages','two_page_news_without_padding','lossless_article_pagination','old_menalo_labels_blocked','process_headline_blocked','duplicate_paragraph_blocked','repeated_sentence_blocked','quote_source_match','unverifiable_quote_blocked','analysis_evidence','review_invalidated_by_edit','jsonb_stable_digest','daily_reference_freshness','benchmark_binding','duplicate_reference_blocked','same_article_html','legacy_boolean_not_enough']}));
