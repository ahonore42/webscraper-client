"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Loader2, Globe, Code, Eye, Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface Selector {
  name: string
  selector: string
  selector_type: "css" | "xpath"
}

interface ScrapeResult {
  job_id: string
  status: string
  url: string
  title?: string
  text_content?: string
  html_content?: string
  links?: string[]
  images?: string[]
  metadata?: Record<string, string>
  selectors?: Array<{ name: string; selector: string; selector_type: string; value: unknown; count?: number }>
  error_message?: string
}

export default function PublicScrapePage() {
  const [url, setUrl] = useState("")
  const [selectors, setSelectors] = useState<Selector[]>([
    { name: "title", selector: "h1", selector_type: "css" },
  ])
  const [renderJs, setRenderJs] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ScrapeResult | null>(null)
  const [copied, setCopied] = useState(false)

  // Load result passed from landing page via sessionStorage, open SSE if pending
  useEffect(() => {
    // Landing page flow: job_id only, SSE delivers the final result (no pending state shown)
    const pendingJobId = sessionStorage.getItem("pendingScrapeJobId")
    if (pendingJobId) {
      sessionStorage.removeItem("pendingScrapeJobId")
      console.log(`[useEffect] Landing page job_id: ${pendingJobId}, opening SSE`)
      setSubmitting(true)
      openSSE(pendingJobId)
      return
    }

    // Direct form submission flow: full result (immediate or pending)
    const stored = sessionStorage.getItem("scrapeResult")
    console.log(`[useEffect] sessionStorage check: ${stored ? "found" : "empty"}`)
    if (stored) {
      sessionStorage.removeItem("scrapeResult")
      try {
        const parsed = JSON.parse(stored) as ScrapeResult
        console.log(`[useEffect] Parsed result: status=${parsed.status}, job_id=${parsed.job_id}`)
        if (parsed.status === "pending" && parsed.job_id) {
          console.log(`[useEffect] Opening SSE for job ${parsed.job_id}`)
          setSubmitting(true)
          openSSE(parsed.job_id)
        } else {
          console.log(`[useEffect] Immediate result, showing directly`)
          setResult(parsed)
          setSubmitting(false)
        }
      } catch {
        // ignore corrupt data
      }
    } else {
      console.log(`[useEffect] No stored result, waiting for direct form submission`)
    }
  }, [])

  function openSSE(jobId: string) {
    console.log(`[SSE Client] Opening EventSource for job ${jobId}`)
    setSubmitting(true)
    const es = new EventSource(`/api/scrape/stream/${jobId}`)

    es.onopen = () => {
      console.log(`[SSE Client] EventSource connected`)
    }

    es.onmessage = (e) => {
      console.log(`[SSE Client] onmessage:`, e.data)
      try {
        const data = JSON.parse(e.data)
        if (data.connected) {
          console.log(`[SSE Client] Received connection confirmation`)
          return
        }
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

    es.onerror = (err) => {
      console.error(`[SSE Client] onerror:`, err)
      es.close()
      setSubmitting(false)
    }
  }

  async function submitScrape() {
    if (!url) return
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      toast.error("Please enter a valid URL starting with http:// or https://")
      return
    }

    setSubmitting(true)
    setResult(null)

    try {
      const webhookBase = process.env.NEXT_PUBLIC_WEBHOOK_BASE_URL || window.location.origin
      const callbackUrl = `${webhookBase}/api/webhook/scrape`
      console.log(`[submitScrape] Submitting scrape for ${url}`)
      console.log(`[submitScrape] callback_url: ${callbackUrl}`)

      const res = await fetch("/api/public/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          selectors: selectors.filter((s) => s.name && s.selector),
          render_js: renderJs,
          callback_url: callbackUrl,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Scrape failed")
      }

      const data: ScrapeResult = await res.json()
      console.log(`[submitScrape] POST response: status=${data.status}, job_id=${data.job_id}`)

      if (data.status === "pending" && data.job_id) {
        console.log(`[submitScrape] Job pending, opening SSE for ${data.job_id}`)
        openSSE(data.job_id)
      } else {
        console.log(`[submitScrape] Immediate result, showing directly`)
        setResult(data)
        setSubmitting(false)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit scrape")
      console.error(`[submitScrape] Error:`, err)
      setSubmitting(false)
    }
  }

  function addSelector() {
    setSelectors([...selectors, { name: "", selector: "", selector_type: "css" }])
  }

  function removeSelector(index: number) {
    setSelectors(selectors.filter((_, i) => i !== index))
  }

  function updateSelector(index: number, field: keyof Selector, value: string) {
    const updated = [...selectors]
    updated[index] = { ...updated[index], [field]: value }
    setSelectors(updated)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Public Scrape</h1>
            <p className="text-muted-foreground text-sm mt-1">Submit a URL and define selectors to extract data</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Config */}
            <Card>
              <CardHeader>
                <CardTitle>Configure scrape</CardTitle>
                <CardDescription>Define the URL and selectors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="flex-1"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Selectors</Label>
                    <Button variant="outline" size="sm" onClick={addSelector} className="gap-1">
                      <Plus className="h-3 w-3" />
                      Add
                    </Button>
                  </div>

                  {selectors.map((sel, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-1">
                        <Input
                          value={sel.name}
                          onChange={(e) => updateSelector(i, "name", e.target.value)}
                          placeholder="Field name"
                          className="h-8 text-sm"
                        />
                        <div className="flex gap-1">
                          <select
                            value={sel.selector_type}
                            onChange={(e) => updateSelector(i, "selector_type", e.target.value as "css" | "xpath")}
                            className="h-8 text-xs border rounded px-2 bg-background"
                          >
                            <option value="css">CSS</option>
                            <option value="xpath">XPath</option>
                          </select>
                          <Input
                            value={sel.selector}
                            onChange={(e) => updateSelector(i, "selector", e.target.value)}
                            placeholder={sel.selector_type === "css" ? "div.class" : "//div[@class='...']"}
                            className="flex-1 h-8 text-sm font-mono"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSelector(i)}
                        className="mt-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex items-center gap-4">
                  <Button
                    variant={renderJs ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRenderJs(!renderJs)}
                    className="gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    Render JS
                  </Button>
                </div>

                <Button
                  onClick={submitScrape}
                  disabled={submitting || !url}
                  className="w-full gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4" />
                      Scrape URL
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>
                  {submitting ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Scraping...
                    </span>
                  ) : result ? (
                    <Badge variant="outline" className="font-normal">
                      {result.status}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">Results will appear here</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result?.error_message ? (
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                    <p className="text-sm text-red-700 dark:text-red-400">{result.error_message}</p>
                  </div>
                ) : result ? (
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="font-normal">
                        {result.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-muted-foreground"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(result, null, 2))
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        }}
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied ? "Copied" : "Copy JSON"}
                      </Button>
                    </div>
                    <div className="rounded-lg border border-border overflow-hidden text-xs">
                      <pre className="p-4 text-xs text-foreground overflow-auto max-h-96 whitespace-pre-wrap">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Code className="h-12 w-12 mb-3" />
                    <p className="text-sm text-muted-foreground">Configure and run a scrape to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
