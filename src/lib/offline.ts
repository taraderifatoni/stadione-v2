// lib/offline.ts — Offline-first utilities for PWA

const STORAGE_KEY = "stadione_offline_queue"

interface OfflineAction {
  id: string
  type: "checkin" | "attendance" | "booking"
  payload: any
  createdAt: string
}

export function getOfflineQueue(): OfflineAction[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  } catch { return [] }
}

export function addToOfflineQueue(action: Omit<OfflineAction, "id" | "createdAt">) {
  const queue = getOfflineQueue()
  queue.push({
    ...action,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))

  // Trigger background sync
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready.then((reg: any) => {
      reg.sync.register("stadione-sync").catch(() => {})
    })
  }
}

export function clearOfflineQueue() {
  localStorage.removeItem(STORAGE_KEY)
}

export function getOfflineQueueCount(): number {
  return getOfflineQueue().length
}

export async function processOfflineQueue(): Promise<number> {
  const queue = getOfflineQueue()
  if (queue.length === 0) return 0

  let processed = 0
  for (const action of queue) {
    try {
      if (action.type === "checkin") {
        await fetch("/api/offline/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action.payload),
        })
      }
      processed++
    } catch {
      break // Stop processing on first failure (offline again)
    }
  }

  // Remove processed items
  const remaining = queue.slice(processed)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining))
  return processed
}
