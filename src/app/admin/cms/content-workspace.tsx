"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import {
  Archive, ArrowLeft, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3,
  FileText, History, LayoutDashboard, LoaderCircle, Newspaper, Pencil, Plus, Search,
  Send, Settings2, Sparkles, Trophy, Video, X,
} from "lucide-react"
import { toast } from "sonner"

type Asset = { role?: string; eyebrow?: string; headline?: string; body?: string; tone?: string; image_url?: string | null; url?: string | null }
type ContentItem = {
  id: string; parent_id?: string | null; kind: "ARTICLE" | "SOCIAL"; format: string; title: string;
  slug?: string | null; excerpt?: string | null; body?: string | null; caption?: string | null;
  hashtags?: string[]; platforms?: string[]; category?: string | null; status: string;
  source_url?: string | null; source_name?: string | null; assets?: Asset[];
  scheduled_at?: string | null; published_at?: string | null; archived_at?: string | null;
  created_at: string; updated_at: string;
}
type Activity = { id: string; content_id: string; action: string; from_status?: string | null; to_status?: string | null; created_at: string }
type Candidate = {
  id?: string; title: string; snippet?: string | null; source?: string | null; sourceUrl?: string | null;
  imageUrl?: string | null; publishedAt?: string | null; engine?: string | null; metrics?: Record<string, number | string | null>;
}
type TrendSource = { cached: boolean; items: Candidate[] }
type TrendPool = { date: string; fetchedAt: string; sources: Record<string, TrendSource> }
type Usage = { used: number; limit: number; automatedLimit: number; configured: boolean }
type View = "pipeline" | "calendar" | "history" | "settings"

const STATUS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "border-white/10 bg-white/5 text-[#B5AC8A]" },
  PENDING_REVIEW: { label: "Perlu review", cls: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
  SCHEDULED: { label: "Terjadwal", cls: "border-blue-500/30 bg-blue-500/10 text-blue-300" },
  PUBLISHED: { label: "Tayang", cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
  ARCHIVED: { label: "Arsip", cls: "border-white/10 bg-black/20 text-[#6B6558]" },
  REJECTED: { label: "Ditolak", cls: "border-red-500/30 bg-red-500/10 text-red-300" },
}

const formatDate = (value?: string | null, time = true) => value ? new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric", ...(time ? { hour: "2-digit", minute: "2-digit" } : {}),
}).format(new Date(value)) : "Belum diatur"

