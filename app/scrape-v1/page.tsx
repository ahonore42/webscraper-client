"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { ScrapeForm, ScrapeResults } from "@/components/scrape"
import type { ScrapeResult, ScrapeSubmitData } from "@/components/scrape"

export default function PublicScrapePage() {
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ScrapeResult | null>(null)

  // Load result passed from landing page via sessionStorage, open SSE if pending
  useEffect(() => {
    const pendingJobId = sessionStorage.getItem("pendingScrapeJobId")
    if (pendingJobId) {
      sessionStorage.removeItem("pendingScrapeJobId")
      console.log(`[useEffect] Landing page job_id: ${pendingJobId}, opening SSE`)
      setSubmitting(true)
      openSSE(pendingJobId)
      return
    }

    const stored = sessionStorage.getItem("scrapeResult")
    if (stored) {
      sessionStorage.removeItem("scrapeResult")
      try {
        const parsed = JSON.parse(stored) as ScrapeResult
        if (parsed.status === "pending" && parsed.job_id) {
          setSubmitting(true)
          openSSE(parsed.job_id)
        } else {
          setResult(parsed)
          setSubmitting(false)
        }
      } catch {
        // ignore corrupt data
      }
    }
  }, [])

  function openSSE(jobId: string) {
    const es = new EventSource(`/api/scrape/stream/${jobId}`)

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.connected) return
        console.log(`[SSE Client] Received result:`, data)
        setResult(data)
        setSubmitting(false)
        es.close()
      } catch (err) {
        console.error(`[SSE Client] JSON parse error:`, err)
        setSubmitting(false)
        es.close()
      }
    }

    es.onerror = () => {
      es.close()
      setSubmitting(false)
    }
  }

  async function handleScrape(data: ScrapeSubmitData) {
    setSubmitting(true)
    setResult(null)

    try {
      const webhookBase = process.env.NEXT_PUBLIC_WEBHOOK_BASE_URL || window.location.origin
      const callbackUrl = `${webhookBase}/api/webhook/scrape`

      const res = await fetch("/api/public/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: data.url,
          selectors: data.selectors,
          render_js: data.renderJs,
          callback_url: callbackUrl,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Scrape failed")
      }

      const resultData: ScrapeResult = await res.json()

      if (resultData.status === "pending" && resultData.job_id) {
        openSSE(resultData.job_id)
      } else {
        setResult(resultData)
        setSubmitting(false)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit scrape")
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
          <span className="font-semibold text-foreground">WebScraper</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Public Scrape</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Submit a URL and define selectors to extract data
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <ScrapeForm onSubmit={handleScrape} submitting={submitting} />
            <ScrapeResults result={result} submitting={submitting} />
          </div>
        </div>
      </div>
    </div>
  )
}
