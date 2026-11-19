import "server-only"
import { createHash, randomUUID } from "node:crypto"
import { promises as fs } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Packet } from "@/lib/cms/engine"
const run=promisify(execFile)
export const narrationConfigured=()=>Boolean(process.env.OPENAI_API_KEY || (process.env.STADIONE_CLONE_TTS_URL && process.env.STADIONE_CLONE_TTS_TOKEN));
export const illustratedVoices=new Set(["publisio-taradfs","alloy","ash","ballad","coral","echo","fable","onyx","nova","sage","shimmer","verse","marin","cedar"])
export async function generateIllustratedNarration(admin:ReturnType<typeof createAdminClient>,id:string,spec:NonNullable<Packet["media"]["illustration_reel"]>,voice="coral") {
 if(!narrationConfigured())throw new Error("NARRATION_PROVIDER_MISSING: OPENAI_API_KEY belum dikonfigurasi untuk Stadione.")
 const scenes=spec.scenes
 if(!illustratedVoices.has(voice)||!Array.isArray(scenes)||scenes.length<3||scenes.length>12||scenes.some(s=>typeof s.narration!=="string"||!s.narration.trim()||s.narration.length>180))throw new Error("Narasi perlu 3–12 adegan valid, maksimal 180 karakter per adegan.")
  const dir=await fs.mkdtemp(join(tmpdir(),"stadione-tts-"))
  try {
    const files:string[]=[], timed:typeof scenes=[]; let start=0
    for(let i=0;i<scenes.length;i++) {
      const phrases:string[]=[];let phrase="";
      for(const word of scenes[i].narration.trim().split(/\s+/)) {
        if(phrase && (phrase+" "+word).length>64){phrases.push(phrase);phrase="";}
        phrase+=(phrase?" ":"")+word;
      }
      if(phrase)phrases.push(phrase);
      const sceneStart=start, captions:{text:string;start:number;end:number}[]=[];
      for(let j=0;j<phrases.length;j++) {
      const useClone=voice==="publisio-taradfs";
      if(useClone && (!process.env.STADIONE_CLONE_TTS_URL || !process.env.STADIONE_CLONE_TTS_TOKEN)) throw new Error("Layanan suara Publisio belum dikonfigurasi.");
      if(!useClone && !process.env.OPENAI_API_KEY) throw new Error("Pilih suara Publisio Tara DFS; OpenAI belum dikonfigurasi.");
      const response=useClone ? await fetch(`${process.env.STADIONE_CLONE_TTS_URL}/say`,{method:"POST",headers:{"Content-Type":"application/json","x-clone-token":process.env.STADIONE_CLONE_TTS_TOKEN!},body:JSON.stringify({voice:"taradfs",text:phrases[j],speed:1,temperature:0.6,guidance:2.5,num_step:16}),signal:AbortSignal.timeout(180000)}) : await fetch("https://api.openai.com/v1/audio/speech",{method:"POST",headers:{"Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-4o-mini-tts",voice,input:phrases[j],instructions:"Bacakan dalam bahasa Indonesia dengan jelas dan natural sebagai narator olahraga. Jangan menambahkan kata.",response_format:"mp3"}),signal:AbortSignal.timeout(60000)})
      if(!response.ok) throw new Error(`Penyedia narasi gagal (HTTP ${response.status}). Periksa konfigurasi dan kuota.`)
      const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length<100 || bytes.length>10_000_000) throw new Error("Berkas narasi tidak valid.")
      const mp3=join(dir,`scene-${i}-${j}.mp3`),file=join(dir,`scene-${i}-${j}.wav`);await fs.writeFile(mp3,bytes)
      await run("ffmpeg",["-v","error","-y","-nostdin","-i",mp3,"-c:a","pcm_s16le","-ar","48000","-ac","1",file],{timeout:30000})
      const info=JSON.parse((await run("ffprobe",["-v","error","-show_format","-of","json",file],{timeout:20000})).stdout)
      const duration=Number(info.format.duration)
      if(!Number.isFinite(duration) || duration<=0 || duration>20) throw new Error(`Narasi adegan ${i+1} melebihi 20 detik atau tidak valid.`)
      const end=Math.round((start+duration)*1000000)/1000000;
      captions.push({text:phrases[j],start:Math.round((start-sceneStart)*1000000)/1000000,end:Math.round((end-sceneStart)*1000000)/1000000});start=end;files.push(file);
      }
      if(start-sceneStart>20)throw new Error(`Narasi adegan ${i+1} melebihi 20 detik.`);
      timed.push({...scenes[i],captions,start:sceneStart,end:start});
    }
    if(start<8 || start>90) throw new Error("Total narasi harus 8–90 detik; sesuaikan naskah.")
    const list=join(dir,"list.txt"),output=join(dir,"narration.wav")
    await fs.writeFile(list,files.map(f=>`file '${f}'`).join("\n"))
    await run("ffmpeg",["-v","error","-y","-nostdin","-f","concat","-safe","0","-i",list,"-c:a","pcm_s16le",output],{timeout:120000})
    const key=`illustrated-narration/${id}/${randomUUID()}.wav`,bytes=await fs.readFile(output)
    const {error:upload}=await admin.storage.from("stadione-cms").upload(key,bytes,{contentType:"audio/wav",upsert:false});if(upload) throw new Error("Gagal menyimpan narasi ke penyimpanan CMS.")
    const audio_url=admin.storage.from("stadione-cms").getPublicUrl(key).data.publicUrl
    return {illustration_reel:{...spec,scenes:timed,audio_url,audio_credit:voice==="publisio-taradfs"?"Narasi Tara DFS melalui Publisio":`Narasi AI OpenAI (${voice})`,audio_rights:"CLEARED",audio_evidence:`Narasi dihasilkan redaksi melalui ${voice==="publisio-taradfs"?"Publisio, suara pemilik dengan persetujuan 19 November 2026":"OpenAI"} pada ${new Date().toISOString()}`,audio_generated:true,audio_script_sha256:createHash("sha256").update(timed.map(s=>s.narration).join("\n")).digest("hex")}}
  }  finally {await fs.rm(dir,{recursive:true,force:true})}
}
