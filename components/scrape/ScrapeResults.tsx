"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Code, Copy, Check } from "lucide-react"
import { useState } from "react"
import type { ScrapeResult } from "./types"
import { SyntaxHighlightedJson } from "@/components/docs"

interface ScrapeResultsProps {
  result: ScrapeResult | null
  submitting: boolean
  error?: string
}

export function ScrapeResults({ result, submitting, error }: ScrapeResultsProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (!result) return
    navigator.clipboard.writeText(JSON.stringify(result, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Results</CardTitle>
        <CardDescription>
          {submitting ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Scraping...
            </span>
          ) : error ? (
            <span className="text-red-500">Error</span>
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
        {error ? (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
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
                onClick={handleCopy}
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy JSON"}
              </Button>
            </div>
            <SyntaxHighlightedJson data={result as unknown as Record<string, unknown>} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Code className="h-12 w-12 mb-3" />
            <p className="text-sm text-muted-foreground">Configure and run a scrape to see results</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
