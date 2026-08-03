"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { C } from "@/lib/design"
import { Plus, Edit3, Trash2, Package, Crown, Users } from "lucide-react"

export default function WorkspaceMembers() {
  const { slug } = useParams<{ slug: string }>()
  const [venue, setVenue] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [tab, setTab] = useState<"members" | "plans" | "packages">("members")
  const [showForm, setShowForm] = useState<"plan" | "package" | null>(null)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [msg, setMsg] = useState("")
  const supabase = createClient()

  useEffect(() => {
    supabase.from("venues").select("id, name").eq("slug", slug).single().then(({ data: v }: any) => {
      if (!v) return
      setVenue(v)
      loadData(v.id)
    })
  }, [slug])

  function loadData(vid: string) {
    supabase.from("members").select("*, plans:plan_id(name, tier_level)").eq("venue_id", vid).order("created_at", { ascending: false }).limit(50).then(({ data }: any) => setMembers(data || []))
    supabase.from("membership_plans").select("*").eq("venue_id", vid).order("tier_level").then(({ data }: any) => setPlans(data || []))
    supabase.from("visit_packages").select("*").eq("venue_id", vid).order("visit_count").then(({ data }: any) => setPackages(data || []))
  }

  function openForm(type: "plan" | "package", item?: any) {
    setEditItem(item || null)
    setForm(item ? { ...item } : type === "plan" ? { name: "", tier_level: 1, price: "", billing_cycle: "monthly", benefits: "{}", is_active: true } : { name: "", visit_count: 1, price: "", validity_days: 90, is_active: true })
    setShowForm(type)
  }

  async function savePlan() {
    if (!venue) return
    const data = { ...form, venue_id: venue.id, price: Number(form.price), tier_level: Number(form.tier_level), benefits: typeof form.benefits === "string" ? JSON.parse(form.benefits) : form.benefits }
    if (editItem) await supabase.from("membership_plans").update(data).eq("id", editItem.id)
    else await supabase.from("membership_plans").insert(data)
    setShowForm(null); setMsg("Paket disimpan!"); loadData(venue.id); setTimeout(() => setMsg(""), 2000)
  }

  async function savePackage() {
    if (!venue) return
    const data = { ...form, venue_id: venue.id, price: Number(form.price), visit_count: Number(form.visit_count), validity_days: Number(form.validity_days) }
    if (editItem) await supabase.from("visit_packages").update(data).eq("id", editItem.id)
    else await supabase.from("visit_packages").insert(data)
    setShowForm(null); setMsg("Paket kunjungan disimpan!"); loadData(venue.id); setTimeout(() => setMsg(""), 2000)
  }

  async function deleteItem(type: "plan" | "package", id: string) {
    await supabase.from(type === "plan" ? "membership_plans" : "visit_packages").delete().eq("id", id)
    loadData(venue.id)
  }

  const tb = (t: string) => ({ flex: 1, padding: "10px 8px", borderRadius: 8, border: "none", background: tab === t ? C.primary : "transparent", color: tab === t ? "#fff" : C.textMuted, fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "center" as any })
  const inputStyle = { width: "100%", padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" as any, marginBottom: 10 }
  const btnStyle = { width: "100%", padding: "12px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#141210", borderRadius: 10, padding: 4 }}>
        <button onClick={() => setTab("members")} style={tb("members")}><Users size={14} style={{ marginRight: 4 }} />Member</button>
        <button onClick={() => setTab("plans")} style={tb("plans")}><Crown size={14} style={{ marginRight: 4 }} />Paket</button>
        <button onClick={() => setTab("packages")} style={tb("packages")}><Package size={14} style={{ marginRight: 4 }} />Kunjungan</button>
      </div>

      {msg && <div style={{ background: "#1B3A1D", color: "#4CAF50", padding: 8, borderRadius: 8, fontSize: 12, textAlign: "center", marginBottom: 12 }}>{msg}</div>}

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div style={{ background: C.surface, borderRadius: 16, padding: 24, maxWidth: 400, width: "100%", maxHeight: "80vh", overflow: "auto", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>{editItem ? "Edit" : "Tambah"} {showForm === "plan" ? "Paket Membership" : "Paket Kunjungan"}</div>
            <label style={{ fontSize: 12, color: C.textSec, display: "block", marginBottom: 4 }}>Nama</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
            {showForm === "plan" ? (
              <>
                <label style={{ fontSize: 12, color: C.textSec, display: "block", marginBottom: 4 }}>Tier (1-5)</label>
                <input type="number" min={1} max={5} value={form.tier_level} onChange={e => setForm({ ...form, tier_level: e.target.value })} style={inputStyle} />
                <label style={{ fontSize: 12, color: C.textSec, display: "block", marginBottom: 4 }}>Billing</label>
                <select value={form.billing_cycle} onChange={e => setForm({ ...form, billing_cycle: e.target.value })} style={{ ...inputStyle, background: C.elevated }}>
                  <option value="monthly">Bulanan</option>
                  <option value="quarterly">3 Bulan</option>
                  <option value="yearly">Tahunan</option>
                </select>
                <label style={{ fontSize: 12, color: C.textSec, display: "block", marginBottom: 4 }}>Benefits (JSON)</label>
                <input value={typeof form.benefits === "string" ? form.benefits : JSON.stringify(form.benefits)} onChange={e => setForm({ ...form, benefits: e.target.value })} style={inputStyle} />
              </>
            ) : (
              <>
                <label style={{ fontSize: 12, color: C.textSec, display: "block", marginBottom: 4 }}>Jumlah Kunjungan</label>
                <input type="number" min={1} value={form.visit_count} onChange={e => setForm({ ...form, visit_count: e.target.value })} style={inputStyle} />
                <label style={{ fontSize: 12, color: C.textSec, display: "block", marginBottom: 4 }}>Masa Berlaku (hari)</label>
                <input type="number" min={1} value={form.validity_days} onChange={e => setForm({ ...form, validity_days: e.target.value })} style={inputStyle} />
              </>
            )}
            <label style={{ fontSize: 12, color: C.textSec, display: "block", marginBottom: 4 }}>Harga (Rp)</label>
            <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={inputStyle} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowForm(null)} style={{ ...btnStyle, background: "transparent", border: `1px solid ${C.border}`, color: C.text, width: "auto", flex: 1 }}>Batal</button>
              <button onClick={showForm === "plan" ? savePlan : savePackage} style={{ ...btnStyle, width: "auto", flex: 1 }}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {tab === "members" && (
        <div>
          {members.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: C.textMuted, fontSize: 13 }}>Belum ada member</div> :
            members.map((m: any) => (
              <div key={m.id} style={{ background: C.surface, borderRadius: 14, padding: 12, border: `1px solid ${C.border}`, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{m.plans?.name || "Member"}</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>Exp {new Date(m.end_date).toLocaleDateString("id-ID")}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: m.status === "active" ? "#1B3A1D" : "#3A1515", color: m.status === "active" ? "#4CAF50" : "#C62828" }}>{m.status}</span>
              </div>
            ))}
        </div>
      )}

      {/* Plans Tab */}
      {tab === "plans" && (
        <div>
          <button onClick={() => openForm("plan")} style={{ ...btnStyle, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Plus size={14} />Tambah Paket</button>
          {plans.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: C.textMuted, fontSize: 13 }}>Belum ada paket membership</div> :
            plans.map((p: any) => (
              <div key={p.id} style={{ background: C.surface, borderRadius: 14, padding: 12, border: `1px solid ${C.border}`, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>Tier {p.tier_level} · {p.billing_cycle === "monthly" ? "Bulanan" : p.billing_cycle === "quarterly" ? "3 Bulan" : "Tahunan"}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.accent, marginTop: 4 }}>Rp {Number(p.price).toLocaleString("id-ID")}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => openForm("plan", p)} style={{ padding: 6, borderRadius: 8, border: "none", background: "transparent", color: C.accent, cursor: "pointer" }}><Edit3 size={14} /></button>
                    <button onClick={() => deleteItem("plan", p.id)} style={{ padding: 6, borderRadius: 8, border: "none", background: "transparent", color: C.danger, cursor: "pointer" }}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Visit Packages Tab */}
      {tab === "packages" && (
        <div>
          <button onClick={() => openForm("package")} style={{ ...btnStyle, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Plus size={14} />Tambah Paket Kunjungan</button>
          {packages.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: C.textMuted, fontSize: 13 }}>Belum ada paket kunjungan</div> :
            packages.map((p: any) => (
              <div key={p.id} style={{ background: C.surface, borderRadius: 14, padding: 12, border: `1px solid ${C.border}`, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{p.visit_count}x Kunjungan · {p.validity_days} hari</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.accent, marginTop: 4 }}>Rp {Number(p.price).toLocaleString("id-ID")}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => openForm("package", p)} style={{ padding: 6, borderRadius: 8, border: "none", background: "transparent", color: C.accent, cursor: "pointer" }}><Edit3 size={14} /></button>
                    <button onClick={() => deleteItem("package", p.id)} style={{ padding: 6, borderRadius: 8, border: "none", background: "transparent", color: C.danger, cursor: "pointer" }}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
