export default function JuaraHome() {
  return (
    <section style={{ display: "flex", gap: 16 }}>
      <div style={{ flex: 1, background: "#FFFFFF", border: "1px solid #E2E8F0", padding: 16, minHeight: 320 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Boardroom Inbox</h1>
        <p style={{ fontSize: 13, color: "#475569" }}>
          Ruang kerja eksekutif klub. Mulai dari Owner Vision &amp; Playbook untuk mengunci arah strategis,
          lalu hasilkan cetak biru skuad dan keuangan.
        </p>
        <a href="/juara/vision" style={{ display: "inline-block", marginTop: 16, background: "#064E3B", color: "#FFFFFF", padding: "8px 14px", borderRadius: 4, fontSize: 13 }}>
          Buka Owner Vision Wizard
        </a>
      </div>
      <aside style={{ width: 440, background: "#FFFFFF", border: "1px solid #E2E8F0", padding: 16, flexShrink: 0 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Inspector</h2>
        <p style={{ fontSize: 12, color: "#475569" }}>Pilih baris untuk melihat rincian tanpa kehilangan konteks daftar.</p>
      </aside>
    </section>
  )
}
