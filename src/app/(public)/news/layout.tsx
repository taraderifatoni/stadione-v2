import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Berita Olahraga | Stadione",
  description: "Berita, laporan pertandingan, dan cerita olahraga terbaru dari Stadione.",
}

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children
}
