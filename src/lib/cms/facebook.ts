import "server-only"
const graph="https://graph.facebook.com/v25.0";
type GraphResult={id?:string;name?:string;can_post?:boolean;access_token?:string;success?:boolean;video_id?:string;upload_url?:string;is_published?:boolean;permalink_url?:string;status?:{video_status?:string;uploading_phase?:{status?:string};processing_phase?:{status?:string};publishing_phase?:{status?:string}};error?:{message?:string;code?:number}};
export class FacebookRequestError extends Error {
 constructor(message:string,public definitive:boolean){super(message);this.name="FacebookRequestError";}
}
export function facebookConfigured(){return Boolean(process.env.FACEBOOK_PAGE_ID&&(process.env.FACEBOOK_PAGE_ACCESS_TOKEN||process.env.META_ACCESS_TOKEN));}
async function request(url:URL|string,token:string,params?:Record<string,string>,headers:Record<string,string>={},method?:string):Promise<GraphResult>{
 let response:Response;
 try{response=await fetch(url,{method:method||(params||headers.file_url?"POST":"GET"),headers:{Authorization:headers.file_url?'OAuth '+token:'Bearer '+token,...(params?{"Content-Type":"application/x-www-form-urlencoded"}:{}),...headers},body:params?new URLSearchParams(params):undefined,cache:"no-store",signal:AbortSignal.timeout(headers.file_url?60000:20000)});}
 catch{throw new FacebookRequestError("Facebook tidak merespons sebelum batas waktu; hasil permintaan belum dapat dipastikan.",false);}
 const result=await response.json().catch(()=>({})) as GraphResult;
 if(!response.ok||result.error){const message=(result.error?.message||'HTTP '+response.status).replaceAll(token,'[REDACTED]');throw new FacebookRequestError('Facebook API: '+message+' ('+(result.error?.code||response.status)+')',Boolean(result.error&&response.status>=400&&response.status<500));}
 return result;
}
export async function facebookClient(){
 const pageId=process.env.FACEBOOK_PAGE_ID||"",initial=process.env.FACEBOOK_PAGE_ACCESS_TOKEN||process.env.META_ACCESS_TOKEN||"";
 if(!/^\d+$/.test(pageId)||!initial)throw new Error("Halaman Facebook belum dikonfigurasi.");
 const me=await request(new URL(graph+'/me?fields=id,name,can_post'),initial);
 let token=initial;
 if(me.id!==pageId){
  const page=await request(new URL(graph+'/'+pageId+'?fields=id,access_token'),initial);
  if(page.id!==pageId||!page.access_token)throw new Error("Token tidak memiliki akses publikasi Halaman Facebook Stadione.");
  token=page.access_token;
 }
 const page=await request(new URL(graph+'/'+pageId+'?fields=id,name,can_post'),token);
 if(page.id!==pageId||page.can_post!==true)throw new Error("Halaman Facebook tidak mengizinkan publikasi dengan koneksi saat ini.");
 return {
  pageId,name:page.name||"Facebook",
  async photo(url:string){const r=await request(graph+'/'+pageId+'/photos',token,{url,published:"false"});if(!r.id)throw new Error("ID unggahan foto Facebook tidak tersedia.");return r.id;},
  async photosPost(ids:string[],caption:string){const params:Record<string,string>={message:caption,published:"true"};ids.forEach((id,i)=>{params['attached_media['+i+']']=JSON.stringify({media_fbid:id});});const r=await request(graph+'/'+pageId+'/feed',token,params);if(!r.id)throw new FacebookRequestError("Facebook tidak mengembalikan ID posting; jangan kirim ulang.",false);return r.id;},
  async reelStart(){const r=await request(graph+'/'+pageId+'/video_reels',token,{upload_phase:"start"});if(!r.video_id||!/^\d+$/.test(r.video_id)||!r.upload_url)throw new Error("Sesi unggah Reels Facebook tidak tersedia.");const u=new URL(r.upload_url);if(u.protocol!=="https:"||u.hostname!=="rupload.facebook.com"||!u.pathname.endsWith('/'+r.video_id))throw new Error("Tujuan unggah Reels Facebook tidak valid.");return {id:r.video_id,uploadUrl:r.upload_url};},
  async reelUpload(id:string,url:string){const r=await request('https://rupload.facebook.com/video-upload/v25.0/'+id,token,undefined,{file_url:url});if(r.success!==true)throw new Error("Unggahan Reels Facebook belum selesai.");},
  async reelFinish(id:string,caption:string){const r=await request(graph+'/'+pageId+'/video_reels',token,{upload_phase:"finish",video_id:id,video_state:"PUBLISHED",description:caption});if(r.success!==true)throw new FacebookRequestError("Konfirmasi publikasi Reels Facebook belum pasti.",false);return id;},
  async remove(id:string){if(!/^\d+(?:_\d+)?$/.test(id))throw new Error("ID salinan Facebook tidak valid.");const r=await request(graph+"/"+id,token,undefined,{},"DELETE");if(r.success!==true)throw new FacebookRequestError("Facebook belum mengonfirmasi penghapusan.",false);},
  async confirm(id:string,reel:boolean){const r=await request(new URL(graph+'/'+id+'?fields='+(reel?"id,status":"id,is_published,permalink_url")),token);if(r.id!==id)throw new Error("ID posting Facebook berbeda dari riwayat publikasi.");if(reel&&r.status?.video_status==="error")throw new Error("Facebook gagal memproses video.");const published=reel?r.status?.publishing_phase?.status==="complete":r.is_published===true;return {published,url:r.permalink_url||(reel?'https://www.facebook.com/reel/'+id:'https://www.facebook.com/'+id.split('_').at(-1))};},
 };
}
export async function facebookConnectionStatus(){
 if(!facebookConfigured())return {platform:"FACEBOOK",configured:false,connected:false,can_publish:false,account:null,error:"Koneksi Facebook belum tersedia."};
 try{const c=await facebookClient();return {platform:"FACEBOOK",configured:true,connected:true,can_publish:true,account:c.name,page_id:c.pageId,error:null};}
 catch(e){return {platform:"FACEBOOK",configured:true,connected:false,can_publish:false,account:null,error:e instanceof Error?e.message:"Koneksi Facebook gagal."};}
}
