export type MirrorItem={id:string;kind:string;status:string;format:string;published_at?:string|null;external_post_id?:string|null;archived_at?:string|null;updated_at?:string;parent_id?:string|null;caption?:string|null;hashtags?:string[];platforms?:string[];assets?:{url?:string;image_url?:string;video_url?:string;render_audit?:{output_sha256?:string}}[];editorial_meta?:Record<string,unknown>};
export function mirrorEligible(item:MirrorItem,startedAt:string,enabled=true){
 return enabled&&item.kind==="SOCIAL"&&item.status==="PUBLISHED"&&Boolean(item.external_post_id)&&Boolean(item.platforms?.includes("INSTAGRAM"))&&!item.archived_at&&!item.editorial_meta?.cms_deleted_at&&item.editorial_meta?.mirror_disabled!==true&&Number.isFinite(Date.parse(startedAt))&&Date.parse(item.published_at||"")>=Date.parse(startedAt);
}
export function mirrorCaption(item:MirrorItem){return String(item.caption||"").trim()+((item.hashtags||[]).length?"\n\n"+item.hashtags!.map(tag=>'#'+tag.replace(/^#/,"")).join(" "):"");}
export const mirrorTerminalStates=["PUBLISHED","FAILED","PUBLISHING","UNCERTAIN","DELETING","DELETED","REMOVAL_FAILED","REMOVAL_UNCERTAIN"];
