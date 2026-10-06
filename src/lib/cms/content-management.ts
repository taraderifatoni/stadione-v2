import "server-only";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { deletePublishedMedia } from "./meta";

export async function manageCmsContent(id: string, action: "archive" | "restore" | "delete", actorId: string, options: { syncMeta?: boolean; instagramArchived?: boolean; instagramDeleted?: boolean } = {}) {
  if(!/^[a-f0-9-]{36}$/i.test(id))throw Error("ID konten tidak valid.");
  const db=createAdminClient(), token=randomUUID();
  const {data:claimed,error:claimError}=await db.rpc("claim_stadione_content_management",{p_content_id:id,p_token:token});
  if(claimError)throw Error(claimError.message);
  if(!claimed)throw Error("Konten masih terjadwal, sedang diproses Meta, atau sedang dikelola. Batalkan jadwal atau tunggu proses selesai.");
  type ManagedItem = {id:string;kind:string;status:string;published_at?:string;external_post_id?:string;editorial_meta:Record<string,unknown>};
  const {data,error:readError}=await db.from("stadione_content_items").select("*").eq("id",id).single();
  if(readError || !data)throw Error("Konten tidak ditemukan.");
  const item: ManagedItem=data;
  const {data:publication,error:publicationError}=await db.from("stadione_ig_publish_attempts").select("state,media_id").eq("content_id",id).maybeSingle();
  if(publicationError)throw Error("Riwayat publikasi belum dapat diperiksa; penghapusan ditahan.");
  // Meta may have succeeded while the final CMS status write failed. Its durable
  // attempt must still prevent a local-only deletion or an orphan Instagram post.
  if(!item.external_post_id && publication?.state==="PUBLISHED" && publication.media_id) item.external_post_id=publication.media_id;
  let meta={...item.editorial_meta};
  const at=new Date().toISOString(), historical=item.kind==="SOCIAL" && Boolean(item.external_post_id || item.published_at || publication?.state==="PUBLISHED");
  async function update(fields:Record<string,unknown>) {
    const {data:saved,error}=await db.from("stadione_content_items").update(fields).eq("id",id).eq("editorial_meta->management_lease->>token",token).select("*").single();
    if(error || !saved)throw Error(`Data CMS belum berhasil disimpan. ${error?.message || "Kunci pengelolaan berubah."}`);
    return saved;
  }
  try {
    if(action==="archive") {
      meta={...meta,archive_previous_status:item.status==="ARCHIVED"?meta.archive_previous_status:item.status,archive_scope:historical?(options.instagramArchived?"INSTAGRAM_REPORTED":"CMS_ONLY"):"CMS_ONLY",archived_by:actorId,management_lease:null};
      const saved=await update({status:"ARCHIVED",archived_at:at,editorial_meta:meta});
      await db.from("stadione_content_activity").insert({content_id:id,action:options.instagramArchived?"archive_instagram_reported":"archive_cms",actor_id:actorId,from_status:item.status,to_status:"ARCHIVED",metadata:{scope:meta.archive_scope,instagram_verified:false}});
      return {id,ok:true,item:saved,message:historical && !options.instagramArchived?"Diarsipkan di CMS. Postingan Instagram tetap tayang.":options.instagramArchived?"Arsip CMS disimpan; arsip Instagram dicatat berdasarkan konfirmasi kamu.":"Konten diarsipkan."};
    }
    if(action==="restore") {
      if(meta.cms_deleted_at)throw Error("Konten yang telah dihapus tidak dapat dipulihkan.");
      if(item.status!=="ARCHIVED")throw Error("Pilih konten yang diarsipkan.");
      const status=historical?"PUBLISHED":meta.archive_previous_status==="PUBLISHED"?"PUBLISHED":"DRAFT";
      const saved=await update({status,archived_at:null,editorial_meta:{...meta,management_lease:null}});
      await db.from("stadione_content_activity").insert({content_id:id,action:"restore_cms",actor_id:actorId,from_status:"ARCHIVED",to_status:status,metadata:{instagram_unchanged:true}});
      return {id,ok:true,item:saved,message:"Dikembalikan di CMS. Status arsip Instagram tidak diubah."};
    }
    if(historical) {
      const removal=meta.meta_removal as {state?:string} | undefined;
      if(meta.cms_deleted_at)return {id,ok:true,message:"Konten sudah dihapus."};
      if(!options.syncMeta && !options.instagramDeleted)throw Error("Aktifkan Hapus Instagram + CMS atau konfirmasi bahwa posting sudah dihapus di Instagram.");
      if(!options.instagramDeleted && ["DELETING","UNCERTAIN"].includes(removal?.state || ""))throw Error("Hasil penghapusan sebelumnya belum pasti. Periksa Instagram; jangan mengirim hapus ulang sebelum dikonfirmasi.");
      if(!options.instagramDeleted && removal?.state!=="DELETED") {
        if(!item.external_post_id)throw Error("ID posting Meta belum tercatat; hapus lewat Instagram lalu konfirmasikan di CMS.");
        meta={...meta,meta_removal:{state:"DELETING",requested_at:at,actor_id:actorId}};
        await update({editorial_meta:meta});
        try { await deletePublishedMedia(item.external_post_id); }
        catch(e) {
          const uncertain=e instanceof Error && ["TimeoutError","AbortError","TypeError"].includes(e.name);
          meta={...meta,meta_removal:{state:uncertain?"UNCERTAIN":"FAILED",requested_at:at,actor_id:actorId,error:e instanceof Error?e.message:"Meta gagal."}};
          await update({editorial_meta:meta});
          throw Error(`CMS tetap disimpan. ${e instanceof Error?e.message:"Meta gagal menghapus."}`);
        }
      }
      // Keep a hidden tombstone and published attempt for event/plan deduplication.
      const saved=await update({status:"ARCHIVED",archived_at:at,scheduled_at:null,...(item.external_post_id?{external_post_id:item.external_post_id}:{}),editorial_meta:{...meta,cms_deleted_at:at,management_lease:null,meta_removal:{state:options.instagramDeleted?"DELETED_REPORTED":"DELETED",at,actor_id:actorId,verified:!options.instagramDeleted}}});
      await db.from("stadione_content_activity").insert({content_id:id,action:options.instagramDeleted?"delete_instagram_reported":"delete_instagram",actor_id:actorId,from_status:item.status,to_status:"ARCHIVED",metadata:{media_id:item.external_post_id,verified:!options.instagramDeleted}});
      return {id,ok:true,item:saved,message:options.instagramDeleted?"Dihapus dari CMS berdasarkan konfirmasi penghapusan Instagram kamu.":"Berhasil dihapus dari Instagram dan CMS."};
    }
    const {error}=await db.from("stadione_content_items").delete().eq("id",id).eq("editorial_meta->management_lease->>token",token);
    if(error)throw Error(error.message);
    return {id,ok:true,message:"Konten dihapus permanen."};
  } finally {
    // CAS on the current token ensures a
    // completed management action cannot erase a newer owner's metadata.
    const {data:latest}=await db.from("stadione_content_items").select("editorial_meta").eq("id",id).maybeSingle();
    if(latest?.editorial_meta?.management_lease?.token===token)
      await db.from("stadione_content_items").update({editorial_meta:{...latest.editorial_meta,management_lease:null}}).eq("id",id).eq("editorial_meta->management_lease->>token",token);
  }
}
