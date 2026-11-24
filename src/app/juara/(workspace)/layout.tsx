import type { ReactNode } from "react"
import WorkspaceShell from "@/components/juara/WorkspaceShell"

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <WorkspaceShell>{children}</WorkspaceShell>
}
