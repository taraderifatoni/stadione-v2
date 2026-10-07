#!/usr/bin/env node
// Agent writes/reviews the article; this adapter uses the deployed shared gates.
// preview -> inspect JPEGs -> schedule; no direct Meta publishing or historical drivers.
const fs = require('node:fs'), path = require('node:path'), {createHash}=require('node:crypto');
const activeLoader='/opt/stadione-current/scripts/cms-load.cjs';
const load = require(fs.existsSync(activeLoader)?activeLoader:'./cms-load.cjs');
const core=load('src/lib/cms/engine.ts'), writing=load('src/lib/cms/news-writing.ts');
const media=load('src/lib/cms/engine-media.ts'), refs=load('src/lib/cms/writing-references.ts');
const db=load('src/lib/supabase/admin.ts').createAdminClient();
const sha=b=>createHash('sha256').update(b).digest('hex');
async function main(){
 const [mode,inputFile,coverFile]=process.argv.slice(2);
 if(!['preview','schedule'].includes(mode)||!inputFile)throw Error('Use preview input.json cover.png, inspect JPEGs, then schedule input.json');
 const input=JSON.parse(fs.readFileSync(inputFile));
 if(!input.plan_key||!input.event_key||!['CAROUSEL','REEL'].includes(input.format))throw Error('Require normal plan_key, event_key and format');
 const {data:rows,error}=await db.from('stadione_content_items').select('*').eq('kind','SOCIAL');if(error)throw error;
 const item=rows.find(x=>x.editorial_meta?.plan_key===input.plan_key);
 if(!item)throw Error('Slot missing: run current committed calendar seeder first');
 const {data:attempts,error:ae}=await db.from('stadione_ig_publish_attempts').select('*').eq('content_id',item.id);if(ae)throw ae;
 if(!['DRAFT','PENDING_REVIEW'].includes(item.status)||item.editorial_meta?.cms_deleted_at||attempts?.some(x=>!['FAILED'].includes(x.state))){console.log(JSON.stringify({skipped:true,id:item.id,status:item.status,reason:'existing_scheduled_published_archived_or_attempt'}));return;}
 const duplicate=rows.find(x=>x.id!==item.id&&x.editorial_meta?.event_key===input.event_key);
 if(duplicate){console.log(JSON.stringify({skipped:true,id:duplicate.id,status:duplicate.status,reason:'existing_event_identity'}));return;}
 if(!Array.isArray(input.dedupe_terms)||input.dedupe_terms.length<2)throw Error('Require at least two event-specific Instagram duplicate terms');
 const connection=await load('src/lib/cms/meta.ts').metaConnectionStatus();
 if(!connection.connected||connection.account!=='stadione.id')throw Error('Instagram Stadione connection not verified');
 const url=new URL('https://graph.facebook.com/v25.0/'+process.env.INSTAGRAM_USER_ID+'/media');url.searchParams.set('fields','id,caption,timestamp');url.searchParams.set('limit','100');
 const response=await fetch(url,{headers:{Authorization:'Bearer '+process.env.META_ACCESS_TOKEN},signal:AbortSignal.timeout(20000)}),live=await response.json();
 if(!response.ok||live.error||!Array.isArray(live.data))throw Error('Cannot verify live Instagram duplicates');
 const already=live.data.find(x=>Date.parse(x.timestamp)>Date.now()-48*3600000&&input.dedupe_terms.every(t=>(x.caption||'').toLocaleLowerCase('id-ID').includes(String(t).toLocaleLowerCase('id-ID'))));
 if(already){console.log(JSON.stringify({skipped:true,media_id:already.id,reason:'event_already_on_instagram'}));return;}
 const dir=path.resolve(path.dirname(inputFile),'preview-'+item.id),file=path.join(dir,'prepared.json');fs.mkdirSync(dir,{recursive:true});
 let packet=input.packet;
 if(mode==='preview'){
  if(input.format==='CAROUSEL'){
   if(!coverFile)throw Error('Prepared, visually reviewed AI editorial cover required');
   const bytes=fs.readFileSync(coverFile),digest=sha(bytes),key='editorial/production/'+input.event_key+'/'+digest+'.png';
   const {error:ue}=await db.storage.from('stadione-cms').upload(key,bytes,{contentType:'image/png',upsert:false});if(ue&&!/already exists|duplicate/i.test(ue.message))throw ue;
   packet.slides=writing.articleSlides(packet.article);
   packet.media.editorial_cover={...packet.media.editorial_cover,url:db.storage.from('stadione-cms').getPublicUrl(key).data.publicUrl,sha256:digest,page_count:packet.slides.length};
  }
  const issues=[...core.auditPacket(packet,input.format),...await refs.writingReferenceIssues(packet.article)];if(issues.length)throw Error(issues.join('\n'));
  const rendered=input.format==='REEL'?[await media.renderReel(packet)]:await media.renderCarousel(packet);
  for(let i=0;i<rendered.length;i++)fs.writeFileSync(path.join(dir,(i+1)+(input.format==='REEL'?'.mp4':'.jpg')),rendered[i].bytes);
  fs.writeFileSync(file,JSON.stringify({input_sha256:sha(fs.readFileSync(inputFile)),packet,render_audit:rendered.map(x=>x.audit)},null,2));
  console.log(JSON.stringify({id:item.id,state:'PREVIEW_ONLY',directory:dir,assets:rendered.length,audit:rendered.map(x=>x.audit)}));return;
 }
 const prepared=JSON.parse(fs.readFileSync(file));if(prepared.input_sha256!==sha(fs.readFileSync(inputFile)))throw Error('Input changed since visual preview');
 packet=prepared.packet;
 for(let i=0;i<prepared.render_audit.length;i++)if(sha(fs.readFileSync(path.join(dir,(i+1)+(input.format==='REEL'?'.mp4':'.jpg'))))!==prepared.render_audit[i].output_sha256)throw Error('Preview bytes changed');
 const issues=[...core.auditPacket(packet,input.format),...await refs.writingReferenceIssues(packet.article)];if(issues.length)throw Error(issues.join('\n'));
 const {error:se}=await db.from('stadione_content_items').update({format:input.format,editorial_meta:{...item.editorial_meta,event_key:input.event_key,format_reason:input.format_reason||null,engine_packet:packet,planned_at:item.scheduled_at}}).eq('id',item.id).eq('updated_at',item.updated_at).in('status',['DRAFT','PENDING_REVIEW']).select('id').single();if(se)throw se;
 const result=await load('src/lib/cms/content-engine.ts').generateEnginePreview(item.id);console.log(JSON.stringify(result));
 if(result.state!=='AUTO_SCHEDULED'&&!result.skipped)throw Error('Slot production did not reach AUTO_SCHEDULED');
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
