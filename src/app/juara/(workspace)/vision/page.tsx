import OwnerWizard from "@/components/juara/OwnerWizard"
import { Info } from "lucide-react"

export default function OwnerVisionPage() {
  return (
    <>
      <div className="ju-pagehead">
        <h2>Owner Vision</h2>
        <p>Lima keputusan fondasi sebelum playbook klub Anda dibuat.</p>
      </div>
      <div className="ju-vision-layout">
        <OwnerWizard />
        <aside className="ju-card ju-vision-aside">
          <h3><Info size={15} aria-hidden="true" /> Catatan</h3>
          <p className="ju-inline-note">
            Hasil dihasilkan oleh engine rumus JUARA, bukan angka hardcode. Simpan playbook
            untuk memasukkannya ke arsip klub, atau unduh PDF untuk rapat pengurus.
          </p>
          <p className="ju-inline-note" style={{ marginTop: 14 }}>
            Perubahan pada wizard tidak akan memperbarui playbook yang sudah tersimpan.
          </p>
        </aside>
      </div>
    </>
  )
}
