"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Notification } from "@/types"
import { useRouter } from "next/navigation"

export function NotificationCenter({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()
  const router = useRouter()

  const fetchNotifications = useCallback(async () => {
    const { data, count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: false })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)

    if (data) {
      setNotifications(data as Notification[])
      setUnreadCount(data.filter((n) => !n.is_read).length)
    }
  }, [userId])

  useEffect(() => {
    fetchNotifications()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchNotifications])

  async function markAsRead(notification: Notification) {
    if (notification.is_read) {
      router.push(notification.link || "/notifications")
      return
    }

    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notification.id)

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notification.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      )
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
    router.push(notification.link || "/notifications")
  }

  async function markAllAsRead() {
    await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_read", false)

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    )
    setUnreadCount(0)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative inline-flex items-center justify-center rounded-lg p-2 hover:bg-[#242220] focus-visible:outline-none">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 flex items-center justify-center px-1 bg-[#84102D] text-white text-[10px] rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2">
          <DropdownMenuLabel className="p-0">Notifikasi</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-auto py-1" onClick={markAllAsRead}>
              Tandai semua
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#B5AC8A]">
            Belum ada notifikasi
          </div>
        ) : (
          notifications.slice(0, 10).map((notif) => (
            <DropdownMenuItem
              key={notif.id}
              className="flex flex-col items-start gap-1 cursor-pointer px-4 py-3"
              onClick={() => markAsRead(notif)}
            >
              <div className="flex items-center gap-2 w-full">
                {!notif.is_read && (
                  <span className="h-2 w-2 rounded-full bg-[#84102D] shrink-0" />
                )}
                <span className="text-sm font-medium flex-1">{notif.title}</span>
                <span className="text-xs text-[#6B6558] shrink-0">
                  {formatTimeAgo(notif.created_at)}
                </span>
              </div>
              <p className="text-xs text-[#B5AC8A] line-clamp-2">{notif.body}</p>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center text-sm text-[#84102D]"
          onClick={() => router.push("/notifications")}
        >
          Lihat semua
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Baru saja"
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}j`
  const days = Math.floor(hours / 24)
  return `${days}h`
}
