// Source discovery and fallback review for NEW operator-produced slots only.
const crypto=require('node:crypto');
function sourcePage(value){
 try{const u=new URL(value);if(u.protocol!=='https:')return null;
 const host=u.hostname.toLowerCase().replace(/^www\./,'');
 if(host==='youtube.com'||host==='m.youtube.com'){const id=u.pathname==='/watch'?u.searchParams.get('v'):u.pathname.match(/^\/shorts\/([^/]+)/)?.[1];return id?'https://www.youtube.com/watch?v='+encodeURIComponent(id):null;}
 if(host==='youtu.be')return u.pathname.length>1?'https://www.youtube.com/watch?v='+encodeURIComponent(u.pathname.split('/')[1]):null;
 if(host==='tiktok.com'||host==='m.tiktok.com')return /\/video\/\d+/.test(u.pathname)?'https://www.tiktok.com'+u.pathname.replace(/\/$/,''):null;
 if(['x.com','twitter.com','mobile.twitter.com'].includes(host))return /\/status\/\d+/.test(u.pathname)?'https://x.com'+u.pathname.replace(/\/$/,''):null;
 if(host==='instagram.com')return /^\/(reel|p)\/[^/]+/.test(u.pathname)?'https://www.instagram.com'+u.pathname.replace(/\/$/,'')+'/':null;
 return null;
 }catch{return null;}
}
function normalizeVideoResults(payload){
 const rows=[...(payload.shorts_results||[]),...(payload.video_results||[])];const seen=new Set();
 return rows.filter(x=>x&&typeof x==='object').map(x=>{
  let page=null;for(const k of ['video_link','original_url','source_url','link']){page=sourcePage(x[k]);if(page)break;}
  if(!page&&x.link){try{const u=new URL(x.link);if(/(^|\.)bing\.com$/.test(u.hostname)){for(const k of ['murl','url','mediaurl']){page=sourcePage(u.searchParams.get(k));if(page)break;}}}catch{}}
  const rawViews=Number(x.extracted_views);const m=String(x.views||'').replace(/,/g,'').match(/([\d.]+)\s*([KM])?/i);const views=Number.isFinite(rawViews)&&rawViews>0?rawViews:m?Number(m[1])*({K:1000,M:1000000}[String(m[2]||'').toUpperCase()]||1):null;
  return{title:x.title||'Video olahraga',page_url:page,discovery_url:x.link||null,creator:x.channel||x.profile_name||null,published_label:x.date||null,views:Number.isFinite(views)?views:null,link_status:page?'SOURCE_PAGE':'INDEX_RESOLUTION_REQUIRED'};
 }).filter(x=>{const key=x.page_url||x.discovery_url;if(!key||seen.has(key))return false;seen.add(key);return true;}).slice(0,30);
}
const fallbackDigest=r=>crypto.createHash('sha256').update(JSON.stringify([r.plan_key,r.checked_at,r.queries,(r.attempts||[]).map(a=>[a.page_url,a.creator,a.checked_at,a.result,a.detail,a.proof])])).digest('hex');
function fallbackIssues(input,item,now=Date.now()){
 // Old scheduled/published packets never reach this check in the shared adapter.
 if(item.format!=='REEL'||input.format!=='CAROUSEL')return[];
 const r=input.reel_research;const issues=[];const fresh=t=>Number.isFinite(Date.parse(t))&&Date.parse(t)<=now+300000&&now-Date.parse(t)<=36*3600000;
 if(!r||r.plan_key!==input.plan_key||!fresh(r.checked_at))return['Slot Reels perlu riset footage segar untuk plan_key yang sama sebelum fallback carousel.'];
 if(!Array.isArray(r.queries)||new Set(r.queries.map(x=>String(x).trim()).filter(x=>x.length>=15)).size<2)issues.push('Coba dua pencarian video terarah sesuai pilar/topik, bukan hanya pool mingguan.');
 const attempts=Array.isArray(r.attempts)?r.attempts:[],accepted=['NOT_ACCESSIBLE','NO_MEDIA','UNVERIFIED_CONTEXT','PERMISSION_UNCONFIRMED','AUDIO_UNCLEARED','DUPLICATE_TOPIC'];
 const valid=attempts.filter(a=>sourcePage(a.page_url)&&a.creator?.trim()&&fresh(a.checked_at)&&accepted.includes(a.result)&&a.detail?.trim().length>=30&&a.proof?.kind&&a.proof?.summary?.trim().length>=20);
 if(attempts.some(a=>a.result==='USABLE'))issues.push('Ada footage USABLE; pertahankan Reels dan proses potongannya.');
 if(new Set(valid.map(a=>a.page_url)).size<3||new Set(valid.map(a=>a.creator.trim().toLowerCase())).size<2)issues.push('Fallback perlu bukti pemeriksaan tiga kandidat nyata dari minimal dua kreator; halaman Bing bukan video sumber.');
 if(!r.review?.reviewer_id?.trim()||!fresh(r.review.reviewed_at)||r.review.digest!==fallbackDigest(r))issues.push('Editor harus meninjau alasan footage gagal dan mengikat review ke manifest riset.');
 return issues;
}
module.exports={sourcePage,normalizeVideoResults,fallbackDigest,fallbackIssues};
