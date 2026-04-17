import { getRedisSubscriber } from "@/lib/redis"

export const dynamic = "force-dynamic"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params
  console.log(`[SSE] Stream opened for job ${jobId}`)

  const encoder = new TextEncoder()
  const redis = getRedisSubscriber()
  const channel = `scrape:result:${jobId}`

  const stream = new ReadableStream({
    start(controller) {
      console.log(`[SSE] Starting stream, subscribing to channel ${channel}`)

      // Send initial connection confirmed message
      controller.enqueue(encoder.encode(`data: {"connected": true}\n\n`))

      let settled = false

      const handler = (ch: string, message: string) => {
        console.log(`[SSE] Message received on channel ${ch}:`, message.substring(0, 200))
        if (settled) {
          console.log(`[SSE] Stream already settled, ignoring message`)
          return
        }
        settled = true
        try {
          controller.enqueue(encoder.encode(`data: ${message}\n\n`))
          console.log(`[SSE] Enqueued message, closing stream`)
          controller.close()
        } catch (err) {
          console.error(`[SSE] Error enqueuing message:`, err)
        }
      }

      // Register handler BEFORE subscribe to avoid missing messages in the async window
      redis.on("message", handler)

      redis.subscribe(channel).then(() => {
        console.log(`[SSE] Successfully subscribed to ${channel}`)
      }).catch((err) => {
        console.error(`[SSE] Redis subscribe error:`, err)
        try {
          controller.close()
        } catch {
          // stream already closed
        }
      })

      // Timeout after 60 seconds
      setTimeout(() => {
        if (settled) {
          console.log(`[SSE] Timeout fired but stream already settled`)
          return
        }
        settled = true
        console.log(`[SSE] Timeout fired, closing stream (no message received)`)
        try {
          controller.close()
        } catch {
          // stream already closed
        }
      }, 60000)
    },

    cancel() {
      console.log(`[SSE] Stream cancelled for job ${jobId}`)
      try {
        redis.unsubscribe(channel).catch((err) => {
          console.error(`[SSE] Unsubscribe error:`, err)
        })
        redis.removeListener("message", () => {})
      } catch {
        // ignore
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
