import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/lib/cms/auth";
import {
  buildEditorialPackage,
  slugifyCms,
  type EditorialCandidate,
} from "@/lib/cms/editorial";
import { manageCmsContent } from "@/lib/cms/content-management";
import { getSearchUsage } from "@/lib/cms/serpapi";
import {
  metaConfigured,
  metaConnectionStatus,
  publicMediaUrl,
} from "@/lib/cms/meta";

import {
  ENGINE,
  contentDigest,
  enginePublicationIssues,
  type Packet,
} from "@/lib/cms/engine";

const editableFields = [
  "title",
  "excerpt",
  "body",
  "caption",
  "category",
  "source_url",
  "source_name",
  "external_url",
] as const;

async function uniqueSlug(base: string) {
  const admin = createAdminClient();
  const root = slugifyCms(base);
  const { data } = await admin
    .from("stadione_content_items")
    .select("slug")
    .like("slug", `${root}%`)
    .limit(100);
  const existing = new Set((data || []).map((row) => row.slug));
  if (!existing.has(root)) return root;
  let number = 2;
  while (existing.has(`${root}-${number}`)) number += 1;
  return `${root}-${number}`;
}

async function logActivity(
  contentId: string,
  action: string,
  actorId: string,
  fromStatus?: string | null,
  toStatus?: string | null,
  metadata: Record<string, unknown> = {},
) {
  const admin = createAdminClient();
  await admin.from("stadione_content_activity").insert({
    content_id: contentId,
    action,
    actor_id: actorId,
    from_status: fromStatus || null,
    to_status: toStatus || null,
    metadata,
  });
}

