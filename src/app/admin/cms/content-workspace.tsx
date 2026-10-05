"use client"

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import Link from "next/link"
import {
  Archive, ArrowLeft, BookmarkPlus, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, ExternalLink,
  FileText, History, LayoutDashboard, LoaderCircle, Newspaper, Pencil, Plus, Search,
  Send, Settings2, Sparkles, Trash2, Trophy, Video, X,
} from "lucide-react"
import { toast } from "sonner"
import { WEEKLY_MATRIX, type EditorialSlot } from "@/lib/cms/editorial"

type Asset = { video_url?: string | null; type?: string; eyebrow?: string; headline?: string; body?: string; tone?: string; image_url?: string | null; url?: string | null }
type ContentItem = {
  id: string; parent_id?: string | null; kind: "ARTICLE" | "SOCIAL"; format: string; title: string;
  slug?: string | null; excerpt?: string | null; body?: string | null; caption?: string | null;
  hashtags?: string[]; platforms?: string[]; category?: string | null; status: string;
  source_url?: string | null; source_name?: string | null; assets?: Asset[];
  scheduled_at?: string | null; published_at?: string | null; archived_at?: string | null;
  created_at: string; updated_at: string;
  editorial_meta?: Record<string, unknown>; source_snapshot?: Record<string, unknown>; source_rights_status?: string;
}
type Activity = { id: string; content_id: string; action: string; from_status?: string | null; to_status?: string | null; created_at: string }
type Candidate = {
  id?: string; title: string; snippet?: string | null; source?: string | null; sourceUrl?: string | null;
  imageUrl?: string | null; publishedAt?: string | null; engine?: string | null; metrics?: Record<string, number | string | null>;
}
type TrendSource = { cached: boolean; items: Candidate[] }
type TrendPool = { date: string; fetchedAt: string; sources: Record<string, TrendSource> }
type MetaConnection = { configured: boolean; connected: boolean; account: string | null }
type PublishAttempt = { content_id: string; state: string; creation_id?: string | null; media_id?: string | null; error_message?: string | null }
type Usage = { used: number; limit: number; automatedLimit: number; configured: boolean }
type View = "pipeline" | "matrix" | "references" | "calendar" | "history" | "settings"

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
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value))
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "00"
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`
}
const wibToIso = (value: string) => value ? new Date(`${value}:00+07:00`).toISOString() : null

function StatusBadge({ value }: { value: string }) {
  const tone = STATUS[value] || STATUS.DRAFT
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] ${tone.cls}`}>{tone.label}</span>
}

export function ContentWorkspace() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [usage, setUsage] = useState<Usage>({ used: 0, limit: 100, automatedLimit: 93, configured: false })
  const [schedulerEnabled, setSchedulerEnabled] = useState(false)
  const [metaConnection, setMetaConnection] = useState<MetaConnection>({ configured: false, connected: false, account: null })
  const [attempts, setAttempts] = useState<PublishAttempt[]>([])
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
      setSchedulerEnabled(Boolean(content.schedulerEnabled))
      setMetaConnection(content.meta || { configured: false, connected: false, account: null })
      setAttempts(content.attempts || [])
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

  function createFromTrend(candidate: Candidate, decision: "FEED" | "REEL" | "BOTH" | "REJECT") {
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/cms", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create_from_trend", candidate, decision }),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || "Keputusan kandidat gagal disimpan")
        toast.success(decision === "REJECT" ? "Kandidat ditolak dan dicatat" : `Disetujui untuk ${decision === "BOTH" ? "Feed + Reels" : decision}; masuk antrean produksi`)
        setTrendOpen(false)
        await load()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Keputusan kandidat gagal disimpan")
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
            <div className="flex items-center justify-between text-[11px] font-bold text-[#B5AC8A]"><span>SerpApi bulan ini</span><span>{usage.used}/{usage.limit}</span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#242220]"><div className="h-full rounded-full bg-[#84102D]" style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }} /></div>
            <div className="mt-2 text-[10px] text-[#6B6558]">Batas otomatis {usage.automatedLimit}. Cadangan {usage.limit - usage.automatedLimit} request.</div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-[#2E2C28] bg-[#1A1816] p-2 xl:sticky xl:top-24">
            <NavButton active={view === "pipeline"} icon={Newspaper} label="Pipeline konten" onClick={() => setView("pipeline")} />
            <NavButton active={view === "matrix"} icon={Clock3} label="Matriks mingguan" onClick={() => setView("matrix")} />
            <NavButton active={view === "references"} icon={BookmarkPlus} label="Referensi visual bulanan" onClick={() => setView("references")} />
            <NavButton active={view === "calendar"} icon={CalendarDays} label="Kalender" onClick={() => setView("calendar")} />
            <NavButton active={view === "history"} icon={History} label="Riwayat aktivitas" onClick={() => setView("history")} />
            <NavButton active={view === "settings"} icon={Settings2} label="Engine & koneksi" onClick={() => setView("settings")} />
            <div className="mx-2 my-3 border-t border-[#2E2C28]" />
            <div className="px-3 pb-3 text-[10px] leading-5 text-[#6B6558]">Tone editorial: data-first, energik, dekat dengan komunitas, dan anti-clickbait.</div>
          </aside>

          <section className="min-w-0 rounded-2xl border border-[#2E2C28] bg-[#1A1816]">
            {view === "pipeline" && <Pipeline items={filtered} loading={loading} query={query} setQuery={setQuery} kind={kind} setKind={setKind} status={status} setStatus={setStatus} onEdit={setSelected} />}
            {view === "matrix" && <MatrixView pending={pending} onCreate={async (slot) => {
              const response = await fetch("/api/admin/cms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create_manual", kind: "SOCIAL", slot }) })
              const result = await response.json()
              if (!response.ok) return toast.error(result.error || "Draft slot gagal dibuat")
              toast.success("Draft slot dibuat; isi dengan fakta terverifikasi dan visual berizin")
              await load()
              setSelected(result.item)
            }} />}
            {view === "references" && <MonthlyReferences />}
            {view === "calendar" && <CalendarView items={items} onEdit={setSelected} />}
            {view === "history" && <HistoryView activities={activities} items={items} />}
            {view === "settings" && <SettingsView schedulerEnabled={schedulerEnabled} meta={metaConnection} usage={usage} pool={pool} onScan={scanTrends} pending={pending} />}
          </section>
        </div>
      </main>

      {trendOpen && <TrendModal pool={pool} pending={pending} onClose={() => setTrendOpen(false)} onRefresh={scanTrends} onCreate={createFromTrend} />}
      {manualOpen && <ManualModal pending={pending} onClose={() => setManualOpen(false)} onCreated={async () => { setManualOpen(false); await load() }} />}
      {selected && <EditorModal item={selected} schedulerEnabled={schedulerEnabled} attempt={attempts.find((entry) => entry.content_id === selected.id)} pending={pending} onClose={() => setSelected(null)} onSaved={async () => { setSelected(null); await load() }} />}
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

