"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { resetPassword } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)

    const { error: err } = await resetPassword(email)
    if (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.")
    } else {
      setMessage("Cek email Anda untuk tautan reset kata sandi.")
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="font-bold text-3xl tracking-wider">
          STADIONE
        </CardTitle>
        <CardDescription>Reset kata sandi</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-[#84102D]">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Mengirim..." : "Kirim Tautan Reset"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-[#B5AC8A]">
          <Link href="/login" className="text-[#84102D] hover:underline font-medium">
            Kembali ke login
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
