import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";
import type { Packet, VideoSource } from "./engine";
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
) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const size = initialSize - attempt * 4;
    const out = await sharp({
      text: {
        text: `<span foreground="#F5F0E8">${esc(text)}</span>`,
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
  const wrap = (value: string, limit: number) => {
    const lines: string[] = [];
    let line = "";
    for (const word of value.replace(/\s+/g, " ").trim().split(" ")) {
      if (`${line} ${word}`.trim().length > limit && line) {
        lines.push(line);
        line = word;
      } else line = `${line} ${word}`.trim();
    }
    if (line) lines.push(line);
    return lines;
  };
  const textLines = (
    lines: string[],
    x: number,
    y: number,
    size: number,
    step: number,
    weight = 500,
    color = "#191714",
  ) =>
    lines
      .map(
        (line, index) =>
          `<text x="${x}" y="${y + index * step}" font-family="DejaVu Sans" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(line)}</text>`,
      )
      .join("");
  const source = (() => {
    try {
      return new URL(packet.sources[0]?.url || "").hostname
        .replace(/^www\./, "")
        .toUpperCase();
    } catch {
      return "REDAKSI STADIONE";
    }
  })();
  const images = [];
  for (let i = 0; i < packet.slides.length; i++) {
    const slide = packet.slides[i];
    const headline = wrap(slide.headline, i === 0 ? 24 : 30);
    const body = wrap(slide.body, 48);
    if (headline.length > 4 || body.length > 32)
      throw new Error(
        `Slide ${i + 1}: artikel terlalu panjang untuk halaman koran.`,
      );
    const firstColumn = body.slice(0, 16);
    const secondColumn = body.slice(16, 32);
    const cover = i === 0;
    const content = cover
      ? `${textLines(headline, 64, 385, 76, 88, 900)}${textLines(body, 68, 385 + headline.length * 88 + 54, 32, 46, 500, "#302c27")}`
      : `${textLines(headline, 64, 300, 58, 68, 900)}<line x1="64" y1="${330 + headline.length * 68}" x2="1016" y2="${330 + headline.length * 68}" stroke="#84102d" stroke-width="8"/>${textLines(firstColumn, 64, 430 + headline.length * 68, 28, 42, 500, "#302c27")}${textLines(secondColumn, 558, 430 + headline.length * 68, 28, 42, 500, "#302c27")}`;
    const svg = Buffer.from(
      `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg"><defs><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="3" seed="8"/><feColorMatrix values="0 0 0 0 .18 0 0 0 0 .16 0 0 0 0 .13 0 0 0 .055 0"/></filter></defs><rect width="1080" height="1350" fill="#eee9dd"/><rect width="1080" height="1350" filter="url(#n)" opacity=".55"/><rect width="1080" height="18" fill="#84102d"/><text x="64" y="78" font-family="DejaVu Sans" font-size="27" font-weight="900" letter-spacing="7" fill="#191714">STADIONE</text><text x="1016" y="78" text-anchor="end" font-family="DejaVu Sans" font-size="20" font-weight="700" fill="#191714">EDISI DIGITAL • ${i + 1}/${packet.slides.length}</text><line x1="64" y1="105" x2="1016" y2="105" stroke="#191714" stroke-width="2"/><text x="64" y="148" font-family="DejaVu Sans" font-size="19" font-weight="700" fill="#84102d">${esc(packet.assignment.pillar.toUpperCase())}</text><text x="1016" y="148" text-anchor="end" font-family="DejaVu Sans" font-size="18" font-weight="700" fill="#191714">SUMBER: ${esc(source)}</text><line x1="64" y1="170" x2="1016" y2="170" stroke="#191714" stroke-width="2"/>${content}<line x1="64" y1="1282" x2="1016" y2="1282" stroke="#191714" stroke-width="2"/><text x="64" y="1320" font-family="DejaVu Sans" font-size="17" font-weight="700" fill="#84102d">BACA UTUH • SIMPAN • BAGIKAN</text><text x="1016" y="1320" text-anchor="end" font-family="DejaVu Sans" font-size="17" font-weight="700" fill="#191714">STADIONE.PRO</text></svg>`,
    );
    const bytes = await sharp(svg).jpeg({ quality: 94 }).toBuffer();
    images.push({
      bytes,
      audit: {
        width: 1080,
        height: 1350,
        layout: "newspaper_text",
        authentic_photo: false,
        headline_lines: headline.length,
        body_lines: body.length,
        columns: cover ? 1 : secondColumn.length ? 2 : 1,
        ok: true,
      },
    });
  }
  return images;
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
