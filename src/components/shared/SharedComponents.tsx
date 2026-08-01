import { C } from "@/lib/design"

export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div style={{ padding: "0 16px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginBottom: 10, opacity: 0.6 }}>
          <div style={{ height: 14, width: "60%", background: C.elevated, borderRadius: 4, marginBottom: 8 }} />
          <div style={{ height: 12, width: "40%", background: C.elevated, borderRadius: 4 }} />
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, action, actionLabel, onAction }: {
  icon?: any; title: string; action?: string; actionLabel?: string; onAction?: () => void
}) {
  return (
    <div style={{ padding: "40px 16px", textAlign: "center" }}>
      {Icon && <Icon size={40} color={C.textMuted} style={{ margin: "0 auto 12px", display: "block" }} />}
      <p style={{ fontSize: 14, color: C.textMuted, marginBottom: action ? 16 : 0 }}>{title}</p>
      {action && onAction && (
        <button onClick={onAction} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          {actionLabel || action}
        </button>
      )}
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    active: { color: SEMANTIC.success.text, bg: SEMANTIC.success.bg, label: "Aktif" },
    confirmed: { color: SEMANTIC.success.text, bg: SEMANTIC.success.bg, label: "Dikonfirmasi" },
    paid: { color: "#B5AC8A", bg: "#1A1816", label: "Dibayar" },
    pending: { color: SEMANTIC.warning.text, bg: SEMANTIC.warning.bg, label: "Pending" },
    expired: { color: SEMANTIC.danger.text, bg: SEMANTIC.danger.bg, label: "Expired" },
    cancelled: { color: SEMANTIC.danger.text, bg: SEMANTIC.danger.bg, label: "Dibatalkan" },
    draft: { color: "#6B6558", bg: "#1A1816", label: "Draft" },
    published: { color: SEMANTIC.success.text, bg: SEMANTIC.success.bg, label: "Published" },
  }
  const s = map[status] || map.active
  return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: s.bg, color: s.color }}>{s.label}</span>
}

import { SEMANTIC } from "@/lib/constants"
