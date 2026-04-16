"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Globe, Code2, Clock, Shield, Zap, CheckCircle, ArrowRight } from "lucide-react"
import { toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const PUBLIC_SCRAPE_URL = `${API_URL}/public/scrape`

interface ScrapeResult {
  job_id: string
  status: string
  url: string
  title?: string
  selectors?: Array<{ name: string; value: unknown }>
  error_message?: string
}

export default function LandingPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [url, setUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [polling, setPolling] = useState(false)
  const [result, setResult] = useState<ScrapeResult | null>(null)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "register">("register")

  async function handlePublicScrape() {
    if (!url) return

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      toast.error("Please enter a valid URL starting with http:// or https://")
      return
    }

    setSubmitting(true)
    setResult(null)

    try {
      const res = await fetch("/api/public/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          selectors: [{ name: "title", selector: "title", selector_type: "css" }],
          render_js: false,
        }),
      })

      if (res.status === 401 || res.status === 403) {
        setShowAuthDialog(true)
        setSubmitting(false)
        return
      }

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Scrape failed")
      }

      const data: ScrapeResult = await res.json()
      pollResult(data.job_id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Scrape failed")
      setSubmitting(false)
    }
  }

  async function pollResult(jobId: string) {
    setPolling(true)
    try {
      const res = await fetch(`/api/public/scrape/${jobId}`)
      const data: ScrapeResult = await res.json()

      if (data.status === "pending" || data.status === "running") {
        await new Promise((r) => setTimeout(r, 2000))
        return pollResult(jobId)
      }

      setResult(data)
    } catch {
      toast.error("Failed to fetch result")
    } finally {
      setPolling(false)
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-50">
      {/* Nav */}
      <header className="border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-semibold text-lg tracking-tight">WebScraper</span>
          <nav className="flex items-center gap-4">
            {session ? (
              <Button onClick={() => router.push("/dashboard")} size="sm" className="gap-1">
                Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Get started</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
        <Badge variant="outline" className="mb-6 border-zinc-700 text-zinc-400">
          API-first web scraping
        </Badge>
        <h1 className="text-5xl font-bold tracking-tight max-w-2xl mb-6">
          Programmatic web scraping at scale
        </h1>
        <p className="text-zinc-400 text-lg max-w-xl mb-10">
          Extract structured data from any website. CSS selectors, XPath, JavaScript rendering,
          scheduled jobs — all via a simple REST API.
        </p>

        {/* Public scrape form */}
        <Card className="w-full max-w-lg bg-zinc-900 border-zinc-800 mb-12">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-4 w-4 text-zinc-400" />
              Try it now — no signup required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://news.ycombinator.com"
                className="flex-1 bg-zinc-950 border-zinc-700 placeholder:text-zinc-600"
                onKeyDown={(e) => e.key === "Enter" && handlePublicScrape()}
              />
              <Button onClick={handlePublicScrape} disabled={submitting || polling} className="shrink-0">
                {submitting || polling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
              </Button>
            </div>
            {(submitting || polling) && (
              <p className="text-xs text-zinc-500 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                {polling ? "Scraping..." : "Submitting..."}
              </p>
            )}
            {result && (
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-left">
                {result.error_message ? (
                  <p className="text-sm text-red-400">{result.error_message}</p>
                ) : (
                  <div className="space-y-2">
                    {result.title && (
                      <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider">Title</p>
                        <p className="text-sm font-medium">{result.title}</p>
                      </div>
                    )}
                    {result.selectors?.map((s, i) => (
                      <div key={i}>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider">{s.name}</p>
                        <p className="text-sm font-mono text-zinc-300 truncate">
                          {String(s.value ?? "(empty)").slice(0, 100)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-8 text-sm text-zinc-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-zinc-600" /> No credit card
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-zinc-600" /> Free tier included
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-zinc-600" /> API key auth
          </span>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-800 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-12">Everything you need to scrape at scale</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={<Globe className="h-5 w-5" />}
              title="Any website, any data"
              description="CSS selectors, XPath queries, or auto-detected content. Extract titles, prices, links, images, and custom fields."
            />
            <FeatureCard
              icon={<Code2 className="h-5 w-5" />}
              title="JavaScript rendering"
              description="Our headless browser renders JavaScript-heavy pages automatically. Scrape SPAs, React apps, and dynamic content."
            />
            <FeatureCard
              icon={<Clock className="h-5 w-5" />}
              title="Scheduled scraping"
              description="Set up recurring scrape jobs on a cron schedule. We run them and deliver results to your webhook."
            />
            <FeatureCard
              icon={<Shield className="h-5 w-5" />}
              title="API key auth"
              description="Every request authenticated via API key. Track usage per key, revoke instantly, and manage access controls."
            />
            <FeatureCard
              icon={<Zap className="h-5 w-5" />}
              title="Rate limiting"
              description="Generous rate limits with automatic throttling. Queued jobs run reliably under load."
            />
            <FeatureCard
              icon={<Code2 className="h-5 w-5" />}
              title="Stored selectors"
              description="Save selector sets to your account. Reference them by name instead of repeating selectors in every request."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-800 py-16 px-4 text-center">
        <h2 className="text-2xl font-semibold mb-3">Start scraping in minutes</h2>
        <p className="text-zinc-400 mb-6 max-w-md mx-auto">
          Create a free account and get your first API key instantly.
        </p>
        <div className="flex gap-3 justify-center">
          <Button size="lg" asChild>
            <Link href="/register">Create free account</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-6 px-4 text-center text-xs text-zinc-600">
        <p>Built with FastAPI + Next.js</p>
      </footer>

      {/* Auth dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create your free account</DialogTitle>
            <DialogDescription>
              Sign up to continue scraping. Your API key will be created automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              variant={authMode === "register" ? "default" : "outline"}
              onClick={() => setAuthMode("register")}
              className="flex-1"
            >
              Register
            </Button>
            <Button
              variant={authMode === "login" ? "default" : "outline"}
              onClick={() => setAuthMode("login")}
              className="flex-1"
            >
              Sign in
            </Button>
          </div>
          <div className="py-4">
            {authMode === "register" ? (
              <p className="text-sm text-zinc-500 text-center">
                Redirecting to registration...
              </p>
            ) : (
              <p className="text-sm text-zinc-500 text-center">Redirecting to login...</p>
            )}
          </div>
          <Button
            onClick={() => {
              setShowAuthDialog(false)
              router.push(authMode === "register" ? "/register" : "/login")
            }}
            className="w-full"
          >
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
      <div className="text-zinc-400 mb-3">{icon}</div>
      <p className="font-medium mb-2">{title}</p>
      <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
    </div>
  )
}
