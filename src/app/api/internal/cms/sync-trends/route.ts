import { timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"

import { getDailySportsPool, getSearchUsage } from "@/lib/cms/serpapi"

export const runtime = "nodejs"
export const maxDuration = 180

export async function POST(request: NextRequest) {
  const expected = process.env.CMS_WORKER_SECRET
  const actual = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || ""
  if (!expected || Buffer.byteLength(actual) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const pool = await getDailySportsPool()
    const usage = await getSearchUsage()
    return NextResponse.json({
      synced_at: new Date().toISOString(),
      date: pool.date,
      sources: Object.fromEntries(Object.entries(pool.sources).map(([engine, source]) => [engine, {
        cached: source.cached,
        items: source.items.length,
      }])),
      usage,
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Trend sync failed" }, { status: 502 })
  }
}
