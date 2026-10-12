#!/usr/bin/env node
// Operator research; quota/cache writes only, never CMS/Meta mutations or downloads.
const fs=require('node:fs'),load=require('./cms-load.cjs'),audience=require('./editorial-audience.cjs');
async function main(){
 const args=process.argv.slice(2),arg=n=>args[args.indexOf(n)+1],plan=args.includes('--plan-key')?arg('--plan-key'):null;
 if(!plan||!args.includes('--output'))throw Error('Use --plan-key YYYY-MM-DD:slot --output /private/reel-research.json [--topic specific subject]');
 if(fs.existsSync(arg('--output')))throw Error('Research output exists; use a new file for another query and preserve earlier attempts.');
 const db=load('src/lib/supabase/admin.ts').createAdminClient();const r=await db.from('stadione_content_items').select('*').eq('kind','SOCIAL');if(r.error)throw r.error;
 const item=r.data.find(x=>x.editorial_meta?.plan_key===plan);if(!item)throw Error('CMS slot missing');
 if(!['DRAFT','PENDING_REVIEW'].includes(item.status)||item.editorial_meta?.cms_deleted_at||item.archived_at){console.log(JSON.stringify({skipped:true,id:item.id,status:item.status}));return;}
 const att=await db.from('stadione_ig_publish_attempts').select('state').eq('content_id',item.id);if(att.error)throw att.error;if(att.data.some(x=>x.state!=='FAILED'))throw Error('Durable publication attempt present: do not re-produce');
 const topic=args.includes('--topic')?arg('--topic'):null;
 const pillar=String(item.category||item.editorial_meta?.pillar);
 const pool=process.env.YOUTUBE_API_KEY?await require("./youtube-discovery.cjs").getYoutubeVideoPool(pillar,topic):await load("src/lib/cms/serpapi.ts").getReelVideoPool(pillar,topic||audience.defaultQuery(pillar));
 if(pool.payload){pool.candidates=require("./reel-research-policy.cjs").normalizeVideoResults(pool.payload);delete pool.payload;}
 pool.candidates=audience.rankCandidates(pool.candidates,pillar);
 const out={version:1,plan_key:plan,requested_format:'REEL',scheduled_at:item.scheduled_at,checked_at:new Date().toISOString(),queries:[pool.query],discovery:pool,attempts:[],review:null,note:'Discovery is not verification/download/license. Open actual source pages, verify full reporting and record real footage/audio/timestamps. No fallback authorization from this file alone.'};
 fs.mkdirSync(require('node:path').dirname(arg('--output')),{recursive:true});fs.writeFileSync(arg('--output'),JSON.stringify(out,null,2));
 console.log(JSON.stringify({id:item.id,plan_key:plan,scheduled_at:item.scheduled_at,provider:pool.provider||'SERPAPI_BING',query:pool.query,cached:pool.cached,cache_hours:pool.cache_hours,candidates:pool.candidates}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