export async function GET() {
  const auth = await requirePlatformAdmin();
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createAdminClient();
  const [{ data: items, error }, { data: activities }, usage, meta] =
    await Promise.all([
      admin
        .from("stadione_content_items")
        .select("*")
        .is("editorial_meta->>cms_deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(300),
      admin
        .from("stadione_content_activity")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300),
      getSearchUsage(),
      metaConnectionStatus(),
    ]);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: attempts } = await admin
    .from("stadione_ig_publish_attempts")
    .select("content_id,state,creation_id,media_id,error_message")
    .limit(300);
  return NextResponse.json({
    items: (items || []).filter(item => !item.editorial_meta?.cms_deleted_at),
    activities: activities || [],
    usage,
    meta,
    schedulerEnabled: process.env.CMS_SCHEDULER_ENABLED === "true",
    attempts: attempts || [],
  });
}

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  const input = await request.json().catch(() => ({}));
  const admin = createAdminClient();

  if (input.action === "create_manual") {
    const slot =
      input.slot && typeof input.slot === "object"
        ? (input.slot as Record<string, unknown>)
        : null;
    const title = String(
      input.title || (slot ? `${slot.label} — ${slot.theme}` : ""),
    ).trim();
    if (title.length < 8)
      return NextResponse.json(
        { error: "Judul minimal 8 karakter." },
        { status: 400 },
      );
    const kind = input.kind === "SOCIAL" ? "SOCIAL" : "ARTICLE";
    const requestedFormat = input.format || slot?.format;
    const format =
      kind === "ARTICLE"
        ? "ARTICLE"
        : ["CAROUSEL", "REEL", "SINGLE_IMAGE", "STORY", "VIDEO"].includes(
              requestedFormat,
            )
          ? requestedFormat
          : "CAROUSEL";
    const { data, error } = await admin
      .from("stadione_content_items")
      .insert({
        kind,
        format,
        title,
        slug: kind === "ARTICLE" ? await uniqueSlug(title) : null,
        status: "DRAFT",
        platforms:
          kind === "SOCIAL"
            ? [String(input.platform || "INSTAGRAM")]
            : ["WEBSITE"],
        created_by: auth.actor.id,
        category: slot ? String(slot.pillar || "") : null,
        editorial_meta: {
          origin: slot ? "WEEKLY_MATRIX" : "MANUAL",
          standard: kind === "SOCIAL" ? ENGINE : "STADIONE_SPORTS_DESK_V1",
          slot: slot || null,
          fact_check_status: "UNVERIFIED",
          rights_status: "PENDING",
        },
      })
      .select("*")
      .single();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    await logActivity(data.id, "create", auth.actor.id, null, "DRAFT");
    return NextResponse.json({ item: data });
  }

  if (input.action === "create_from_trend") {
    const candidate = input.candidate as EditorialCandidate;
    const decision = String(input.decision || "").toUpperCase();
    if (
      !candidate?.title ||
      String(candidate.title).trim().length < 4 ||
      !["FEED", "REEL", "BOTH", "REJECT"].includes(decision)
    ) {
      return NextResponse.json(
        { error: "Kandidat atau keputusan tren tidak valid." },
        { status: 400 },
      );
    }
    const candidateId = String(
      candidate.id || candidate.sourceUrl || candidate.title,
    ).slice(0, 300);
    const { error: decisionError } = await admin
      .from("stadione_trend_decisions")
      .insert({
        candidate_id: candidateId,
        candidate,
        decision,
        actor_id: auth.actor.id,
        source_url: candidate.sourceUrl || null,
        decided_at: new Date().toISOString(),
      });
    if (decisionError)
      return NextResponse.json(
        { error: "Keputusan kandidat gagal dicatat." },
        { status: 500 },
      );
    if (decision === "REJECT")
      return NextResponse.json({ decision, rejected: true });

    const pack = buildEditorialPackage(candidate);
    const candidateImages = Array.from(
      new Set(
        [candidate.imageUrl, ...(candidate.imageUrls || [])].filter(
          (url): url is string =>
            typeof url === "string" && /^https:\/\//.test(url),
        ),
      ),
    );
    const carouselImage = (index: number) => {
      if (index % 2 !== 0 || candidateImages.length === 0) return null;
      if (candidateImages.length === 1)
        return index === 0 ? candidateImages[0] : null;
      return candidateImages[(index / 2) % candidateImages.length];
    };
    const approvedFormats =
      decision === "BOTH"
        ? ["CAROUSEL", "REEL"]
        : [decision === "FEED" ? "CAROUSEL" : "REEL"];
    const { data: article, error: articleError } = await admin
      .from("stadione_content_items")
      .insert({
        kind: "ARTICLE",
        format: "ARTICLE",
        title: pack.article.title,
        slug: await uniqueSlug(pack.article.slug),
        excerpt: pack.article.excerpt,
        body: pack.article.body,
        category: String(input.category || "Sports Update"),
        status: "DRAFT",
        platforms: ["WEBSITE"],
        source_url: candidate.sourceUrl || null,
        source_name: candidate.source || null,
        source_snapshot: candidate,
        assets: [],
        editorial_meta: {
          origin: "TREND_MANUAL",
          engine: candidate.engine || null,
          standard: "STADIONE_SPORTS_DESK_V1",
          manual_publish: true,
          trend_decision: decision,
          trend_approved_by: auth.actor.id,
          trend_approved_at: new Date().toISOString(),
          verification_required: true,
          fact_check_status: "UNVERIFIED",
          rights_status: "PENDING",
          image_reference_url: candidate.imageUrl || null,
        },
        created_by: auth.actor.id,
      })
      .select("*")
      .single();
    if (articleError)
      return NextResponse.json(
        { error: articleError.message },
        { status: 500 },
      );

    const socialRows = approvedFormats.map((format) => ({
      parent_id: article.id,
      kind: "SOCIAL",
      format,
      title: pack.social.title,
      caption: pack.social.caption,
      hashtags: pack.social.hashtags,
      platforms: ["INSTAGRAM"],
      category: article.category,
      status: "DRAFT",
      source_url: candidate.sourceUrl || null,
      source_name: candidate.source || null,
      source_snapshot: candidate,
      assets:
        format === "CAROUSEL"
          ? pack.social.slides.map((slide, index) => {
              const imageUrl = carouselImage(index);
              return {
                ...slide,
                layout: imageUrl ? "photo" : "full_text",
                ...(imageUrl
                  ? {
                      image_url: imageUrl,
                      source_url: candidate.sourceUrl || null,
                      source_name: candidate.source || null,
                      rights_status: "PENDING",
                    }
                  : {}),
              };
            })
          : [],
      editorial_meta: {
        origin: "TREND_MANUAL",
        standard: ENGINE,
        manual_publish: true,
        trend_decision: decision,
        trend_approved_by: auth.actor.id,
        trend_approved_at: new Date().toISOString(),
        fact_check_status: "UNVERIFIED",
        rights_status: "PENDING",
        carousel_layout:
          candidateImages.length > 1
            ? "ALTERNATING_PHOTO_TEXT"
            : "COVER_PHOTO_TEXT",
        authentic_faces_only: true,
        engine_state: "AWAITING_SOURCE_PACKET",
      },
      created_by: auth.actor.id,
    }));
    const { data: socials, error: socialError } = await admin
      .from("stadione_content_items")
      .insert(socialRows)
      .select("*");
    if (socialError) {
      await admin.from("stadione_content_items").delete().eq("id", article.id);
      return NextResponse.json({ error: socialError.message }, { status: 500 });
    }
    await Promise.all([
      logActivity(
        article.id,
        "create_manual_from_trend",
        auth.actor.id,
        null,
        "DRAFT",
        { decision, engine: candidate.engine },
      ),
      ...(socials || []).map((social) =>
        logActivity(
          social.id,
          "create_manual_from_trend",
          auth.actor.id,
          null,
          "DRAFT",
          { article_id: article.id, decision },
        ),
      ),
    ]);
    return NextResponse.json({
      decision,
      article,
      socials: socials || [],
      manual_publish: true,
    });
  }

  return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  const input = await request.json().catch(() => ({}));
  const id = String(input.id || "");
  if (!id)
    return NextResponse.json(
      { error: "ID konten wajib diisi." },
      { status: 400 },
    );

  const admin = createAdminClient();
  const { data: current, error: findError } = await admin
    .from("stadione_content_items")
    .select("*")
    .eq("id", id)
    .single();
  if (findError || !current)
    return NextResponse.json(
      { error: "Konten tidak ditemukan." },
      { status: 404 },
    );

  const managementAction = String(input.action || "save");
  if (["archive", "restore"].includes(managementAction)) {
    try {
      const result = await manageCmsContent(id, managementAction as "archive" | "restore", auth.actor.id, { instagramArchived: input.instagram_archived === true });
      return NextResponse.json(result);
    } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Pengelolaan konten gagal." }, { status: 409 }); }
  }
  if (current.status === "ARCHIVED" || current.editorial_meta?.cms_deleted_at)
    return NextResponse.json({ error: "Pulihkan arsip CMS sebelum mengedit konten." }, { status: 409 });
  if (Date.parse(current.editorial_meta?.management_lease?.until || "") > Date.now())
    return NextResponse.json({ error: "Konten sedang dikelola. Tunggu proses selesai." }, { status: 409 });
  const update: Record<string, unknown> = {};
  for (const field of editableFields)
    if (field in input)
      update[field] = String(input[field] || "").trim() || null;
  if (Array.isArray(input.hashtags))
    update.hashtags = input.hashtags
      .map((tag: unknown) => String(tag).replace(/^#/, "").trim())
      .filter(Boolean)
      .slice(0, 20);
  if (Array.isArray(input.assets)) update.assets = input.assets;
  const oldMeta =
    current.editorial_meta && typeof current.editorial_meta === "object"
      ? current.editorial_meta
      : {};
  if (input.editorial_meta && typeof input.editorial_meta === "object")
    update.editorial_meta = { ...oldMeta, ...input.editorial_meta };
  // These records can only be written by the authenticated management endpoint.
  if (update.editorial_meta) {
    const managedMeta = update.editorial_meta as Record<string, unknown>;
    for (const field of ["management_lease", "meta_removal", "cms_deleted_at", "archive_scope", "archive_previous_status", "archived_by"])
      if (field in oldMeta) managedMeta[field] = oldMeta[field]; else delete managedMeta[field];
  }
  if ("source_url" in input)
    update.source_url = String(input.source_url || "").trim() || null;
  if ("source_name" in input)
    update.source_name = String(input.source_name || "").trim() || null;

  const action = String(input.action || "save");
  let resetFailedAttempt = false;
  if (current.kind === "SOCIAL") {
    const { data: attempt } = await admin
      .from("stadione_ig_publish_attempts")
      .select("state")
      .eq("content_id", id)
      .maybeSingle();
    if (
      attempt &&
      [
        "PREPARING",
        "PUBLISHING",
        "PUBLISHED",
        "UNCERTAIN",
        "PROCESSING",
        "READY",
      ].includes(attempt.state)
    )
      return NextResponse.json(
        {
          error:
            "Publikasi sedang diproses atau telah dikirim. Konten tidak dapat diubah; lanjutkan atau periksa status Meta.",
        },
        { status: 409 },
      );
    resetFailedAttempt = attempt?.state === "FAILED";
  }
  const mergedMeta = {
    ...oldMeta,
    ...((update.editorial_meta as Record<string, unknown>) || {}),
  };
  if (oldMeta.standard === ENGINE) {
    mergedMeta.standard = ENGINE;
    // Client cannot manufacture render or approval records.
    for (const field of [
      "engine_approval",
      "render_audit",
      "rendered_packet_digest",
      "engine_state",
    ])
      mergedMeta[field] = oldMeta[field];
    if (
      action !== "approve" &&
      contentDigest({ ...current, ...update, editorial_meta: mergedMeta }) !==
        contentDigest(current)
    )
      mergedMeta.engine_approval = null;
    update.editorial_meta = mergedMeta;
  }
  const proposed = { ...current, ...update, editorial_meta: mergedMeta };
  if (action === "approve") {
    if (oldMeta.standard !== ENGINE)
      return NextResponse.json(
        { error: "Buat preview engine terlebih dahulu." },
        { status: 409 },
      );
    const issues = enginePublicationIssues(proposed, false);
    if (issues.length)
      return NextResponse.json(
        { error: issues.join(" "), issues },
        { status: 409 },
      );
    mergedMeta.engine_approval = {
      actor_id: auth.actor.id,
      approved_at: new Date().toISOString(),
      digest: contentDigest(proposed),
    };
    update.editorial_meta = mergedMeta;
  }
  if (["schedule", "publish"].includes(action)) {
    const issues = enginePublicationIssues(proposed);
    if(current.format === "CAROUSEL" || current.kind === "ARTICLE") {
      const {writingReferenceIssues}=await import("@/lib/cms/writing-references");
      issues.push(...await writingReferenceIssues((mergedMeta.engine_packet as Packet | undefined)?.article));
    }
    if (issues.length)
      return NextResponse.json(
        { error: issues.join(" "), issues },
        { status: 409 },
      );
  }
  let nextStatus = current.status;
  if (action === "review") nextStatus = "PENDING_REVIEW";
  if (action === "draft") nextStatus = "DRAFT";
  if (action === "publish") {
    if (current.kind === "SOCIAL")
      return NextResponse.json(
        {
          error:
            "Simpan draf sosial, lalu gunakan tombol Publikasikan ke Instagram.",
        },
        { status: 409 },
      );
    const gateMeta = {
      ...oldMeta,
      ...((update.editorial_meta as Record<string, unknown>) || {}),
    };
    if (
      gateMeta.fact_check_status !== "VERIFIED" ||
      gateMeta.rights_status !== "CLEARED" ||
      !(update.source_url ?? current.source_url)
    )
      return NextResponse.json(
        {
          error:
            "Publikasi ditahan. Verifikasi fakta, cantumkan sumber, dan nyatakan hak foto beres terlebih dahulu.",
        },
        { status: 409 },
      );
    nextStatus = "PUBLISHED";
    update.published_at = new Date().toISOString();
    update.scheduled_at = null;
  }
  if (action === "schedule") {
    if (!["DRAFT", "PENDING_REVIEW", "SCHEDULED"].includes(current.status))
      return NextResponse.json(
        { error: "Status konten ini tidak dapat dijadwalkan." },
        { status: 409 },
      );
    if (current.kind === "ARTICLE")
      return NextResponse.json(
        {
          error:
            "Penjadwalan artikel belum aktif karena penerbit otomatis artikel belum tersedia.",
        },
        { status: 409 },
      );
    if (process.env.CMS_SCHEDULER_ENABLED !== "true" || !metaConfigured())
      return NextResponse.json(
        {
          error:
            "Penjadwalan otomatis Instagram belum aktif. Gunakan publikasi manual saat waktu tayang.",
        },
        { status: 409 },
      );
    if (
      !current.platforms?.includes("INSTAGRAM") ||
      !current.platforms.every(
        (platform: string) => platform === "INSTAGRAM",
      ) ||
      !["SINGLE_IMAGE", "CAROUSEL", "REEL"].includes(current.format)
    )
      return NextResponse.json(
        {
          error:
            "Penjadwalan hanya mendukung gambar tunggal, carousel, dan Reel Instagram.",
        },
        { status: 409 },
      );
    const assets = (update.assets ?? current.assets) as Array<{
      url?: string;
      image_url?: string;
      video_url?: string;
    }>;
    try {
      if (
        !Array.isArray(assets) ||
        (current.format === "CAROUSEL"
          ? assets.length < 2 || assets.length > 10
          : assets.length !== 1)
      )
        throw new Error("Jumlah aset belum sesuai format.");
      assets.forEach((asset, index) =>
        publicMediaUrl(
          current.format === "REEL"
            ? asset.video_url || asset.url
            : asset.url || asset.image_url,
          `Aset ${index + 1}`,
        ),
      );
      if (!String(update.caption ?? current.caption ?? "").trim())
        throw new Error("Caption wajib diisi.");
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Aset tidak valid." },
        { status: 400 },
      );
    }
    const scheduledAt = new Date(String(input.scheduled_at || ""));
    if (
      Number.isNaN(scheduledAt.getTime()) ||
      scheduledAt.getTime() <= Date.now()
    ) {
      return NextResponse.json(
        { error: "Jadwal tayang harus berada di masa depan." },
        { status: 400 },
      );
    }
    const gateMeta = {
      ...oldMeta,
      ...((update.editorial_meta as Record<string, unknown>) || {}),
    };
    if (
      gateMeta.fact_check_status !== "VERIFIED" ||
      gateMeta.rights_status !== "CLEARED" ||
      !(update.source_url ?? current.source_url)
    )
      return NextResponse.json(
        {
          error:
            "Penjadwalan ditahan. Verifikasi fakta, cantumkan sumber, dan nyatakan hak foto beres terlebih dahulu.",
        },
        { status: 409 },
      );
    nextStatus = "SCHEDULED";
    update.scheduled_at = scheduledAt.toISOString();
    update.publish_error = null;
  }
  update.status = nextStatus;
  if (
    current.kind === "ARTICLE" &&
    typeof update.title === "string" &&
    update.title !== current.title &&
    !input.keep_slug
  ) {
    update.slug = await uniqueSlug(update.title);
  }

  const { data, error } = await admin
    .from("stadione_content_items")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  if (action === "schedule" && current.kind === "SOCIAL" && current.parent_id)
    await admin.from("stadione_content_items").update({ status: "SCHEDULED", scheduled_at: update.scheduled_at, publish_error: null }).eq("id", current.parent_id).eq("kind", "ARTICLE");
  if (resetFailedAttempt)
    await admin
      .from("stadione_ig_publish_attempts")
      .delete()
      .eq("content_id", id)
      .eq("state", "FAILED");
  await logActivity(id, action, auth.actor.id, current.status, nextStatus);
  return NextResponse.json({ item: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  const input = await request.json().catch(() => ({}));
  const syncMeta = input.sync_meta === true;
  const ids = Array.isArray(input.ids)
    ? [
        ...new Set<string>(
          input.ids
            .map((id: unknown) => String(id))
            .filter((id: string) => /^[a-f0-9-]{36}$/i.test(id)),
        ),
      ].slice(0, 100)
    : [];
  if (!ids.length)
    return NextResponse.json(
      { error: "Pilih minimal satu konten." },
      { status: 400 },
    );
  const results = [];
  for (const id of ids) {
    try { results.push(await manageCmsContent(id, "delete", auth.actor.id, { syncMeta, instagramDeleted: input.instagram_deleted === true && ids.length === 1 })); }
    catch (e) { results.push({ id, ok: false, error: e instanceof Error ? e.message : "Penghapusan gagal." }); }
  }
  const deleted = results.filter(result => result.ok).length;
  return NextResponse.json({ deleted, results, ...(deleted !== ids.length ? { error: "Sebagian atau semua penghapusan gagal; lihat hasil tiap konten." } : {}) }, { status: deleted === ids.length ? 200 : deleted ? 207 : 409 });
}