function MatrixView({ pending, onCreate }: { pending: boolean; onCreate: (slot: EditorialSlot) => void }) {
  const columns = ["Senin", "Selasa–Kamis", "Jumat", "Sabtu–Minggu"]
  const times = [{ value: "08:00", label: "Pagi", window: "07:00–09:00" }, { value: "13:00", label: "Siang", window: "12:00–14:00" }, { value: "20:00", label: "Malam", window: "19:00–21:00" }]
  return <div className="p-4 sm:p-6"><div className="mb-5"><div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#B5AC8A]">Ritme publikasi · WIB</div><h2 className="mt-1 text-xl font-bold">Matriks jadwal mingguan</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-[#6B6558]">Slot adalah panduan editorial yang bisa dijadikan draft. Jadwal pertandingan aktual mengubah tema; hasil, starting XI, dan live update perlu verifikasi sumber terkini.</p></div><div className="grid gap-3 lg:grid-cols-[130px_repeat(4,minmax(0,1fr))]"><div className="hidden lg:block" />{columns.map((column) => <div key={column} className="hidden rounded-xl bg-[#242220] px-3 py-3 text-[11px] font-bold text-[#B5AC8A] lg:block">{column}</div>)}{times.map((time) => <Fragment key={time.value}><div className="flex items-center gap-3 rounded-xl border border-[#2E2C28] bg-[#0D0D0D] p-3 lg:block"><div className="text-sm font-bold">{time.label}</div><div className="text-[10px] text-[#6B6558]">{time.window}</div></div>{columns.map((column) => {
    const group = column === "Senin" ? "Senin" : column === "Selasa–Kamis" ? "Selasa–Kamis" : column
    const slot = WEEKLY_MATRIX.find((entry) => entry.day === group && entry.time === time.value)!
    return <button key={`${time.value}-${column}`} onClick={() => onCreate(slot)} disabled={pending} className="rounded-xl border border-[#2E2C28] bg-[#0D0D0D] p-3 text-left transition hover:border-[#84102D] disabled:opacity-50"><div className="mb-2 flex items-center justify-between gap-2"><span className="text-[9px] font-bold uppercase tracking-[.1em] text-[#A51A3A]">{column} · {slot.time} WIB</span><Plus size={14} className="shrink-0 text-[#B5AC8A]" /></div><div className="text-xs font-bold leading-5">{slot.label}</div><p className="mt-1 text-[10px] leading-4 text-[#8A8375]">{slot.theme}</p><div className="mt-3 flex flex-wrap gap-1.5"><span className="inline-flex rounded-full border border-[#2E2C28] px-2 py-1 text-[9px] text-[#B5AC8A]">{slot.pillar}</span><span className="inline-flex items-center gap-1 rounded-full border border-[#84102D]/40 bg-[#84102D]/10 px-2 py-1 text-[9px] text-[#D58A9D]">{slot.format === "REEL" ? <Video size={10} /> : <FileText size={10} />}{slot.format}</span></div></button>
  })}</Fragment>)}</div><div className="mt-5 rounded-xl border border-[#2E2C28] bg-[#0D0D0D] p-4 text-[10px] leading-5 text-[#8A8375]"><strong className="text-[#B5AC8A]">Panduan visual cover:</strong> satu foto asli berizin sebagai fokus, judul 3–7 kata, crop dengan wajah/subjek tetap utuh, grading kontras dan grain tipis, aksen burgundy/charcoal/cream. Thumbnail SerpApi, Pinterest, dan video TikTok hanya referensi; jangan dipakai ulang tanpa izin. Untuk Tarkam/UGC catat izin repost, kredit, asal, tanggal, dan moderasi sebelum tayang.</div></div>
}