const localInput = (value?: string | null) => {
  if (!value) return ""
  const d = new Date(value)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

function StatusBadge({ value }: { value: string }) {
  const tone = STATUS[value] || STATUS.DRAFT
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] ${tone.cls}`}>{tone.label}</span>
}

export function ContentWorkspace() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [usage, setUsage] = useState<Usage>({ used: 0, limit: 100, automatedLimit: 93, configured: false })
  const [pool, setPool] = useState<TrendPool | null>(null)
  const [view, setView] = useState<View>("pipeline")
  const [query, setQuery] = useState("")
  const [kind, setKind] = useState("ALL")
  const [status, setStatus] = useState("ALL")
  const [loading, setLoading] = useState(true)
  const [trendOpen, setTrendOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [selected, setSelected] = useState<ContentItem | null>(null)
  const [pending, startTransition] = useTransition()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [contentResponse, trendResponse] = await Promise.all([fetch("/api/admin/cms", { cache: "no-store" }), fetch("/api/admin/cms/trends", { cache: "no-store" })])
      const content = await contentResponse.json()
      const trends = await trendResponse.json()
      if (!contentResponse.ok) throw new Error(content.error || "CMS gagal dimuat")
      setItems(content.items || [])
      setActivities(content.activities || [])
      setUsage(content.usage || trends.usage || { used: 0, limit: 100, automatedLimit: 93, configured: false })
      setPool(trends.run?.pool || null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "CMS gagal dimuat")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const frame = requestAnimationFrame(() => { void load() })
    return () => cancelAnimationFrame(frame)
  }, [load])

  const counts = useMemo(() => ({
    all: items.length,
    review: items.filter((item) => item.status === "PENDING_REVIEW").length,
    scheduled: items.filter((item) => item.status === "SCHEDULED").length,
    published: items.filter((item) => item.status === "PUBLISHED").length,
  }), [items])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items.filter((item) => {
      const haystack = [item.title, item.category, item.source_name, ...(item.platforms || [])].filter(Boolean).join(" ").toLowerCase()
      return (!needle || haystack.includes(needle)) && (kind === "ALL" || item.kind === kind) && (status === "ALL" || item.status === status)
    })
  }, [items, query, kind, status])

  function scanTrends() {
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/cms/trends", { method: "POST" })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || "Pemindaian tren gagal")
        setPool(result.run.pool)
        setUsage(result.usage)
        setTrendOpen(true)
        toast.success("Kolam tren olahraga hari ini sudah siap")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Pemindaian tren gagal")
      }
    })
  }

  function createFromTrend(candidate: Candidate) {
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/cms", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create_from_trend", candidate }),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || "Paket konten gagal dibuat")
        toast.success("Artikel, Instagram, dan Facebook masuk antrean review")
        setTrendOpen(false)
        await load()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Paket konten gagal dibuat")
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F5F0E8]">
      <header className="sticky top-0 z-40 border-b border-[#2E2C28] bg-[#0D0D0D]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/admin/dashboard" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#2E2C28] bg-[#1A1816] text-[#B5AC8A] hover:border-[#84102D]"><ArrowLeft size={18} /></Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#B5AC8A]"><Trophy size={12} /> Stadione Sports Desk</div>
              <h1 className="truncate text-xl font-bold tracking-[-.03em] sm:text-2xl">Content & CMS</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setManualOpen(true)} className="hidden h-10 items-center gap-2 rounded-xl border border-[#2E2C28] bg-[#1A1816] px-4 text-xs font-bold hover:border-[#B5AC8A]/50 sm:inline-flex"><Plus size={16} /> Buat manual</button>
            <button onClick={pool ? () => setTrendOpen(true) : scanTrends} disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#84102D] px-4 text-xs font-bold text-white shadow-[0_12px_28px_rgba(132,16,45,.24)] hover:bg-[#A51A3A] disabled:opacity-50">
              {pending ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />} {pool ? "Buka tren" : "Ambil tren hari ini"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Kpi label="Semua konten" value={counts.all} icon={LayoutDashboard} onClick={() => { setStatus("ALL"); setView("pipeline") }} />
          <Kpi label="Perlu review" value={counts.review} icon={Pencil} accent="#F59E0B" onClick={() => { setStatus("PENDING_REVIEW"); setView("pipeline") }} />
          <Kpi label="Terjadwal" value={counts.scheduled} icon={Clock3} accent="#60A5FA" onClick={() => { setStatus("SCHEDULED"); setView("pipeline") }} />
          <Kpi label="Sudah tayang" value={counts.published} icon={CheckCircle2} accent="#34D399" onClick={() => { setStatus("PUBLISHED"); setView("pipeline") }} />
          <div className="rounded-2xl border border-[#2E2C28] bg-[#1A1816] p-4">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#B5AC8A]"><span>SearchAPI bulan ini</span><span>{usage.used}/{usage.limit}</span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#242220]"><div className="h-full rounded-full bg-[#84102D]" style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }} /></div>
            <div className="mt-2 text-[10px] text-[#6B6558]">Batas otomatis {usage.automatedLimit}. Cadangan {usage.limit - usage.automatedLimit} request.</div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-[#2E2C28] bg-[#1A1816] p-2 xl:sticky xl:top-24">
            <NavButton active={view === "pipeline"} icon={Newspaper} label="Pipeline konten" onClick={() => setView("pipeline")} />
            <NavButton active={view === "calendar"} icon={CalendarDays} label="Kalender" onClick={() => setView("calendar")} />
            <NavButton active={view === "history"} icon={History} label="Riwayat aktivitas" onClick={() => setView("history")} />
            <NavButton active={view === "settings"} icon={Settings2} label="Engine & koneksi" onClick={() => setView("settings")} />
            <div className="mx-2 my-3 border-t border-[#2E2C28]" />
            <div className="px-3 pb-3 text-[10px] leading-5 text-[#6B6558]">Tone editorial: data-first, energik, dekat dengan komunitas, dan anti-clickbait.</div>
          </aside>

          <section className="min-w-0 rounded-2xl border border-[#2E2C28] bg-[#1A1816]">
            {view === "pipeline" && <Pipeline items={filtered} loading={loading} query={query} setQuery={setQuery} kind={kind} setKind={setKind} status={status} setStatus={setStatus} onEdit={setSelected} />}
            {view === "calendar" && <CalendarView items={items} onEdit={setSelected} />}
            {view === "history" && <HistoryView activities={activities} items={items} />}
            {view === "settings" && <SettingsView usage={usage} pool={pool} onScan={scanTrends} pending={pending} />}
          </section>
        </div>
      </main>

      {trendOpen && <TrendModal pool={pool} pending={pending} onClose={() => setTrendOpen(false)} onRefresh={scanTrends} onCreate={createFromTrend} />}
      {manualOpen && <ManualModal pending={pending} onClose={() => setManualOpen(false)} onCreated={async () => { setManualOpen(false); await load() }} />}
      {selected && <EditorModal item={selected} pending={pending} onClose={() => setSelected(null)} onSaved={async () => { setSelected(null); await load() }} />}
    </div>
  )
}

function Kpi({ label, value, icon: Icon, accent = "#B5AC8A", onClick }: { label: string; value: number; icon: typeof FileText; accent?: string; onClick: () => void }) {
  return <button onClick={onClick} className="rounded-2xl border border-[#2E2C28] bg-[#1A1816] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#84102D]">
    <div className="flex items-center justify-between"><span className="text-[11px] font-bold text-[#6B6558]">{label}</span><Icon size={16} style={{ color: accent }} /></div>
    <div className="mt-3 text-2xl font-bold">{value}</div>
  </button>
}

function NavButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof FileText; label: string; onClick: () => void }) {
  return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold transition ${active ? "bg-[#84102D] text-white" : "text-[#B5AC8A] hover:bg-[#242220] hover:text-[#F5F0E8]"}`}><Icon size={17} /> {label}</button>
}

