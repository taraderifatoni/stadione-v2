import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { C } from "@/lib/design"
import { articleBlocks, articleImage, formatNewsDate, getPublishedArticle } from "@/lib/cms/public-news"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getPublishedArticle(slug)
  if (!article) return { title: "Berita tidak ditemukan | Stadione" }
  return { title: `${article.title} | Stadione`, description: article.excerpt || article.title }
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params
  const article = await getPublishedArticle(slug)
  if (!article) notFound()
  const image = articleImage(article)
  const blocks = articleBlocks(article.body)

  return (
    <article style={{ paddingBottom: 28 }}>
      <div style={{ padding: "14px 16px" }}>
        <Link href="/news" style={{ color: C.textSec, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13 }}><ArrowLeft size={17} />Kembali ke News</Link>
      </div>
      {image ? <img src={image} alt="" style={{ width: "100%", maxHeight: 420, objectFit: "cover", display: "block" }} /> : null}
      <div style={{ padding: "22px 20px 12px" }}>
        <div style={{ color: C.primaryLight, fontSize: 11, fontWeight: 800, letterSpacing: 1.1, textTransform: "uppercase" }}>{article.category || "Sports Update"}</div>
        <h1 style={{ color: C.text, fontSize: 30, lineHeight: 1.1, letterSpacing: -0.5, margin: "9px 0 12px" }}>{article.title}</h1>
        <time style={{ color: C.textMuted, fontSize: 12 }}>{formatNewsDate(article.published_at)}</time>
        {article.excerpt ? <p style={{ color: C.textSec, fontSize: 16, lineHeight: 1.62, margin: "22px 0", paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>{article.excerpt}</p> : null}
        <div>
          {blocks.map((block, index) => block.type === "heading" ? (
            <h2 key={index} style={{ color: C.text, fontSize: 22, lineHeight: 1.25, margin: "28px 0 10px" }}>{block.text}</h2>
          ) : block.type === "instagram" ? (
            <figure key={index} style={{ margin: "26px auto", maxWidth: 540 }}>
              <div style={{ borderRadius: 14, overflow: "hidden", background: "#fff", border: `1px solid ${C.border}` }}>
                <iframe title="Reels Instagram Stadione" src={block.embedUrl} scrolling="no" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen style={{ display: "block", width: "100%", height: 690, border: 0 }} />
              </div>
              <figcaption style={{ marginTop: 9, textAlign: "center", fontSize: 12, color: C.textMuted }}>
                <a href={block.url} target="_blank" rel="noreferrer" style={{ color: C.primaryLight, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>Tonton langsung di Instagram <ExternalLink size={13} /></a>
              </figcaption>
            </figure>
          ) : (
            <p key={index} style={{ color: C.textSec, fontSize: 16, lineHeight: 1.72, margin: "0 0 18px" }}>{block.text}</p>
          ))}
        </div>
      </div>
    </article>
  )
}
