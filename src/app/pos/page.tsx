"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { C } from "@/lib/design"
import { Calendar, DollarSign, Wallet, QrCode, ArrowLeftRight, CreditCard, Clock, Printer, Receipt, ChevronLeft } from "lucide-react"

const Card = ({ children, style }: any) => <div style={{ background: C.surface, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, ...style }}>{children}</div>
const Badge = ({ children, color, bg }: any) => <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: bg || (color || C.primary) + "22", color: color || C.primaryLight, letterSpacing: 0.3 }}>{children}</span>

export default function PosPage() {
  const router = useRouter()

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <div style={{ background: C.primary, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: 2 }}>STADIONE POS</span>
        <span style={{ fontSize: 11, color: "#fff9" }}>Kasir</span>
      </div>
      <div style={{ padding: 16, maxWidth: 480, margin: "0 auto" }}>
        {/* Stat cards */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, background: C.surface, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: "#4CAF5018", display: "flex", alignItems: "center", justifyContent: "center" }}><DollarSign size={14} color="#4CAF50" /></div><span style={{ fontSize: 11, color: C.textMuted }}>Kas saat ini</span></div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Rp 2.450.000</div>
          </div>
          <div style={{ flex: 1, background: C.surface, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: C.primary + "18", display: "flex", alignItems: "center", justifyContent: "center" }}><Calendar size={14} color={C.primaryLight} /></div><span style={{ fontSize: 11, color: C.textMuted }}>Transaksi</span></div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>18</div>
          </div>
        </div>

        {/* Payment methods */}
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 10 }}>Pembayaran</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {[{ icon: Wallet, label: "Cash", color: "#4CAF50" }, { icon: QrCode, label: "QRIS", color: C.primaryLight }, { icon: ArrowLeftRight, label: "Transfer", color: C.accent }, { icon: CreditCard, label: "Debit", color: "#FFB300" }].map((a, i) => (
            <Card key={i} style={{ textAlign: "center", padding: 14 }}>
              <a.icon size={20} color={a.color} style={{ margin: "0 auto 6px", display: "block" }} />
              <div style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{a.label}</div>
            </Card>
          ))}
        </div>

        {/* Quick walk-in form */}
        <div style={{ marginBottom: 14 }}><label style={{ fontSize: 12, color: C.textSec, marginBottom: 6, display: "block" }}>Nama / Guest</label><input placeholder="Nama pelanggan" style={{ width: "100%", padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} /></div>
        <div style={{ marginBottom: 14 }}><label style={{ fontSize: 12, color: C.textSec, marginBottom: 6, display: "block" }}>Lapangan</label><select style={{ width: "100%", padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }}><option>Futsal A — Rp 120.000/jam</option><option>Futsal B — Rp 120.000/jam</option></select></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div><label style={{ fontSize: 12, color: C.textSec, marginBottom: 6, display: "block" }}>Jam mulai</label><input type="time" defaultValue="15:00" style={{ width: "100%", padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} /></div>
          <div><label style={{ fontSize: 12, color: C.textSec, marginBottom: 6, display: "block" }}>Durasi</label><select style={{ width: "100%", padding: "10px 12px", background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }}><option>1 jam</option><option>2 jam</option></select></div>
        </div>
        <Card style={{ marginBottom: 14, background: C.elevated, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 13, color: C.textMuted }}>Total</span><span style={{ fontSize: 15, fontWeight: 700, color: C.accent }}>Rp 120.000</span></div>
        </Card>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Receipt size={16} />Cetak</button>
          <button style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Printer size={16} />Proses</button>
        </div>

        {/* Transactions */}
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginTop: 20, marginBottom: 10 }}>Transaksi hari ini</div>
        {[{ ref: "BK-001", name: "Andi", amount: "120rb", method: "Cash" }, { ref: "BK-002", name: "Lisa", amount: "300rb", method: "QRIS" }].map((t, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}11` }}>
            <div><div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{t.name}</div><div style={{ fontSize: 11, color: C.textMuted }}>{t.ref} · {t.method}</div></div>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.accent }}>Rp {t.amount}</span>
          </div>
        ))}

        {/* Shift info */}
        <div style={{ marginTop: 20 }}>
          <Card style={{ background: C.elevated }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><Clock size={18} color={C.primaryLight} /><span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Shift aktif</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 13, color: C.textMuted }}>Kas awal</span><span style={{ fontSize: 13, color: C.text }}>Rp 500.000</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 13, color: C.textMuted }}>Cash masuk</span><span style={{ fontSize: 13, color: C.text }}>Rp 1.950.000</span></div>
            <div style={{ height: 1, background: C.border, margin: "8px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Saldo akhir</span><span style={{ fontSize: 16, fontWeight: 700, color: C.accent }}>Rp 2.450.000</span></div>
            <button style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px solid ${C.danger}44`, background: "transparent", color: C.danger, fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 12 }}>Tutup shift</button>
          </Card>
        </div>
      </div>
    </div>
  )
}
