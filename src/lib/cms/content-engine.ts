import "server-only"
import { randomUUID, createHash } from "node:crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { ENGINE, auditPacket, packetDigest, type Packet, type Source } from "./engine"
import { sourceBytes, renderCarousel, renderReel } from "./engine-media"
const digest=(text:string)=>createHash("sha256").update(text).digest("hex")
const plain=(html:string)=>html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;|&#160;/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/\s+/g," ").trim()
const tokens=(title:string)=>new Set(title.toLowerCase().replace(/[^\p{L}\p{N} ]/gu," ").split(/\s+/).filter(s=>s.length>3 && !/indonesia|olahraga|berita|terbaru|hari|hasil|untuk|dengan|pada|dari/.test(s)))
const relevant=(title:string,pillar:string)=> /Eropa/.test(pillar)? /arsenal|chelsea|united|madrid|barcelona|premier|champions|juventus|liverpool|serie|bundesliga/i.test(title) : /Tarkam|Komunitas/.test(pillar)? /tarkam|komunitas|kampung|amatir/i.test(title) : /Sepak Bola Indonesia/.test(pillar)? /liga|persib|persija|pssi|timnas|sepak bola|garuda/i.test(title) : true
async function research(candidate: Record<string,unknown>, others:Record<string,unknown>[], meta: Record<string,unknown>): Promise<Packet> {
  const title=String(candidate.title || "")
  const words=tokens(title)
  const related=others.filter(c=>c.sourceUrl && [...tokens(String(c.title))].filter(w=>words.has(w)).length>=3)
  const urls=[...new Set([candidate,...related].map(c=>String(c.sourceUrl || "")).filter(u=>u.startsWith("https://")))].slice(0,4)
  const sources:Source[]=[]
  for(let i=0;i<urls.length;i++) {
    try { const html=(await sourceBytes(urls[i],2_000_000)).toString("utf8");const text=plain(html).slice(0,25000);const published=html.match(/(?:datePublished|article:published_time)["'\s:=]+(?:content=["'])?([^"'<>]{10,40})/i)?.[1] || "";sources.push({id:`source-${i+1}`,url:urls[i],primary:false,published_at:published,retrieved_at:new Date().toISOString(),text,sha256:digest(text)}) } catch { /* Candidate remains unresolved. An unavailable source never becomes evidence. */ }
  }
  return {version:3,narrative_reviewed:false,context:{who:"",what:"",when:"",where:"",why:"",how:""},event_status:"UNCONFIRMED",event_at:"",assignment:{pillar:String(meta.pillar || "Sports Update"),angle:String(meta.angle || "Update"),why_now:""},sources,claims:[{id:"claim-1",text:title,verified:false,evidence:[]}],slides:[{role:"hook",headline:title.slice(0,96),body:"",claim_ids:["claim-1"]},{role:"fact",headline:"Fakta utama",body:"",claim_ids:["claim-1"]},{role:"chronology",headline:"Urutan kejadian",body:"",claim_ids:["claim-1"]},{role:"context",headline:"Konteks pertandingan",body:"",claim_ids:["claim-1"]},{role:"closing",headline:"Apa artinya untuk penggemar?",body:"",claim_ids:["claim-1"]}],media:{url:"",type:"",credit:"",rights_evidence:"",scope:"",rights_status:"PENDING",video_sources:[],scenes:[]}}
}
export async function generateEnginePreview(id:string) {
  const admin=createAdminClient()
  const {data:item,error}=await admin.from("stadione_content_items").select("*").eq("id",id).single()
  if(error || !item || item.kind!=="SOCIAL" || !["DRAFT","PENDING_REVIEW"].includes(item.status)) throw new Error("Pilih draf sosial yang belum dijadwalkan/terbit.")
  const meta=item.editorial_meta || {}
  const fingerprint=digest(JSON.stringify([item.id,meta.engine_packet || null,meta.plan_key || null]))
  const key=`${item.id}:${fingerprint}`;const lease=randomUUID()
  const {data:claimed,error:claimError}=await admin.rpc("claim_stadione_engine_run",{p_key:key,p_content_id:id,p_lease:lease})
  if(claimError) throw new Error("Klaim engine gagal; periksa migration database.")
  if(!claimed) return {id,skipped:true,reason:"input_already_processed_or_locked"}
  let savedTimestamp=item.updated_at
  const checkpoint=async(stage:string,state="RUNNING",detail:unknown={})=>{const {error:e}=await admin.from("stadione_engine_runs").update({stage,state,detail,leased_until:new Date(Date.now()+15*60000).toISOString(),updated_at:new Date().toISOString()}).eq("run_key",key).eq("lease_token",lease).select("run_key").single();if(e)throw e}
  try {
    await checkpoint("RESEARCH")
    let packet=meta.engine_packet as Packet | undefined
    if(!packet) {
      const {data:run}=await admin.from("stadione_editorial_runs").select("pool").eq("status","COMPLETED").order("created_at",{ascending:false}).limit(10)
      const pool=run?.find(r=>r.pool?.sources)?.pool
      const news=pool?.sources?.google_news?.items || []
      const candidate=(news as Record<string,unknown>[]).find(c=>relevant(String(c.title),String(meta.pillar || item.category || "")))
      if(!candidate) { await checkpoint("ASSIGNMENT","BLOCKED",{issues:["Tidak ada kandidat aktual yang sesuai pilar matrix. Editor perlu memilih berita/sumber primer."]});return {id,state:"BLOCKED",issues:["Tidak ada kandidat sesuai pilar matrix."]} }
      packet=await research(candidate,news,meta)
    }
    await checkpoint("CLAIM_AUDIT")
    const issues=auditPacket(packet,item.format)
    const baseMeta={...meta,standard:ENGINE,engine_packet:packet,engine_approval:null,engine_run_key:key,engine_state:issues.length?"BLOCKED":"RENDERING",engine_issues:issues,engine_voice:{tone:"tajam, energik, dekat komunitas",rules:["fakta dulu, konteks sesudahnya","rumor berlabel","hasil hanya final resmi","banter performa, bukan identitas","kutipan persis sumber"]}}
    const {data:savedItem,error:saveError}=await admin.from("stadione_content_items").update({status:"PENDING_REVIEW",editorial_meta:baseMeta,source_url:packet.sources.find(s=>s.primary)?.url || packet.sources[0]?.url || item.source_url,source_snapshot:{sources:packet.sources}}).eq("id",id).eq("updated_at",item.updated_at).select("id,updated_at").single()
    if(saveError) throw new Error("Draf berubah selama research; muat ulang sebelum regenerasi.")
    savedTimestamp=savedItem.updated_at
    if(issues.length) {await checkpoint("CLAIM_AUDIT","BLOCKED",{issues});return {id,state:"BLOCKED",issues}}
    await checkpoint("RENDER")
    const rendered=item.format==="REEL"?[await renderReel(packet)]:await renderCarousel(packet)
    const assets=[]
    for(let i=0;i<rendered.length;i++) {
      const extension=item.format==="REEL"?"mp4":"jpg";const path=`engine/${id}/${fingerprint}-${i+1}.${extension}`
      const {error:uploadError}=await admin.storage.from("stadione-cms").upload(path,rendered[i].bytes,{contentType:item.format==="REEL"?"video/mp4":"image/jpeg",upsert:true})
      if(uploadError)throw new Error(`Upload render gagal: ${uploadError.message}`)
      const {data:url}=admin.storage.from("stadione-cms").getPublicUrl(path)
      const clips=packet.media.video_sources || []; assets.push({...packet.slides[i],type:item.format==="REEL"?"video":"image",...(item.format==="REEL"?{video_url:url.publicUrl}:{url:url.publicUrl}),credit:item.format==="REEL"?clips.map(c=>c.credit).join(" · "):packet.media.credit,rights_status:"CLEARED",rights_evidence:item.format==="REEL"?clips.map(c=>c.rights_evidence).join(" · "):packet.media.rights_evidence,source_url:item.format==="REEL"?clips[0]?.page_url:packet.media.url,source_clips:item.format==="REEL"?clips.map(c=>({id:c.id,platform:c.platform,page_url:c.page_url,creator:c.creator,credit:c.credit,rights_status:c.rights_status,scope:c.scope})):undefined,render_audit:rendered[i].audit})
    }
    const caption=packet.claims.map(c=>c.text).join("\n\n")+`\n\n${packet.slides.at(-1)?.headline}\nSumber: ${packet.sources.map(s=>new URL(s.url).hostname).join(", ")}. Foto/video: ${packet.media.credit}.`
    const {error:finishError}=await admin.from("stadione_content_items").update({title:packet.slides[0].headline,caption,assets,editorial_meta:{...baseMeta,engine_state:"READY_FOR_REVIEW",engine_issues:[],fact_check_status:"VERIFIED",rights_status:"CLEARED",rendered_packet_digest:packetDigest(packet),render_audit:{ok:true,format:item.format,assets:rendered.map(r=>r.audit)}}}).eq("id",id).eq("updated_at",savedTimestamp).select("id").single()
    if(finishError)throw finishError
    await checkpoint("EDITOR_REVIEW","COMPLETED",{assets:assets.length,review_required:true})
    return {id,state:"READY_FOR_REVIEW",assets:assets.length,review_required:true}
  } catch(error) {const message=error instanceof Error?error.message:"Engine gagal";await checkpoint("RECOVERY","FAILED",{issues:[message]});await admin.from("stadione_content_items").update({editorial_meta:{...meta,standard:ENGINE,engine_state:"FAILED",engine_issues:[message],engine_approval:null}}).eq("id",id).eq("updated_at",savedTimestamp);return {id,state:"FAILED",issues:[message]}}
}
