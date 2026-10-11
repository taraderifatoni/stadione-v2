#!/usr/bin/env node
// Read-only cover planner. Does not generate images or mutate CMS/schedules.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const args=process.argv.slice(2),arg=n=>{const i=args.indexOf(n);return i<0?undefined:args[i+1]};
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const normalize=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
function select(input,history,catalog,preferred,result){
 const p=input.packet||input;
 if(!p.article?.title||!p.article.dek||!p.media?.url||!Array.isArray(p.slides)||p.slides.length<2)throw Error('Require finalized article, source photo and pagination');
 const primary=p.sources?.find(s=>s.primary);
 if(!primary?.url)throw Error('Primary source required');
 let resultReady=false;
 if(result){
  const claim=p.claims?.find(c=>c.id===result.claim_id&&c.verified);
  const score=String(result.score||'').replace(/\s+/g,'');
  const match=score.match(/^(\d{1,2})[-–:](\d{1,2})$/);
  const text=normalize(claim?.text).replace(/[–:]/g,'-');
  const reviewed=Date.parse(result.order_reviewed_at||'');
  const reviewDigest=crypto.createHash('sha256').update(JSON.stringify([result.claim_id,result.left_label,result.right_label,score,claim?.text])).digest('hex');
  resultReady=p.event_status==='FINAL'&&!!claim&&!!match&&!!result.order_reviewed_by?.trim()&&Number.isFinite(reviewed)&&reviewed<=Date.now()+300000&&result.order_review_digest===reviewDigest&&
   !!result.left_label?.trim()&&!!result.right_label?.trim()&&
   text.includes(normalize(result.left_label))&&text.includes(normalize(result.right_label))&&
   new RegExp('(^|[^0-9])'+match[1]+'\\s*-\\s*'+match[2]+'([^0-9]|$)').test(text)&&
   new Set((claim.evidence||[]).map(e=>e.source_id)).size>=2;
  if(!resultReady)throw Error('Scoreboard requires FINAL plus verified claim matching score and both ordered team labels; editor must review team order against source');
 }
 const allRows=Array.isArray(history)?history:history.items||[];
 const target=allRows.find(r=>r.editorial_meta?.plan_key===input.plan_key);
 const at=Date.parse(input.scheduled_at||target?.scheduled_at||p.context?.scheduled_at||'');
 const rows=allRows.filter(r=>
  r.kind==='SOCIAL'&&['PUBLISHED','SCHEDULED'].includes(r.status)&&!r.editorial_meta?.cms_deleted_at&&!r.archived_at&&
  r.editorial_meta?.plan_key!==input.plan_key&&
  (!Number.isFinite(at)||Date.parse(r.scheduled_at||r.published_at||'')<at)
 ).sort((a,b)=>Date.parse(b.scheduled_at||b.published_at||0)-Date.parse(a.scheduled_at||a.published_at||0)).slice(0,catalog.rotation.balance_window);
 const getVariant=r=>r.editorial_meta?.engine_packet?.media?.editorial_cover?.variant_id||catalog.rotation.legacy_variant;
 const recent=rows.map(getVariant),avoid=new Set(recent.slice(0,catalog.rotation.avoid_last_posts));
 const eligible=catalog.variants.filter(v=>!v.requires_verified_result||resultReady);
 let selected;
 if(preferred){
  selected=eligible.find(v=>v.id===preferred);
  if(!selected)throw Error('Requested variant unknown or requires verified result');
 }else{
  const options=eligible.filter(v=>!avoid.has(v.id));
  const candidates=options.length?options:eligible;
  selected=candidates.slice().sort((a,b)=>recent.filter(id=>id===a.id).length-recent.filter(id=>id===b.id).length||recent.indexOf(b.id)-recent.indexOf(a.id)||catalog.variants.indexOf(a)-catalog.variants.indexOf(b))[0];
 }
 const sourceLabel=new URL(primary.url).hostname.replace(/^www\./,'').toUpperCase();
 const prompt=[
  'Create ONE finished Stadione1080x1350 editorial cover from the authentic original athlete photograph and selected variant reference.',
  'Use the same approved font character and cream/charcoal/#84102d palette; composition must follow '+selected.id+'.',
  selected.layout,
  'Preserve photographed face, hair, body, jersey, pose and identity; transform editorial background only. No invented athlete/action.',
  'Exact headline: '+p.article.title,
  'Exact deck: '+p.article.dek,
  'Source label only: SUMBER: '+sourceLabel,
  'Page count: 1/'+p.slides.length+' exactly; review visible count after final pagination.',
  'Internal horizontal margins72px, normal tight line spacing, deck32px minimum, source24px minimum; measure wrapping and inspect final pixels.',
  'No EDISI DIGITAL, no save/shareCTA, no promotional footer. Website uses clean original photograph; article pages remain cream text-only.',
  ...(selected.requires_verified_result?['Verified ordered result supplied by editor: '+result.left_label+' '+result.score+' '+result.right_label+'; preserve exactly, never infer team order.']:[])
 ].join('\n');
 return {standard:catalog.standard,variant_id:selected.id,variant_name:selected.name,tone:selected.tone,previous_variants:recent,selection_reason:preferred?'explicit_editor_override':'least_used_eligible_excluding_recent',result_checked:resultReady,style_version:catalog.style_version,reference:'assets/editorial/cover-variants-20261012/'+selected.id.toLowerCase()+'.jpg',prompt,metadata_to_add:{variant_id:selected.id,variant_standard:catalog.standard},note:'Suggestion only. Generate artwork from authentic photo, inspect full-resolution cover, record review/hash and use normal shared preview/audit/publisher. Never mutate existing scheduled or published packets.'};
}
module.exports={select};
if(require.main===module){try{
 if(!arg('--input'))throw Error('Usage: node scripts/cms-cover-brief.cjs --input input.json --history cms-before.json [--variant ID] [--result verified-result.json]');
 if(!arg('--history'))throw Error('Recent CMS history required; do not rotate blindly');
 const catalog=read(path.join(__dirname,'..','editorial','cover-variants.json'));
 const input=read(arg('--input')),history=read(arg('--history')),result=arg('--result')?read(arg('--result')):undefined;
 console.log(JSON.stringify(select(input,history,catalog,arg('--variant'),result),null,2));
}catch(e){console.error(e.message);process.exitCode=1}}
