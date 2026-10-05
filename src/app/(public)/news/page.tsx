import Link from "next/link"
import { Newspaper } from "lucide-react"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { articleImage, formatNewsDate, getPublishedArticles } from "@/lib/cms/public-news"

export const dynamic = "force-dynamic"

export default async function NewsPage() {
  const articles = await getPublishedArticles()

  return (
    <div>
      <TopBar title="News" />
      <div style={{ padding: "4px 16px 24px" }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: C.primaryLight, fontSize: 11, fontWeight: 800, letterSpacing: 1.4, marginBottom: 6 }}>STADIONE NEWSROOM</div>
          <h1 style={{ color: C.text, fontSize: 28, lineHeight: 1.08, margin: 0 }}>Cerita olahraga,<br />dibaca sampai tuntas.</h1>
        </div>

        {articles.length === 0 ? (
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, padding: "38px 20px", textAlign: "center", background: C.surface }}>
            <Newspaper size={28} color={C.textMuted} />
            <div style={{ color: C.text, fontWeight: 700, marginTop: 10 }}>Belum ada berita</div>
            <div style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>Artikel yang telah diterbitkan akan muncul di sini.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {articles.map((article, index) => {
              const image = articleImage(article)
              return (
                <Link key={article.id} href={`/news/${article.slug}`} style={{ textDecoration: "none" }}>
                  <article style={{ overflow: "hidden", borderRadius: 16, border: `1px solid ${C.border}`, background: C.surface }}>
                    {image ? <img src={image} alt="" style={{ display: "block", width: "100%", height: index === 0 ? 250 : 190, objectFit: "cover" }} /> : null}
                    <div style={{ padding: "16px 16px 18px" }}>
                      <div style={{ color: C.primaryLight, fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>{article.category || "Sports Update"}</div>
                      <h2 style={{ color: C.text, fontSize: index === 0 ? 22 : 18, lineHeight: 1.22, margin: "7px 0 8px" }}>{article.title}</h2>
                      {article.excerpt ? <p style={{ color: C.textSec, fontSize: 13, lineHeight: 1.55, margin: "0 0 12px" }}>{article.excerpt}</p> : null}
                      <time style={{ color: C.textMuted, fontSize: 11 }}>{formatNewsDate(article.published_at)}</time>
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
