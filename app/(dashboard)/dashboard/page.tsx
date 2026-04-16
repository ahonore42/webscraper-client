"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Key, Database, CheckCircle, Loader2 } from "lucide-react"

interface ScrapeStats {
  total: number
  success: number
}

interface ApiKeySummary {
  keys: Array<{ id: string; is_active: boolean }>
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<ScrapeStats | null>(null)
  const [keyCount, setKeyCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.accessToken) return

    async function load() {
      try {
        const [statsRes, keysRes] = await Promise.all([
          fetch("/api/scrape/stats"),
          fetch("/api/auth/keys"),
        ])
        if (statsRes.ok) {
          const s: ScrapeStats = await statsRes.json()
          setStats(s)
        }
        if (keysRes.ok) {
          const k: ApiKeySummary = await keysRes.json()
          setKeyCount(k.keys?.filter((k) => k.is_active).length ?? 0)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [session?.user?.accessToken])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Welcome back, {session?.user?.email}
        </h1>
        <p className="text-zinc-500 mt-1">Here&apos;s what&apos;s happening with your scraper.</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="API Keys"
          description="Active keys"
          value={loading ? <Loader2 className="h-5 w-5 animate-spin" /> : String(keyCount ?? 0)}
          icon={<Key className="h-5 w-5 text-zinc-500" />}
          href="/api-keys"
          hrefLabel="Manage keys"
        />
        <StatCard
          title="Total Scrapes"
          description="All time"
          value={loading ? <Loader2 className="h-5 w-5 animate-spin" /> : String(stats?.total ?? 0)}
          icon={<Database className="h-5 w-5 text-zinc-500" />}
          href="/scrape"
          hrefLabel="New scrape"
        />
        <StatCard
          title="Success Rate"
          description="All time"
          value={
            loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : stats && stats.total > 0 ? (
              `${Math.round((stats.success / stats.total) * 100)}%`
            ) : (
              "—"
            )
          }
          icon={<CheckCircle className="h-5 w-5 text-zinc-500" />}
        />
      </div>

      {/* Quick start */}
      <Card>
        <CardHeader>
          <CardTitle>Quick start</CardTitle>
          <CardDescription>Get up and running in seconds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <QuickStartStep
            number={1}
            title="Create an API key"
            description="Generate an API key to make programmatic requests."
            href="/api-keys"
            hrefLabel="Create key"
          />
          <QuickStartStep
            number={2}
            title="Run your first scrape"
            description="Submit a URL with CSS or XPath selectors to extract data."
            href="/scrape"
            hrefLabel="Start scraping"
          />
          <QuickStartStep
            number={3}
            title="Integrate via API"
            description="Use your API key in requests to the /scrape endpoint."
          >
            <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded mt-2 inline-block font-mono">
              curl -X POST https://api.example.com/scrape -H &quot;X-API-Key: your-key&quot; -d &#123;&quot;url&quot;: &quot;https://...&quot;&#125;
            </code>
          </QuickStartStep>
        </CardContent>
      </Card>

      {/* Getting help */}
      <Card>
        <CardHeader>
          <CardTitle>Docs & API Reference</CardTitle>
          <CardDescription>Everything you need to integrate</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <DocLink href="#" label="Scraping basics" description="Learn how to submit and poll scrape jobs" />
          <DocLink href="#" label="Selector syntax" description="CSS and XPath selector reference" />
          <DocLink href="#" label="Scheduled scraping" description="Automate recurring scraping tasks" />
          <DocLink href="#" label="Rate limits" description="Understand your plan's limits" />
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  title,
  description,
  value,
  icon,
  href,
  hrefLabel,
}: {
  title: string
  description: string
  value: React.ReactNode
  icon: React.ReactNode
  href?: string
  hrefLabel?: string
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-zinc-500">{title}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
            <p className="text-xs text-zinc-400 mt-1">{description}</p>
          </div>
          <div className="text-zinc-400">{icon}</div>
        </div>
        {href && hrefLabel && (
          <a
            href={href}
            className="inline-block mt-4 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 underline underline-offset-4"
          >
            {hrefLabel} →
          </a>
        )}
      </CardContent>
    </Card>
  )
}

function QuickStartStep({
  number,
  title,
  description,
  href,
  hrefLabel,
  children,
}: {
  number: number
  title: string
  description: string
  href?: string
  hrefLabel?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 flex items-center justify-center text-sm font-medium">
        {number}
      </div>
      <div className="flex-1">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">{title}</p>
        <p className="text-sm text-zinc-500 mt-0.5">{description}</p>
        {children}
        {href && hrefLabel && (
          <a
            href={href}
            className="inline-block mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-50 underline underline-offset-4"
          >
            {hrefLabel} →
          </a>
        )}
      </div>
    </div>
  )
}

function DocLink({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-between p-3 rounded-lg border hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
    >
      <div>
        <p className="font-medium text-zinc-900 dark:text-zinc-50">{label}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
    </a>
  )
}
