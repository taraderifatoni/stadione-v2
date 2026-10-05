import { promises as fs } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { lookup } from "node:dns/promises"
import { isIP } from "node:net"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import sharp from "sharp"
import type { Packet } from "./engine"
const run = promisify(execFile)
const esc = (s: string) => s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c] || c))
const forbiddenIp = (ip: string) => /^(127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.|224\.|255\.|::|fc|fd|fe80)/i.test(ip) || /^(::1$|::ffff:)/i.test(ip)
export async function sourceBytes(raw: string, max = 8_000_000): Promise<Buffer> {
  let url = new URL(raw)
  for (let redirects=0; redirects<4; redirects++) {
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || isIP(url.hostname)) throw new Error("Gunakan URL HTTPS publik tanpa kredensial/port khusus.")
    const addresses = await lookup(url.hostname,{all:true})
    if (!addresses.length || addresses.some(a=>forbiddenIp(a.address))) throw new Error("Alamat sumber internal tidak diizinkan.")
    const response = await fetch(url,{redirect:"manual",signal:AbortSignal.timeout(25000),headers:{"User-Agent":"StadioneEditorial/2.0"}})
    if (response.status >= 300 && response.status < 400 && response.headers.get("location")) { url = new URL(response.headers.get("location")!,url); continue }
    if (!response.ok) throw new Error(`Sumber mengembalikan HTTP ${response.status}`)
    if (Number(response.headers.get("content-length")) > max) throw new Error("Berkas sumber melebihi batas ukuran.")
    if (!response.body) throw new Error("Sumber kosong.")
    const chunks: Uint8Array[]=[]; let size=0
    for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) { size += chunk.length; if(size>max) throw new Error("Berkas sumber melebihi batas ukuran."); chunks.push(chunk) }
    return Buffer.concat(chunks)
  }
  throw new Error("Sumber terlalu banyak redirect.")
}
export async function measuredText(text: string, width: number, maxHeight: number, initialSize: number, bold=false) {
  for (let attempt=0; attempt<5; attempt++) {
    const size=initialSize-attempt*4
    const out=await sharp({text:{text:`<span foreground="#F5F0E8">${esc(text)}</span>`,font:`DejaVu Sans ${bold?"Bold ":""}${size}`,width,rgba:true,wrap:"word",spacing:10}}).png().toBuffer({resolveWithObject:true})
    if (out.info.height<=maxHeight && out.info.width<=width) return {buffer:out.data,width:out.info.width,height:out.info.height,font_size:size,attempts:attempt+1}
  }
  throw new Error("Teks melampaui ruang setelah 5 penyesuaian ukuran. Ringkas naskah tanpa membuang fakta.")
}
export async function renderCarousel(packet: Packet) {
  const photo = await sourceBytes(packet.media.url)
  const original = await sharp(photo).metadata()
  if ((original.width || 0)<800 || (original.height || 0)<600) throw new Error("Foto sumber kurang dari 800×600; unggah foto asli resolusi cukup.")
  const base = await sharp(photo).rotate().resize(1080,1350,{fit:"cover"}).jpeg().toBuffer()
  const overlay=Buffer.from('<svg width="1080" height="1350"><defs><linearGradient id="g" x2="0" y2="1"><stop stop-color="#0d0d0d" stop-opacity="0.2"/><stop offset="0.5" stop-color="#0d0d0d" stop-opacity="0.85"/><stop offset="1" stop-color="#0d0d0d"/></linearGradient></defs><rect width="1080" height="1350" fill="url(#g)"/><rect x="64" y="610" width="110" height="8" fill="#84102d"/></svg>')
  const images=[]
  for(let i=0;i<packet.slides.length;i++) {
    const s=packet.slides[i]
    const title=await measuredText(s.headline,940,240,64,true)
    const body=await measuredText(s.body,940,330,38)
    const label=await measuredText(`STADIONE  /  ${packet.assignment.pillar.toUpperCase()}  /  ${i+1}–${packet.slides.length}`,940,50,20,true)
    const credit=await measuredText(`Foto: ${packet.media.credit}`,940,55,18)
    const png=await sharp(base).composite([{input:overlay},{input:label.buffer,left:64,top:64},{input:title.buffer,left:64,top:655},{input:body.buffer,left:64,top:920},{input:credit.buffer,left:64,top:1260}]).jpeg({quality:90}).toBuffer()
    images.push({bytes:png,audit:{width:1080,height:1350,title_height:title.height,body_height:body.height,repair_attempts:Math.max(title.attempts,body.attempts),ok:true}})
  }
  return images
}
export async function renderReel(packet: Packet) {
  const directory = await fs.mkdtemp(join(tmpdir(),"stadione-reel-"))
  try {
    const source=join(directory,"source.mp4"), output=join(directory,"reel.mp4")
    await fs.writeFile(source,await sourceBytes(packet.media.url,50_000_000))
    const probe=JSON.parse((await run("ffprobe",["-v","error","-show_streams","-show_format","-of","json",source],{timeout:20000})).stdout)
    const duration=Number(probe.format.duration)
    if (!probe.streams.some((s:{codec_type:string})=>s.codec_type==="video") || !probe.streams.some((s:{codec_type:string})=>s.codec_type==="audio")) throw new Error("Video asli harus memiliki gambar bergerak dan audio berizin.")
    const scenes=packet.media.scenes || []
    if (!Number.isFinite(duration) || scenes.some(s=>s.end>duration)) throw new Error("Timeline caption melebihi durasi video asli.")
    const overlays=[]
    const hook=await measuredText(packet.slides[0].headline,920,230,58,true)
    await fs.writeFile(join(directory,"hook.png"),hook.buffer)
    for(let i=0;i<scenes.length;i++) {const caption=await measuredText(scenes[i].text,920,250,44,true);const file=join(directory,`scene-${i}.png`);await fs.writeFile(file,caption.buffer);overlays.push(file)}
    const inputs=["-i",source,"-i",join(directory,"hook.png"),...overlays.flatMap(f=>["-i",f])]
    const filters=["[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[v0]","[v0][1:v]overlay=80:180[v1]"]
    scenes.forEach((s,i)=>filters.push(`[v${i+1}][${i+2}:v]overlay=80:1470:enable='between(t,${s.start},${s.end})'[v${i+2}]`))
    const length=Math.min(90,Math.max(...scenes.map(s=>s.end)))
    await run("ffmpeg",["-y","-nostdin",...inputs,"-filter_complex",filters.join(";"),"-map",`[v${scenes.length+1}]`,"-map","0:a:0","-t",String(length),"-af","loudnorm=I=-16:TP=-1.5:LRA=11","-c:v","libx264","-preset","fast","-crf","22","-pix_fmt","yuv420p","-r","30","-c:a","aac","-movflags","+faststart",output],{timeout:180000,maxBuffer:2_000_000})
    const metadata=JSON.parse((await run("ffprobe",["-v","error","-show_streams","-show_format","-of","json",output],{timeout:20000})).stdout)
    const v=metadata.streams.find((s:{codec_type:string})=>s.codec_type==="video")
    if (v.width!==1080 || v.height!==1920 || Number(metadata.format.duration)>90.2) throw new Error("Output Reel gagal audit 1080×1920 / durasi.")
    return {bytes:await fs.readFile(output),audit:{ok:true,width:v.width,height:v.height,duration:Number(metadata.format.duration),scene_count:scenes.length,normalized_audio:true,source_video:true}}
  } finally { await fs.rm(directory,{recursive:true,force:true}) }
}
