import OwnerWizard from "@/components/juara/OwnerWizard"

export default function OwnerVisionPage() {
  return (
    <section style={{ display: "flex", gap: 16 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Owner Vision &amp; Playbook</h1>
        <OwnerWizard />
      </div>
      <aside style={{ width: 440, background: "#FFFFFF", border: "1px solid #E2E8F0", padding: 16, flexShrink: 0 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Live Summary</h2>
        <p style={{ fontSize: 12, color: "#475569" }}>
          Ringkasan angka akan tampil setelah Playbook dihasilkan. Semua nilai berasal dari
          engine rumus — bukan input hardcode.
        </p>
      </aside>
    </section>
  )
}
