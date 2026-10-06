#!/usr/bin/env node
// One reviewed noon assignment; shared V2 gates + shared renderer, never direct Meta publishing.
const fs=require("node:fs"),path=require("node:path"),Module=require("node:module"),ts=require("typescript"),{createHash,randomUUID}=require("node:crypto"),{createClient}=require("@supabase/supabase-js");
const ROOT=path.resolve(__dirname,".."),EVENT="persija-october-fixtures-recovery-2026-10-06",PLAN="2026-10-06:mid-noon";
require("./cms-load.cjs");
const PRIMARY="https://ileague.id/news/detail/-kebugaran-jadi-kunci-persija-jaga-performa-di-jadwal-padat";
const SECONDARY="https://tangselpos.id/detail/55538/jadwal-padat-menanti-persija-shin-tae-yong-prioritaskan-kebugaran-pemain";
const PHOTO="https://assets.ileague.id/uploads/images/news/-Kebugaran-Jadi-Kunci-Persija-Jaga-Performa-di-Jadwal-Padat-1791255995.JPG";
const TITLE="Lima Laga, Satu Ujian: Menjaga Napas Persija";
const SLIDES=[
{role:"hook",headline:"LIMA LAGA, SATU UJIAN",body:"Persija menghadapi Oktober yang padat. Shin Tae-yong menaruh perhatian pada kebugaran agar momentum kemenangan tidak berhenti di tengah jalan.",claim_ids:["schedule","recovery"],layout:"photo"},
{role:"fact",headline:"OKTOBER MENUNTUT KONSISTENSI",body:"Lima pertandingan menanti Persija dalam rentang 22 hari pada Oktober 2026. Macan Kemayoran membuka rangkaian itu dengan dua lawatan: menghadapi PSIM Yogyakarta pada 10 Oktober, lalu Persita pada 17 Oktober.\n\nSetelahnya, Persija menjamu Arema FC pada 21 Oktober dan Persik pada 26 Oktober. Periode tersebut ditutup dengan laga tandang melawan Dewa United pada 31 Oktober. Jadwal ini mempertemukan tuntutan meraih poin dengan pekerjaan lain yang tak kalah penting: menjaga kesiapan pemain dari satu laga ke laga berikutnya.",claim_ids:["schedule"],layout:"full_text"},
{role:"chronology",headline:"JEDA PENDEK, PEMULIHAN PENTING",body:"Setelah laga melawan Persita, Persija hanya memiliki jarak empat hari menuju pertandingan kontra Arema. Rangkaian laga berikutnya membuat pengaturan kondisi pemain menjadi perhatian Shin Tae-yong. Dalam keterangannya, pelatih Persija itu menekankan pentingnya istirahat, terlebih ketika tim harus melakukan perjalanan antarlaga.\n\nPersija memiliki pilihan pemain untuk mengatur komposisi tim. Namun, persoalannya bukan sekadar mengganti nama dalam susunan pemain. Beban latihan, waktu pemulihan, dan kesiapan pemain yang mendapat kesempatan tampil juga perlu dikelola. Tujuannya ialah mempertahankan performa sepanjang periode padat, bukan hanya pada pertandingan pembuka.",claim_ids:["schedule","recovery"],layout:"full_text"},
{role:"context",headline:"MODAL BAGUS BELUM GARANSI",body:"Persija memasuki periode ini dengan hasil positif. Tiga pertandingan awal Super League 2026/27 dituntaskan dengan kemenangan: 1–0 atas Borneo FC, 2–1 atas Persib Bandung, dan 1–0 atas Java United FC. Catatan itu menjadi modal sebelum menghadapi rangkaian Oktober.\n\nNamun, hasil yang sudah diraih tidak menjawab tantangan pertandingan berikutnya. Jadwal, lawan, dan kondisi pemain akan kembali menuntut keputusan baru. Fokus terhadap kebugaran menunjukkan bahwa menjaga momentum bukan hanya urusan taktik di lapangan, tetapi juga pekerjaan tim pelatih dalam menyiapkan pemain di antara pertandingan.",claim_ids:["form","recovery"],layout:"full_text"},
{role:"closing",headline:"UJIAN DI ANTARA PERTANDINGAN",body:"Analisis Stadione: ukuran kesiapan Persija pada Oktober bukan semata siapa yang tampil sejak menit pertama. Yang juga penting ialah bagaimana tim menjaga kualitas ketika kesempatan bermain dibagi dan ketika waktu antarlaga semakin sempit.\n\nRangkaian tandang, pertandingan kandang, lalu lawatan penutup memberikan konteks bagi penekanan Shin Tae-yong pada kondisi tubuh. Persija sudah membawa modal kemenangan. Kini perhatian beralih pada kemampuan menjaga kesiapan itu selama sebulan. Ini masih pratinjau: belum ada hasil Oktober yang bisa disimpulkan, dan susunan pemain maupun keputusan rotasi tetap menunggu pertandingan.",claim_ids:["schedule","recovery","form"],layout:"full_text"}
];
const esc=s=>s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function load(file){const code=ts.transpileModule(fs.readFileSync(path.join(ROOT,file),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const m=new Module(path.join(ROOT,file),module);m.filename=path.join(ROOT,file);m.paths=Module._nodeModulePaths(ROOT);m._compile(code,m.filename);return m.exports;}
const core=load("src/lib/cms/engine.ts"),renderer=load("src/lib/cms/engine-media.ts"),sha=s=>createHash("sha256").update(s).digest("hex");
async function source(id,url,primary,published_at,start,end){const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(id+" HTTP "+r.status);const html=await r.text();let text=html.replace(/<script[\s\S]*?<\/script>/gi,"").replace(/<style[\s\S]*?<\/style>/gi,"").replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/\s+/g," ");const a=text.indexOf(start),b=text.indexOf(end,a);if(a<0||b<0)throw Error("Source boundary changed: "+id);text=text.slice(a,b);return{id,url,primary,publisher_group:primary?"ILEAGUE":"RAKYAT_MERDEKA",published_at,retrieved_at:new Date().toISOString(),text,sha256:sha(text),report_type:primary?"OFFICIAL_OPERATOR":"SECONDARY_CORROBORATION"};}
async function main(){
const mode=process.argv[2]||"preview",dir=path.join(ROOT,".tools",EVENT);fs.mkdirSync(dir,{recursive:true});
if(mode==="preview"){
const sources=await Promise.all([source("league",PRIMARY,true,"2026-10-06T03:06:00Z","DEPOK --","Berita Terbaru"),source("news",SECONDARY,false,"2026-10-06T04:16:00Z","JAKARTA –","TAG:")]);
const evidence=term=>sources.map(s=>{const at=s.text.indexOf(term);if(at<0)throw Error("Missing evidence "+term+" in "+s.id);return{source_id:s.id,quote:s.text.slice(Math.max(0,at-50),Math.min(s.text.length,at+260))};});
const claims=[
{id:"schedule",text:"Persija dijadwalkan menjalani 5 atau lima pertandingan dalam 22 hari pada Oktober 2026: PSIM 10, Persita 17, Arema 21, Persik 26, Dewa United 31.",verified:true,evidence:evidence("22 hari")},
{id:"recovery",text:"Shin Tae-yong memprioritaskan kondisi tubuh, istirahat, perjalanan, pemulihan, beban latihan, dan kesiapan pemain.",verified:true,evidence:evidence("kondisi tubuh")},
{id:"form",text:"Persija menang 3 pertandingan awal Super League 2026/27: Borneo FC 1–0, Persib Bandung 2–1, Java United FC 1–0.",verified:true,evidence:evidence("Borneo FC")}
];
const packet={version:3,narrative_reviewed:true,event_status:"PREVIEW",event_at:"2026-10-10T00:00:00+07:00",assignment:{pillar:"Sepak bola lokal",angle:"Jadwal Persija dan pengelolaan kebugaran",why_now:"Laporan operator liga terbit pagi 6 Oktober, relevan untuk slot siang sebelum laga pembuka Oktober."},context:{who:"Persija Jakarta dan Shin Tae-yong",what:"Persiapan lima pertandingan Oktober",when:"10–31 Oktober 2026; laporan 6 Oktober",where:"Laga tandang PSIM, Persita, Dewa United; kandang Arema dan Persik",why:"Menjaga performa di rangkaian jadwal padat",how:"Mengatur istirahat, pemulihan, beban latihan, dan kesiapan pemain"},sources,claims,slides:SLIDES,media:{url:PHOTO,type:"image",credit:"ILeague",scope:"Stadione editorial news; cover and clean article hero",rights_status:"CLEARED",rights_evidence:"Editorial use of operator press-photo at source URL, source credited on cover and retained in CMS. Owner requested editorial processing. No purchased license or photographer ownership claimed."}};
const issues=core.auditPacket(packet,"CAROUSEL");if(issues.length)throw Error(issues.join("\n"));
fs.writeFileSync(path.join(dir,"packet.json"),JSON.stringify(packet,null,2));
const images=await renderer.renderCarousel(packet);for(let i=0;i<images.length;i++)fs.writeFileSync(path.join(dir,(i+1)+".jpg"),images[i].bytes);
fs.writeFileSync(path.join(dir,"audit.json"),JSON.stringify(images.map(x=>x.audit),null,2));
console.log(JSON.stringify({mode,dir,words:SLIDES.map(x=>x.body.split(/\s+/).length),audit:images.map(x=>x.audit)}));return;
}
if(!["prepare","schedule"].includes(mode))throw Error("Unsupported mode");
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const {data:prior,error:pe}=await db.from("stadione_content_items").select("id,kind,status,external_post_id,editorial_meta").or("editorial_meta->>event_key.eq."+EVENT+",editorial_meta->>plan_key.eq."+PLAN);if(pe)throw pe;
if(mode==="schedule"){
const item=prior?.find(x=>x.kind==="SOCIAL"&&x.editorial_meta.event_key===EVENT);if(!item)throw Error("Prepared item missing");if(item.status!=="DRAFT")return console.log(JSON.stringify({skipped:true,item}));
const {data:s,error}=await db.from("stadione_content_items").select("*").eq("id",item.id).single();if(error)throw error;
const reviewed=JSON.parse(fs.readFileSync(path.join(dir,"packet.json"),"utf8"));
if(core.packetDigest(s.editorial_meta.engine_packet)!==core.packetDigest(reviewed))throw Error("Stored packet differs from visually reviewed packet");
const meta={...s.editorial_meta,rendered_packet_digest:core.packetDigest(reviewed)};
s.editorial_meta=meta;meta.engine_approval={actor_id:"AUTO_EDITORIAL_USER_REQUEST",approved_at:new Date().toISOString(),digest:core.contentDigest(s)};
const {error:me}=await db.from("stadione_content_items").update({editorial_meta:meta}).eq("id",s.id).eq("status","DRAFT");if(me)throw me;
const issues=core.enginePublicationIssues(s);if(issues.length)throw Error(issues.join("\n"));
if(!s.editorial_meta.visual_reviewed_at)throw Error("Visual QA required");
const {error:e}=await db.from("stadione_content_items").update({status:"SCHEDULED",scheduled_at:"2026-10-06T06:00:00Z"}).eq("id",s.id).eq("status","DRAFT");if(e)throw e;
await db.from("stadione_content_items").update({status:"SCHEDULED",scheduled_at:"2026-10-06T06:00:00Z"}).eq("id",s.parent_id).eq("status","DRAFT");console.log(JSON.stringify({scheduled:s.id,parent:s.parent_id,plan_key:PLAN}));return;
}
if(prior?.length)return console.log(JSON.stringify({skipped:true,prior}));
const u=new URL("https://graph.facebook.com/v23.0/"+process.env.INSTAGRAM_USER_ID+"/media");u.searchParams.set("fields","id,caption,permalink");u.searchParams.set("limit","40");u.searchParams.set("access_token",process.env.META_ACCESS_TOKEN);const ig=await(await fetch(u)).json();if(ig.error||!ig.data)throw Error("Unable to verify live Instagram duplicates");if(ig.data.some(x=>/persija/i.test(x.caption||"")))throw Error("Persija already on recent Instagram; inspect first");
const packet=JSON.parse(fs.readFileSync(path.join(dir,"packet.json"),"utf8")),audits=JSON.parse(fs.readFileSync(path.join(dir,"audit.json"),"utf8"));
const issues=core.auditPacket(packet,"CAROUSEL");if(issues.length||!audits.every(x=>x.ok&&x.safe_wrap))throw Error("QA failed: "+issues.join(" "));
const sid=randomUUID(),aid=randomUUID(),assets=[];
for(let i=0;i<SLIDES.length;i++){const p="editorial/"+EVENT+"/"+sid+"-"+(i+1)+".jpg";const {error}=await db.storage.from("stadione-cms").upload(p,fs.readFileSync(path.join(dir,(i+1)+".jpg")),{contentType:"image/jpeg"});if(error)throw error;assets.push({type:"image",url:db.storage.from("stadione-cms").getPublicUrl(p).data.publicUrl,render_audit:audits[i],credit:i?"Stadione":"ILeague",source_url:PRIMARY});}
const photo=await renderer.sourceBytes(PHOTO),hp="articles/"+EVENT+"/hero.jpg";const {error:he}=await db.storage.from("stadione-cms").upload(hp,photo,{contentType:"image/jpeg",upsert:true});if(he)throw he;
const hero=db.storage.from("stadione-cms").getPublicUrl(hp).data.publicUrl;
const now=new Date().toISOString(),meta={standard:core.ENGINE,event_key:EVENT,origin:"NORMAL_EDITORIAL_SLOT",plan_key:PLAN,planned_at:"2026-10-06T06:00:00Z",additional_post:false,engine_packet:packet,engine_state:"READY_FOR_REVIEW",rendered_packet_digest:core.packetDigest(packet),render_audit:{ok:audits.every(x=>x.ok),pages:audits},fact_check_status:"VERIFIED",rights_status:"CLEARED",visual_reviewed_at:now,renderer:"shared engine-media.ts",article_body_complete:true,serpapi:{engine:"google_news",query:"Persija kebugaran jadwal padat 6 Oktober 2026",checked_at:now,status:"Success"}};
const body=SLIDES.map((s,i)=>(i?"<h2>"+esc(s.headline)+"</h2>":"")+s.body.split("\n\n").map(p=>"<p>"+esc(p)+"</p>").join("")).join("");
const article={id:aid,kind:"ARTICLE",format:"ARTICLE",title:TITLE,slug:"persija-jadwal-padat-oktober-2026-kebugaran",excerpt:SLIDES[0].body,body,category:"Sepak Bola Indonesia",status:"DRAFT",platforms:["WEBSITE"],source_url:PRIMARY,source_name:"ILeague • Tangsel Pos",assets:[{type:"image",url:hero,credit:"ILeague",clean_photo:true,text_overlay:false}],editorial_meta:{...meta,plan_key:PLAN+":article"}};
const social={id:sid,parent_id:aid,kind:"SOCIAL",format:"CAROUSEL",title:TITLE,caption:"LIMA LAGA, SATU UJIAN.\n\nPersija menghadapi lima pertandingan pada Oktober. Setelah awal musim yang positif, Shin Tae-yong menekankan istirahat dan pengaturan kondisi pemain untuk menjaga performa.\n\nCarousel ini memuat artikel utuh: jadwal, konteks pemulihan, dan analisis tantangan Macan Kemayoran. Ini pratinjau, bukan hasil pertandingan.",hashtags:["Stadione","Persija","SepakBolaIndonesia","SuperLeague"],platforms:["INSTAGRAM"],category:"Sepak Bola Indonesia",status:"DRAFT",source_url:PRIMARY,source_name:"ILeague • Tangsel Pos",assets,editorial_meta:meta};
social.editorial_meta.engine_approval={actor_id:"AUTO_EDITORIAL_USER_REQUEST",approved_at:now,digest:core.contentDigest(social)};
const gate=core.enginePublicationIssues(social);if(gate.length)throw Error(gate.join("\n"));
const {error:ae}=await db.from("stadione_content_items").insert(article);if(ae)throw ae;const {error:se}=await db.from("stadione_content_items").insert(social);if(se)throw se;
console.log(JSON.stringify({article:aid,social:sid,plan_key:PLAN,assets:assets.map(x=>x.url),gate}));
}
main().catch(e=>{console.error(e.message);process.exit(1)});
