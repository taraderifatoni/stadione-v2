const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),{select}=require('./cms-cover-brief.cjs'),catalog=require('../editorial/cover-variants.json');
const input=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../assets/editorial/evening-20261011/production.json')));input.scheduled_at='2026-10-11T13:00:00Z';
const base=Array.from({length:6},(_,n)=>({kind:'SOCIAL',status:'PUBLISHED',scheduled_at:new Date(Date.parse('2026-10-11T00:00:00Z')+n*60000).toISOString(),editorial_meta:{plan_key:'legacy-'+n}})),now=new Date().toISOString(),claim=input.packet.claims.find(c=>c.id==='result');
const result={left_label:'Persija',right_label:'PSIM',score:'4–0',claim_id:'result',order_reviewed_by:'QA_FIXTURE_NOT_PRODUCTION',order_reviewed_at:now};
result.order_review_digest=crypto.createHash('sha256').update(JSON.stringify([result.claim_id,result.left_label,result.right_label,result.score,claim.text])).digest('hex');
const snapshot=JSON.stringify({input,base}),legacy=select(input,base,catalog);assert.equal(legacy.variant_id,'KOLOM');assert.equal(legacy.previous_variants[0],'KLASIK');assert.equal(JSON.stringify({input,base}),snapshot);
assert.throws(()=>select(input,base,catalog,'HASIL_LAGA'),/requires verified result/);
assert.throws(()=>select(input,base,catalog,'HASIL_LAGA',{...result,score:'9–0'}),/Scoreboard requires FINAL/);
assert.throws(()=>select(input,base,catalog,'HASIL_LAGA',{...result,left_label:'PSIM',right_label:'Persija'}),/Scoreboard requires FINAL/);
assert.throws(()=>select(input,base,catalog,'HASIL_LAGA',{...result,order_reviewed_by:''}),/Scoreboard requires FINAL/);
const nonfinal=structuredClone(input);nonfinal.packet.event_status='PREVIEW';assert.throws(()=>select(nonfinal,base,catalog,'HASIL_LAGA',result),/Scoreboard requires FINAL/);
assert.equal(select(input,base,catalog,'HASIL_LAGA',result).result_checked,true);
const future=structuredClone(base);future.push({kind:'SOCIAL',status:'SCHEDULED',scheduled_at:'2026-10-12T13:00:00Z',editorial_meta:{plan_key:'future',engine_packet:{media:{editorial_cover:{variant_id:'KOLOM'}}}}});assert.equal(select(input,future,catalog).variant_id,legacy.variant_id);
const tombstone=structuredClone(base);tombstone.push({kind:'SOCIAL',status:'PUBLISHED',scheduled_at:'2026-10-11T12:50:00Z',editorial_meta:{cms_deleted_at:now,engine_packet:{media:{editorial_cover:{variant_id:'KOLOM'}}}}});assert.equal(select(input,tombstone,catalog).variant_id,legacy.variant_id);
let history=[],chosen=[];
for(let n=0;n<18;n++){const v=select(input,history,catalog,undefined,result);assert(!chosen.slice(-2).includes(v.variant_id));chosen.push(v.variant_id);history.push({kind:'SOCIAL',status:'PUBLISHED',scheduled_at:new Date(Date.parse('2026-10-10T00:00:00Z')+n*60000).toISOString(),editorial_meta:{plan_key:'fixture-'+n,engine_packet:{media:{editorial_cover:{variant_id:v.variant_id}}}}});}
assert.equal(new Set(chosen.slice(0,6)).size,6);assert.equal(new Set(chosen.slice(12)).size,6);
console.log(JSON.stringify({ok:true,legacy_handled:true,immutable_inputs:true,score_and_order_digest_guards:true,future_and_tombstone_ignored:true,rotation18:chosen}));