type VisualReference = { id: string; reference_month: string; url: string; note: string; created_at: string }
function MonthlyReferences() {
  const [month, setMonth] = useState(() => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit" }).format(new Date()))
  const [items, setItems] = useState<VisualReference[]>([])
  const [url, setUrl] = useState("")
  const [note, setNote] = useState("")
  const [loadedMonth, setLoadedMonth] = useState("")
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    let active = true
    fetch(`/api/admin/cms/references?month=${encodeURIComponent(month)}`, { cache: "no-store" }).then(async (response) => {
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Referensi gagal dimuat")
      if (active) setItems(result.items || [])
    }).catch((error) => { if (active) toast.error(error instanceof Error ? error.message : "Referensi gagal dimuat") }).finally(() => { if (active) setLoadedMonth(month) })
    return () => { active = false }
  }, [month])
  async function addReference(event: React.FormEvent) {
    event.preventDefault(); setSaving(true)
    try {
      const response = await fetch("/api/admin/cms/references", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ month, url, note }) })
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Referensi gagal disimpan")
      setItems((current) => [result.item, ...current]); setUrl(""); setNote(""); toast.success("Referensi visual bulan ini tersimpan")
    } catch (error) { toast.error(error instanceof Error ? error.message : "Referensi gagal disimpan") } finally { setSaving(false) }
  }
  async function removeReference(id: string) {
    const response = await fetch(`/api/admin/cms/references?id=${encodeURIComponent(id)}`, { method: "DELETE" }); const result = await response.json()
    if (!response.ok) return toast.error(result.error || "Referensi gagal dihapus")
    setItems((current) => current.filter((item) => item.id !== id)); toast.success("Referensi dihapus")
  }
  return <div className="p-4 sm:p-6"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#B5AC8A]">Pinterest · moodboard editorial</div><h2 className="mt-1 text-xl font-bold">Referensi visual bulanan</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-[#6B6558]">Simpan pin yang mewakili gaya bulan ini beserta arahan yang perlu ditiru. Referensi dipakai untuk arah visual, bukan untuk mengambil atau menerbitkan ulang foto pin.</p></div><label className="text-[10px] font-bold text-[#B5AC8A]">Bulan<input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="mt-1 block h-10 rounded-xl border border-[#2E2C28] bg-[#0D0D0D] px-3 text-xs text-[#F5F0E8]" /></label></div><div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#2E2C28] bg-[#0D0D0D] p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs font-bold">Tambahkan pin ke moodboard {month}</div><p className="mt-1 text-[10px] leading-4 text-[#6B6558]">Tempel link Pinterest dan catat bagian yang disukai: komposisi, tipografi, grading, atau treatment foto.</p></div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[9px] font-bold text-amber-300">API menunggu kredensial Pinterest</span><a href="https://developers.pinterest.com/apps/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-[#2E2C28] px-2.5 py-1.5 text-[9px] font-bold text-[#B5AC8A] hover:border-[#B5AC8A]"><ExternalLink size={11} />Kelola Pinterest App</a></div></div><form onSubmit={addReference} className="mt-1 grid gap-3"><Field label="Link Pin Pinterest"><input type="url" required value={url} onChange={(e) => setUrl(e.target.value)} className="input" placeholder="https://www.pinterest.com/pin/..." /></Field><Field label="Catatan gaya untuk Stadione"><textarea value={note} onChange={(e) => setNote(e.target.value)} className="textarea min-h-20" placeholder="Contoh: foto close-up, grain tipis, judul serif besar, aksen cream. Hindari menyalin identitas brand sumber." /></Field><button disabled={saving} className="inline-flex h-10 w-fit items-center gap-2 rounded-xl bg-[#84102D] px-4 text-xs font-bold text-white disabled:opacity-50"><BookmarkPlus size={15} />{saving ? "Menyimpan..." : "Tambahkan referensi bulan ini"}</button></form></div><div className="mb-3 text-xs font-bold text-[#B5AC8A]">{items.length} referensi tersimpan · {month}</div>{loadedMonth !== month ? <Empty icon={BookmarkPlus} text="Memuat referensi..." spin /> : items.length ? <div className="grid gap-3 md:grid-cols-2">{items.map((item) => <article key={item.id} className="rounded-xl border border-[#2E2C28] bg-[#0D0D0D] p-4"><div className="flex items-start justify-between gap-3"><a href={item.url} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-2 break-all text-xs font-bold text-[#F5F0E8] hover:text-[#B5AC8A]"><ExternalLink size={14} className="shrink-0" />{item.url}</a><button onClick={() => void removeReference(item.id)} aria-label="Hapus referensi" className="rounded-lg border border-[#2E2C28] p-2 text-[#8A8375] hover:text-red-300"><Trash2 size={14} /></button></div>{item.note && <p className="mt-3 whitespace-pre-wrap text-[11px] leading-5 text-[#B5AC8A]">{item.note}</p>}<div className="mt-3 text-[9px] text-[#6B6558]">Ditambahkan {formatDate(item.created_at)}</div></article>)}</div> : <div className="rounded-xl border border-dashed border-[#3A3732] px-5 py-12 text-center text-xs text-[#6B6558]">Belum ada pin untuk bulan ini. Referensi yang Anda tambahkan di atas akan tersimpan di arsip bulanan.</div>}</div>
}

