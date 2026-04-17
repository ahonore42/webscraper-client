import { NextResponse } from "next/server"
import { getRedis } from "@/lib/redis"
import { parseHtml } from "@/lib/parser"

// POST handlers are never cached, but force-dynamic ensures route is always computed
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  console.log("[Webhook] Received POST request")
  try {
    const body = await req.json()
    const jobId = body.job_id

    console.log(`[Webhook] body.job_id: ${jobId}`)
    console.log(`[Webhook] body.status: ${body.status}`)
    console.log(`[Webhook] body keys: ${Object.keys(body).join(", ")}`)

    if (!jobId) {
      console.log("[Webhook] Missing job_id, returning 400")
      return NextResponse.json({ error: "job_id is required" }, { status: 400 })
    }

    // Parse HTML server-side to extract/augment links, images, and metadata
    const html = body.html_content as string | undefined
    const url = body.url as string | undefined
    if (html) {
      console.log(`[Webhook] Running parseHtml on html_content (${html.length} chars)`)
      const parsed = parseHtml(html, { baseUrl: url })
      body.links = parsed.links
      body.images = parsed.images
      body.metadata = { ...(body.metadata as Record<string, string> | undefined), ...parsed.metadata }
      console.log(`[Webhook] parseHtml extracted ${parsed.links.length} links, ${parsed.images.length} images, ${Object.keys(parsed.metadata).length} metadata keys`)
    } else {
      console.log(`[Webhook] No html_content in body, skipping parseHtml`)
    }

    const redis = getRedis()
    const resultKey = `scrape:result:${jobId}`
    const channel = `scrape:result:${jobId}`

    console.log(`[Webhook] Storing result in Redis key ${resultKey}`)
    await redis.set(resultKey, JSON.stringify(body), "EX", 3600)

    console.log(`[Webhook] Publishing to Redis channel ${channel}`)
    const publishCount = await redis.publish(channel, JSON.stringify(body))
    console.log(`[Webhook] Publish returned ${publishCount} subscribers`)

    console.log("[Webhook] Returning 200")
    return new Response(null, { status: 200 })
  } catch (err) {
    console.error("[Webhook] Error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
