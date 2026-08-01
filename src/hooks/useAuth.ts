"use client"

import { createClient } from "@/lib/supabase/client"

export function useAuth() {
  const supabase = createClient()

  return {
    supabase,
    signIn: (email: string, password: string) =>
      supabase.auth.signInWithPassword({ email: email.trim(), password }),
    signUp: (email: string, password: string, name: string) =>
      supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim() } },
      }),
    signOut: () => supabase.auth.signOut(),
    resetPassword: (email: string) =>
      supabase.auth.resetPasswordForEmail(email.trim()),
    updatePassword: (password: string) =>
      supabase.auth.updateUser({ password }),
  }
}
