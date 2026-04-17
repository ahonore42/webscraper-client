"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Loader2, Globe, Code, Eye } from "lucide-react"
import { toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface Selector {
  name: string
  selector: string
  selector_type: "css" | "xpath"
  priority?: number
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

export default function ScrapePage() {
  const { data: session } = useSession()

  const [url, setUrl] = useState("")
  const [selectors, setSelectors] = useState<Selector[]>([
    { name: "title", selector: "h1", selector_type: "css" },
  ])
  const [renderJs, setRenderJs] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [polling, setPolling] = useState(false)
  const [result, setResult] = useState<ScrapeResult | null>(null)
  const [, setJobId] = useState<string | null>(null)

  async function submitScrape() {
    if (!url || !session?.user?.accessToken) return
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      toast.error("Please enter a valid URL starting with http:// or https://")
      return
    }

    setSubmitting(true)
    setResult(null)

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          selectors: selectors.filter((s) => s.name && s.selector),
          render_js: renderJs,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Scrape failed")
      }

      const data: ScrapeResult = await res.json()
      setJobId(data.job_id)
      toast.success("Scrape job submitted")
      pollResult(data.job_id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit scrape")
    } finally {
      setSubmitting(false)
    }
  }

  async function pollResult(id: string) {
    setPolling(true)
    try {
      const res = await fetch(`/api/scrape/${id}`)
      const data: ScrapeResult = await res.json()

      if (data.status === "pending" || data.status === "running") {
        await new Promise((r) => setTimeout(r, 2000))
        return pollResult(id)
      }

      setResult(data)
      setJobId(null)
    } catch {
      toast.error("Failed to poll result")
    } finally {
      setPolling(false)
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">New Scrape</h1>
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
                  Submitting...
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
              {polling ? (
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
            ) : result?.selectors ? (
              <div className="space-y-4">
                {result.title && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Title</p>
                    <p className="font-medium text-foreground dark:text-foreground">{result.title}</p>
                  </div>
                )}
                {result.selectors.map((sel, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{sel.name}</p>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {sel.selector_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 font-mono break-all">
                      {formatValue(sel.value)}
                    </p>
                  </div>
                ))}
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
  )
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "(empty)"
  if (Array.isArray(value)) return value.slice(0, 10).join(", ")
  if (typeof value === "object") return JSON.stringify(value).slice(0, 200)
  return String(value).slice(0, 200)
}
