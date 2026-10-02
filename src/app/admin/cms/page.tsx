import { ContentWorkspace } from "./content-workspace"
import { requirePlatformAdmin } from "@/lib/cms/auth"
import { redirect } from "next/navigation"

export default async function StadioneCmsPage() {
  const auth = await requirePlatformAdmin()
  if (!auth.ok) {
    if (auth.status === 401) redirect("/login?redirect=/admin/cms")
    return <main className="p-8">Akses Content &amp; CMS hanya untuk platform admin.</main>
  }
  return <ContentWorkspace />
}
