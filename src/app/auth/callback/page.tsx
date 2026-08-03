"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // GoTrue has already exchanged the OAuth code and set cookies.
    // We just need to detect the session.
    const supabase = createClient()

    async function check() {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        router.replace("/")
      } else {
        // Might need a moment for cookies to propagate
        setTimeout(async () => {
          const { data: retry } = await supabase.auth.getSession()
          if (retry.session) router.replace("/")
          else router.replace("/login?error=oauth_failed")
        }, 1000)
      }
    }
    check()
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
