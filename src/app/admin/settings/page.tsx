"use client"

import { useEffect, useState } from "react"
import { TopBar } from "@/components/shared/TopBar"
import { C } from "@/lib/design"
import { ChevronLeft, Megaphone, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AdminSettings() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [msg, setMsg] = useState("")
  const router = useRouter()
  const H = {"apikey":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4NTI1MjYwMCwiZXhwIjo0OTQwOTI2MjAwLCJyb2xlIjoiYW5vbiJ9.WoeLAuy5jLAlVVQfKJKIIrb870Bt3ZwKtmyBvvksLBY"}
  const KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4NTI1MjYwMCwiZXhwIjo0OTQwOTI2MjAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.oUao5PgOUj94c0DzF_5lmw5eudjaaN8dwjTe9GR9-1Q"

  useEffect(() => {
    fetch("https://api.stadione.pro/rest/v1/platform_announcements?select=*&order=created_at.desc&limit=20", {headers:H})
      .then(r => r.json()).then(setAnnouncements)
  }, [])

  async function create() {
    if (!title) return
    await fetch("https://api.stadione.pro/rest/v1/platform_announcements", {
      method: "POST",
      headers: {"apikey":KEY,"Authorization":"Bearer "+KEY,"Content-Type":"application/json"},
      body: JSON.stringify({title, body, type:"info", is_active:true})
    })
    const r = await fetch("https://api.stadione.pro/rest/v1/platform_announcements?select=*", {headers:H}).then(r => r.json())
    setAnnouncements(r); setShowForm(false); setTitle(""); setBody("")
    setMsg("Pengumuman dibuat!"); setTimeout(() => setMsg(""), 3000)
  }

  return (
    <div>
      <TopBar title="Pengaturan" left={<ChevronLeft size={20} color={C.text} onClick={() => router.back()} style={{ cursor: "pointer" }} />} right={<Plus size={18} color={C.primaryLight} onClick={() => setShowForm(true)} style={{ cursor: "pointer" }} />} />
      <div style={{ padding: "0 16px 16px" }}>
        {msg && <div style={{ fontSize: 12, color: "#4CAF50", marginBottom: 12 }}>{msg}</div>}
        {showForm && (
          <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 12 }}>
            <input placeholder="Judul pengumuman" value={title} onChange={e => setTitle(e.target.value)} style={{ width: "100%", padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
            <textarea placeholder="Isi pengumuman" value={body} onChange={e => setBody(e.target.value)} rows={3} style={{ width: "100%", padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", resize: "vertical", marginBottom: 8 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 14, cursor: "pointer" }}>Batal</button>
              <button onClick={create} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Buat</button>
            </div>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <Megaphone size={14} color={C.primaryLight} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Pengumuman</span>
        </div>
        {announcements.map((a: any) => (
          <div key={a.id} style={{ background: C.surface, borderRadius: 14, padding: 12, border: `1px solid ${C.border}`, marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{a.title}</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{a.body}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
