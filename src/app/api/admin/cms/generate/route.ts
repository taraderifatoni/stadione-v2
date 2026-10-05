import { NextRequest, NextResponse } from "next/server"
import { requirePlatformAdmin } from "@/lib/cms/auth"
import { generateEnginePreview } from "@/lib/cms/content-engine"
export const runtime = "nodejs"
export const maxDuration = 300
export async function POST(request: NextRequest) {
 const auth = await requirePlatformAdmin()
 if (!auth.ok) return NextResponse.json({error:auth.error},{status:auth.status})
 const input = await request.json().catch(()=>({}))
 if(typeof input.id !== "string" || !/^[a-f0-9-]{36}$/i.test(input.id)) return NextResponse.json({error:"ID konten tidak valid."},{status:400})
 try { return NextResponse.json(await generateEnginePreview(input.id)) } catch(error) {return NextResponse.json({error:error instanceof Error?error.message:"Engine gagal."},{status:409})}
}
