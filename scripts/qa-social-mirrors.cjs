#!/usr/bin/env node
const assert=require('node:assert/strict'),load=require('./cms-load.cjs');
const admin=load('src/lib/supabase/admin.ts'),fb=load('src/lib/cms/facebook.ts'),core=load('src/lib/cms/engine.ts'),media=load('src/lib/cms/engine-media.ts'),auth=load('src/lib/cms/auth.ts'),meta=load('src/lib/cms/meta.ts');
const policy=load('src/lib/cms/mirror-policy.ts'),pub=load('src/lib/cms/publish-social-mirrors.ts'),route=load('src/app/api/admin/cms/mirrors/route.ts');
const id='00000000-0000-4000-a000-000000000001',copy=x=>structuredClone(x),start=new Date(Date.now()-3600000).toISOString();
const base={id,kind:'SOCIAL',status:'PUBLISHED',format:'CAROUSEL',published_at:new Date().toISOString(),external_post_id:'ig-original',updated_at:new Date().toISOString(),platforms:['INSTAGRAM'],caption:'Caption asli\n\nBerita terverifikasi.',hashtags:['Stadione'],assets:[{url:'https://media.example.com/1.jpg'},{url:'https://media.example.com/2.jpg'}],editorial_meta:{}};
function memory(item=base){
 const tables={stadione_content_items:[copy(item)],stadione_social_mirror_settings:[{platform:'FACEBOOK',enabled:true,started_at:start}],stadione_social_mirrors:[],stadione_content_activity:[]};
 return {tables,async rpc(name,a){
  const row=tables.stadione_content_items.find(x=>x.id===a.p_content_id),setting=tables.stadione_social_mirror_settings[0];
  if(name==='list_stadione_mirror_due')return {data:tables.stadione_content_items.filter(x=>policy.mirrorEligible(x,setting.started_at,setting.enabled)).filter(x=>!tables.stadione_social_mirrors.some(m=>m.content_id===x.id&&policy.mirrorTerminalStates.includes(m.state))).map(x=>({content_id:x.id})),error:null};
  if(!row||!policy.mirrorEligible(row,setting.started_at,setting.enabled))return {data:false,error:null};
  let m=tables.stadione_social_mirrors.find(x=>x.content_id===row.id);
  if(name==='claim_stadione_social_mirror'){
   if(m&&(policy.mirrorTerminalStates.includes(m.state)||m.leased_until&&Date.parse(m.leased_until)>Date.now()||m.payload_digest!==a.p_digest))return {data:false,error:null};
   if(!m){m={content_id:row.id,platform:'FACEBOOK',state:'CREATED',payload_digest:a.p_digest,content_updated_at:row.updated_at,child_ids:[]};tables.stadione_social_mirrors.push(m);}
   m.lease_token=a.p_token;m.leased_until=new Date(Date.now()+90000).toISOString();return {data:true,error:null};
  }
  if(name==='mark_stadione_mirror_publishing'){
   if(!m||m.lease_token!==a.p_token||m.content_updated_at!==row.updated_at)return {data:false,error:null};m.state='PUBLISHING';return {data:true,error:null};
  }
  throw Error(name);
 },from(table){let op='select',fields,filters=[];const q={select(){return q},eq(k,v){filters.push(x=>x[k]===v);return q},limit(){return q},order(){return q},update(x){op='update';fields=x;return q},insert(x){op='insert';fields=x;return q},single(){return q.run(true)},maybeSingle(){return q.run(true)},then(a,b){return q.run().then(a,b)},async run(single=false){let rows=tables[table].filter(x=>filters.every(f=>f(x)));if(op==='update')rows.forEach(x=>Object.assign(x,copy(fields)));if(op==='insert'){tables[table].push(copy(fields));rows=[fields]}return {data:copy(single?rows[0]||null:rows),error:null}}};return q;}};
}
let db,calls,photo=0,confirm=true,fail=null,race=false;
admin.createAdminClient=()=>db;core.enginePublicationIssues=()=>[];media.verifyCarouselAssets=async()=>{};
fb.facebookClient=async()=>({pageId:'789',name:'Stadione',photo:async()=>{calls.photo++;return String(++photo)},photosPost:async(ids,caption)=>{calls.publish++;assert.equal(ids.length,2);assert.equal(caption,policy.mirrorCaption(base));if(fail instanceof Error)throw fail;return '789_456'},confirm:async()=>{calls.confirm++;if(fail?.confirm)throw Error('Confirmation unavailable');return {published:confirm,url:'https://www.facebook.com/456'}},reelStart:async()=>{calls.start++;return {id:'999',uploadUrl:'https://rupload.facebook.com/video-upload/v25.0/999'}},reelUpload:async()=>{calls.upload++},reelFinish:async()=>{calls.finish++;return '999'}});
function reset(item=base){db=memory(item);calls={photo:0,publish:0,confirm:0,start:0,upload:0,finish:0};photo=0;confirm=true;fail=null;race=false;}
(async()=>{
 assert(policy.mirrorEligible(base,start));for(const change of [{status:'ARCHIVED'},{archived_at:new Date().toISOString()},{editorial_meta:{cms_deleted_at:'yes'}},{external_post_id:null},{status:'SCHEDULED'},{platforms:['FACEBOOK']},{editorial_meta:{mirror_disabled:true}},{published_at:new Date(Date.now()-7200000).toISOString()}])assert(!policy.mirrorEligible({...base,...change},start));assert(!policy.mirrorEligible(base,start,false));
 reset();const original=copy(db.tables.stadione_content_items);assert.equal((await pub.publishFacebookMirror(id)).state,'PUBLISHED');assert.equal(calls.publish,1);assert.deepEqual(db.tables.stadione_content_items,original);assert.equal((await pub.publishFacebookMirror(id)).state,'PUBLISHED');assert.equal(calls.publish,1);
 reset();confirm=false;assert.equal((await pub.publishFacebookMirror(id)).state,'FINALIZING');confirm=true;assert.equal((await pub.publishFacebookMirror(id)).state,'PUBLISHED');assert.equal(calls.publish,1);assert.equal(calls.photo,2);
 reset();fail=new fb.FacebookRequestError('Network timeout',false);assert.equal((await pub.publishFacebookMirror(id)).state,'UNCERTAIN');assert.equal((await pub.publishFacebookMirror(id)).state,'UNCERTAIN');assert.equal(calls.publish,1);
 reset();fail=new fb.FacebookRequestError('Missing permission',true);assert.equal((await pub.publishFacebookMirror(id)).state,'FAILED');await pub.publishFacebookMirror(id);assert.equal(calls.publish,1);
 reset();fail={confirm:true};assert.equal((await pub.publishFacebookMirror(id)).state,'UNCERTAIN');assert.equal(db.tables.stadione_social_mirrors[0].external_id,'789_456');
 reset({...base,status:'ARCHIVED'});assert.equal((await pub.publishFacebookMirror(id)).state,'SKIPPED');assert.equal(calls.photo,0);
 reset();media.verifyCarouselAssets=async()=>{throw Error('Tampered bytes')};assert.equal((await pub.publishFacebookMirror(id)).state,'FAILED');assert.equal(calls.photo,0);media.verifyCarouselAssets=async()=>{};
 reset();const oldPhoto=fb.facebookClient;fb.facebookClient=async()=>({...await oldPhoto(),photo:async()=>{db.tables.stadione_content_items[0].status='ARCHIVED';calls.photo++;return '1'}});assert.equal((await pub.publishFacebookMirror(id)).state,'FAILED');assert.equal(calls.publish,0);fb.facebookClient=oldPhoto;
 reset({...base,format:'REEL',assets:[{video_url:'https://media.example.com/reel.mp4'}]});confirm=false;assert.equal((await pub.publishFacebookMirror(id)).state,'FINALIZING');confirm=true;assert.equal((await pub.publishFacebookMirror(id)).state,'PUBLISHED');assert.equal(calls.start,1);assert.equal(calls.upload,1);assert.equal(calls.finish,1);assert.equal(calls.photo,0);
 reset();auth.requirePlatformAdmin=async()=>({ok:false,error:'Unauthorized',status:401});assert.equal((await route.GET()).status,401);assert.equal((await route.POST(new Request('https://cms.test',{method:'POST'}))).status,401);
 reset();fail=new fb.FacebookRequestError('Timeout',false);await pub.publishFacebookMirror(id);auth.requirePlatformAdmin=async()=>({ok:true,actor:{id:'admin'}});let response=await route.POST(new Request('https://cms.test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'retry',id})}));assert.equal(response.status,409);assert.equal(db.tables.stadione_social_mirrors[0].state,'UNCERTAIN');
 reset();fail=new fb.FacebookRequestError('Rejected',true);await pub.publishFacebookMirror(id);response=await route.POST(new Request('https://cms.test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'retry',id})}));assert.equal(response.status,200);assert.equal(db.tables.stadione_social_mirrors[0].state,'CREATED');
 // Facebook removal retains a durable tombstone and never repeats an uncertain DELETE.
 const removal=load('src/lib/cms/mirror-removal.ts'), savedClient=fb.facebookClient;
 let deletes=0,deleteFailure=null;
 fb.facebookClient=async()=>({pageId:'789',remove:async()=>{deletes++;if(deleteFailure)throw deleteFailure;}});
 function mirrored(){reset();deletes=0;deleteFailure=null;db.tables.stadione_social_mirrors.push({content_id:id,platform:'FACEBOOK',page_id:'789',external_id:'789_456',state:'PUBLISHED'});}
 mirrored();await removal.removeFacebookMirror(id);assert.equal(db.tables.stadione_social_mirrors[0].state,'DELETED');await removal.removeFacebookMirror(id);assert.equal(deletes,1);
 mirrored();deleteFailure=new fb.FacebookRequestError('Delete timeout',false);await assert.rejects(()=>removal.removeFacebookMirror(id),/Instagram dan data CMS dipertahankan/);assert.equal(db.tables.stadione_social_mirrors[0].state,'REMOVAL_UNCERTAIN');await assert.rejects(()=>removal.removeFacebookMirror(id),/belum pasti/);assert.equal(deletes,1);
 mirrored();deleteFailure=new fb.FacebookRequestError('Delete rejected',true);await assert.rejects(()=>removal.removeFacebookMirror(id));assert.equal(db.tables.stadione_social_mirrors[0].state,'REMOVAL_FAILED');
 mirrored();db.tables.stadione_social_mirrors[0].page_id='other';await assert.rejects(()=>removal.removeFacebookMirror(id),/berbeda/);assert.equal(deletes,0);
 fb.facebookClient=savedClient;
 // Transport integration: correct ownership, unpublished uploads, ordered attachments, Reels phases and token-safe errors.
 const originalFetch=global.fetch;process.env.FACEBOOK_PAGE_ID='789';process.env.META_ACCESS_TOKEN='qa-only-token';
 const network=[];global.fetch=async(url,options)=>{const u=new URL(url),params=options.body?Object.fromEntries(options.body):{};network.push({url:u.toString(),params,headers:options.headers});if(u.pathname.endsWith('/me')||u.searchParams.get('fields')==='id,name,can_post')return Response.json({id:'789',name:'Stadione',can_post:true});if(u.pathname.endsWith('/photos'))return Response.json({id:'photo-'+network.length});if(u.pathname.endsWith('/feed'))return Response.json({id:'789_456'});if(u.pathname.endsWith('/video_reels'))return Response.json(params.upload_phase==='start'?{video_id:'999',upload_url:'https://rupload.facebook.com/video-upload/v25.0/999'}:{success:true});if(u.hostname==='rupload.facebook.com')return Response.json({success:true});return Response.json({id:u.pathname.split('/').at(-1),is_published:true,status:{publishing_phase:{status:'complete'}}});};
 const originalClient=require('./cms-load.cjs')('src/lib/cms/facebook.ts');
 // Load a fresh transpiled module to avoid the test-only facebookClient stub.
 delete require.cache[require.resolve('../src/lib/cms/facebook.ts')];const real=load('src/lib/cms/facebook.ts'),client=await real.facebookClient();
 await client.photo('https://media.example.com/1.jpg');await client.photosPost(['one','two'],'Caption');
 const upload=network.find(x=>x.url.endsWith('/photos'));assert.equal(upload.params.published,'false');const feed=network.find(x=>x.url.endsWith('/feed'));assert.deepEqual(JSON.parse(feed.params['attached_media[0]']),{media_fbid:'one'});assert.deepEqual(JSON.parse(feed.params['attached_media[1]']),{media_fbid:'two'});
 const s=await client.reelStart();await client.reelUpload(s.id,'https://media.example.com/reel.mp4');await client.reelFinish(s.id,'Caption');assert((await client.confirm('999',true)).published);assert(network.some(x=>x.headers.file_url==='https://media.example.com/reel.mp4'));
 let derivedHeader=false;
 global.fetch=async(url,options)=>{const u=new URL(url);if(u.pathname.endsWith('/me'))return Response.json({id:'user',name:'Owner'});if(u.searchParams.get('fields')==='id,access_token')return Response.json({id:'789',access_token:'qa-derived-page'});if(u.pathname.endsWith('/photos')){derivedHeader=options.headers.Authorization==='Bearer qa-derived-page';return Response.json({id:'photo'});}return Response.json({id:'789',name:'Stadione',can_post:true});};
 const derived=await real.facebookClient();await derived.photo('https://media.example.com/photo.jpg');assert(derivedHeader);
 global.fetch=async()=>Response.json({id:'789',name:'Other',can_post:false});await assert.rejects(()=>real.facebookClient(),/tidak mengizinkan/);
 global.fetch=async()=>Response.json({error:{message:'qa-only-token invalid',code:190}},{status:400});await assert.rejects(()=>real.facebookClient(),e=>!e.message.includes('qa-only-token'));
 global.fetch=originalFetch;
 console.log(JSON.stringify({ok:true,groups:['eligible_new_published_only','historical_archive_tombstone_cutoff','no_ig_or_cms_mutation','one_feed_ordered_unpublished_photos','replay_no_duplicate','confirm_read_only_resume','uncertain_no_retry','definitive_failure_retry_only','tampered_assets_block_before_meta','archive_during_upload_blocks_publish','real_reels_three_phases_no_repeat_finish','admin_auth','page_ownership_permission','token_safe_errors','delete_mirror_then_tombstone','delete_uncertain_no_repeat','delete_ownership_and_permission']}));
})().catch(e=>{console.error(e);process.exitCode=1});
