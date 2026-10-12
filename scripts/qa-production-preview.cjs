const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),crypto=require('node:crypto');
const source=fs.readFileSync(path.join(__dirname,'cms-produce-slot.cjs'),'utf8');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function fixture(format,declared,packet){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'stadione-preview-checksum-'));
 const input=path.join(dir,'input.json'),bytes=Buffer.from('reviewed '+format+' binary'),item={id:'additional',status:'DRAFT',updated_at:'fixture',scheduled_at:new Date().toISOString(),editorial_meta:{plan_key:'qa:additional'}};
 fs.writeFileSync(input,JSON.stringify({plan_key:'qa:additional',event_key:'qa-unique',format,dedupe_terms:['unique','fixture'],packet:packet||{article:{},media:{editorial_cover:{}}}}));
 const cover=path.join(dir,'cover.jpg');fs.writeFileSync(cover,Buffer.from([255,216,255]));
 let schedules=0,updates=0;
 const db={
  from(name){
   const query={select(){return query},eq(){return query},in(){return query},single(){return query},update(){updates++;return query},then(resolve){return Promise.resolve({data:name==='stadione_content_items'?[item]:[],error:null}).then(resolve)}};
   return query;
  },
  storage:{from(){return {upload:async()=>({error:null}),getPublicUrl:()=>({data:{publicUrl:'https://fixture.test/cover'}})};}}
 };
 const load=file=>({
 'src/lib/cms/engine.ts':{auditPacket:()=>[]},
 'src/lib/cms/news-writing.ts':{articleSlides:()=>[]},
 'src/lib/cms/engine-media.ts':{renderReel:async()=>({bytes,audit:{ok:true,...declared}}),renderCarousel:async()=>[{bytes,audit:{ok:true,output_sha256:sha(bytes)}}]},
 'src/lib/cms/writing-references.ts':{writingReferenceIssues:async()=>[]},
 'src/lib/supabase/admin.ts':{createAdminClient:()=>db},
 'src/lib/cms/meta.ts':{metaConnectionStatus:async()=>({connected:true,account:'stadione.id'})},
 'src/lib/cms/content-engine.ts':{generateEnginePreview:async()=>{schedules++;return{state:'AUTO_SCHEDULED'}}}
 }[file]);
 async function run(mode){
  const errors=[],outputs=[],processMock={argv:['node','adapter',mode,input,cover],env:{INSTAGRAM_USER_ID:'fixture',META_ACCESS_TOKEN:'fixture'}};
  const context={require:x=>x.includes('cms-load.cjs')?load:x==='./reel-research-policy.cjs'?{fallbackIssues:()=>[]}:x==='./editorial-audience.cjs'?require(path.join(__dirname,'editorial-audience.cjs')):require(x),process:processMock,console:{log:x=>outputs.push(x),error:x=>errors.push(x)},fetch:async()=>({ok:true,json:async()=>({data:[]})}),URL,AbortSignal,Buffer};
  const script=source.replace(/^#!.*\n/,'').replace('main().catch(e=>','globalThis.finished=main().catch(e=>');
  vm.runInNewContext(script,context,{filename:'cms-produce-slot.cjs'});await context.finished;return{errors,outputs,exitCode:processMock.exitCode};
 }
 return{dir,bytes,input,run,get schedules(){return schedules},get updates(){return updates},file:path.join(dir,'preview-additional','1'+(format==='REEL'?'.mp4':'.jpg')),prepared:path.join(dir,'preview-additional','prepared.json')};
}
(async()=>{
 const cases=[];
 for(const format of ['REEL','CAROUSEL']){
  const f=await fixture(format);
  try{
   assert.deepEqual((await f.run('preview')).errors,[]);
   assert.equal(JSON.parse(fs.readFileSync(f.prepared)).render_audit[0].output_sha256,sha(f.bytes));
   assert.deepEqual((await f.run('schedule')).errors,[]);assert.equal(f.schedules,1);assert.equal(f.updates,1);
   fs.appendFileSync(f.file,'tampered');const bad=await f.run('schedule');assert.match(bad.errors.join(' '),/Preview bytes changed/);assert.equal(f.schedules,1);assert.equal(f.updates,1);
   cases.push(format+'_preview_schedule_and_tamper_block');
  }finally{fs.rmSync(f.dir,{recursive:true,force:true})}
 }
 const f=await fixture('REEL',{output_sha256:'0'.repeat(64)});
 try{assert.match((await f.run('preview')).errors.join(' '),/Renderer checksum does not match/);assert(!fs.existsSync(f.prepared));assert.equal(f.updates,0);cases.push('renderer_mismatch_blocked_before_preparation')}finally{fs.rmSync(f.dir,{recursive:true,force:true})}
 const blocked=await fixture('REEL',{}, {article:{title:'Caldeira Cetak Gol',dek:'Minnesota United vs Houston Dynamo di MLS',paragraphs:[]},assignment:{pillar:'Sepak Bola Dunia'}});
 try{assert.match((await blocked.run('preview')).errors.join(' '),/Audience policy/);assert(!fs.existsSync(blocked.prepared));assert.equal(blocked.updates,0);assert.equal(blocked.schedules,0);cases.push('unrelated_american_league_blocked_before_preview_and_cms_mutation')}finally{fs.rmSync(blocked.dir,{recursive:true,force:true})}
 console.log(JSON.stringify({ok:true,cases}));
})().catch(e=>{console.error(e);process.exitCode=1});
