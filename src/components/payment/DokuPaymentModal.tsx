"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, ExternalLink, CheckCircle2 } from "lucide-react"

interface DokuPaymentModalProps {
  open: boolean
  onClose: () => void
  bookingId: string
  userName: string
  userEmail: string
  onSuccess: () => void
}

export function DokuPaymentModal({
  open,
  onClose,
  bookingId,
  userName,
  userEmail,
  onSuccess,
}: DokuPaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [polling, setPolling] = useState(false)

  async function handleCreatePayment() {
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, userId: "", userName, userEmail }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Gagal membuat pembayaran")
        return
      }

      setPaymentUrl(data.paymentUrl)
      window.open(data.paymentUrl, "_blank")

      // Start polling for payment status
      startPolling()
    } catch {
      setError("Gagal menghubungi server")
    } finally {
      setLoading(false)
    }
  }

  function startPolling() {
    setPolling(true)
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?bookingId=${bookingId}`)
        const data = await res.json()
        if (data.status === "paid") {
          clearInterval(interval)
          setPolling(false)
          onSuccess()
          onClose()
        }
      } catch {
        // Keep polling
      }
    }, 5000)

    // Stop after 5 minutes
    setTimeout(() => {
      clearInterval(interval)
      setPolling(false)
    }, 300000)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pembayaran DOKU</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <p className="text-sm text-[#84102D] bg-[#84102D]/5 p-3 rounded-lg">{error}</p>
          )}

          {paymentUrl ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-sm text-[#B5AC8A]">
                Halaman pembayaran DOKU telah dibuka di tab baru.
                {polling && " Menunggu pembayaran..."}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(paymentUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Buka Lagi
              </Button>
              {polling && (
                <div className="flex items-center justify-center gap-2 text-sm text-[#B5AC8A]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Menunggu konfirmasi pembayaran...
                </div>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-[#B5AC8A]">
                Anda akan diarahkan ke halaman pembayaran DOKU untuk menyelesaikan transaksi.
              </p>
              <p className="text-xs text-[#6B6558]">
                Pembayaran dapat dilakukan via Virtual Account, QRIS, kartu kredit/debit, dan gerai retail.
              </p>
              <Button
                className="w-full"
                onClick={handleCreatePayment}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : null}
                {loading ? "Membuat Pembayaran..." : "Bayar dengan DOKU"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
