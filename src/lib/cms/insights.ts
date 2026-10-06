import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { publishedMediaDetails, publishedMediaInsights } from "./meta";
import { assessPerformance, type InsightSnapshot } from "./performance";

export async function cmsInsights(ids: string[] = [], refresh = false, force = false) {
  const db=createAdminClient();
  const {data:items,error:itemError}=await db.from("stadione_content_items").select("id,kind,format,status,external_post_id,published_at,editorial_meta").eq("kind","SOCIAL").not("external_post_id","is",null).is("editorial_meta->>cms_deleted_at",null).order("published_at",{ascending:false}).limit(300);
  if(itemError)throw Error(itemError.message);
  if(!items?.length)return {};
  const {data:stored,error:cacheError}=await db.from("stadione_content_insights").select("*").in("content_id",items.map(item=>item.id)).limit(300);
  if(cacheError)throw Error(cacheError.message);
  const snapshots=new Map<string,InsightSnapshot>((stored || []).map(s=>[s.content_id,s]));
  if(refresh) {
    const requested=(items || []).filter(item=>!item.editorial_meta?.cms_deleted_at && item.editorial_meta?.meta_removal?.state!=="DELETED" && (!ids.length || ids.includes(item.id))).slice(0,30);
    let cursor=0;
    await Promise.all(Array.from({length:Math.min(3,requested.length)},async()=>{
      while(cursor<requested.length) {
        const item=requested[cursor++], previous=snapshots.get(item.id);
        // Throttle failures too, so opening CMS does not repeatedly query missing media.
        if(!force && previous?.last_attempt_at && Date.now()-Date.parse(previous.last_attempt_at)<15*60000)continue;
        const at=new Date().toISOString();
        let snapshot: InsightSnapshot;
        try {
          const media=await publishedMediaDetails(item.external_post_id);
          const insights=await publishedMediaInsights(media.id,media.media_product_type==="REELS");
          snapshot={content_id:item.id,media_id:media.id,format:item.format,published_at:media.timestamp || item.published_at,metrics:insights.metrics,unavailable:insights.unavailable,permalink:media.permalink || null,fetched_at:at,last_attempt_at:at,last_error:null};
        } catch(e) {
          snapshot={...(previous || {content_id:item.id,media_id:item.external_post_id,format:item.format,published_at:item.published_at,metrics:{},fetched_at:null}),last_attempt_at:at,last_error:e instanceof Error?e.message:"Insight gagal dibaca."};
        }
        const {error}=await db.from("stadione_content_insights").upsert(snapshot);
        if(error)throw Error(error.message);
        snapshots.set(item.id,snapshot);
      }
    }));
  }
  const activeIds=new Set((items || []).filter(i=>!i.editorial_meta?.cms_deleted_at).map(i=>i.id));
  const all=[...snapshots.values()].filter(s=>activeIds.has(s.content_id));
  return Object.fromEntries(all.map(snapshot=>[snapshot.content_id,{...snapshot,performance:assessPerformance(snapshot,all)}]));
}
