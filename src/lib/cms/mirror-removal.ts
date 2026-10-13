import "server-only";
import {createAdminClient} from "@/lib/supabase/admin";
import {facebookClient,FacebookRequestError} from "./facebook";
export async function removeFacebookMirror(contentId:string){
 const db=createAdminClient(),{data:mirror,error}=await db.from("stadione_social_mirrors").select("*").eq("content_id",contentId).eq("platform","FACEBOOK").maybeSingle();
 if(error)throw Error("Riwayat Facebook belum dapat diperiksa; penghapusan ditahan.");
 if(!mirror||!mirror.external_id||mirror.state==="DELETED")return;
 if(["DELETING","REMOVAL_UNCERTAIN"].includes(mirror.state))throw Error("Hasil penghapusan Facebook belum pasti. Periksa posting Facebook sebelum rekonsiliasi; sistem tidak mengirim hapus ulang.");
 const client=await facebookClient();if(mirror.page_id!==client.pageId)throw Error("Halaman Facebook berbeda dari pemilik salinan ini; penghapusan ditahan.");
 const {error:markError}=await db.from("stadione_social_mirrors").update({state:"DELETING",error_message:null,updated_at:new Date().toISOString()}).eq("content_id",contentId).eq("platform","FACEBOOK");
 if(markError)throw Error("Status penghapusan Facebook gagal disimpan.");
 try{await client.remove(mirror.external_id);const {error:finishError}=await db.from("stadione_social_mirrors").update({state:"DELETED",error_message:null,updated_at:new Date().toISOString()}).eq("content_id",contentId).eq("platform","FACEBOOK");if(finishError)throw Error("Facebook telah menerima penghapusan tetapi status CMS belum tersimpan.");}
 catch(e){const definite=e instanceof FacebookRequestError&&e.definitive;await db.from("stadione_social_mirrors").update({state:definite?"REMOVAL_FAILED":"REMOVAL_UNCERTAIN",error_message:e instanceof Error?e.message:"Facebook gagal.",updated_at:new Date().toISOString()}).eq("content_id",contentId).eq("platform","FACEBOOK");throw Error("Penghapusan Facebook belum selesai. Instagram dan data CMS dipertahankan. "+(e instanceof Error?e.message:""));}
}