function Pipeline({ items, loading, query, setQuery, kind, setKind, status, setStatus, onEdit }: {
  items: ContentItem[]; loading: boolean; query: string; setQuery: (v: string) => void; kind: string; setKind: (v: string) => void; status: string; setStatus: (v: string) => void; onEdit: (item: ContentItem) => void;
}) {
  return <>
    <div className="border-b border-[#2E2C28] p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6558]" size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari judul, kategori, sumber..." className="h-11 w-full rounded-xl border border-[#2E2C28] bg-[#0D0D0D] pl-10 pr-3 text-xs outline-none focus:border-[#84102D]" /></div>
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="h-11 rounded-xl border border-[#2E2C28] bg-[#0D0D0D] px-3 text-xs font-bold"><option value="ALL">Semua jenis</option><option value="ARTICLE">Artikel</option><option value="SOCIAL">Social media</option></select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 rounded-xl border border-[#2E2C28] bg-[#0D0D0D] px-3 text-xs font-bold"><option value="ALL">Semua status</option>{Object.entries(STATUS).map(([value, x]) => <option key={value} value={value}>{x.label}</option>)}</select>
      </div>
    </div>
    <div className="divide-y divide-[#2E2C28]">
      {loading ? <Empty icon={LoaderCircle} text="Memuat workspace..." spin /> : items.length ? items.map((item) => <ContentRow key={item.id} item={item} onEdit={() => onEdit(item)} />) : <Empty icon={Search} text="Tidak ada konten yang cocok." />}
    </div>
  </>
}

function ContentRow({ item, onEdit }: { item: ContentItem; onEdit: () => void }) {
  const cover = item.assets?.find((asset) => asset.image_url || asset.url)
  return <button onClick={onEdit} className="grid w-full grid-cols-[56px_minmax(0,1fr)] gap-3 p-4 text-left transition hover:bg-[#242220]/60 sm:grid-cols-[70px_minmax(0,1fr)_160px_125px] sm:items-center sm:p-5">
    <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-xl border border-[#2E2C28] bg-[#0D0D0D] sm:h-[70px] sm:w-[70px]">{cover ? <img src={cover.image_url || cover.url || ""} alt="" className="h-full w-full object-cover" /> : item.kind === "ARTICLE" ? <FileText size={22} className="text-[#B5AC8A]" /> : <Video size={22} className="text-[#B5AC8A]" />}</div>
    <div className="min-w-0">
      <div className="mb-1 flex flex-wrap items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#B5AC8A]">{item.kind === "ARTICLE" ? "Artikel" : `${item.platforms?.join(", ")} · ${item.format}`}</span><span className="sm:hidden"><StatusBadge value={item.status} /></span></div>
      <h3 className="line-clamp-2 text-sm font-bold leading-5 text-[#F5F0E8]">{item.title}</h3>
      <div className="mt-1 truncate text-[10px] text-[#6B6558]">{item.source_name || "Manual"} · {item.category || "Belum dikategorikan"}</div>
    </div>
    <div className="hidden sm:block"><div className="text-[10px] text-[#6B6558]">{item.status === "SCHEDULED" ? "Jadwal tayang" : "Terakhir diubah"}</div><div className="mt-1 text-xs font-semibold text-[#B5AC8A]">{formatDate(item.status === "SCHEDULED" ? item.scheduled_at : item.updated_at)}</div></div>
    <div className="hidden justify-self-end sm:block"><StatusBadge value={item.status} /></div>
  </button>
}

function CalendarView({ items, onEdit }: { items: ContentItem[]; onEdit: (item: ContentItem) => void }) {
  const [cursor, setCursor] = useState(new Date())
  const year = cursor.getFullYear(), month = cursor.getMonth()
  const first = new Date(year, month, 1), start = new Date(year, month, 1 - first.getDay())
  const days = Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  const key = (date: Date | string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(date))
  const byDay = new Map<string, ContentItem[]>()
  items.filter((x) => x.scheduled_at || x.published_at).forEach((item) => { const k = key(item.scheduled_at || item.published_at!); byDay.set(k, [...(byDay.get(k) || []), item]) })
  return <div className="p-4 sm:p-5">
    <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold">Kalender editorial</h2><p className="mt-1 text-xs text-[#6B6558]">Artikel dan konten sosial dalam satu jadwal.</p></div><div className="flex items-center gap-2"><button onClick={() => setCursor(new Date(year, month - 1, 1))} className="grid h-9 w-9 place-items-center rounded-xl border border-[#2E2C28]"><ChevronLeft size={16} /></button><div className="min-w-28 text-center text-xs font-bold">{new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(cursor)}</div><button onClick={() => setCursor(new Date(year, month + 1, 1))} className="grid h-9 w-9 place-items-center rounded-xl border border-[#2E2C28]"><ChevronRight size={16} /></button></div></div>
    <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-[#2E2C28]">{["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map((d) => <div key={d} className="border-b border-[#2E2C28] bg-[#242220] p-2 text-center text-[10px] font-bold text-[#B5AC8A]">{d}</div>)}{days.map((day) => <div key={day.toISOString()} className={`min-h-24 border-b border-r border-[#2E2C28] p-1.5 ${day.getMonth() === month ? "bg-[#0D0D0D]" : "bg-black/30 text-[#6B6558]"}`}><div className="mb-1 text-[10px] font-bold">{day.getDate()}</div>{(byDay.get(key(day)) || []).slice(0, 3).map((item) => <button key={item.id} onClick={() => onEdit(item)} className={`mb-1 block w-full truncate rounded px-1.5 py-1 text-left text-[9px] font-bold ${item.kind === "ARTICLE" ? "bg-[#84102D] text-white" : "bg-[#B5AC8A] text-[#0D0D0D]"}`}>{item.title}</button>)}</div>)}</div>
  </div>
}

function HistoryView({ activities, items }: { activities: Activity[]; items: ContentItem[] }) {
  const names = new Map(items.map((item) => [item.id, item.title]))
  return <div><div className="border-b border-[#2E2C28] p-5"><h2 className="text-lg font-bold">Riwayat aktivitas</h2><p className="mt-1 text-xs text-[#6B6558]">Jejak perubahan status untuk kebutuhan kontrol redaksi.</p></div><div className="divide-y divide-[#2E2C28]">{activities.length ? activities.map((a) => <div key={a.id} className="flex gap-3 p-4 sm:p-5"><div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#84102D]/20 text-[#A51A3A]"><History size={14} /></div><div className="min-w-0"><div className="truncate text-xs font-bold">{names.get(a.content_id) || "Konten"}</div><div className="mt-1 text-[10px] text-[#6B6558]">{a.action.replaceAll("_", " ")} · {a.from_status || "baru"} → {a.to_status || "tetap"} · {formatDate(a.created_at)}</div></div></div>) : <Empty icon={History} text="Belum ada aktivitas." />}</div></div>
}

function SettingsView({ usage, pool, onScan, pending }: { usage: Usage; pool: TrendPool | null; onScan: () => void; pending: boolean }) {
  const sources = [
    ["Google Trends", "Satu snapshot tren olahraga Indonesia per hari", "google_trends_trending_now"],
    ["Google News", "Satu kumpulan berita olahraga terbaru per hari", "google_news"],
    ["TikTok Search", "Satu kumpulan video olahraga Indonesia per hari", "tiktok_search"],
  ]
  return <div className="p-4 sm:p-6"><h2 className="text-lg font-bold">Engine & koneksi</h2><p className="mt-1 text-xs text-[#6B6558]">Konfigurasi dipisahkan dari Meta API agar CMS bisa dipakai sebelum kanal sosial dihubungkan.</p><div className="mt-5 grid gap-3 lg:grid-cols-2"><div className="rounded-2xl border border-[#2E2C28] bg-[#0D0D0D] p-4"><div className="flex items-center justify-between"><div><div className="text-xs font-bold">SearchAPI.io</div><div className="mt-1 text-[10px] text-[#6B6558]">{usage.configured ? "Kunci API terpasang di server" : "Kunci API belum terpasang"}</div></div><span className={`h-2.5 w-2.5 rounded-full ${usage.configured ? "bg-emerald-400" : "bg-amber-400"}`} /></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#242220]"><div className="h-full bg-[#84102D]" style={{ width: `${Math.min(100, usage.used)}%` }} /></div><div className="mt-2 flex justify-between text-[10px] text-[#6B6558]"><span>{usage.used} terpakai</span><span>{usage.limit - usage.used} tersisa</span></div></div><div className="rounded-2xl border border-[#2E2C28] bg-[#0D0D0D] p-4"><div className="text-xs font-bold">Meta API</div><div className="mt-1 text-[10px] leading-5 text-[#6B6558]">Adaptor Instagram dan Facebook sudah disiapkan sebagai status tertunda. Publish sosial tetap dikunci sampai App ID, Page ID, IG User ID, dan token tersedia.</div><div className="mt-3 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-300">Menunggu kredensial</div></div></div><div className="mt-5 space-y-2">{sources.map(([label, description, key]) => <div key={key} className="flex items-center justify-between rounded-xl border border-[#2E2C28] bg-[#0D0D0D] p-3"><div><div className="text-xs font-bold">{label}</div><div className="mt-1 text-[10px] text-[#6B6558]">{description}</div></div><span className="text-[10px] font-bold text-[#B5AC8A]">{pool?.sources?.[key] ? `${pool.sources[key].items.length} item` : "Belum diambil"}</span></div>)}</div><button onClick={onScan} disabled={pending || !usage.configured} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#84102D] px-4 text-xs font-bold disabled:opacity-40">{pending ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />} Sinkronkan kolam tren hari ini</button></div>
}

function TrendModal({ pool, pending, onClose, onRefresh, onCreate }: { pool: TrendPool | null; pending: boolean; onClose: () => void; onRefresh: () => void; onCreate: (candidate: Candidate) => void }) {
  const [source, setSource] = useState("google_news")
  const options = [{ key: "google_news", label: "Google News" }, { key: "google_trends_trending_now", label: "Google Trends" }, { key: "tiktok_search", label: "TikTok" }]
  const items = pool?.sources?.[source]?.items || []
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}><div className="max-h-[94vh] w-full max-w-5xl overflow-hidden rounded-t-3xl border border-[#2E2C28] bg-[#1A1816] sm:rounded-3xl"><div className="flex items-start justify-between border-b border-[#2E2C28] p-5"><div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#B5AC8A]">Daily sports radar</div><h2 className="mt-1 text-xl font-bold">Kolam tren olahraga</h2><p className="mt-1 text-[11px] text-[#6B6558]">Satu hasil harian dipakai bersama untuk 2–3 konten. Tidak ada request tambahan per konten.</p></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl bg-[#242220]"><X size={16} /></button></div><div className="flex gap-2 overflow-x-auto border-b border-[#2E2C28] p-3">{options.map((option) => <button key={option.key} onClick={() => setSource(option.key)} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold ${source === option.key ? "bg-[#84102D] text-white" : "bg-[#242220] text-[#B5AC8A]"}`}>{option.label} <span className="ml-1 opacity-60">{pool?.sources?.[option.key]?.items.length || 0}</span></button>)}<button onClick={onRefresh} disabled={pending} className="ml-auto shrink-0 rounded-xl border border-[#2E2C28] px-3 py-2 text-xs font-bold text-[#B5AC8A] disabled:opacity-40">{pending ? "Sinkronisasi..." : "Refresh cache"}</button></div><div className="max-h-[65vh] overflow-y-auto p-3 sm:p-5"><div className="grid gap-3 md:grid-cols-2">{items.map((candidate, index) => <div key={candidate.id || `${source}-${index}`} className="overflow-hidden rounded-2xl border border-[#2E2C28] bg-[#0D0D0D]"><div className="flex gap-3 p-3">{candidate.imageUrl ? <img src={candidate.imageUrl} alt="" className="h-20 w-24 shrink-0 rounded-xl object-cover" /> : <div className="grid h-20 w-24 shrink-0 place-items-center rounded-xl bg-[#242220] text-[#B5AC8A]"><Trophy size={20} /></div>}<div className="min-w-0"><div className="text-[9px] font-bold uppercase tracking-[.12em] text-[#B5AC8A]">{candidate.source || source}</div><h3 className="mt-1 line-clamp-3 text-xs font-bold leading-5">{candidate.title}</h3></div></div>{candidate.snippet && <p className="line-clamp-3 px-3 pb-3 text-[10px] leading-4 text-[#6B6558]">{candidate.snippet}</p>}<div className="flex items-center justify-between border-t border-[#2E2C28] px-3 py-2"><span className="text-[9px] text-[#6B6558]">Sumber tetap melekat</span><button onClick={() => onCreate(candidate)} disabled={pending} className="rounded-lg bg-[#84102D] px-3 py-2 text-[10px] font-bold text-white disabled:opacity-40">Buat paket konten</button></div></div>)}</div>{!items.length && <Empty icon={Sparkles} text="Belum ada hasil. Sinkronkan kolam tren terlebih dahulu." />}</div></div></div>
}

function ManualModal({ pending, onClose, onCreated }: { pending: boolean; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("")
  const [kind, setKind] = useState("ARTICLE")
  async function submit() { const response = await fetch("/api/admin/cms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create_manual", title, kind, format: kind === "ARTICLE" ? "ARTICLE" : "CAROUSEL" }) }); const result = await response.json(); if (!response.ok) return toast.error(result.error || "Gagal membuat draf"); toast.success("Draf manual dibuat"); onCreated() }
  return <SimpleModal title="Buat draf manual" onClose={onClose}><label className="text-[11px] font-bold text-[#B5AC8A]">Jenis konten</label><select value={kind} onChange={(e) => setKind(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#2E2C28] bg-[#0D0D0D] px-3 text-xs"><option value="ARTICLE">Artikel website</option><option value="SOCIAL">Carousel Instagram</option></select><label className="mt-4 block text-[11px] font-bold text-[#B5AC8A]">Judul kerja</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#2E2C28] bg-[#0D0D0D] px-3 text-xs outline-none focus:border-[#84102D]" placeholder="Tulis judul konten..." /><button onClick={submit} disabled={pending || title.trim().length < 8} className="mt-5 h-11 w-full rounded-xl bg-[#84102D] text-xs font-bold text-white disabled:opacity-40">Buat draf</button></SimpleModal>
}

function EditorModal({ item, pending, onClose, onSaved }: { item: ContentItem; pending: boolean; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState({ title: item.title, excerpt: item.excerpt || "", body: item.body || "", caption: item.caption || "", hashtags: (item.hashtags || []).join(" "), category: item.category || "", scheduled_at: localInput(item.scheduled_at) })
  async function save(action: string) { const response = await fetch("/api/admin/cms", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, action, ...draft, hashtags: draft.hashtags.split(/[\s,]+/).map((tag) => tag.replace(/^#/, "")).filter(Boolean), scheduled_at: draft.scheduled_at ? new Date(draft.scheduled_at).toISOString() : null }) }); const result = await response.json(); if (!response.ok) return toast.error(result.error || "Konten gagal disimpan"); toast.success(action === "publish" ? "Artikel diterbitkan" : action === "schedule" ? "Konten dijadwalkan" : "Perubahan disimpan"); onSaved() }
  return <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}><div className="h-full w-full max-w-3xl overflow-y-auto border-l border-[#2E2C28] bg-[#1A1816]"><div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#2E2C28] bg-[#1A1816]/95 p-5 backdrop-blur"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#B5AC8A]">{item.kind === "ARTICLE" ? "Article editor" : `${item.platforms?.join(", ")} · ${item.format}`}</div><h2 className="mt-1 text-xl font-bold">Edit konten</h2></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl bg-[#242220]"><X size={16} /></button></div><div className="space-y-4 p-5"><Field label="Judul"><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="input" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Kategori"><input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="input" /></Field><Field label="Jadwal tayang"><input type="datetime-local" value={draft.scheduled_at} onChange={(e) => setDraft({ ...draft, scheduled_at: e.target.value })} className="input" /></Field></div>{item.kind === "ARTICLE" ? <><Field label="Ringkasan"><textarea value={draft.excerpt} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} className="textarea min-h-24" /></Field><Field label="Isi artikel (HTML)"><textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} className="textarea min-h-[360px] font-mono text-[11px]" /></Field></> : <><Field label="Caption"><textarea value={draft.caption} onChange={(e) => setDraft({ ...draft, caption: e.target.value })} className="textarea min-h-36" /></Field><Field label="Hashtag"><input value={draft.hashtags} onChange={(e) => setDraft({ ...draft, hashtags: e.target.value })} className="input" placeholder="#Stadione #OlahragaIndonesia" /></Field>{item.format === "CAROUSEL" && <div><div className="mb-2 text-[11px] font-bold text-[#B5AC8A]">Preview struktur carousel</div><div className="flex gap-3 overflow-x-auto pb-2">{(item.assets || []).map((asset, index) => <SlidePreview key={index} asset={asset} index={index} />)}</div></div>}</>}<div className="rounded-xl border border-[#2E2C28] bg-[#0D0D0D] p-3 text-[10px] leading-5 text-[#6B6558]">Sumber: {item.source_name || "Manual"}{item.source_url && <> · <a href={item.source_url} target="_blank" rel="noreferrer" className="text-[#B5AC8A] underline">buka sumber asli</a></>}</div><div className="flex flex-wrap gap-2 border-t border-[#2E2C28] pt-4"><Action label="Simpan draf" icon={Pencil} onClick={() => save("draft")} pending={pending} /><Action label="Kirim review" icon={Send} onClick={() => save("review")} pending={pending} /><Action label="Jadwalkan" icon={Clock3} onClick={() => save("schedule")} pending={pending} disabled={!draft.scheduled_at} />{item.kind === "ARTICLE" && <Action label="Publish" icon={CheckCircle2} onClick={() => save("publish")} pending={pending} primary />}<Action label="Arsipkan" icon={Archive} onClick={() => save("archive")} pending={pending} /></div></div></div></div>
}

function SlidePreview({ asset, index }: { asset: Asset; index: number }) {
  const colors = asset.tone === "burgundy" ? "bg-[#84102D] text-white" : asset.tone === "sand" ? "bg-[#B5AC8A] text-[#0D0D0D]" : "bg-[#0D0D0D] text-[#F5F0E8]"
  return <div className={`relative aspect-square w-52 shrink-0 overflow-hidden rounded-2xl border border-[#2E2C28] p-4 ${colors}`}>{asset.image_url && <img src={asset.image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />}<div className="relative flex h-full flex-col justify-between"><div className="text-[8px] font-bold uppercase tracking-[.16em] opacity-70">{asset.eyebrow || `Slide ${index + 1}`}</div><div><div className="text-lg font-bold leading-tight">{asset.headline}</div><div className="mt-2 line-clamp-4 text-[9px] leading-4 opacity-80">{asset.body}</div></div><div className="text-[8px] font-bold uppercase tracking-[.15em]">STADIONE</div></div></div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-[11px] font-bold text-[#B5AC8A]">{label}</span>{children}</label> }
function Action({ label, icon: Icon, onClick, pending, primary, disabled }: { label: string; icon: typeof FileText; onClick: () => void; pending: boolean; primary?: boolean; disabled?: boolean }) { return <button onClick={onClick} disabled={pending || disabled} className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-[11px] font-bold disabled:opacity-35 ${primary ? "bg-[#84102D] text-white" : "border border-[#2E2C28] bg-[#0D0D0D] text-[#B5AC8A]"}`}><Icon size={14} /> {label}</button> }
function Empty({ icon: Icon, text, spin }: { icon: typeof FileText; text: string; spin?: boolean }) { return <div className="px-5 py-16 text-center"><Icon size={24} className={`mx-auto text-[#6B6558] ${spin ? "animate-spin" : ""}`} /><p className="mt-3 text-xs font-bold text-[#6B6558]">{text}</p></div> }
function SimpleModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}><div className="w-full max-w-md rounded-t-3xl border border-[#2E2C28] bg-[#1A1816] p-5 sm:rounded-3xl"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">{title}</h2><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl bg-[#242220]"><X size={16} /></button></div><div className="mt-5">{children}</div></div></div> }
