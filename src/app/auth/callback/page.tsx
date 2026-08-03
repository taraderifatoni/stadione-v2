"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    async function handleCallback() {
      // Exchange OAuth code for session — @supabase/ssr needs explicit call
      const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href)
      if (error) {
        console.error("OAuth callback error:", error.message)
        router.replace("/login")
        return
      }
      if (data.session) {
        router.replace("/")
      }
    }

    // Small delay to ensure DOM is ready and hash fragment is available
    const t = setTimeout(handleCallback, 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ minHeight: "100vh", background: "#0D0D0D", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: 20, border: "3px solid #84102D", borderTopColor: "transparent", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
        <div style={{ fontSize: 14, color: "#B5AC8A" }}>Menyelesaikan login...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}
