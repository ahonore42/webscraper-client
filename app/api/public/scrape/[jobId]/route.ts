import { NextRequest, NextResponse } from "next/server"
import { parseHtml } from "@/lib/parser"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Force dynamic rendering — this route must always run at request time, never cached
export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params
  console.log(`[GET /api/public/scrape/${jobId}] Request received`)

  let res: Response
  try {
    res = await fetch(`${API_URL}/public/scrape/${jobId}`, {
      signal: AbortSignal.timeout(30000),
      // Prevent Next.js server-side cache from returning stale data
      cache: "no-store",
    })
    console.log(`[GET /api/public/scrape/${jobId}] Backend response status: ${res.status}`)
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      console.error(`[GET /api/public/scrape/${jobId}] Backend timeout`)
      return NextResponse.json({ error: "Backend request timed out" }, { status: 504 })
    }
    console.error(`[GET /api/public/scrape/${jobId}] Proxy fetch error:`, err)
    return NextResponse.json({ error: "Failed to reach backend" }, { status: 502 })
  }

  let data: Record<string, unknown>
  try {
    data = await res.json()
    console.log(`[GET /api/public/scrape/${jobId}] Backend data: status=${data.status}, url=${data.url}`)
  } catch {
    const text = await res.text().catch(() => "unknown")
    console.error(`[GET /api/public/scrape/${jobId}] Failed to parse JSON:`, text.slice(0, 200))
    return NextResponse.json({ error: "Backend returned invalid JSON" }, { status: 502 })
  }

  // Parse HTML server-side to extract links, images, and metadata
  const html = data.html_content as string | undefined
  const url = data.url as string | undefined
  if (html) {
    const parsed = parseHtml(html, { baseUrl: url })
    data.links = parsed.links
    data.images = parsed.images
    data.metadata = { ...(data.metadata as Record<string, string> | undefined), ...parsed.metadata }
  }

  // Prevent browser HTTP cache from returning stale responses
  return NextResponse.json(data, {
    status: res.status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  })
}