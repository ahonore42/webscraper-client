"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { ScrapeForm, ScrapeResults } from "@/components/scrape"
import type { ScrapeResult, ScrapeSubmitData, ScrapeResultField } from "@/components/scrape"

export default function ScrapePage() {
  const { data: session } = useSession()
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ScrapeResult | null>(null)
  const [selectedFields, setSelectedFields] = useState<Set<ScrapeResultField> | null>(null)

  async function handleScrape(data: ScrapeSubmitData) {
    if (!session?.user?.accessToken) return

    setSubmitting(true)
    setResult(null)

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: data.url,
          selectors: data.selectors,
          render_js: data.renderJs,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Scrape failed")
      }

      const resultData: ScrapeResult = await res.json()
      setResult(resultData)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit scrape")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">New Scrape</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Submit a URL and define selectors to extract data
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <ScrapeForm
          onSubmit={handleScrape}
          disabled={!session?.user?.accessToken}
          submitting={submitting}
          selectedFields={selectedFields}
          onFieldsChange={setSelectedFields}
        />
        <ScrapeResults result={result} submitting={submitting} selectedFields={selectedFields} />
      </div>
    </div>
  )
}
