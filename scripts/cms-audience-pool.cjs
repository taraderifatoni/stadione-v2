#!/usr/bin/env node
// Read the deployed SerpAPI pool, then apply operator audience priorities. Never mutates CMS.
const fs=require('node:fs'),load=require('/opt/stadione-current/scripts/cms-load.cjs'),audience=require('./editorial-audience.cjs');
(async()=>{
 const args=process.argv.slice(2),arg=n=>args[args.indexOf(n)+1];
 if(!args.includes('--output'))throw Error('Use --output /private/new-pool.json [--pillar CMS-pillar]');
 const output=arg('--output');if(fs.existsSync(output))throw Error('Output exists; preserve previous research.');
 const pillar=args.includes('--pillar')?arg('--pillar'):'';
 const pool=await load('src/lib/cms/serpapi.ts').getDailySportsPool(),sources={};
 for(const[k,v]of Object.entries(pool.sources))sources[k]={...v,items:audience.rankCandidates(v.items,pillar),discovered_count:v.items.length};
 const result={...pool,sources,audience_policy_version:audience.policy.version,pillar,notice:'Audience score is editorial priority, not a viral metric, verified facts, footage access or licence.'};
 fs.mkdirSync(require('node:path').dirname(output),{recursive:true,mode:0o700});fs.writeFileSync(output,JSON.stringify(result,null,2),{mode:0o600});
 console.log(JSON.stringify({date:result.date,fetchedAt:result.fetchedAt,pillar,sources:Object.fromEntries(Object.entries(sources).map(([k,v])=>[k,{cached:v.cached,discovered:v.discovered_count,eligible:v.items.length,top:v.items.slice(0,5).map(x=>({title:x.title,audience:x.audience}))}]))}));
})().catch(e=>{console.error(e.message);process.exitCode=1});
