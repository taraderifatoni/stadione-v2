import { NextRequest, NextResponse } from "next/server"
import { requirePlatformAdmin } from "@/lib/cms/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { createHash, randomUUID } from "node:crypto"
import { promises as fs } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import type { Packet } from "@/lib/cms/engine"

export const runtime="nodejs"
export const maxDuration=300
const run=promisify(execFile)
const voices=new Set(["alloy","ash","ballad","coral","echo","fable","onyx","nova","sage","shimmer","verse","marin","cedar"])
export async function POST(request:NextRequest) {
  const auth=await requirePlatformAdmin(); if(!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status})
  if(!process.env.OPENAI_API_KEY) return NextResponse.json({error:"Narasi AI belum terhubung. Admin server perlu mengatur OPENAI_API_KEY untuk Stadione."},{status:503})
  const input=await request.json().catch(()=>null), id=input?.id, packet=input?.packet as Packet | undefined, voice=String(input?.voice || "coral")
  const spec=packet?.media?.illustration_reel, scenes=spec?.scenes
  if(typeof id!=="string" || !/^[a-f0-9-]{36}$/i.test(id) || !Array.isArray(scenes) || scenes.length<3 || scenes.length>12 || !voices.has(voice) || scenes.some(s=>typeof s.narration!=="string" || !s.narration.trim() || s.narration.length>180)) return NextResponse.json({error:"Pilih draf Reel dan isi narasi untuk 3–12 adegan (maksimal 180 karakter per adegan)."},{status:400})
  const admin=createAdminClient(), {data:item,error}=await admin.from("stadione_content_items").select("id,format,kind,status").eq("id",id).maybeSingle()
  if(error || !item || item.kind!=="SOCIAL" || item.format!=="REEL" || !["DRAFT","PENDING_REVIEW"].includes(item.status)) return NextResponse.json({error:"Narasi hanya untuk draf Reel yang belum terbit."},{status:409})
  const dir=await fs.mkdtemp(join(tmpdir(),"stadione-tts-"))
  try {
    const files:string[]=[], timed:typeof scenes=[]; let start=0
    for(let i=0;i<scenes.length;i++) {
      const response=await fetch("https://api.openai.com/v1/audio/speech",{method:"POST",headers:{"Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-4o-mini-tts",voice,input:scenes[i].narration,instructions:"Bacakan dalam bahasa Indonesia dengan jelas dan natural sebagai narator olahraga. Jangan menambahkan kata.",response_format:"mp3"}),signal:AbortSignal.timeout(60000)})
      if(!response.ok) throw new Error(`Penyedia narasi gagal (HTTP ${response.status}). Periksa konfigurasi dan kuota.`)
      const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length<100 || bytes.length>10_000_000) throw new Error("Berkas narasi tidak valid.")
      const mp3=join(dir,`scene-${i}.mp3`),file=join(dir,`scene-${i}.wav`);await fs.writeFile(mp3,bytes)
      await run("ffmpeg",["-v","error","-y","-nostdin","-i",mp3,"-c:a","pcm_s16le","-ar","48000","-ac","1",file],{timeout:30000})
      const info=JSON.parse((await run("ffprobe",["-v","error","-show_format","-of","json",file],{timeout:20000})).stdout)
      const duration=Number(info.format.duration)
      if(!Number.isFinite(duration) || duration<=0 || duration>20) throw new Error(`Narasi adegan ${i+1} melebihi 20 detik atau tidak valid.`)
      const end=Math.round((start+duration)*1000000)/1000000;timed.push({...scenes[i],start,end});start=end;files.push(file)
    }
    if(start<8 || start>90) throw new Error("Total narasi harus 8–90 detik; sesuaikan naskah.")
    const list=join(dir,"list.txt"),output=join(dir,"narration.wav")
    await fs.writeFile(list,files.map(f=>`file '${f}'`).join("\n"))
    await run("ffmpeg",["-v","error","-y","-nostdin","-f","concat","-safe","0","-i",list,"-c:a","pcm_s16le",output],{timeout:120000})
    const key=`illustrated-narration/${id}/${randomUUID()}.wav`,bytes=await fs.readFile(output)
    const {error:upload}=await admin.storage.from("stadione-cms").upload(key,bytes,{contentType:"audio/wav",upsert:false});if(upload) throw new Error("Gagal menyimpan narasi ke penyimpanan CMS.")
    const audio_url=admin.storage.from("stadione-cms").getPublicUrl(key).data.publicUrl
    return NextResponse.json({illustration_reel:{...spec,scenes:timed,audio_url,audio_credit:`Narasi AI OpenAI (${voice})`,audio_rights:"CLEARED",audio_evidence:`Narasi dihasilkan redaksi melalui OpenAI pada ${new Date().toISOString()}`,audio_generated:true,audio_script_sha256:createHash("sha256").update(timed.map(s=>s.narration).join("\n")).digest("hex")}})
  } catch(e) {return NextResponse.json({error:e instanceof Error?e.message:"Pembuatan narasi gagal."},{status:502})}
  finally {await fs.rm(dir,{recursive:true,force:true})}
}
