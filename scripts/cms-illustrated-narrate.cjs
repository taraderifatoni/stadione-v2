#!/usr/bin/env node
// Trusted VPS CLI. Uses the same narration implementation as the authenticated CMS API.
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const load=require('./cms-load.cjs');
const policy=require('./illustrated-slot-policy.cjs');
async function main(){
 const [inputFile,outputFile,voice='coral']=process.argv.slice(2);
 if(!inputFile||!outputFile)throw Error('Usage: cms-illustrated-narrate.cjs input.json narrated.json [voice]');
 if(path.resolve(inputFile)===path.resolve(outputFile))throw Error('Output must differ from the reviewed source input');
 const raw=fs.readFileSync(inputFile),input=JSON.parse(raw);
 if(input.format!=='REEL'||!input.packet?.media?.illustration_reel)throw Error('Require REEL input and illustration_reel scenes');
 const db=load('src/lib/supabase/admin.ts').createAdminClient();
 const {data,error}=await db.from('stadione_content_items').select('id,status,archived_at,editorial_meta').eq('kind','SOCIAL').in('status',['DRAFT','PENDING_REVIEW']);
 if(error)throw error;
 const matches=(data||[]).filter(x=>x.editorial_meta?.plan_key===input.plan_key&&!x.editorial_meta?.cms_deleted_at&&!x.archived_at);
 if(matches.length!==1)throw Error('Require one unmodified draft matching plan_key');
 const item=matches[0];
 const sourceHash=createHash('sha256').update(raw).update(voice).digest('hex');
 if(fs.existsSync(outputFile)){
  const cached=JSON.parse(fs.readFileSync(outputFile));
  if(cached.narration_preparation?.input_sha256===sourceHash&&cached.narration_preparation?.content_id===item.id){
   console.log(JSON.stringify({state:'NARRATION_REUSED',id:item.id,output:path.resolve(outputFile),published:false}));return;
  }
  throw Error('Output exists for different input; choose a new output filename');
 }
 const issues=policy.illustrationIssues(input,item);if(issues.length)throw Error(issues.join('\n'));
 const {generateIllustratedNarration}=load('src/lib/cms/illustrated-narration.ts');
 const result=await generateIllustratedNarration(db,item.id,input.packet.media.illustration_reel,voice);
 const out={...input,packet:{...input.packet,media:{...input.packet.media,...result}},narration_preparation:{content_id:item.id,input_sha256:sourceHash,created_at:new Date().toISOString(),voice}};
 fs.writeFileSync(outputFile,JSON.stringify(out,null,2),{flag:'wx',mode:0o600});
 console.log(JSON.stringify({state:'NARRATION_PREPARED',id:item.id,output:path.resolve(outputFile),next:'Listen, review timing, then cms-produce-slot.cjs preview. Nothing scheduled or published.',published:false}));
}
main().catch(e=>{console.error(JSON.stringify({state:'BLOCKED',stage:'NARRATION',message:e.message}));process.exitCode=1});