function HistoryView({ activities, items }: { activities: Activity[]; items: ContentItem[] }) {
  const names = new Map(items.map((item) => [item.id, item.title]))
  return <div><div className="border-b border-[#2E2C28] p-5"><h2 className="text-lg font-bold">Riwayat aktivitas</h2><p className="mt-1 text-xs text-[#6B6558]">Jejak perubahan status untuk kebutuhan kontrol redaksi.</p></div><div className="divide-y divide-[#2E2C28]">{activities.length ? activities.map((a) => <div key={a.id} className="flex gap-3 p-4 sm:p-5"><div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#84102D]/20 text-[#A51A3A]"><History size={14} /></div><div className="min-w-0"><div className="truncate text-xs font-bold">{names.get(a.content_id) || "Konten"}</div><div className="mt-1 text-[10px] text-[#6B6558]">{a.action.replaceAll("_", " ")} · {a.from_status || "baru"} → {a.to_status || "tetap"} · {formatDate(a.created_at)}</div></div></div>) : <Empty icon={History} text="Belum ada aktivitas." />}</div></div>
}

function SettingsView({ schedulerEnabled, meta, usage, pool, onScan, pending }: { schedulerEnabled: boolean; meta: MetaConnection; usage: Usage; pool: TrendPool | null; onScan: () => void; pending: boolean }) {
  const sources = [
    ["Google Trends", "Satu snapshot tren olahraga Indonesia per hari", "google_trends_trending_now"],
    ["Google News", "Satu kumpulan berita olahraga terbaru per hari", "google_news"],
    ["TikTok · video pendek via Bing SERP", "Satu pencarian video pendek per minggu; yang ditampilkan hanya hasil TikTok", "bing_videos"],
  ]
  return <div className="p-4 sm:p-6"><h2 className="text-lg font-bold">Engine & koneksi</h2><p className="mt-1 text-xs text-[#6B6558]">SerpApi menyediakan Google News, Google Trends, dan pencarian video pendek. Pencarian video dapat memuat tautan TikTok, bukan feed tren TikTok native.</p><div className="mt-5 grid gap-3 lg:grid-cols-2"><div className="rounded-2xl border border-[#2E2C28] bg-[#0D0D0D] p-4"><div className="flex items-center justify-between"><div><div className="text-xs font-bold">SerpApi</div><div className="mt-1 text-[10px] text-[#6B6558]">{usage.configured ? "Kunci API terpasang di server" : "Kunci API belum terpasang"}</div></div><span className={`h-2.5 w-2.5 rounded-full ${usage.configured ? "bg-emerald-400" : "bg-amber-400"}`} /></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#242220]"><div className="h-full bg-[#84102D]" style={{ width: `${Math.min(100, usage.used)}%` }} /></div><div className="mt-2 flex justify-between text-[10px] text-[#6B6558]"><span>{usage.used} terpakai</span><span>{usage.limit - usage.used} tersisa</span></div><p className="mt-3 text-[10px] leading-4 text-[#6B6558]">Rencana hemat: 2 pencarian harian (News + Sports Trends), video pendek mingguan; sekitar 67 request/bulan. Hard stop otomatis: 93 dari 100.</p></div><div className="rounded-2xl border border-[#2E2C28] bg-[#0D0D0D] p-4"><div className="text-xs font-bold">Meta API</div><div className="mt-1 text-[10px] leading-5 text-[#6B6558]">Publikasi Instagram menggunakan Graph API. Facebook belum tersedia. {schedulerEnabled ? "Penjadwalan otomatis aktif." : "Penjadwalan otomatis belum aktif."}</div><div className="mt-3 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-300">{meta.connected ? `Terhubung: @${meta.account || "Instagram"}` : meta.configured ? "Koneksi perlu diperiksa" : "Kredensial belum tersedia"}</div></div></div><div className="mt-5 space-y-2">{sources.map(([label, description, key]) => <div key={key} className="flex items-center justify-between rounded-xl border border-[#2E2C28] bg-[#0D0D0D] p-3"><div><div className="text-xs font-bold">{label}</div><div className="mt-1 text-[10px] text-[#6B6558]">{description}</div></div><span className="text-[10px] font-bold text-[#B5AC8A]">{pool?.sources?.[key] ? `${pool.sources[key].items.length} item` : "Belum diambil"}</span></div>)}</div><button onClick={onScan} disabled={pending || !usage.configured} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#84102D] px-4 text-xs font-bold disabled:opacity-40">{pending ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />} Sinkronkan kolam tren hari ini</button></div>
}

function viralAssessment(candidate: Candidate) {
  const views=Number(candidate.metrics?.views||0), volume=Number(candidate.metrics?.searchVolume||0), increase=Number(candidate.metrics?.increase||0)
  const score=(views>=100000?3:views>=10000?2:views>0?1:0)+(volume>=50000?2:volume>0?1:0)+(increase>=100?2:increase>0?1:0)+(candidate.publishedAt?1:0)
  return score>=4?{label:"TINGGI",reason:"Momentum dan sinyal audiens kuat; cocok diproses cepat."}:score>=2?{label:"SEDANG",reason:"Ada sinyal minat, tetapi angle dan visual perlu diperkuat."}:{label:"PERLU CEK",reason:"Sinyal publik terbatas; verifikasi relevansi sebelum diproses."}
}
function TrendModal({pool,pending,onClose,onRefresh,onCreate}:{pool:TrendPool|null;pending:boolean;onClose:()=>void;onRefresh:()=>void;onCreate:(candidate:Candidate,decision:"FEED"|"REEL"|"BOTH"|"REJECT")=>void}) {
  const [source,setSource]=useState("google_news")
  const options=[{key:"google_news",label:"Google News"},{key:"google_trends_trending_now",label:"Google Trends"},{key:"bing_videos",label:"Video portal/YouTube/TikTok/X"}],items=pool?.sources?.[source]?.items||[]
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="max-h-[94vh] w-full max-w-5xl overflow-hidden rounded-t-3xl border border-[#2E2C28] bg-[#1A1816] sm:rounded-3xl">
    <div className="flex items-start justify-between border-b border-[#2E2C28] p-5"><div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#B5AC8A]">Approval radar</div><h2 className="mt-1 text-xl font-bold">Kandidat berpotensi viral</h2><p className="mt-1 text-[11px] text-[#6B6558]">Buka link, pilih format, lalu engine memproses. Tidak ada konten dibuat sebelum keputusanmu.</p></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl bg-[#242220]"><X size={16}/></button></div>
    <div className="flex gap-2 overflow-x-auto border-b border-[#2E2C28] p-3">{options.map(o=><button key={o.key} onClick={()=>setSource(o.key)} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold ${source===o.key?"bg-[#84102D] text-white":"bg-[#242220] text-[#B5AC8A]"}`}>{o.label} <span className="ml-1 opacity-60">{pool?.sources?.[o.key]?.items.length||0}</span></button>)}<button onClick={onRefresh} disabled={pending} className="ml-auto shrink-0 rounded-xl border border-[#2E2C28] px-3 py-2 text-xs font-bold text-[#B5AC8A]">Refresh cache</button></div>
    <div className="max-h-[68vh] overflow-y-auto p-3 sm:p-5"><div className="grid gap-3 md:grid-cols-2">{items.map((candidate,index)=>{const viral=viralAssessment(candidate);return <div key={candidate.id||`${source}-${index}`} className="overflow-hidden rounded-2xl border border-[#2E2C28] bg-[#0D0D0D]">
      <div className="flex gap-3 p-3">{candidate.imageUrl?<img src={candidate.imageUrl} alt="" className="h-20 w-24 shrink-0 rounded-xl object-cover"/>:<div className="grid h-20 w-24 shrink-0 place-items-center rounded-xl bg-[#242220]"><Trophy size={20}/></div>}<div className="min-w-0"><div className="flex flex-wrap gap-2"><span className="text-[9px] font-bold uppercase text-[#B5AC8A]">{candidate.source||source}</span><span className="rounded bg-[#84102D]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#D58A9D]">POTENSI {viral.label}</span></div><h3 className="mt-1 line-clamp-3 text-xs font-bold leading-5">{candidate.title}</h3></div></div>
      {candidate.snippet&&<p className="line-clamp-3 px-3 pb-2 text-[10px] leading-4 text-[#8A8375]">{candidate.snippet}</p>}<p className="px-3 pb-3 text-[10px] text-[#B5AC8A]">{viral.reason}</p>
      <div className="flex items-center justify-between border-y border-[#2E2C28] px-3 py-2">{candidate.sourceUrl?<a href={candidate.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-300">Buka sumber <ExternalLink size={11}/></a>:<span className="text-[9px] text-amber-300">Link sumber belum tersedia</span>}<span className="text-[9px] text-[#6B6558]">Final approval tetap wajib</span></div>
      <div className="grid grid-cols-2 gap-2 p-3"><button disabled={pending} onClick={()=>onCreate(candidate,"FEED")} className="rounded-lg bg-[#84102D] px-2 py-2 text-[10px] font-bold">Approve Feed</button><button disabled={pending} onClick={()=>onCreate(candidate,"REEL")} className="rounded-lg bg-[#84102D] px-2 py-2 text-[10px] font-bold">Approve Reels</button><button disabled={pending} onClick={()=>onCreate(candidate,"BOTH")} className="rounded-lg border border-[#84102D] px-2 py-2 text-[10px] font-bold text-[#D58A9D]">Approve Keduanya</button><button disabled={pending} onClick={()=>onCreate(candidate,"REJECT")} className="rounded-lg border border-[#2E2C28] px-2 py-2 text-[10px] font-bold text-[#8A8375]">Reject</button></div>
    </div>})}</div>{!items.length&&<Empty icon={Sparkles} text="Belum ada kandidat. Sinkronkan radar terlebih dahulu."/>}</div>
  </div></div>
}

function ManualModal({ pending, onClose, onCreated }: { pending: boolean; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("")
  const [kind, setKind] = useState("ARTICLE")
  const [format, setFormat] = useState("CAROUSEL")
  async function submit() { const response = await fetch("/api/admin/cms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create_manual", title, kind, format: kind === "ARTICLE" ? "ARTICLE" : format }) }); const result = await response.json(); if (!response.ok) return toast.error(result.error || "Gagal membuat draf"); toast.success("Draf manual dibuat"); onCreated() }
  return <SimpleModal title="Buat draf manual" onClose={onClose}><label className="text-[11px] font-bold text-[#B5AC8A]">Jenis konten</label><select value={kind} onChange={(e) => setKind(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#2E2C28] bg-[#0D0D0D] px-3 text-xs"><option value="ARTICLE">Artikel website</option><option value="SOCIAL">Konten Instagram</option></select>{kind === "SOCIAL" && <><label className="mt-4 block text-[11px] font-bold text-[#B5AC8A]">Format sosial</label><select value={format} onChange={(e) => setFormat(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#2E2C28] bg-[#0D0D0D] px-3 text-xs"><option value="SINGLE_IMAGE">Gambar tunggal</option><option value="CAROUSEL">Carousel</option><option value="REEL">Reels</option></select></>}<label className="mt-4 block text-[11px] font-bold text-[#B5AC8A]">Judul kerja</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#2E2C28] bg-[#0D0D0D] px-3 text-xs outline-none focus:border-[#84102D]" placeholder="Tulis judul konten..." /><button onClick={submit} disabled={pending || title.trim().length < 8} className="mt-5 h-11 w-full rounded-xl bg-[#84102D] text-xs font-bold text-white disabled:opacity-40">Buat draf</button></SimpleModal>
}

function EditorModal({ item, schedulerEnabled, attempt, pending, onClose, onSaved }: { item: ContentItem; schedulerEnabled: boolean; attempt?: PublishAttempt; pending: boolean; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState({ title: item.title, excerpt: item.excerpt || "", body: item.body || "", caption: item.caption || "", hashtags: (item.hashtags || []).join(" "), category: item.category || "", scheduled_at: localInput(item.scheduled_at) })
  const meta = item.editorial_meta || {}
  const [enginePacket, setEnginePacket] = useState(JSON.stringify(meta.engine_packet || null, null, 2))
  const [generating, setGenerating] = useState(false)
  async function generatePreview() { setGenerating(true); try { const response=await fetch("/api/admin/cms/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:item.id})}); const result=await response.json(); if(!response.ok) throw new Error(result.error); toast[result.state === "READY_FOR_REVIEW" ? "success" : "error"](result.state === "READY_FOR_REVIEW" ? "Preview siap diperiksa editor" : (result.issues || [result.reason]).join(" ")); onSaved() } catch(error) {toast.error(error instanceof Error ? error.message : "Engine gagal")} finally {setGenerating(false)} }
  const [sourceUrl, setSourceUrl] = useState(item.source_url || "")
  const [factVerified, setFactVerified] = useState(meta.fact_check_status === "VERIFIED")
  const [rightsCleared, setRightsCleared] = useState(meta.rights_status === "CLEARED")
  const [coverOpen, setCoverOpen] = useState(false)
  const [mediaUrls, setMediaUrls] = useState((item.assets || []).filter((asset) => asset.url || asset.image_url || asset.video_url).map((asset) => asset.video_url || asset.url || asset.image_url || "").join("\n"))
  const [sending, setSending] = useState(false)
  async function publishInstagram() {
    if (sending) return
    setSending(true)
    try {
      if (!attempt || ["FAILED", "PREPARING"].includes(attempt.state)) {
        const saved = await save("draft", false)
        if (!saved) return
      }
      const response = await fetch("/api/admin/cms/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Publikasi gagal")
      toast.success(result.state === "PUBLISHED" ? "Konten diterbitkan di Instagram" : result.message || "Media sedang diproses Meta")
      onSaved()
    } catch (error) { toast.error(error instanceof Error ? error.message : "Publikasi gagal"); onSaved() } finally { setSending(false) }
  }
  async function save(action: string, close = true) { let parsedPacket; try { parsedPacket=JSON.parse(enginePacket) } catch {toast.error("Source packet harus berupa JSON valid."); return false} const response = await fetch("/api/admin/cms", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, action, ...draft, source_url: sourceUrl, editorial_meta: { ...(parsedPacket ? {engine_packet:parsedPacket} : {}), fact_check_status: factVerified ? "VERIFIED" : "UNVERIFIED", rights_status: rightsCleared ? "CLEARED" : "PENDING" }, assets: item.kind === "SOCIAL" ? mediaUrls.split(/\n+/).map((url) => url.trim()).filter(Boolean).map((url) => (item.assets || []).find(asset => (asset.video_url || asset.url || asset.image_url) === url) || (item.format === "REEL" ? { type: "video", video_url: url } : { type: "image", url })) : undefined, hashtags: draft.hashtags.split(/[\s,]+/).map((tag) => tag.replace(/^#/, "")).filter(Boolean), scheduled_at: wibToIso(draft.scheduled_at) }) }); const result = await response.json(); if (!response.ok) { toast.error(result.error || "Konten gagal disimpan"); return false } if (close) { toast.success(action === "publish" ? "Artikel diterbitkan" : action === "schedule" ? "Instagram dijadwalkan" : "Perubahan disimpan"); onSaved() } return true }
  return <><div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}><div className="h-full w-full max-w-3xl overflow-y-auto border-l border-[#2E2C28] bg-[#1A1816]"><div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#2E2C28] bg-[#1A1816]/95 p-5 backdrop-blur"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#B5AC8A]">{item.kind === "ARTICLE" ? "Article editor" : `${item.platforms?.join(", ")} · ${item.format}`}</div><h2 className="mt-1 text-xl font-bold">Edit konten</h2></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl bg-[#242220]"><X size={16} /></button></div><div className="space-y-4 p-5">{item.kind === "SOCIAL" && ["DRAFT","PENDING_REVIEW"].includes(item.status) && <div className="rounded-xl border border-[#84102D]/50 bg-[#84102D]/10 p-4 text-xs"><div className="font-bold">Sports Desk engine · {String(meta.engine_state || "Belum dibuat")}</div>{Array.isArray(meta.engine_issues) && <ul className="mt-2 list-disc pl-4">{meta.engine_issues.map((issue,index)=><li key={index}>{String(issue)}</li>)}</ul>}<p className="mt-2">Research → klaim → potongan video nyata dari portal/YouTube/TikTok/X → montage Reels atau carousel → quality gate → jadwal otomatis. AI tidak membuat footage.</p><button disabled={generating} onClick={generatePreview} className="mt-3 rounded border px-3 py-2">{generating ? "Memproses..." : "Buat preview engine"}</button></div>}<Field label="Source packet / claim ledger (JSON)"><textarea value={enginePacket} onChange={e=>setEnginePacket(e.target.value)} className="textarea min-h-48 font-mono text-[11px]" /><p className="text-[10px] text-[#8A8375]">Simpan sebelum membuat preview. Untuk Reels, isi video_sources dan scenes: URL halaman, URL media, platform, kreator, transkrip, timestamp potongan, kredit, hak media/audio, dan claim_ids. Engine membuat montage, bukan footage AI.</p></Field><Field label="Judul"><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="input" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Kategori"><input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="input" /></Field><Field label="Jadwal tayang (WIB)"><input type="datetime-local" value={draft.scheduled_at} onChange={(e) => setDraft({ ...draft, scheduled_at: e.target.value })} className="input" /></Field></div><Field label="URL sumber primer"><input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} className="input" placeholder="https://..." /></Field>{item.kind === "ARTICLE" ? <><Field label="Ringkasan"><textarea value={draft.excerpt} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} className="textarea min-h-24" /></Field><Field label="Isi artikel / brief (HTML)"><textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} className="textarea min-h-[360px] font-mono text-[11px]" /></Field></> : <><button onClick={() => setCoverOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#84102D]/50 bg-[#84102D]/10 px-3 text-[11px] font-bold text-[#F5F0E8]"><Sparkles size={14} />Buat cover film dari foto asli</button><Field label="Caption"><textarea value={draft.caption} onChange={(e) => setDraft({ ...draft, caption: e.target.value })} className="textarea min-h-36" /></Field><Field label="Hashtag"><input value={draft.hashtags} onChange={(e) => setDraft({ ...draft, hashtags: e.target.value })} className="input" placeholder="#Stadione #OlahragaIndonesia" /></Field><Field label={item.format === "REEL" ? "URL video MP4 publik (HTTPS)" : item.format === "CAROUSEL" ? "URL gambar JPEG publik, satu per baris (2–10)" : "URL gambar JPEG publik (HTTPS)"}><textarea value={mediaUrls} onChange={(e) => setMediaUrls(e.target.value)} className="textarea min-h-24" placeholder="https://.../media.jpg" /></Field>{item.format === "CAROUSEL" && <div><div className="mb-2 text-[11px] font-bold text-[#B5AC8A]">Preview struktur carousel</div><div className="flex gap-3 overflow-x-auto pb-2">{(item.assets || []).map((asset, index) => <SlidePreview key={index} asset={asset} index={index} />)}</div></div>}</>}<div className="space-y-2 rounded-xl border border-[#2E2C28] bg-[#0D0D0D] p-3 text-[10px] leading-5"><div className="text-[#B5AC8A]">Gate publikasi · perlu fakta dan aset yang lolos pengecekan</div><label className="flex items-start gap-2 text-[#8A8375]"><input type="checkbox" checked={factVerified} onChange={(e) => setFactVerified(e.target.checked)} className="mt-1 accent-[#84102D]" />Fakta utama, nama, angka/kutipan, dan konteks sudah dicocokkan dengan sumber primer.</label><label className="flex items-start gap-2 text-[#8A8375]"><input type="checkbox" checked={rightsCleared} onChange={(e) => setRightsCleared(e.target.checked)} className="mt-1 accent-[#84102D]" />Foto/video adalah milik sendiri atau izin penggunaan, kredit, dan cakupannya sudah dicatat.</label>{item.source_url && <a href={item.source_url} target="_blank" rel="noreferrer" className="inline-block text-[#B5AC8A] underline">Buka sumber</a>}</div><div className="flex flex-wrap gap-2 border-t border-[#2E2C28] pt-4"><Action label="Simpan draf" icon={Pencil} onClick={() => save("draft")} pending={pending} /><Action label="Setujui preview engine" icon={CheckCircle2} onClick={() => save("approve")} pending={pending} /><Action label="Kirim review" icon={Send} onClick={() => save("review")} pending={pending} />{item.kind === "SOCIAL" && schedulerEnabled && (item.platforms || []).includes("INSTAGRAM") && <Action label="Jadwalkan" icon={Clock3} onClick={() => save("schedule")} pending={pending} disabled={!draft.scheduled_at} />}{item.kind === "ARTICLE" && <Action label="Publish" icon={CheckCircle2} onClick={() => save("publish")} pending={pending} primary />}{item.kind === "SOCIAL" && (item.platforms || []).includes("INSTAGRAM") && item.status !== "PUBLISHED" && !["PUBLISHING", "UNCERTAIN"].includes(attempt?.state || "") && <Action label={attempt?.state === "PROCESSING" ? "Lanjutkan publikasi" : "Publikasikan ke Instagram"} icon={CheckCircle2} onClick={publishInstagram} pending={pending || sending} primary />}{attempt && <span className="self-center text-[10px] text-[#B5AC8A]">Meta: {attempt.state}{attempt.error_message ? ` · ${attempt.error_message}` : ""}</span>}<Action label="Arsipkan" icon={Archive} onClick={() => save("archive")} pending={pending} /></div></div></div></div>{coverOpen && <CoverModal item={item} onClose={() => setCoverOpen(false)} onDone={() => { setCoverOpen(false); onSaved() }} />}</>
}

function SlidePreview({ asset, index }: { asset: Asset; index: number }) {
  const colors = asset.tone === "burgundy" ? "bg-[#84102D] text-white" : asset.tone === "sand" ? "bg-[#B5AC8A] text-[#0D0D0D]" : "bg-[#0D0D0D] text-[#F5F0E8]"
  return <div className={`relative aspect-square w-52 shrink-0 overflow-hidden rounded-2xl border border-[#2E2C28] p-4 ${colors}`}>{asset.image_url && <img src={asset.image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />}<div className="relative flex h-full flex-col justify-between"><div className="text-[8px] font-bold uppercase tracking-[.16em] opacity-70">{asset.eyebrow || `Slide ${index + 1}`}</div><div><div className="text-lg font-bold leading-tight">{asset.headline}</div><div className="mt-2 line-clamp-4 text-[9px] leading-4 opacity-80">{asset.body}</div></div><div className="text-[8px] font-bold uppercase tracking-[.15em]">STADIONE</div></div></div>
}

function CoverModal({ item, onClose, onDone }: { item: ContentItem; onClose: () => void; onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [objectUrl, setObjectUrl] = useState("")
  const [credit, setCredit] = useState("")
  const [permissionScope, setPermissionScope] = useState("")
  const [headline, setHeadline] = useState(item.title)
  const [style, setStyle] = useState("drama")
  const [permission, setPermission] = useState(false)
  const [saving, setSaving] = useState(false)
  useEffect(() => () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }, [objectUrl])
  useEffect(() => {
    if (!objectUrl || !canvasRef.current) return
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current; if (!canvas) return
      const width = 1080, height = 1350; canvas.width = width; canvas.height = height
      const ctx = canvas.getContext("2d"); if (!ctx) return
      ctx.fillStyle = "#0d0d0d"; ctx.fillRect(0, 0, width, height)
      const scale = Math.max(width / img.width, height / img.height), drawW = img.width * scale, drawH = img.height * scale
      ctx.save(); ctx.filter = style === "mono" ? "grayscale(1) contrast(1.12) brightness(.88)" : style === "burgundy" ? "contrast(1.08) saturate(.72) sepia(.12)" : "contrast(1.12) saturate(.82) brightness(.9)"
      ctx.drawImage(img, (width - drawW) / 2, (height - drawH) / 2, drawW, drawH); ctx.restore()
      const wash = ctx.createLinearGradient(0, 0, width, height); wash.addColorStop(0, "rgba(10,8,8,.08)"); wash.addColorStop(.48, style === "burgundy" ? "rgba(92,8,29,.14)" : "rgba(10,10,10,.16)"); wash.addColorStop(1, "rgba(8,7,8,.92)"); ctx.fillStyle = wash; ctx.fillRect(0, 0, width, height)
      const bottom = ctx.createLinearGradient(0, height * .42, 0, height); bottom.addColorStop(0, "rgba(10,9,9,0)"); bottom.addColorStop(1, "rgba(10,9,9,.94)"); ctx.fillStyle = bottom; ctx.fillRect(0, 0, width, height)
      const vignette = ctx.createRadialGradient(width / 2, height / 2, height * .15, width / 2, height / 2, height * .76); vignette.addColorStop(0, "rgba(0,0,0,0)"); vignette.addColorStop(1, "rgba(0,0,0,.28)"); ctx.fillStyle = vignette; ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = "#B5AC8A"; ctx.fillRect(74, 82, 5, 74)
      ctx.fillStyle = "#F5F0E8"; ctx.font = "700 25px Arial, sans-serif"; ctx.letterSpacing = "7px"; ctx.fillText("STADIONE  /  SPORTS DESK", 99, 111)
      ctx.font = "500 18px Arial, sans-serif"; ctx.letterSpacing = "5px"; ctx.fillStyle = "#D0C5B1"; ctx.fillText("THE MOMENT · THE STORY", 80, 870)
      const words = headline.trim().split(/\s+/); const lines: string[] = []; let line = ""; ctx.font = "700 86px Georgia, serif"
      words.forEach((word) => { const next = line ? `${line} ${word}` : word; if (ctx.measureText(next).width > 920 && line) { lines.push(line); line = word } else line = next }); if (line) lines.push(line)
      let y = Math.min(1010, 930 + Math.max(0, 3 - lines.length) * 46); ctx.fillStyle = "#F5F0E8"; ctx.font = "700 86px Georgia, serif"
      lines.slice(0, 4).forEach((text) => { ctx.fillText(text, 78, y); y += 96 })
      ctx.fillStyle = "#A51A3A"; ctx.fillRect(80, y + 9, 92, 7)
      ctx.font = "500 17px Arial, sans-serif"; ctx.letterSpacing = "3px"; ctx.fillStyle = "#D1C9BC"; ctx.fillText("FAKTA · KONTEKS · KOMUNITAS", 80, y + 64)
      // Light, even film grain; the source photograph remains recognizable and unaltered in identity.
      let seed = 823; ctx.fillStyle = "rgba(245,240,232,.10)"; for (let i = 0; i < 1100; i++) { seed = (seed * 16807) % 2147483647; const x = seed % width; seed = (seed * 16807) % 2147483647; const py = seed % height; ctx.fillRect(x, py, 2, 2) }
    }
    img.src = objectUrl
  }, [objectUrl, headline, style])
  async function upload(role: string, blob: Blob) {
    const body = new FormData(); body.append("itemId", item.id); body.append("role", role); body.append("credit", credit); body.append("permissionScope", permissionScope); body.append("permissionConfirmed", String(permission)); body.append("template", `film-poster-${style}-v1`); body.append("file", blob, role === "original" ? (file?.name || "original.jpg") : "stadione-cover.jpg")
    const response = await fetch("/api/admin/cms/cover", { method: "POST", body }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Unggah aset gagal")
  }
  async function save() {
    if (!file || !credit.trim() || !permissionScope.trim() || !permission || !canvasRef.current) return toast.error("Foto, kredit, cakupan izin, dan konfirmasi wajib ada.")
    setSaving(true)
    try {
      const cover = await new Promise<Blob>((resolve, reject) => canvasRef.current!.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Render cover gagal")), "image/jpeg", 0.92))
      await upload("original", file); await upload("cover", cover)
      toast.success("Cover dan foto asli tersimpan bersama kreditnya."); onDone()
    } catch (error) { toast.error(error instanceof Error ? error.message : "Cover gagal disimpan") } finally { setSaving(false) }
  }
  return <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/85 p-0 backdrop-blur sm:items-center sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}><div className="max-h-[96vh] w-full max-w-5xl overflow-y-auto rounded-t-3xl border border-[#2E2C28] bg-[#1A1816] p-4 sm:rounded-3xl sm:p-6"><div className="flex items-start justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#B5AC8A]">Photo-led cover · 4:5</div><h2 className="mt-1 text-xl font-bold">Cover film dari foto asli</h2><p className="mt-1 text-xs text-[#8A8375]">Grade warna, crop tengah, vignette, grain halus, tipografi serif. Tidak menghasilkan atau mengubah identitas orang.</p></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl bg-[#242220]"><X size={16} /></button></div><div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_280px]"><div className="flex min-h-64 items-center justify-center rounded-2xl border border-[#2E2C28] bg-[#0D0D0D] p-3">{file ? <canvas ref={canvasRef} className="max-h-[58vh] w-auto max-w-full rounded-lg object-contain" /> : <div className="text-center text-xs text-[#6B6558]">Pilih foto asli untuk melihat preview cover</div>}</div><div className="space-y-3"><Field label="Foto asli (JPEG/PNG/WebP, max 10 MB)"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const next = e.target.files?.[0] || null; setFile(next); setObjectUrl(next ? URL.createObjectURL(next) : "") }} className="block w-full text-[10px] text-[#B5AC8A] file:mr-2 file:rounded-lg file:border-0 file:bg-[#84102D] file:px-3 file:py-2 file:text-[10px] file:font-bold file:text-white" /></Field><Field label="Judul cover"><textarea value={headline} onChange={(e) => setHeadline(e.target.value.slice(0, 70))} className="textarea min-h-20" /></Field><Field label="Color grade"><select value={style} onChange={(e) => setStyle(e.target.value)} className="input"><option value="drama">Cinematic drama</option><option value="mono">Monochrome + cream</option><option value="burgundy">Burgundy editorial</option></select></Field><Field label="Kredit / asal foto"><input value={credit} onChange={(e) => setCredit(e.target.value)} className="input" placeholder="Nama fotografer · pemilik · sumber" /></Field><Field label="Cakupan izin"><input value={permissionScope} onChange={(e) => setPermissionScope(e.target.value)} className="input" placeholder="Contoh: retouch & repost IG, FB, situs" /></Field><label className="flex items-start gap-2 text-[10px] leading-4 text-[#8A8375]"><input type="checkbox" checked={permission} onChange={(e) => setPermission(e.target.checked)} className="mt-0.5 accent-[#84102D]" />Saya memiliki foto ini atau sudah mengantongi izin penggunaan dan penyuntingan.</label><button onClick={save} disabled={saving || !file || !credit.trim() || !permissionScope.trim() || !permission} className="h-11 w-full rounded-xl bg-[#84102D] text-xs font-bold disabled:opacity-40">{saving ? "Menyimpan foto & cover..." : "Simpan cover dan foto asli"}</button></div></div></div></div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-[11px] font-bold text-[#B5AC8A]">{label}</span>{children}</label> }
function Action({ label, icon: Icon, onClick, pending, primary, disabled }: { label: string; icon: typeof FileText; onClick: () => void; pending: boolean; primary?: boolean; disabled?: boolean }) { return <button onClick={onClick} disabled={pending || disabled} className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-[11px] font-bold disabled:opacity-35 ${primary ? "bg-[#84102D] text-white" : "border border-[#2E2C28] bg-[#0D0D0D] text-[#B5AC8A]"}`}><Icon size={14} /> {label}</button> }
function Empty({ icon: Icon, text, spin }: { icon: typeof FileText; text: string; spin?: boolean }) { return <div className="px-5 py-16 text-center"><Icon size={24} className={`mx-auto text-[#6B6558] ${spin ? "animate-spin" : ""}`} /><p className="mt-3 text-xs font-bold text-[#6B6558]">{text}</p></div> }
function SimpleModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}><div className="w-full max-w-md rounded-t-3xl border border-[#2E2C28] bg-[#1A1816] p-5 sm:rounded-3xl"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">{title}</h2><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl bg-[#242220]"><X size={16} /></button></div><div className="mt-5">{children}</div></div></div> }
