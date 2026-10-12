// Public metadata only. Never returns/downloads audiovisual files or captions.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const number=x=>x===undefined||x===null||x===''?null:Number.isFinite(Number(x))?Number(x):null;
function durationSeconds(value){const m=String(value||'').match(/^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/);return m?Number(m[1]||0)*86400+Number(m[2]||0)*3600+Number(m[3]||0)*60+Number(m[4]||0):null;}
function recentWindow(now,days=7){const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);return new Date(Date.parse(day+'T00:00:00+07:00')-days*86400000).toISOString();}
function candidates(videos,now){const seen=new Set();return videos.filter(x=>x?.id&&!seen.has(x.id)&&seen.add(x.id)).map(x=>({id:x.id,title:x.snippet?.title||'',page_url:'https://www.youtube.com/watch?v='+encodeURIComponent(x.id),creator:x.snippet?.channelTitle||null,channel_id:x.snippet?.channelId||null,published_at:x.snippet?.publishedAt||null,thumbnail:x.snippet?.thumbnails?.high?.url||x.snippet?.thumbnails?.medium?.url||null,description:x.snippet?.description||'',duration_iso:x.contentDetails?.duration||null,duration_seconds:durationSeconds(x.contentDetails?.duration),views:number(x.statistics?.viewCount),likes:number(x.statistics?.likeCount),comments:number(x.statistics?.commentCount),license:x.status?.license||null,embeddable:typeof x.status?.embeddable==='boolean'?x.status.embeddable:null,live_status:x.snippet?.liveBroadcastContent||null,metadata_retrieved_at:new Date(now).toISOString(),link_status:'SOURCE_PAGE',media_download_verified:false,transcript_verified:false,rights_status:'EDITORIAL_REVIEW'}));}
async function getYoutubeVideoPool(pillar,topic,options={}){
 const keywords={'Sepak Bola Eropa':'sepak bola Eropa highlights pertandingan','Sepak Bola Indonesia':'sepak bola Indonesia Liga Timnas','Olahraga Indonesia':'atlet Indonesia bulutangkis voli balap prestasi','Tarkam & Komunitas':'tarkam sepak bola kampung Indonesia'};
 if(!keywords[pillar])throw Error('Pilar YouTube tidak dikenali.');
 const query=String(topic||keywords[pillar]).trim();if(query.length<8||query.length>220)throw Error('Topik YouTube perlu8–220karakter.');
 const key=options.apiKey||process.env.YOUTUBE_API_KEY;if(!key)throw Error('YOUTUBE_API_KEY belum tersedia untuk pencarian metadata.');
 const now=options.now??Date.now(),fetcher=options.fetch||fetch,after=recentWindow(now),dir=options.cacheDir===false?null:options.cacheDir||'/opt/stadione-editorial/youtube-cache',cacheKey=hash(JSON.stringify([1,pillar,query,after]));
 const file=dir?path.join(dir,cacheKey+'.json'):null;
 if(file){try{const c=JSON.parse(await fs.readFile(file,'utf8'));if(c.expires_at>now&&c.pool?.provider==='YOUTUBE_DATA_API')return {...c.pool,cached:true,api_requests:0};}catch(e){if(e.code!=='ENOENT'&&!(e instanceof SyntaxError))throw Error('Cache metadata YouTube tidak dapat dibaca.');}}
 async function request(endpoint,params){
  const url=new URL('https://www.googleapis.com/youtube/v3/'+endpoint);url.searchParams.set('key',key);for(const [k,v]of Object.entries(params))url.searchParams.set(k,String(v));
  let res;try{res=await fetcher(url,{signal:AbortSignal.timeout(20000)});}catch{throw Error('YouTube '+endpoint+': koneksi atau timeout gagal.');}
  let body;try{body=await res.json();}catch{throw Error('YouTube '+endpoint+': respons JSON tidak valid (HTTP'+res.status+').');}
  if(!res.ok||body.error){const reason=body.error?.errors?.[0]?.reason||'providerError';throw Error('YouTube '+endpoint+' HTTP'+res.status+' '+String(reason).replace(/[^A-Za-z0-9_-]/g,'').slice(0,80));}
  return body;
 }
 const found=await request('search',{part:'snippet',type:'video',q:query,publishedAfter:after,regionCode:'ID',relevanceLanguage:'id',maxResults:20,order:'relevance'});
 const ids=[...new Set((found.items||[]).map(x=>x.id?.videoId).filter(Boolean))];const videos=ids.length?(await request('videos',{part:'snippet,contentDetails,statistics,status',id:ids.join(',')})).items||[]:[];
 const pool={provider:'YOUTUBE_DATA_API',query,date:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta'}).format(now),fetched_at:new Date(now).toISOString(),published_after:after,cached:false,cache_hours:24,api_requests:ids.length?2:1,candidates:candidates(videos,now),note:'Official public metadata. Not a media download, transcript, licence clearance or verification of recording date.'};
 if(file){await fs.mkdir(dir,{recursive:true,mode:0o700});for(const name of await fs.readdir(dir)){if(!/^[a-f0-9]{64}\.json$/.test(name))continue;try{const x=JSON.parse(await fs.readFile(path.join(dir,name),'utf8'));if(x.expires_at<=now)await fs.unlink(path.join(dir,name));}catch(e){if(e.code!=='ENOENT')throw Error('Expired YouTube metadata cache cleanup failed.');}}const tmp=file+'.'+crypto.randomUUID()+'.tmp';await fs.writeFile(tmp,JSON.stringify({expires_at:now+86400000,pool}),{mode:0o600});await fs.rename(tmp,file);}
 return pool;
}
module.exports={durationSeconds,recentWindow,candidates,getYoutubeVideoPool};
