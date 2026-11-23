import Link from "next/link"

export default function PlaybookListPage() {
  return (
    <section style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", padding: 24 }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Daftar Playbook</h1>
      <p style={{ fontSize: 13, color: "#475569", marginBottom: 16 }}>
        RENCANA — penyimpanan Playbook ke database memerlukan apply migrasi (izin Owner).
        Daftar akan muncul setelah tabel <code>juara_playbooks</code> aktif.
      </p>
      <Link href="/juara/vision" style={{ display: "inline-block", background: "#064E3B", color: "#FFFFFF", padding: "8px 14px", borderRadius: 4, fontSize: 13, textDecoration: "none" }}>
        Buka Owner Vision Wizard
      </Link>
    </section>
  )
}
