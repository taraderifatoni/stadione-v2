"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { C } from "@/lib/design"
import { Plus, Edit3, Trash2, GraduationCap, Users, BookOpen } from "lucide-react"

export default function WorkspaceAcademy() {
  const { slug } = useParams<{ slug: string }>()
  const [venue, setVenue] = useState<any>(null)
  const [academy, setAcademy] = useState<any>(null)
  const [programs, setPrograms] = useState<any[]>([])
  const [coaches, setCoaches] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [tab, setTab] = useState<"programs" | "coaches" | "students">("programs")
  const [showForm, setShowForm] = useState<"program" | "coach" | null>(null)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [msg, setMsg] = useState("")
  const supabase = createClient()

  useEffect(() => {
    supabase.from("venues").select("id, name").eq("slug", slug).single().then(({ data: v }: any) => {
      if (!v) return
      setVenue(v)
      supabase.from("academies").select("*").eq("venue_id", v.id).single().then(({ data: a }: any) => {
        setAcademy(a || null)
        if (a) {
          supabase.from("programs").select("*").eq("academy_id", a.id).order("created_at", { ascending: false }).then(({ data: p }: any) => setPrograms(p || []))
          supabase.from("coaches").select("*").eq("venue_id", v.id).order("created_at", { ascending: false }).then(({ data: c }: any) => setCoaches(c || []))
          supabase.from("students").select("*").eq("academy_id", a.id).order("created_at", { ascending: false }).limit(30).then(({ data: s }: any) => setStudents(s || []))
        }
      })
    })
  }, [slug])

  async function createAcademy() {
    if (!venue) return
    const { data, error } = await supabase.from("academies").insert({ venue_id: venue.id, name: `${venue.name} Academy` }).select().single()
    if (error) { setMsg(error.message); return }
    setAcademy(data); setMsg("Akademi dibuat!")
  }

  function openForm(type: "program" | "coach", item?: any) {
    setEditItem(item || null)
    setForm(type === "program"
      ? (item ? { ...item } : { name: "", schedule: "", price: "", max_capacity: "", description: "", is_active: true })
      : (item ? { ...item } : { name: "", specialization: "", contact: "", is_active: true }))
    setShowForm(type)
  }

  async function saveItem() {
    if (!academy) return
    if (showForm === "program") {
      const data = { ...form, academy_id: academy.id, price: Number(form.price) || 0, max_capacity: Number(form.max_capacity) || null }
      if (editItem) await supabase.from("programs").update(data).eq("id", editItem.id)
      else await supabase.from("programs").insert(data)
      supabase.from("programs").select("*").eq("academy_id", academy.id).order("created_at", { ascending: false }).then(({ data: p }: any) => setPrograms(p || []))
    } else {
      const data = { ...form, venue_id: venue.id }
      if (editItem) await supabase.from("coaches").update(data).eq("id", editItem.id)
      else await supabase.from("coaches").insert(data)
      supabase.from("coaches").select("*").eq("venue_id", venue.id).order("created_at", { ascending: false }).then(({ data: c }: any) => setCoaches(c || []))
    }
    setShowForm(null); setMsg("Disimpan!")
  }

  async function deleteItem(type: "program" | "coach", id: string) {
    await supabase.from(type === "program" ? "programs" : "coaches").delete().eq("id", id)
    if (type === "program") setPrograms(programs.filter(p => p.id !== id))
    else setCoaches(coaches.filter(c => c.id !== id))
  }

  const tb = (t: string) => ({ flex: 1, padding: "10px 8px", borderRadius: 8, border: "none", background: tab === t ? C.primary : "transparent", color: tab === t ? "#fff" : C.textMuted, fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "center" as any })
  const is = { width: "100%", padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" as any, marginBottom: 10 }
  const bs = { width: "100%", padding: "12px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }

  return (
    <div style={{ padding: 16 }}>
      {msg && <div style={{ background: "#1B3A1D", color: "#4CAF50", padding: 8, borderRadius: 8, fontSize: 12, textAlign: "center", marginBottom: 12 }}>{msg}</div>}

      {!academy ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <GraduationCap size={48} color={C.textMuted} style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 4 }}>Belum ada akademi</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>Buat akademi untuk venue ini</div>
          <button onClick={createAcademy} style={bs}>Buat Akademi</button>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
            {[[BookOpen, "Program", programs.length], [Users, "Coach", coaches.length], [GraduationCap, "Murid", students.length]].map(([Icon, l, v]: any, i) => (
              <div key={i} style={{ background: C.surface, borderRadius: 14, padding: 10, border: `1px solid ${C.border}`, textAlign: "center" }}>
                <Icon size={18} color={C.accent} style={{ marginBottom: 4 }} />
                <div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>{v}</div><div style={{ fontSize: 11, color: C.textMuted }}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 4, marginBottom: 12, background: "#141210", borderRadius: 10, padding: 4 }}>
            <button onClick={() => setTab("programs")} style={tb("programs")}>Program</button>
            <button onClick={() => setTab("coaches")} style={tb("coaches")}>Coach</button>
            <button onClick={() => setTab("students")} style={tb("students")}>Murid</button>
          </div>

          {(tab === "programs" || tab === "coaches") && (
            <button onClick={() => openForm(tab === "programs" ? "program" : "coach")} style={{ ...bs, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Plus size={14} />Tambah {tab === "programs" ? "Program" : "Coach"}</button>
          )}

          {tab === "programs" && (programs.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: C.textMuted, fontSize: 13 }}>Belum ada program</div> : programs.map((p: any) => (
            <div key={p.id} style={{ background: C.surface, borderRadius: 14, padding: 12, border: `1px solid ${C.border}`, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.name}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{p.schedule || "-"} · Kapasitas {p.max_capacity || "∞"}</div>
                {p.price > 0 && <div style={{ fontSize: 13, fontWeight: 600, color: C.accent }}>Rp {Number(p.price).toLocaleString("id-ID")}</div>}
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => openForm("program", p)} style={{ padding: 6, borderRadius: 8, border: "none", background: "transparent", color: C.accent, cursor: "pointer" }}><Edit3 size={14} /></button>
                <button onClick={() => deleteItem("program", p.id)} style={{ padding: 6, borderRadius: 8, border: "none", background: "transparent", color: C.danger, cursor: "pointer" }}><Trash2 size={14} /></button>
              </div>
            </div>
          )))}

          {tab === "coaches" && (coaches.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: C.textMuted, fontSize: 13 }}>Belum ada coach</div> : coaches.map((c: any) => (
            <div key={c.id} style={{ background: C.surface, borderRadius: 14, padding: 12, border: `1px solid ${C.border}`, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{c.name}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{c.specialization || "-"} · {c.contact || "-"}</div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => openForm("coach", c)} style={{ padding: 6, borderRadius: 8, border: "none", background: "transparent", color: C.accent, cursor: "pointer" }}><Edit3 size={14} /></button>
                <button onClick={() => deleteItem("coach", c.id)} style={{ padding: 6, borderRadius: 8, border: "none", background: "transparent", color: C.danger, cursor: "pointer" }}><Trash2 size={14} /></button>
              </div>
            </div>
          )))}

          {tab === "students" && (students.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: C.textMuted, fontSize: 13 }}>Belum ada murid</div> : students.map((s: any) => (
            <div key={s.id} style={{ background: C.surface, borderRadius: 14, padding: 12, border: `1px solid ${C.border}`, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{s.name}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{s.age_group || "Semua umur"}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: s.status === "active" ? "#1B3A1D" : "#3A1515", color: s.status === "active" ? "#4CAF50" : "#C62828" }}>{s.status}</span>
            </div>
          )))}
        </>
      )}

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div style={{ background: C.surface, borderRadius: 16, padding: 24, maxWidth: 400, width: "100%", maxHeight: "80vh", overflow: "auto", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>{editItem ? "Edit" : "Tambah"} {showForm === "program" ? "Program" : "Coach"}</div>
            <label style={{ fontSize: 12, color: C.textSec, display: "block", marginBottom: 4 }}>Nama</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={is} />
            {showForm === "program" ? (
              <>
                <label style={{ fontSize: 12, color: C.textSec, display: "block", marginBottom: 4 }}>Jadwal</label>
                <input value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} placeholder="Senin & Rabu 16:00-18:00" style={is} />
                <label style={{ fontSize: 12, color: C.textSec, display: "block", marginBottom: 4 }}>Harga (Rp)</label>
                <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={is} />
                <label style={{ fontSize: 12, color: C.textSec, display: "block", marginBottom: 4 }}>Kapasitas Maks</label>
                <input type="number" value={form.max_capacity} onChange={e => setForm({ ...form, max_capacity: e.target.value })} style={is} />
                <label style={{ fontSize: 12, color: C.textSec, display: "block", marginBottom: 4 }}>Deskripsi</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={is} />
              </>
            ) : (
              <>
                <label style={{ fontSize: 12, color: C.textSec, display: "block", marginBottom: 4 }}>Spesialisasi</label>
                <input value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} style={is} />
                <label style={{ fontSize: 12, color: C.textSec, display: "block", marginBottom: 4 }}>Kontak</label>
                <input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} style={is} />
              </>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowForm(null)} style={{ ...bs, background: "transparent", border: `1px solid ${C.border}`, color: C.text, width: "auto", flex: 1 }}>Batal</button>
              <button onClick={saveItem} style={{ ...bs, width: "auto", flex: 1 }}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
