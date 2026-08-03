import Link from "next/link"

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "#0D0D0D", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: 40, maxWidth: 360 }}>
        <div style={{ fontSize: 72, fontWeight: 900, color: "#84102D", lineHeight: 1 }}>404</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#F5F0E8", marginTop: 16 }}>Halaman tidak ditemukan</div>
        <div style={{ fontSize: 13, color: "#6B6558", marginTop: 8, marginBottom: 24 }}>
          Halaman yang Anda cari mungkin sudah dipindahkan atau tidak tersedia.
        </div>
        <Link href="/" style={{ display: "inline-block", padding: "12px 28px", borderRadius: 10, background: "#84102D", color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}
