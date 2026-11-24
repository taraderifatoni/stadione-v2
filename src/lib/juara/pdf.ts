import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import type { generatePlaybookSummary } from "./playbook.ts"

type Summary = ReturnType<typeof generatePlaybookSummary>
type GStateLike = Parameters<jsPDF["setGState"]>[0]
interface PdfDocExtension {
  GState: new (options: { opacity: number }) => GStateLike
  lastAutoTable: { finalY: number }
}

export async function buildBoardroomPdf(
  summary: Summary,
  meta: { downloader: string; role: string; timestamp: string }
): Promise<Uint8Array> {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const ext = doc as unknown as PdfDocExtension
  const watermark = `RAHASIA — ${meta.downloader} | ${meta.role} | ${meta.timestamp}`

  const addWatermark = () => {
    const pages = doc.getNumberOfPages()
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i)
      doc.saveGraphicsState()
      doc.setGState(new ext.GState({ opacity: 0.08 }))
      doc.setFontSize(28)
      doc.setTextColor(15, 23, 42)
      doc.text(watermark, 105, 148, { angle: 45, align: "center" })
      doc.restoreGraphicsState()
    }
  }

  doc.setFontSize(16)
  doc.text("Master Club Playbook — JUARA.STADIONE.PRO", 14, 18)
  doc.setFontSize(10)
  doc.text(`Horizon: ${summary.horizonYears} tahun | Tactical DNA: ${summary.tacticalDna}`, 14, 26)
  doc.text(`Total slot skuad: ${summary.totalSlots}`, 14, 32)

  autoTable(doc, {
    startY: 40,
    head: [["Kelompok Usia", "Persen", "Slot"]],
    body: summary.ageMatrix.map((b) => [b.bracket, `${b.percent}%`, String(b.slots)]),
  })

  autoTable(doc, {
    startY: ext.lastAutoTable.finalY + 8,
    head: [["Grade", "Kuota", "Beban Gaji"]],
    body: [
      ["A", summary.gradeQuota.A.join("–"), "45–50%"],
      ["B", summary.gradeQuota.B.join("–"), "35–40%"],
      ["C", summary.gradeQuota.C.join("–"), "10–15%"],
    ],
  })

  autoTable(doc, {
    startY: ext.lastAutoTable.finalY + 8,
    head: [["SCR Status", "Nilai"]],
    body: [["Status", summary.scrStatus]],
  })

  addWatermark()
  const buffer = doc.output("arraybuffer") as ArrayBuffer
  return new Uint8Array(buffer)
}
