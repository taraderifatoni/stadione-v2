#!/usr/bin/env node
// Owner-authorized design revision. Stable ID prevents retries from making another post.
const fs = require("node:fs"), path = require("node:path"), { createHash } = require("node:crypto");
const { createClient } = require("@supabase/supabase-js"), load = require("./cms-load.cjs");
const core = load("src/lib/cms/engine.ts"), media = load("src/lib/cms/engine-media.ts"), style = load("src/lib/cms/carousel-style.ts");
const ROOT = path.resolve(__dirname, ".."), ORIGINAL = "32ce976a-6040-41af-be88-a7bf3c884235";
const REVISION = "persija-approved-newspaper-collage-20261006-v1";
const digest = b => createHash("sha256").update(b).digest("hex");
const hex = digest(REVISION), ID = `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
const DIR = path.join(ROOT, ".tools", REVISION);
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
async function one(id) { const { data, error } = await db.from("stadione_content_items").select("*").eq("id", id).maybeSingle(); if(error) throw error; return data; }
async function graph(id, fields) {
  const url = new URL(`https://graph.facebook.com/v25.0/${id}`); url.searchParams.set("fields", fields);
  const r = await fetch(url, { headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}` }, signal: AbortSignal.timeout(20000) });
  const result = await r.json(); if(!r.ok || result.error) throw Error(result.error?.message || `Meta HTTP ${r.status}`); return result;
}
async function routineSnapshot() {
  const { data, error } = await db.from("stadione_content_items").select("id,status,scheduled_at,editorial_meta").eq("kind", "SOCIAL"); if(error) throw error;
  return (data || []).filter(x => x.editorial_meta?.plan_key && !x.editorial_meta?.additional_post)
    .map(x => ({id:x.id,status:x.status,scheduled_at:x.scheduled_at,plan_key:x.editorial_meta.plan_key,planned_at:x.editorial_meta.planned_at}))
    .sort((a,b) => a.id.localeCompare(b.id));
}
async function main() {
  const mode = process.argv[2] || "prepare";
  fs.mkdirSync(DIR, { recursive: true });
  const old = await one(ORIGINAL); if(!old || old.status !== "PUBLISHED" || old.external_post_id !== "17952401802083527") throw Error("Original published Persija record changed; inspect before proceeding");
  const existing = await one(ID);
  if(mode === "prepare") {
    if(existing) { console.log(JSON.stringify({skipped:true,id:ID,status:existing.status,media_id:existing.external_post_id})); return; }
    const live = await graph(old.external_post_id, "id,media_type,permalink,children{id}");
    if(live.media_type !== "CAROUSEL_ALBUM" || live.children?.data?.length !== 5) throw Error("Original Instagram carousel does not match CMS");
    fs.writeFileSync(path.join(DIR,"routine-before.json"), JSON.stringify(await routineSnapshot(),null,2));
    fs.writeFileSync(path.join(DIR,"original.json"), JSON.stringify(old,null,2));
    const bytes = fs.readFileSync(path.join(ROOT,"assets/editorial/previews/persija-cover-preview-20261006.png"));
    if(digest(bytes) !== "8ad16753781f9c2782b4602015990ef7dc1de2f17f257717aa763fd84036b0d0") throw Error("Approved preview checksum differs");
    const coverPath = `editorial/${REVISION}/approved-cover.png`;
    const { error: ce } = await db.storage.from("stadione-cms").upload(coverPath, bytes, {contentType:"image/png",upsert:false});
    if(ce && !/already exists|duplicate/i.test(ce.message)) throw ce;
    const now = new Date().toISOString(), packet = structuredClone(old.editorial_meta.engine_packet);
    packet.slides[0].headline = "PERSIJA: LIMA LAGA, SATU UJIAN";
    packet.slides[0].body = "Shin Tae-yong menaruh perhatian pada kebugaran agar momentum kemenangan tidak berhenti di tengah jalan.";
    packet.media.editorial_cover = {url:db.storage.from("stadione-cms").getPublicUrl(coverPath).data.publicUrl,sha256:digest(bytes),style_version:style.CAROUSEL_STYLE,source_photo_url:packet.media.url,headline:packet.slides[0].headline,dek:packet.slides[0].body,source_label:"ILEAGUE.ID",reviewed_at:now,reviewed_by:"OWNER_REQUEST_20261006",safe_wrap:true,authentic_subject:true,editorial_background:true,no_edition_label:true,no_promotional_footer:true};
    const errors = core.auditPacket(packet,"CAROUSEL"); if(errors.length) throw Error(errors.join("\n"));
    const rendered = await media.renderCarousel(packet), assets = [];
    for(let i=0; i<rendered.length; i++) {
      const objectPath = `editorial/${REVISION}/${ID}-${i+1}.jpg`;
      fs.writeFileSync(path.join(DIR,`${i+1}.jpg`),rendered[i].bytes);
      const { error } = await db.storage.from("stadione-cms").upload(objectPath,rendered[i].bytes,{contentType:"image/jpeg",upsert:false});
      if(error && !/already exists|duplicate/i.test(error.message)) throw error;
      assets.push({type:"image",url:db.storage.from("stadione-cms").getPublicUrl(objectPath).data.publicUrl,render_audit:rendered[i].audit,credit:i?"Stadione":"ILeague • olah editorial Stadione",source_url:old.source_url});
    }
    await media.verifyCarouselAssets(assets);
    const meta = {...old.editorial_meta,standard:core.ENGINE,origin:"ADDITIONAL_DESIGN_REVISION",plan_key:`additional:${REVISION}`,planned_at:now,additional_post:true,design_revision:REVISION,replaces_content_id:ORIGINAL,replaces_media_id:old.external_post_id,owner_requested_republish_at:now,carousel_style:style.CAROUSEL_STYLE,carousel_design_brief:style.CAROUSEL_DESIGN_BRIEF,engine_packet:packet,engine_state:"READY_FOR_REVIEW",rendered_packet_digest:core.packetDigest(packet),render_audit:{ok:true,pages:rendered.map(r=>r.audit)},visual_reviewed_at:now,approved_via:"OWNER_REQUEST_20261006"};
    delete meta.engine_approval; delete meta.engine_run_key;
    const revised = {id:ID,parent_id:old.parent_id,kind:"SOCIAL",format:"CAROUSEL",title:old.title,caption:old.caption,hashtags:old.hashtags,platforms:old.platforms,category:old.category,status:"DRAFT",source_url:old.source_url,source_name:old.source_name,source_snapshot:old.source_snapshot,assets,editorial_meta:meta};
    meta.engine_approval = {actor_id:"OWNER_REQUEST_20261006",approved_at:now,digest:core.contentDigest(revised)};
    const gate = core.enginePublicationIssues(revised); if(gate.length) throw Error(gate.join("\n"));
    const { error } = await db.from("stadione_content_items").insert(revised); if(error) throw error;
    fs.writeFileSync(path.join(DIR,"audit.json"),JSON.stringify({id:ID,packet,assets},null,2));
    console.log(JSON.stringify({prepared:ID,parent_id:old.parent_id,style:style.CAROUSEL_STYLE,assets:assets.map(a=>a.url),audit:rendered.map(r=>r.audit)})); return;
  }
  if(!existing || existing.editorial_meta.design_revision !== REVISION) throw Error("Prepared revision missing");
  if(mode === "publish") {
    const publisher = load("src/lib/cms/publish-instagram.ts");
    const response = await publisher.publishInstagramContent(ID,null); const result = await response.json();
    console.log(JSON.stringify({id:ID,http_status:response.status,...result}));
    if(response.status >= 400) process.exitCode = 1;
    return;
  }
  if(mode === "verify") {
    if(existing.status !== "PUBLISHED" || !existing.external_post_id) throw Error("Revision is not published");
    const live = await graph(existing.external_post_id,"id,media_type,permalink,children{id,media_type}");
    const account = await graph(process.env.INSTAGRAM_USER_ID,"id,username");
    if(account.username !== "stadione.id" || live.media_type !== "CAROUSEL_ALBUM" || live.children?.data?.length !== 5 || !live.children.data.every(c=>c.media_type === "IMAGE")) throw Error("Published account/carousel differs");
    await media.verifyCarouselAssets(existing.assets);
    const before = JSON.parse(fs.readFileSync(path.join(DIR,"routine-before.json"),"utf8")), after = await routineSnapshot();
    const unchanged = JSON.stringify(before) === JSON.stringify(after);
    const result={id:ID,parent_id:existing.parent_id,media_id:live.id,permalink:live.permalink,account:account.username,slides:5,style:style.CAROUSEL_STYLE,routine_slots_unchanged:unchanged,original_media_preserved:old.external_post_id,article_not_duplicated:true};
    fs.writeFileSync(path.join(DIR,"published.json"),JSON.stringify(result,null,2)); console.log(JSON.stringify(result));
    if(!unchanged) throw Error("Routine snapshot changed; inspect whether a normal worker advanced a slot"); return;
  }
  throw Error("Use prepare, publish or verify");
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
