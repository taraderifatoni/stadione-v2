/* eslint-disable @typescript-eslint/no-require-imports */
// One-time owner-directed publishing for the exact reviewed draft; never falsify rights status.
// If Meta publish has been requested but its response is unclear, leave UNCERTAIN and never retry.
const {randomUUID,createHash}=require('node:crypto'),{createClient}=require('@supabase/supabase-js'),load=require('./cms-load.cjs');
const meta=load('src/lib/cms/meta.ts'),id='3a97aee0-061d-43c8-9744-6cb5dbefcf62',event='harry-kane-ballon-dor-2026-illustrated',videoHash='9b4be2eae327c977bfdc9bf042d3b86ff49f00b9bb093faa28253d07a5c7869c',coverHash='43fe53a754f5daca3576e4ea1c92ef4d6d5d3a33ceacee12503d2eb0dad3d827';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function digest(url){const res=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!res.ok)throw Error(`Media HTTP ${res.status}`);return createHash('sha256').update(Buffer.from(await res.arrayBuffer())).digest('hex')}
async function main(){const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});const {data:item,error}=await db.from('stadione_content_items').select('*').eq('id',id).single();if(error)throw error;
 if(item.status==='PUBLISHED'){console.log(JSON.stringify({state:'PUBLISHED',media_id:item.external_post_id,already:true}));return}
 const m=item.editorial_meta||{}, asset=item.assets?.[0];if(item.status!=='DRAFT'||item.format!=='REEL'||m.event_key!==event||m.fact_check_status!=='VERIFIED'||m.rights_status!=='PENDING'||item.assets?.length!==1||m.cover_sha256!==coverHash||asset?.render_audit?.sha256!==videoHash)throw Error('Draft berbeda dari versi yang pemilik minta. Berhenti.');
 const video=meta.publicMediaUrl(asset.video_url,'Video'),cover=meta.publicMediaUrl(m.cover_url,'Cover');if(await digest(video)!==videoHash||await digest(cover)!==coverHash)throw Error('Checksum media tidak cocok.');
 if(!meta.metaConfigured())throw Error('Meta belum tersambung');
 if(process.argv.includes('--check')){console.log(JSON.stringify({ready:true,cover_checksum:true,video_checksum:true,audio_rights:'UNVERIFIED',dry_run:true}));return}
 const lease=randomUUID(),claim=await db.rpc('claim_stadione_ig_publish',{p_content_id:id,p_token:lease});if(claim.error)throw claim.error;if(!claim.data)throw Error('Publikasi sedang berjalan atau tidak pasti; jangan kirim ulang.');
 const attemptResult=await db.from('stadione_ig_publish_attempts').select('*').eq('content_id',id).single();if(attemptResult.error)throw attemptResult.error;let a=attemptResult.data,publishSent=false;
 const save=async fields=>{const q=await db.from('stadione_ig_publish_attempts').update({...fields,updated_at:new Date().toISOString()}).eq('content_id',id).eq('lease_token',lease).select('content_id').single();if(q.error)throw q.error};
 try{
  const updated=await db.from('stadione_content_items').update({editorial_meta:{...m,owner_requested_publication_after_audio_rights_notice:true,owner_requested_at:new Date().toISOString()}}).eq('id',id).eq('status','DRAFT').eq('updated_at',item.updated_at).select('id').single();if(updated.error)throw Error('Draft berubah sebelum proses publikasi.');
  if(!a.creation_id){const caption=item.caption.trim()+'\n\n'+(item.hashtags||[]).map(t=>'#'+t.replace(/^#/,'')).join(' ');const container=await meta.createReel(video,caption,undefined,cover);await save({creation_id:container,state:'PROCESSING',error_message:null});a.creation_id=container}
  let status='IN_PROGRESS';for(let i=0;i<12;i++){await save({leased_until:new Date(Date.now()+90000).toISOString()});status=await meta.containerStatus(a.creation_id);if(status==='FINISHED')break;if(status==='ERROR'||status==='EXPIRED')throw Error('Meta container status '+status);await pause(2500)}
  if(status!=='FINISHED'){await save({state:'PROCESSING',lease_token:null,leased_until:null});console.log(JSON.stringify({state:'PROCESSING',creation_id:a.creation_id}));return}
  await save({state:'PUBLISHING',lease_token:null,leased_until:null});publishSent=true;
  const mediaId=await meta.publishContainer(a.creation_id);const att=await db.from('stadione_ig_publish_attempts').update({state:'PUBLISHED',media_id:mediaId,updated_at:new Date().toISOString()}).eq('content_id',id).eq('state','PUBLISHING');if(att.error)throw att.error;
  const finish=await db.from('stadione_content_items').update({status:'PUBLISHED',external_post_id:mediaId,published_at:new Date().toISOString(),scheduled_at:null,publish_error:null}).eq('id',id);if(finish.error)throw finish.error;
  await db.from('stadione_content_activity').insert({content_id:id,action:'publish_instagram',from_status:'DRAFT',to_status:'PUBLISHED',metadata:{media_id:mediaId,creation_id:a.creation_id,owner_directed:true,audio_rights:'UNVERIFIED'}});
  let permalink=null;try{const detail=await meta.publishedMediaDetails(mediaId);permalink=detail.permalink||null}catch{}console.log(JSON.stringify({state:'PUBLISHED',media_id:mediaId,permalink,creation_id:a.creation_id,audio_rights:'UNVERIFIED'}));
 }catch(e){const message=e instanceof Error?e.message:'Publication error';if(publishSent){await db.from('stadione_ig_publish_attempts').update({state:'UNCERTAIN',error_message:message,leased_until:null,lease_token:null}).eq('content_id',id).eq('state','PUBLISHING')}else await save({state:'FAILED',error_message:message,leased_until:null,lease_token:null});throw e}
}
main().catch(e=>{console.error(e.message);process.exit(1)})
