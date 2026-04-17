import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const PUBLIC_TOKEN = process.env.NEXT_PUBLIC_SCRAPE_TOKEN || ""

// Force dynamic rendering — this route must always run at request time, never cached
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const body = await req.json()
  console.log(`[POST /api/public/scrape] url=${body.url}, callback_url=${body.callback_url}`)

  // Frontend passes its own public URL as the callback target
  // The celery worker will POST the result here when the scrape completes
  const callbackUrl = body.callback_url

  const res = await fetch(`${API_URL}/public/scrape`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Public-Token": PUBLIC_TOKEN,
    },
    body: JSON.stringify({ ...body, callback_url: callbackUrl }),
    // Prevent Next.js server-side cache
    cache: "no-store",
  })

  const data = await res.json()
  console.log(`[POST /api/public/scrape] backend response: status=${data.status}, job_id=${data.job_id}`)

  return NextResponse.json(data, { status: res.status })
}