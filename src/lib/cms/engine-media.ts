import { promises as fs } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { lookup } from "node:dns/promises"
import { isIP } from "node:net"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import sharp from "sharp"
import type { Packet,VideoSource } from "./engine"
const run=promisify(execFile)
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]||c))
const forbiddenIp=(ip:string)=>/^(127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.|224\.|255\.|::|fc|fd|fe80)/i.test(ip)||/^(::1$|::ffff:)/i.test(ip)
export async function sourceBytes(raw:string,max=8_000_000):Promise<Buffer>{
 let url=new URL(raw)
 for(let redirects=0;redirects<4;redirects++){
  if(url.protocol!=="https:"||url.username||url.password||(url.port&&url.port!=="443")||isIP(url.hostname))throw new Error("Gunakan URL HTTPS publik tanpa kredensial/port khusus.")
  const addresses=await lookup(url.hostname,{all:true});if(!addresses.length||addresses.some(a=>forbiddenIp(a.address)))throw new Error("Alamat sumber internal tidak diizinkan.")
  const response=await fetch(url,{redirect:"manual",signal:AbortSignal.timeout(30000),headers:{"User-Agent":"StadioneEditorial/3.0"}})
  if(response.status>=300&&response.status<400&&response.headers.get("location")){url=new URL(response.headers.get("location")!,url);continue}
  if(!response.ok)throw new Error(`Sumber mengembalikan HTTP ${response.status}`)
  if(Number(response.headers.get("content-length"))>max)throw new Error("Berkas sumber melebihi batas ukuran.")
  if(!response.body)throw new Error("Sumber kosong.")
  const chunks:Uint8Array[]=[];let size=0;for await(const chunk of response.body as unknown as AsyncIterable<Uint8Array>){size+=chunk.length;if(size>max)throw new Error("Berkas sumber melebihi batas ukuran.");chunks.push(chunk)}
  return Buffer.concat(chunks)
 }throw new Error("Sumber terlalu banyak redirect.")
}
export async function measuredText(text:string,width:number,maxHeight:number,initialSize:number,bold=false){
 for(let attempt=0;attempt<5;attempt++){const size=initialSize-attempt*4;const out=await sharp({text:{text:`<span foreground="#F5F0E8">${esc(text)}</span>`,font:`DejaVu Sans ${bold?"Bold ":""}${size}`,width,rgba:true,wrap:"word",spacing:10}}).png().toBuffer({resolveWithObject:true});if(out.info.height<=maxHeight&&out.info.width<=width)return{buffer:out.data,width:out.info.width,height:out.info.height,font_size:size,attempts:attempt+1}}
 throw new Error("Teks melampaui ruang setelah 5 penyesuaian ukuran.")
}
export async function renderCarousel(packet:Packet){
 const photo=await sourceBytes(packet.media.url),original=await sharp(photo).metadata();if((original.width||0)<800||(original.height||0)<600)throw new Error("Foto sumber kurang dari 800×600.")
 const base=await sharp(photo).rotate().resize(1080,1350,{fit:"cover"}).jpeg().toBuffer(),overlay=Buffer.from('<svg width="1080" height="1350"><defs><linearGradient id="g" x2="0" y2="1"><stop stop-color="#0d0d0d" stop-opacity=".2"/><stop offset=".5" stop-color="#0d0d0d" stop-opacity=".85"/><stop offset="1" stop-color="#0d0d0d"/></linearGradient></defs><rect width="1080" height="1350" fill="url(#g)"/><rect x="64" y="610" width="110" height="8" fill="#84102d"/></svg>')
 const images=[]
 for(let i=0;i<packet.slides.length;i++){const s=packet.slides[i],title=await measuredText(s.headline,940,240,64,true),body=await measuredText(s.body,940,330,38),label=await measuredText(`STADIONE / ${packet.assignment.pillar.toUpperCase()} / ${i+1}–${packet.slides.length}`,940,50,20,true),credit=await measuredText(`Foto: ${packet.media.credit}`,940,55,18);const bytes=await sharp(base).composite([{input:overlay},{input:label.buffer,left:64,top:64},{input:title.buffer,left:64,top:655},{input:body.buffer,left:64,top:920},{input:credit.buffer,left:64,top:1260}]).jpeg({quality:90}).toBuffer();images.push({bytes,audit:{width:1080,height:1350,title_height:title.height,body_height:body.height,repair_attempts:Math.max(title.attempts,body.attempts),ok:true}})}
 return images
}
async function probe(file:string){return JSON.parse((await run("ffprobe",["-v","error","-show_streams","-show_format","-of","json",file],{timeout:20000})).stdout)}
async function writeSource(directory:string,clip:VideoSource,index:number){const file=join(directory,`source-${index}.mp4`);await fs.writeFile(file,await sourceBytes(clip.media_url,150_000_000));const info=await probe(file);if(!info.streams.some((s:{codec_type:string})=>s.codec_type==="video")||!info.streams.some((s:{codec_type:string})=>s.codec_type==="audio"))throw new Error(`Video ${clip.id} wajib memiliki gambar bergerak dan audio.`);return{file,duration:Number(info.format.duration)}}
export async function renderReel(packet:Packet){
 const directory=await fs.mkdtemp(join(tmpdir(),"stadione-montage-"))
 try{
  const clips=packet.media.video_sources||[],scenes=packet.media.scenes||[],files=new Map<string,{file:string;duration:number}>()
  for(let i=0;i<clips.length;i++)files.set(clips[i].id,await writeSource(directory,clips[i],i))
  const hook=await measuredText(packet.slides[0].headline,920,220,56,true);await fs.writeFile(join(directory,"hook.png"),hook.buffer)
  const segments:string[]=[]
  for(let i=0;i<scenes.length;i++){
   const scene=scenes[i],clip=clips.find(c=>c.id===scene.source_id),source=files.get(scene.source_id);if(!clip||!source)throw new Error(`Sumber potongan ${i+1} tidak tersedia.`)
   if(scene.source_end>source.duration+.1)throw new Error(`Timestamp potongan ${i+1} melewati durasi video sumber.`)
   const caption=await measuredText(scene.text,920,240,42,true),credit=await measuredText(`Sumber: ${clip.credit}`,920,65,20)
   const captionFile=join(directory,`caption-${i}.png`),creditFile=join(directory,`credit-${i}.png`),segment=join(directory,`segment-${i}.mp4`)
   await fs.writeFile(captionFile,caption.buffer);await fs.writeFile(creditFile,credit.buffer)
   const duration=scene.source_end-scene.source_start
   const filters=["[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[v0]","[v0][1:v]overlay=80:160[v1]","[v1][2:v]overlay=80:1460[v2]","[v2][3:v]overlay=80:1810[vout]"].join(";")
   await run("ffmpeg",["-v","error","-y","-nostdin","-ss",String(scene.source_start),"-t",String(duration),"-i",source.file,"-i",join(directory,"hook.png"),"-i",captionFile,"-i",creditFile,"-filter_complex",filters,"-map","[vout]","-map","0:a:0","-af","aresample=async=1:first_pts=0","-c:v","libx264","-preset","fast","-crf","22","-pix_fmt","yuv420p","-r","30","-c:a","aac","-ar","48000","-ac","2",segment],{timeout:180000,maxBuffer:2_000_000});segments.push(segment)
  }
  const list=join(directory,"concat.txt");await fs.writeFile(list,segments.map(f=>`file '${f.replace(/'/g,"'\\''")}'`).join("\n"))
  const output=join(directory,"reel.mp4")
  await run("ffmpeg",["-v","error","-y","-nostdin","-f","concat","-safe","0","-i",list,"-af","loudnorm=I=-16:TP=-1.5:LRA=11","-c:v","copy","-c:a","aac","-movflags","+faststart",output],{timeout:240000,maxBuffer:2_000_000})
  const meta=await probe(output),v=meta.streams.find((s:{codec_type:string})=>s.codec_type==="video"),duration=Number(meta.format.duration)
  if(v?.width!==1080||v?.height!==1920||duration<7.8||duration>90.2)throw new Error("Output montage gagal audit 1080×1920 atau durasi 8–90 detik.")
  return{bytes:await fs.readFile(output),audit:{ok:true,width:v.width,height:v.height,duration,scene_count:scenes.length,source_count:clips.length,platforms:[...new Set(clips.map(c=>c.platform))],normalized_audio:true,source_video:true,ai_footage:false}}
 }finally{await fs.rm(directory,{recursive:true,force:true})}
}
