import {NextRequest,NextResponse} from "next/server";
import {requirePlatformAdmin} from "@/lib/cms/auth";
import {createAdminClient} from "@/lib/supabase/admin";
import {facebookConnectionStatus} from "@/lib/cms/facebook";
import {metaConnectionStatus} from "@/lib/cms/meta";
import {mirrorEligible} from "@/lib/cms/mirror-policy";
export async function GET(){
 const auth=await requirePlatformAdmin();if(!auth.ok)return NextResponse.json({error:auth.error},{status:auth.status});
 const db=createAdminClient(),[ig,fb,{data:settings,error:settingsError},{data:attempts,error:attemptsError}]=await Promise.all([metaConnectionStatus(),facebookConnectionStatus(),db.from("stadione_social_mirror_settings").select("*"),db.from("stadione_social_mirrors").select("content_id,platform,state,external_id,external_url,error_message,published_at,updated_at,stadione_content_items(title)").order("updated_at",{ascending:false}).limit(100)]);
 const connections=[{platform:"INSTAGRAM",connected:ig.connected,can_publish:ig.connected,account:ig.account,error:ig.connected?null:"Koneksi Instagram belum tersedia."},fb,...["YOUTUBE","PINTEREST","TIKTOK","X","THREADS"].map(platform=>({platform,connected:false,can_publish:false,account:null,error:platform==="YOUTUBE"&&process.env.YOUTUBE_API_KEY?"API pencarian tersedia; koneksi unggah kanal belum tersedia.":"Akun publikasi belum tersambung."}))];
 return NextResponse.json({connections,settings:settings||[],attempts:attempts||[],error:settingsError||attemptsError?"Riwayat mirroring belum tersedia.":null});
}
export async function POST(request:NextRequest){
 const auth=await requirePlatformAdmin();if(!auth.ok)return NextResponse.json({error:auth.error},{status:auth.status});
 const input=await request.json().catch(()=>({}));if(input.action!=="retry"||!/^[a-f0-9-]{36}$/i.test(input.id||""))return NextResponse.json({error:"Permintaan tidak valid."},{status:400});
 const db=createAdminClient(),{data:item}=await db.from("stadione_content_items").select("*").eq("id",input.id).maybeSingle(),{data:setting}=await db.from("stadione_social_mirror_settings").select("*").eq("platform","FACEBOOK").maybeSingle();
 if(!item||!setting||!mirrorEligible(item,setting.started_at,setting.enabled))return NextResponse.json({error:"Konten tidak memenuhi syarat mirroring."},{status:409});
 const {data,error}=await db.from("stadione_social_mirrors").update({state:"CREATED",child_ids:[],creation_id:null,external_id:null,error_message:null,lease_token:null,leased_until:null,updated_at:new Date().toISOString()}).eq("content_id",input.id).eq("platform","FACEBOOK").eq("state","FAILED").select("content_id").maybeSingle();
 if(error||!data)return NextResponse.json({error:"Hanya kegagalan yang pasti belum terbit dapat dicoba lagi. Hasil belum pasti harus diperiksa terlebih dahulu."},{status:409});
 return NextResponse.json({queued:true,message:"Facebook masuk antrean lagi. Instagram tetap utuh."});
}
