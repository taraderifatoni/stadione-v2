"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [msg, setMsg] = useState("Menyelesaikan login...")

  useEffect(() => {
    const supabase = createClient()

    // Check if hash fragment has tokens (PKCE flow)
    const hasHash = window.location.hash.includes("access_token")

    // Quick check — may already be signed in
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) { router.replace("/"); return }
    })

    // Also listen for state changes (PKCE processes hash → fires SIGNED_IN)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        router.replace("/")
      }
    })

    // Fallback: try getSession again after a delay
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        router.replace("/")
      } else {
        setMsg("Login gagal. Mengarahkan ke halaman login...")
        setTimeout(() => router.replace("/login?error=oauth_failed"), 2000)
      }
    }, hasHash ? 2000 : 4000)

    return () => { subscription.unsubscribe(); clearTimeout(t) }
  }, [])

  return (
    <div style={{ minHeight: "100vh", background: "#0D0D0D", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: 20, border: "3px solid #84102D", borderTopColor: "transparent", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
        <div style={{ fontSize: 14, color: "#B5AC8A" }}>{msg}</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}
