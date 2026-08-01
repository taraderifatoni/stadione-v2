"use client"

import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-[#84102D]/10 flex items-center justify-center">
            <span className="text-2xl">!</span>
          </div>
          <div>
            <p className="font-semibold text-lg text-[#F5F0E8]">Terjadi Kesalahan</p>
            <p className="text-sm text-[#B5AC8A] mt-1">Silakan muat ulang halaman</p>
          </div>
          <Button onClick={() => this.setState({ hasError: false })}>Coba Lagi</Button>
        </div>
      )
    }
    return this.props.children
  }
}
