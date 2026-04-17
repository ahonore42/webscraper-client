"use client"

import { useState } from "react"
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
import { Header } from "@/components/header"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface ScrapeResult {
  job_id: string
  status: string
  url: string
  title?: string
  text_content?: string
  links?: string[]
  images?: string[]
  selectors?: Array<{ name: string; value: unknown }>
  error_message?: string
}

export default function LandingPage() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "register">("register")

  async function handlePublicScrape() {
    if (!url) return

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      toast.error("Please enter a valid URL starting with http:// or https://")
      return
    }

    setSubmitting(true)

    try {
      // Use WEBHOOK_BASE_URL if set (must be reachable from Celery in Docker).
      // Fall back to window.location.origin for production.
      const webhookBase = process.env.NEXT_PUBLIC_WEBHOOK_BASE_URL || window.location.origin
      const callbackUrl = `${webhookBase}/api/webhook/scrape`
      console.log(`[Landing] Submitting scrape for ${url}`)
      console.log(`[Landing] callback_url: ${callbackUrl}`)

      const res = await fetch("/api/public/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          selectors: [],
          render_js: false,
          callback_url: callbackUrl,
        }),
      })

      console.log(`[Landing] POST response status: ${res.status}`)

      if (res.status === 401 || res.status === 403) {
        console.log(`[Landing] Auth required, showing dialog`)
        setShowAuthDialog(true)
        setSubmitting(false)
        return
      }

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Scrape failed")
      }

      const data = await res.json()
      console.log(`[Landing] POST response: status=${data.status}, job_id=${data.job_id}`)
      // Only store the job_id — we never show pending state, SSE delivers the final result
      sessionStorage.setItem("pendingScrapeJobId", data.job_id)
      router.push("/scrape-v1")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Scrape failed")
      console.error(`[Landing] Error:`, err)
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
        <Badge variant="outline" className="mb-6 border-border text-muted-foreground">
          API-first web scraping
        </Badge>
        <h1 className="text-5xl font-bold tracking-tight max-w-2xl mb-6 text-foreground">
          Programmatic web scraping at scale
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mb-10">
          Extract structured data from any website. CSS selectors, XPath, JavaScript rendering,
          scheduled jobs — all via a simple REST API.
        </p>

        {/* Public scrape form */}
        <Card className="w-full max-w-lg mb-12">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <Zap className="h-4 w-4 text-muted-foreground" />
              Try it now — no signup required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://news.ycombinator.com"
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handlePublicScrape()}
              />
              <Button onClick={handlePublicScrape} disabled={submitting} className="shrink-0">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
              </Button>
            </div>
            {submitting && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Submitting...
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4" /> No credit card
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4" /> Free tier included
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4" /> API key auth
          </span>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-12 text-foreground">Everything you need to scrape at scale</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={<Globe className="h-5 w-5 text-primary" />}
              title="Any website, any data"
              description="CSS selectors, XPath queries, or auto-detected content. Extract titles, prices, links, images, and custom fields."
            />
            <FeatureCard
              icon={<Code2 className="h-5 w-5 text-primary" />}
              title="JavaScript rendering"
              description="Our headless browser renders JavaScript-heavy pages automatically. Scrape SPAs, React apps, and dynamic content."
            />
            <FeatureCard
              icon={<Clock className="h-5 w-5 text-primary" />}
              title="Scheduled scraping"
              description="Set up recurring scrape jobs on a cron schedule. We run them and deliver results to your webhook."
            />
            <FeatureCard
              icon={<Shield className="h-5 w-5 text-primary" />}
              title="API key auth"
              description="Every request authenticated via API key. Track usage per key, revoke instantly, and manage access controls."
            />
            <FeatureCard
              icon={<Zap className="h-5 w-5 text-primary" />}
              title="Rate limiting"
              description="Generous rate limits with automatic throttling. Queued jobs run reliably under load."
            />
            <FeatureCard
              icon={<Code2 className="h-5 w-5 text-primary" />}
              title="Stored selectors"
              description="Save selector sets to your account. Reference them by name instead of repeating selectors in every request."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-16 px-4 text-center">
        <h2 className="text-2xl font-semibold mb-3 text-foreground">Start scraping in minutes</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
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
      <footer className="border-t border-border py-6 px-4 text-center text-xs text-muted-foreground">
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
              <p className="text-sm text-muted-foreground text-center">
                Redirecting to registration...
              </p>
            ) : (
              <p className="text-sm text-muted-foreground text-center">Redirecting to login...</p>
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
    <div className="p-6 rounded-xl border border-border bg-card">
      <div className="text-muted-foreground mb-3">{icon}</div>
      <p className="font-medium mb-2 text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
