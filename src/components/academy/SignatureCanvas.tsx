"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"

export function SignatureCanvas({ onSave }: { onSave: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    setDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top
    ctx.lineWidth = 2
    ctx.strokeStyle = "#F5F0E8"
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function stopDraw() { setDrawing(false) }
  function clear() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  function handleSave() {
    const canvas = canvasRef.current
    if (canvas) onSave(canvas.toDataURL())
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={300}
        height={100}
        className="border border-[#2E2C28] rounded-lg w-full touch-none bg-[#1A1816]"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={clear}>Hapus</Button>
        <Button size="sm" onClick={handleSave}>Simpan Tanda Tangan</Button>
      </div>
    </div>
  )
}
