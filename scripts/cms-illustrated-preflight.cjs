#!/usr/bin/env node
// Read-only check. Never creates assets, charges TTS, or changes a slot.
const fs=require('node:fs');
const load=require(fs.existsSync('/opt/stadione-current/scripts/cms-load.cjs')?'/opt/stadione-current/scripts/cms-load.cjs':'./cms-load.cjs');
const {requiresIllustration}=require('./illustrated-slot-policy.cjs');
(async()=>{
 const db=load('src/lib/supabase/admin.ts').createAdminClient();
 const {data,error}=await db.from('stadione_content_items').select('id,title,kind,format,status,scheduled_at,archived_at,editorial_meta').eq('kind','SOCIAL').in('status',['DRAFT','PENDING_REVIEW']);
 if(error)throw error;
 const slots=(data||[]).filter(requiresIllustration).sort((a,b)=>String(a.scheduled_at).localeCompare(String(b.scheduled_at)));
 const providerConfigured=Boolean(process.env.OPENAI_API_KEY);
 console.log(JSON.stringify({state:providerConfigured?'PROVIDER_CONFIGURED_NOT_TESTED':'BLOCKED',stage:'NARRATION_PREFLIGHT',provider:'openai',provider_configured:providerConfigured,issues:providerConfigured?[]:['NARRATION_PROVIDER_MISSING: OPENAI_API_KEY belum dikonfigurasi untuk Stadione. Alternatif: rekaman narasi berizin per adegan.'],assignments:slots.map(s=>({id:s.id,title:s.title,status:s.status,current_format:s.format,required_format:'REEL',required_visual_mode:'illustration',plan_key:s.editorial_meta.plan_key,scheduled_at:s.scheduled_at})),mutations:0},null,2));
 if(!providerConfigured)process.exitCode=2;
})().catch(e=>{console.error(JSON.stringify({state:'FAILED',stage:'PREFLIGHT',message:e.message}));process.exitCode=1});
