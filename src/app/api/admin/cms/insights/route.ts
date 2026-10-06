import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/cms/auth";
import { cmsInsights } from "@/lib/cms/insights";

export async function GET() {
  const auth=await requirePlatformAdmin();
  if(!auth.ok)return NextResponse.json({error:auth.error},{status:auth.status});
  try { return NextResponse.json({insights:await cmsInsights()}); }
  catch(e) { return NextResponse.json({error:e instanceof Error?e.message:"Insight gagal dimuat."},{status:502}); }
}
export async function POST(request:NextRequest) {
  const auth=await requirePlatformAdmin();
  if(!auth.ok)return NextResponse.json({error:auth.error},{status:auth.status});
  const input=await request.json().catch(()=>({}));
  const ids=Array.isArray(input.ids)?[...new Set<string>(input.ids.map(String))].filter(id=>/^[a-f0-9-]{36}$/i.test(id)).slice(0,30):[];
  if(Array.isArray(input.ids) && !ids.length)return NextResponse.json({error:"Pilih ID konten yang valid."},{status:400});
  try { return NextResponse.json({insights:await cmsInsights(ids,true,input.force===true)}); }
  catch(e) { return NextResponse.json({error:e instanceof Error?e.message:"Insight gagal diperbarui."},{status:502}); }
}
