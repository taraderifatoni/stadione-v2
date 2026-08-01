"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") setShow(false)
    setDeferredPrompt(null)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-[#1A1816] border border-[#84102D] rounded-xl p-4 shadow-lg max-w-sm mx-auto">
      <div className="flex items-center gap-3">
        <img src="/icon-192.png" alt="Stadione" className="h-10 w-10 rounded-lg" />
        <div className="flex-1">
          <p className="font-semibold text-sm">Install Stadione</p>
          <p className="text-xs text-[#B5AC8A]">Akses cepat dari homescreen</p>
        </div>
        <Button size="sm" onClick={handleInstall}>
          <Download className="h-4 w-4 mr-1" />Install
        </Button>
      </div>
    </div>
  )
}
