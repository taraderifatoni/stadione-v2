import "server-only"
import {createHash,randomUUID} from "node:crypto";
import {createAdminClient} from "@/lib/supabase/admin";
import {enginePublicationIssues,type Packet} from "./engine";
import {verifyCarouselAssets} from "./engine-media";
import {articleHtml,articleDigest} from "./news-writing";
import {publicMediaUrl} from "./meta";
import {facebookConfigured,facebookClient,FacebookRequestError} from "./facebook";
import {mirrorEligible,mirrorCaption,mirrorTerminalStates,type MirrorItem} from "./mirror-policy";
type Attempt={state:string;child_ids:string[];creation_id?:string|null;external_id?:string|null;error_message?:string|null};
export async function publishFacebookMirror(id:string){
 const db=createAdminClient(),{data:item,error:readError}=await db.from("stadione_content_items").select("*").eq("id",id).maybeSingle();
 if(readError||!item)throw new Error("Konten untuk mirroring tidak ditemukan.");
 const {data:settings,error:settingsError}=await db.from("stadione_social_mirror_settings").select("*").eq("platform","FACEBOOK").maybeSingle();
 if(settingsError)throw new Error("Pengaturan mirroring belum tersedia.");
 if(!settings||!mirrorEligible(item,settings.started_at,settings.enabled))return {id,platform:"FACEBOOK",state:"SKIPPED"};
 const {data:old,error:oldError}=await db.from("stadione_social_mirrors").select("*").eq("content_id",id).eq("platform","FACEBOOK").maybeSingle();
 if(oldError)throw new Error("Riwayat mirroring belum tersedia.");
 if(old&&mirrorTerminalStates.includes(old.state))return {id,platform:"FACEBOOK",state:old.state,external_id:old.external_id,error:old.error_message};
 const payload=JSON.stringify({format:item.format,caption:mirrorCaption(item),assets:item.assets,article:item.editorial_meta?.engine_packet?.article?.review?.article_digest});
 const digest=createHash("sha256").update(payload).digest("hex"),token=randomUUID();
 const {data:claimed,error:claimError}=await db.rpc("claim_stadione_social_mirror",{p_content_id:id,p_platform:"FACEBOOK",p_token:token,p_digest:digest});
 if(claimError)throw new Error("Klaim mirroring gagal: "+claimError.message);
 if(!claimed)return {id,platform:"FACEBOOK",state:"BUSY_OR_BLOCKED"};
 const {data:attempt,error:attemptError}=await db.from("stadione_social_mirrors").select("*").eq("content_id",id).eq("platform","FACEBOOK").single();
 if(attemptError||!attempt)throw new Error("Status mirroring tidak tersedia.");
 const state:Attempt=attempt;
 let sent=false,accepted=Boolean(attempt.external_id);
 async function save(fields:Record<string,unknown>){const {error}=await db.from("stadione_social_mirrors").update({...fields,updated_at:new Date().toISOString()}).eq("content_id",id).eq("platform","FACEBOOK").eq("lease_token",token).select("content_id").single();if(error)throw new Error("Status mirroring gagal disimpan.");Object.assign(state,fields);}
 const heartbeat=()=>save({leased_until:new Date(Date.now()+90000).toISOString()});
 try{
  const client=await facebookClient();await save({page_id:client.pageId});
  if(state.state!=="FINALIZING"){
   if(!["SINGLE_IMAGE","CAROUSEL","REEL"].includes(item.format))throw new Error("Format konten belum mendukung mirroring Facebook.");
   const issues=enginePublicationIssues(item),packet=item.editorial_meta?.engine_packet as Packet|undefined;
   if(issues.length)throw new Error(issues.join(" "));
   if(packet?.article){
    const {data:article,error}=await db.from("stadione_content_items").select("*").eq("id",item.parent_id||"").maybeSingle();
    if(error||!article||article.kind!=="ARTICLE"||article.body!==articleHtml(packet.article)||article.excerpt!==packet.article.dek||articleDigest(article.editorial_meta?.engine_packet?.article)!==articleDigest(packet.article))throw new Error("Artikel pasangan tidak cocok dengan naskah yang diterbitkan.");
   }
   const assets=Array.isArray(item.assets)?item.assets:[];
   const urls=assets.map((a:NonNullable<MirrorItem["assets"]>[number],i:number)=>publicMediaUrl(item.format==="REEL"?a.video_url||a.url:a.url||a.image_url,"Aset "+(i+1)));
   if(!mirrorCaption(item)||!urls.length||(item.format==="CAROUSEL"&&(urls.length<2||urls.length>10))||(item.format!=="CAROUSEL"&&urls.length!==1))throw new Error("Jumlah aset atau caption Facebook tidak valid.");
   if(item.format==="CAROUSEL"){await heartbeat();await verifyCarouselAssets(assets);}
   if(item.format==="REEL"){
    if(!state.creation_id){await heartbeat();const session=await client.reelStart();await save({creation_id:session.id,state:"UPLOADING"});}
    if(state.state!=="READY"){await heartbeat();await client.reelUpload(state.creation_id!,urls[0]);await save({state:"READY"});}
   }else{
    for(let i=state.child_ids.length;i<urls.length;i++){await heartbeat();const child=await client.photo(urls[i]);await save({state:"UPLOADING",child_ids:[...state.child_ids,child]});}
   }
   const {data:marked,error:markError}=await db.rpc("mark_stadione_mirror_publishing",{p_content_id:id,p_platform:"FACEBOOK",p_token:token});
   if(markError||!marked)throw new Error("Konten atau izin mirroring berubah sebelum publikasi; pengiriman ditahan.");
   sent=true;
   const externalId=item.format==="REEL"?await client.reelFinish(state.creation_id!,mirrorCaption(item)):await client.photosPost(state.child_ids,mirrorCaption(item));
   accepted=true;await save({state:"FINALIZING",external_id:externalId,error_message:null});
  }
  await heartbeat();const proof=await client.confirm(state.external_id!,item.format==="REEL");
  if(!proof.published){await save({state:"FINALIZING",lease_token:null,leased_until:null});return {id,platform:"FACEBOOK",state:"FINALIZING"};}
  await save({state:"PUBLISHED",external_url:proof.url,published_at:new Date().toISOString(),lease_token:null,leased_until:null,error_message:null});
  await db.from("stadione_content_activity").insert({content_id:id,action:"publish_facebook_mirror",actor_id:null,from_status:"PUBLISHED",to_status:"PUBLISHED",metadata:{platform:"FACEBOOK",external_id:state.external_id,page_id:client.pageId}});
  return {id,platform:"FACEBOOK",state:"PUBLISHED",external_id:state.external_id,url:proof.url};
 }catch(e){
  const message=e instanceof Error?e.message:"Facebook gagal.",uncertain=accepted||(sent&&!(e instanceof FacebookRequestError&&e.definitive));
  await db.from("stadione_social_mirrors").update({state:uncertain?"UNCERTAIN":"FAILED",error_message:message,lease_token:null,leased_until:null,updated_at:new Date().toISOString()}).eq("content_id",id).eq("platform","FACEBOOK").eq("lease_token",token);
  return {id,platform:"FACEBOOK",state:uncertain?"UNCERTAIN":"FAILED",error:message};
 }
}
export async function publishDueMirrors(){
 if(!facebookConfigured())return {results:[],error:"Facebook belum dikonfigurasi."};
 const db=createAdminClient(),{data,error}=await db.rpc("list_stadione_mirror_due",{p_platform:"FACEBOOK",p_limit:1});
 if(error)return {results:[],error:"Antrean mirroring gagal dibaca: "+error.message};
 const results=[];for(const row of data||[])results.push(await publishFacebookMirror(row.content_id));return {results,error:null};
}
