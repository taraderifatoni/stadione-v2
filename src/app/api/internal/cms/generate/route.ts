import { timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateEnginePreview } from "@/lib/cms/content-engine"
export const runtime = "nodejs"
export const maxDuration = 300
export async function POST(request:NextRequest) {
 const expected=process.env.CMS_WORKER_SECRET || "", actual=request.headers.get("authorization")?.replace(/^Bearer /,"") || ""
 if(!expected || Buffer.byteLength(expected)!==Buffer.byteLength(actual) || !timingSafeEqual(Buffer.from(expected),Buffer.from(actual))) return NextResponse.json({error:"Unauthorized"},{status:401})
 const admin=createAdminClient()
 const input=await request.json().catch(()=>({}))
 let ids:string[]=[]
 if(input.id) {
  if(typeof input.id !== "string" || !/^[a-f0-9-]{36}$/i.test(input.id)) return NextResponse.json({error:"Invalid id"},{status:400})
  ids=[input.id]
 } else {
  const now=Date.now()
  const {data,error}=await admin.from("stadione_content_items").select("id,editorial_meta").eq("kind","SOCIAL").in("status",["DRAFT","PENDING_REVIEW"]).gte("scheduled_at",new Date(now-6*3600000).toISOString()).lte("scheduled_at",new Date(now+2*3600000).toISOString()).order("scheduled_at").limit(3)
  if(error)return NextResponse.json({error:"Unable to load slots"},{status:500})
  ids=(data || []).filter(r=>r.editorial_meta?.plan_key && !r.editorial_meta?.engine_approval).map(r=>r.id)
 }
 const results=[]
 for(const id of ids) {try {results.push(await generateEnginePreview(id))}catch(error){results.push({id,state:"FAILED",error:error instanceof Error?error.message:"Engine failed"})}}
 return NextResponse.json({checked_at:new Date().toISOString(),review_required:true,results})
}
