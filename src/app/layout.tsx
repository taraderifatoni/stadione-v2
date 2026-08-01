import type { Metadata } from "next"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { Providers } from "./providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "Stadione — Platform Olahraga Indonesia",
  description: "Booking lapangan, membership gym, akademi olahraga — semua dalam satu platform.",
  icons: { icon: "/stadione-logo.svg" },
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Stadione", statusBarStyle: "black-translucent" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full antialiased">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0D0D0D" />
      </head>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')};` }} />
        <TooltipProvider>
          <Providers>{children}</Providers>
          <Toaster richColors closeButton />
        </TooltipProvider>
      </body>
    </html>
  )
}
