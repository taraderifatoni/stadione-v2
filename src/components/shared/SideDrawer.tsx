"use client"

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  Home,
  CalendarDays,
  Dumbbell,
  GraduationCap,
  User as UserIcon,
  Settings,
  LogOut,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface SideDrawerProps {
  open: boolean
  onClose: () => void
  user: User | null
  pathname: string
}

export function SideDrawer({ open, onClose, user, pathname }: SideDrawerProps) {
  const router = useRouter()
  const supabase = createClient()

  const menuItems = [
    { icon: Home, label: "Beranda", href: "/" },
    { icon: CalendarDays, label: "Booking", href: "/booking" },
    { icon: Dumbbell, label: "Fitness", href: "/fitness" },
    { icon: GraduationCap, label: "Akademi", href: "/academy" },
    { icon: UserIcon, label: "Profil", href: "/profile" },
  ]

  const adminItems = [
    { icon: Settings, label: "Dashboard", href: "/admin" },
  ]

  async function handleSignOut() {
    await supabase.auth.signOut()
    onClose()
    router.push("/login")
    router.refresh()
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="font-bold text-xl tracking-wider text-[#84102D]">
            STADIONE
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col py-2">
          {user ? (
            <div className="px-4 py-2">
              <p className="text-sm font-medium truncate">
                {user.user_metadata?.name || user.email}
              </p>
              <p className="text-xs text-[#B5AC8A] truncate">{user.email}</p>
            </div>
          ) : (
            <div className="px-4 py-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  onClose()
                  router.push("/login")
                }}
              >
                Masuk
              </Button>
            </div>
          )}
          <Separator />
          <nav className="flex-1 py-2">
            {menuItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className="w-full justify-start gap-3 rounded-none px-4 h-11"
                onClick={() => {
                  onClose()
                  router.push(item.href)
                }}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            ))}
            {adminItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                className="w-full justify-start gap-3 rounded-none px-4 h-11"
                onClick={() => {
                  onClose()
                  router.push(item.href)
                }}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </nav>
          <Separator />
          {user && (
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-[#84102D]"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
