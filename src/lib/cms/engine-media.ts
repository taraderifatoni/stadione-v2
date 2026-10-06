import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { CAROUSEL_STYLE, carouselStyleIssues, editorialCoverIssues } from "./carousel-style";
import { packetDigest, type Packet, type VideoSource } from "./engine";
import { articleIssues, articleSlides } from "./news-writing";
const run = promisify(execFile);
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c] || c,
  );
const forbiddenIp = (ip: string) =>
  /^(127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.|224\.|255\.|::|fc|fd|fe80)/i.test(
    ip,
  ) || /^(::1$|::ffff:)/i.test(ip);
export async function sourceBytes(
  raw: string,
  max = 8_000_000,
): Promise<Buffer> {
  let url = new URL(raw);
  for (let redirects = 0; redirects < 4; redirects++) {
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      (url.port && url.port !== "443") ||
      isIP(url.hostname)
    )
      throw new Error("Gunakan URL HTTPS publik tanpa kredensial/port khusus.");
    const addresses = await lookup(url.hostname, { all: true });
    if (!addresses.length || addresses.some((a) => forbiddenIp(a.address)))
      throw new Error("Alamat sumber internal tidak diizinkan.");
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(30000),
      headers: { "User-Agent": "StadioneEditorial/3.0" },
    });
    if (
      response.status >= 300 &&
      response.status < 400 &&
      response.headers.get("location")
    ) {
      url = new URL(response.headers.get("location")!, url);
      continue;
    }
    if (!response.ok)
      throw new Error(`Sumber mengembalikan HTTP ${response.status}`);
    if (Number(response.headers.get("content-length")) > max)
      throw new Error("Berkas sumber melebihi batas ukuran.");
    if (!response.body) throw new Error("Sumber kosong.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
      size += chunk.length;
      if (size > max) throw new Error("Berkas sumber melebihi batas ukuran.");
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
  throw new Error("Sumber terlalu banyak redirect.");
}
export async function measuredText(
  text: string,
  width: number,
  maxHeight: number,
  initialSize: number,
  bold = false,
  color = "#F5F0E8",
) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const size = initialSize - attempt * 4;
    const out = await sharp({
      text: {
        text: `<span foreground="${color}">${esc(text)}</span>`,
        font: `DejaVu Sans ${bold ? "Bold " : ""}${size}`,
        width,
        rgba: true,
        wrap: "word",
        spacing: 10,
      },
    })
      .png()
      .toBuffer({ resolveWithObject: true });
    if (out.info.height <= maxHeight && out.info.width <= width)
      return {
        buffer: out.data,
        width: out.info.width,
        height: out.info.height,
        font_size: size,
attempts: attempt + 1,
      };
  }
  throw new Error("Teks melampaui ruang setelah 5 penyesuaian ukuran.");
}
export async function renderCarousel(packet: Packet) {
  const writingIssues=articleIssues(packet.article,packet.claims,packet.sources);
  if(writingIssues.length)throw new Error(writingIssues.join(" "));
  if(packetDigest(packet.slides)!==packetDigest(articleSlides(packet.article!)))throw new Error("Slide berbeda dari artikel yang ditinjau; buat pagination ulang.");
  const coverIssues = editorialCoverIssues(packet);
  if (coverIssues.length) throw new Error(coverIssues.join(" "));
  const source = new URL(packet.sources.find(s => s.primary)?.url || packet.sources[0].url).hostname.replace(/^www\./, "").toUpperCase();
  const cover = packet.media.editorial_cover!;
  const coverBytes = await sourceBytes(cover.url);
  const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
  if (hash(coverBytes) !== cover.sha256) throw new Error("Berkas cover berubah setelah review; jangan menerbitkan aset pengganti.");
  const info = await sharp(coverBytes).metadata();
  if (!info.width || !info.height || info.width < 1080 || info.height < 1350 ||
      Math.abs(info.width / info.height - 4 / 5) > 0.002 || (info.pages || 1) !== 1)
    throw new Error("Cover editorial wajib gambar statis minimal 1080x1350 dengan rasio 4:5; tidak boleh dicrop ulang.");
  const images = [];
  const left = 72, width = 936, bottom = 1278;
  for (let i = 0; i < packet.slides.length; i++) {
    if (i === 0) {
      // Mechanical export only. Never regenerate or place a second headline over the approved artwork.
      const bytes = await sharp(coverBytes).resize(1080, 1350, { fit: "fill" }).jpeg({quality:95,chromaSubsampling:"4:4:4"}).toBuffer();
      images.push({bytes,audit:{width:1080,height:1350,style_version:CAROUSEL_STYLE,layout:"newspaper_collage_cover",authentic_photo:true,editorial_background:true,source_label:source,cover_input_sha256:cover.sha256,output_sha256:hash(bytes),no_edition_label:true,no_promotional_footer:true,safe_wrap:true,ok:true}});
      continue;
    }
    const slide = packet.slides[i];
    const headline = await measuredText(slide.headline, width, 235, 60, true, "#191714");
    const titleTop = 205;
    const bodyTop = titleTop + headline.height + 30;
    const body = await measuredText(slide.body, width, bottom - bodyTop, 36, false, "#302c27");
    if (body.font_size < 32) throw new Error("Pisahkan artikel menjadi halaman tambahan; jangan perkecil teks di bawah batas baca.");
    const boxes = [
      { x: left, y: titleTop, width: headline.width, height: headline.height, font_size: headline.font_size },
      { x: left, y: bodyTop, width: body.width, height: body.height, font_size: body.font_size },
    ];
    const safe = boxes.every(b => b.x >= left && b.x + b.width <= 1008 && b.y + b.height <= bottom);
    if (!safe) throw new Error("Teks keluar dari area aman carousel.");
    const base = Buffer.from(`<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
      <rect width="1080" height="1350" fill="#eee9dd"/>
      <rect width="1080" height="14" fill="#84102d"/>
      <text x="72" y="74" font-family="DejaVu Sans" font-size="27" font-weight="900" letter-spacing="7" fill="#191714">STADIONE</text>
      <text x="1008" y="74" text-anchor="end" font-family="DejaVu Sans" font-size="22" font-weight="700" fill="#191714">${i+1}/${packet.slides.length}</text>
      <line x1="72" y1="102" x2="1008" y2="102" stroke="#191714" stroke-width="2"/>
      <text x="72" y="150" font-family="DejaVu Sans" font-size="20" font-weight="700" fill="#84102d">${esc(packet.assignment.pillar.toUpperCase())}</text>
      <line x1="72" y1="174" x2="1008" y2="174" stroke="#191714" stroke-width="2"/>
      <line x1="72" y1="${titleTop+headline.height+13}" x2="1008" y2="${titleTop+headline.height+13}" stroke="#84102d" stroke-width="5"/>
    </svg>`);
    const layers: sharp.OverlayOptions[] = [];
    layers.push({ input: headline.buffer, left, top: titleTop }, { input: body.buffer, left, top: bodyTop });
    const bytes = await sharp(base).composite(layers).jpeg({quality:95,chromaSubsampling:"4:4:4"}).toBuffer();
    images.push({bytes,audit:{width:1080,height:1350,style_version:CAROUSEL_STYLE,layout:"newspaper_article",paper_tone:"#eee9dd",authentic_photo:false,source_label:null,text_sha256:packetDigest(slide),output_sha256:hash(bytes),no_edition_label:true,no_promotional_footer:true,headline_height:headline.height,body_height:body.height,headline_font_size:headline.font_size,body_font_size:body.font_size,boxes,safe_wrap:safe,columns:1,ok:safe}});
  }
  return images;
}
export async function verifyCarouselAssets(assets: Record<string, unknown>[]) {
  const issues = carouselStyleIssues(assets);
  if (issues.length) throw new Error(issues.join(" "));
  await Promise.all(assets.map(async (asset, i) => {
    const bytes = await sourceBytes(String(asset.url || asset.image_url || ""));
    const a = asset.render_audit as Record<string, unknown>;
    if (createHash("sha256").update(bytes).digest("hex") !== a.output_sha256)
      throw new Error(`Slide ${i+1} berubah setelah render; buat render baru sebelum publikasi.`);
    const info = await sharp(bytes).metadata();
    if (info.format !== "jpeg" || info.width !== 1080 || info.height !== 1350)
      throw new Error(`Slide ${i+1} bukan JPEG 1080x1350.`);
  }));
}
async function probe(file: string) {
  return JSON.parse(
    (
      await run(
        "ffprobe",
        ["-v", "error", "-show_streams", "-show_format", "-of", "json", file],
        { timeout: 20000 },
      )
    ).stdout,
  );
}
async function writeSource(
  directory: string,
  clip: VideoSource,
  index: number,
) {
  const file = join(directory, `source-${index}.mp4`);
  await fs.writeFile(file, await sourceBytes(clip.media_url, 150_000_000));
  const info = await probe(file);
  if (
    !info.streams.some(
      (s: { codec_type: string }) => s.codec_type === "video",
    ) ||
    !info.streams.some((s: { codec_type: string }) => s.codec_type === "audio")
  )
    throw new Error(
      `Video ${clip.id} wajib memiliki gambar bergerak dan audio.`,
    );
  return { file, duration: Number(info.format.duration) };
}
export async function renderReel(packet: Packet) {
  const directory = await fs.mkdtemp(join(tmpdir(), "stadione-montage-"));
  try {
    const clips = packet.media.video_sources || [],
scenes = packet.media.scenes || [],
      files = new Map<string, { file: string; duration: number }>();
    for (let i = 0; i < clips.length; i++)
      files.set(clips[i].id, await writeSource(directory, clips[i], i));
    const hook = await measuredText(
      packet.slides[0].headline,
      920,
      220,
      56,
      true,
    );
    await fs.writeFile(join(directory, "hook.png"), hook.buffer);
    const segments: string[] = [];
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i],
        clip = clips.find((c) => c.id === scene.source_id),
        source = files.get(scene.source_id);
      if (!clip || !source)
        throw new Error(`Sumber potongan ${i + 1} tidak tersedia.`);
      if (scene.source_end > source.duration + 0.1)
        throw new Error(
          `Timestamp potongan ${i + 1} melewati durasi video sumber.`,
        );
      const caption = await measuredText(scene.text, 920, 240, 42, true),
        credit = await measuredText(`Sumber: ${clip.credit}`, 920, 65, 20);
      const captionFile = join(directory, `caption-${i}.png`),
        creditFile = join(directory, `credit-${i}.png`),
        segment = join(directory, `segment-${i}.mp4`);
      await fs.writeFile(captionFile, caption.buffer);
      await fs.writeFile(creditFile, credit.buffer);
      const duration = scene.source_end - scene.source_start;
      const filters = [
        "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[v0]",
        "[v0][1:v]overlay=80:160[v1]",
        "[v1][2:v]overlay=80:1460[v2]",
        "[v2][3:v]overlay=80:1810[vout]",
      ].join(";");
      await run(
        "ffmpeg",
        [
          "-v",
          "error",
          "-y",
          "-nostdin",
          "-ss",
          String(scene.source_start),
          "-t",
          String(duration),
          "-i",
          source.file,
          "-i",
          join(directory, "hook.png"),
          "-i",
          captionFile,
          "-i",
          creditFile,
          "-filter_complex",
          filters,
          "-map",
          "[vout]",
          "-map",
          "0:a:0",
          "-af",
          "aresample=async=1:first_pts=0",
          "-c:v",
          "libx264",
          "-preset",
          "fast",
          "-crf",
          "22",
          "-pix_fmt",
          "yuv420p",
          "-r",
          "30",
          "-c:a",
          "aac",
          "-ar",
          "48000",
          "-ac",
          "2",
          segment,
        ],
        { timeout: 180000, maxBuffer: 2_000_000 },
      );
      segments.push(segment);
    }
    const list = join(directory, "concat.txt");
    await fs.writeFile(
      list,
      segments.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n"),
    );
    const output = join(directory, "reel.mp4");
    await run(
      "ffmpeg",
      [
        "-v",
        "error",
        "-y",
        "-nostdin",
        "-f",
"concat",
        "-safe",
        "0",
        "-i",
        list,
        "-af",
        "loudnorm=I=-16:TP=-1.5:LRA=11",
        "-c:v",
        "copy",
        "-c:a",
        "aac",
        "-movflags",
        "+faststart",
        output,
      ],
      { timeout: 240000, maxBuffer: 2_000_000 },
    );
    const meta = await probe(output),
      v = meta.streams.find(
        (s: { codec_type: string }) => s.codec_type === "video",
      ),
      duration = Number(meta.format.duration);
    if (
      v?.width !== 1080 ||
      v?.height !== 1920 ||
      duration < 7.8 ||
      duration > 90.2
    )
      throw new Error(
        "Output montage gagal audit 1080×1920 atau durasi 8–90 detik.",
      );
    return {
      bytes: await fs.readFile(output),
      audit: {
        ok: true,
        width: v.width,
        height: v.height,
        duration,
        scene_count: scenes.length,
        source_count: clips.length,
        platforms: [...new Set(clips.map((c) => c.platform))],
        normalized_audio: true,
        source_video: true,
        ai_footage: false,
      },
    };
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}
