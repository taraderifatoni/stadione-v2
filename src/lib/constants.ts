// lib/constants.ts — SINGLE SOURCE OF TRUTH. Do not redefine anywhere else.

export const SUBDOMAIN = {
  PUBLIC: "stadione.pro",
  ADMIN: "admin.stadione.pro",
  POS: "pos.stadione.pro",
} as const

export const APP_URL = {
  PUBLIC: process.env.NEXT_PUBLIC_APP_URL_PUBLIC ?? "https://stadione.pro",
  ADMIN: process.env.NEXT_PUBLIC_APP_URL_ADMIN ?? "https://admin.stadione.pro",
  POS: process.env.NEXT_PUBLIC_APP_URL_POS ?? "https://pos.stadione.pro",
} as const

export function makeVenueSlug(name: string): string {
  return name.trim().toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export function makeInvoiceNumber(seq: number, date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `INV-${y}${m}${d}-${String(seq).padStart(3, "0")}`
}

export function makeBookingCode(seq: number, date = new Date()): string {
  const d = String(date.getDate()).padStart(2, "0")
  const m = String(date.getMonth() + 1).padStart(2, "0")
  return `BK-${d}${m}-${String(seq).padStart(3, "0")}`
}

// Semantic status colors (Design Brief §2)
export const SEMANTIC = {
  success: { bg: "#1B3A1D", text: "#4CAF50" },
  warning: { bg: "#3A2200", text: "#FFB300" },
  danger: { bg: "#3A1515", text: "#C62828" },
  info: { bg: "#1A1816", text: "#6B6558" },
} as const
