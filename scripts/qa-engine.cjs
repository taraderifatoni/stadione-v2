/* eslint-disable @typescript-eslint/no-require-imports */
const assert=require("node:assert/strict"), fs=require("node:fs"), path=require("node:path"), crypto=require("node:crypto"), Module=require("node:module"), ts=require("typescript"), {execFileSync}=require("node:child_process")
const root=path.resolve(__dirname,"..")
function load(file,replace={}) {
 let src=fs.readFileSync(path.join(root,file),"utf8")
 for(const [a,b] of Object.entries(replace))src=src.replace(a,b)
 const code=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText
 const m=new Module(path.join(root,file),module);m.filename=path.join(root,file);m.paths=Module._nodeModulePaths(root);m._compile(code,m.filename);return m.exports
}
const core=load("src/lib/cms/engine.ts"), sha=s=>crypto.createHash("sha256").update(s).digest("hex")
const text="Indonesia mencatat hasil resmi pada pertandingan final. Penyelenggara mengonfirmasi hasil ini dan menyebut konteks pertandingan."
const packet={version:2,narrative_reviewed:true,context:Object.fromEntries(["who","what","when","where","why","how"].map(k=>[k,"Konteks terverifikasi"])),event_status:"FINAL",event_at:new Date(Date.now()-3600000).toISOString(),assignment:{pillar:"Olahraga Indonesia",angle:"Apresiasi",why_now:"Hasil resmi baru diumumkan penyelenggara pertandingan."},sources:[{id:"p",url:"https://federasi.example/news",publisher_group:"federation",primary:true,published_at:new Date().toISOString(),text,sha256:sha(text)},{id:"s",url:"https://redaksi.example/news",publisher_group:"independent-newsroom",primary:false,published_at:new Date().toISOString(),text,sha256:sha(text)}],claims:[{id:"c",text:"Indonesia mencatat hasil resmi pada pertandingan final.",verified:true,evidence:[{source_id:"p",quote:text},{source_id:"s",quote:text}]}],slides:["hook","fact","chronology","context","closing"].map(role=>({role,headline:"Hasil resmi Indonesia",body:"Konteks pertandingan sudah dikonfirmasi.",claim_ids:["c"]})),media:{url:"https://media.example/photo.jpg",type:"image",credit:"QA fixture",rights_evidence:"Synthetic fixture solely for testing",scope:"QA",rights_status:"CLEARED"}}
assert.deepEqual(core.auditPacket(packet,"CAROUSEL"),[])
const change=f=>{const p=structuredClone(packet);f(p);return core.auditPacket(p,"CAROUSEL")}
assert(change(p=>p.sources.pop()).length)
assert(change(p=>p.sources[1].publisher_group="federation").some(x=>x.includes("kelompok")))
assert(change(p=>p.claims[0].evidence[1].quote="Tidak ada kutipan ini di sumber.").length)
assert(change(p=>p.sources.forEach(s=>s.published_at="2020-01-01")).some(x=>x.includes("48 jam")))
assert(change(p=>p.event_at=new Date(Date.now()+86400000).toISOString()).some(x=>x.includes("final")))
assert(change(p=>p.slides[2].body="Menang 9-0").some(x=>x.includes("angka")))
assert(change(p=>p.media.rights_status="PENDING").some(x=>x.includes("izin")))
assert(core.auditPacket(packet,"REEL").some(x=>x.includes("video asli")))
const item={title:"Hasil resmi Indonesia",caption:"Fakta hasil final dan konteks pertandingan.",format:"CAROUSEL",assets:packet.slides.map(()=>({url:"https://media.example/slide.jpg"})),editorial_meta:{standard:core.ENGINE,engine_packet:packet,engine_state:"READY_FOR_REVIEW",rendered_packet_digest:core.packetDigest(packet),render_audit:{ok:true}}}
item.editorial_meta.engine_approval={actor_id:"editor",digest:core.contentDigest(item)}
assert.deepEqual(core.enginePublicationIssues(item),[])
item.caption+=" Perubahan";assert(core.enginePublicationIssues(item).some(x=>x.includes("Editor harus")))
item.editorial_meta.engine_packet.slides[0].body+=" Perubahan";assert(core.enginePublicationIssues(item).some(x=>x.includes("packet berubah")))
;(async()=>{
 const sharp=require("sharp")
 global.__engineTestPhoto=await sharp({create:{width:1200,height:1600,channels:3,background:"#6a8490"}}).jpeg().toBuffer()
 const media=load("src/lib/cms/engine-media.ts",{"await sourceBytes(packet.media.url)":"global.__engineTestPhoto","await sourceBytes(packet.media.url,50_000_000)":"global.__engineTestVideo"})
 const rendered=await media.renderCarousel(packet)
 assert.equal(rendered.length,5)
 for(const r of rendered){const m=await sharp(r.bytes).metadata();assert.equal(m.width,1080);assert.equal(m.height,1350);assert(r.audit.body_height<=330);assert(r.audit.title_height<=240)}
 await assert.rejects(()=>media.measuredText("Panjang ".repeat(1000),920,20,64),/5 penyesuaian/)
 const dir=fs.mkdtempSync("/tmp/stadione-engine-qa-"), source=path.join(dir,"fixture.mp4")
 try {
  execFileSync("ffmpeg",["-v","error","-y","-f","lavfi","-i","testsrc2=size=640x360:rate=30","-f","lavfi","-i","sine=frequency=440:sample_rate=44100","-t","6","-c:v","libx264","-pix_fmt","yuv420p","-c:a","aac",source],{timeout:30000})
  global.__engineTestVideo=fs.readFileSync(source)
  packet.media={...packet.media,type:"video",transcript:"Video QA sintetis dengan suara pengujian untuk verifikasi render saja.",audio_rights:"CLEARED",scenes:[{start:0,end:2,text:"Fakta pertama",claim_ids:["c"]},{start:2,end:4,text:"Konteks pertandingan",claim_ids:["c"]},{start:4,end:6,text:"Makna hasil resmi",claim_ids:["c"]}]}
  const reel=await media.renderReel(packet);assert(reel.audit.ok);assert.equal(reel.audit.scene_count,3);assert.equal(reel.audit.height,1920);assert(reel.audit.duration<=6.2)
  packet.media.scenes[2].end=20
  await assert.rejects(()=>media.renderReel(packet),/durasi video/)
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
 console.log(JSON.stringify({ok:true,tests:["independent_sources","claim_evidence","freshness","future_final","unsupported_number","media_rights","reel_video_gate","approval_digest_invalidation","packet_render_invalidation","measured_5_slide_render","bounded_overflow_repair","real_video_ffmpeg_1080x1920","timeline_bounds"]}))
})().catch(e=>{console.error(e);process.exitCode=1})
