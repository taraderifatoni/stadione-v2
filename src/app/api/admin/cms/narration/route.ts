import { generateIllustratedNarration, illustratedVoices } from "@/lib/cms/illustrated-narration"
import { NextRequest, NextResponse } from "next/server"
import { requirePlatformAdmin } from "@/lib/cms/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Packet } from "@/lib/cms/engine"

export const runtime="nodejs"
export const maxDuration=300
const voices=illustratedVoices
export async function POST(request:NextRequest) {
  const auth=await requirePlatformAdmin(); if(!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status})
  if(!process.env.OPENAI_API_KEY) return NextResponse.json({error:"Narasi AI belum terhubung. Admin server perlu mengatur OPENAI_API_KEY untuk Stadione."},{status:503})
  const input=await request.json().catch(()=>null), id=input?.id, packet=input?.packet as Packet | undefined, voice=String(input?.voice || "coral")
  const spec=packet?.media?.illustration_reel, scenes=spec?.scenes
  if(typeof id!=="string" || !/^[a-f0-9-]{36}$/i.test(id) || !Array.isArray(scenes) || scenes.length<3 || scenes.length>12 || !voices.has(voice) || scenes.some(s=>typeof s.narration!=="string" || !s.narration.trim() || s.narration.length>180)) return NextResponse.json({error:"Pilih draf Reel dan isi narasi untuk 3–12 adegan (maksimal 180 karakter per adegan)."},{status:400})
  const admin=createAdminClient(), {data:item,error}=await admin.from("stadione_content_items").select("id,format,kind,status").eq("id",id).maybeSingle()
  if(error || !item || item.kind!=="SOCIAL" || item.format!=="REEL" || !["DRAFT","PENDING_REVIEW"].includes(item.status)) return NextResponse.json({error:"Narasi hanya untuk draf Reel yang belum terbit."},{status:409})
  try {return NextResponse.json(await generateIllustratedNarration(admin,id,spec!,voice))}
  catch(e) {return NextResponse.json({error:e instanceof Error?e.message:"Pembuatan narasi gagal."},{status:502})}
}
