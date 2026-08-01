"use client"

import { useRouter } from "next/navigation"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft, Star, Download } from "lucide-react"
import jsPDF from "jspdf"

const Card = ({ children, style }: any) => <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, ...style }}>{children}</div>

export default function AcademyReportPage() {
  const router = useRouter()
  const cats = [
    { name: "Teknik dasar", weight: 30, items: [{ n: "Dribbling", s: 4 }, { n: "Passing", s: 3 }, { n: "Shooting", s: 4 }, { n: "First touch", s: 3 }] },
    { name: "Fisik", weight: 25, items: [{ n: "Kecepatan", s: 4 }, { n: "Daya tahan", s: 3 }, { n: "Kekuatan", s: 3 }] },
    { name: "Taktik", weight: 20, items: [{ n: "Posisi", s: 4 }, { n: "Keputusan", s: 3 }, { n: "Kerjasama", s: 4 }] },
    { name: "Mental", weight: 25, items: [{ n: "Disiplin", s: 5 }, { n: "Semangat", s: 4 }, { n: "Kepemimpinan", s: 3 }] },
  ]

  function handlePDF() {
    const doc = new jsPDF(); let y = 20
    doc.setFontSize(18); doc.text("Raport Akademi", 105, y, { align: "center" }); y += 10
    doc.setFontSize(12); doc.text("Ahmad - U-14 Elite | Juli 2026", 105, y, { align: "center" }); y += 8
    doc.setFontSize(36); doc.setTextColor("#4CAF50"); doc.text("3.8", 105, y, { align: "center" }); y += 12
    doc.setFontSize(10); doc.setTextColor("#000000")
    cats.forEach(cat => { doc.setFontSize(12); doc.text(`${cat.name} (${cat.weight}%)`, 20, y); y += 6
      cat.items.forEach(it => { doc.setFontSize(10); doc.text(`${it.n}: ${"*".repeat(it.s)}${"-".repeat(5-it.s)}`, 25, y); y += 5 }); y += 3 })
    doc.text("Coach: Andi - 30 Jul 2026  |  Direktur: Rudi - 31 Jul 2026", 105, doc.internal.pageSize.height - 15, { align: "center" })
    doc.save("raport-ahmad-juli-2026.pdf")
  }

  return (
    <div>
      <TopBar title="Raport Juli 2026" sub="Ahmad - U-14 Elite" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} />
      <div style={{ padding: "0 16px 16px" }}>
        <button onClick={handlePDF} style={{ width: "100%", padding: "12px 20px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 16 }}>
          <Download size={16} />Download PDF
        </button>
        <Card style={{ textAlign: "center", marginBottom: 16, background: C.elevated }}>
          <div style={{ fontSize: 11, color: C.textMuted }}>Nilai total</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#4CAF50" }}>3.8</div>
          <div style={{ fontSize: 12, color: C.textMuted }}>dari 5.0</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 8 }}>
            {[1,2,3,4,5].map(i => <Star key={i} size={16} color={i<=4?"#FFB300":C.textMuted} fill={i<=4?"#FFB300":"none"} />)}
          </div>
        </Card>
        {cats.map((cat, ci) => (
          <Card key={ci} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{cat.name}</span>
              <span style={{ fontSize: 11, color: C.textMuted }}>Bobot {cat.weight}%</span>
            </div>
            {cat.items.map((it, ii) => (
              <div key={ii} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                <span style={{ fontSize: 13, color: C.textSec }}>{it.n}</span>
                <div style={{ display: "flex", gap: 3 }}>
                  {[1,2,3,4,5].map(v => <div key={v} style={{ width: 20, height: 20, borderRadius: 4, background: v<=it.s?C.primaryLight:C.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: v<=it.s?"#fff":C.textMuted, fontWeight: 600 }}>{v}</div>)}
                </div>
              </div>
            ))}
          </Card>
        ))}
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, textAlign: "center", padding: 12, background: C.elevated, borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Coach: Andi</div>
            <div style={{ fontSize: 10, color: C.textMuted }}>30 Jul 2026</div>
          </div>
          <div style={{ flex: 1, textAlign: "center", padding: 12, background: C.elevated, borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Direktur: Rudi</div>
            <div style={{ fontSize: 10, color: C.textMuted }}>31 Jul 2026</div>
          </div>
        </div>
      </div>
    </div>
  )
}
