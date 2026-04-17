"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, Globe, Eye } from "lucide-react"
import type { Selector, ScrapeSubmitData, ScrapeResultField } from "./types"
import { SelectorList } from "./SelectorList"
import { ScrapeFieldSelector } from "./ScrapeFieldSelector"

interface ScrapeFormProps {
  onSubmit: (data: ScrapeSubmitData) => void
  disabled?: boolean
  submitting?: boolean
  initialSelectors?: Selector[]
  selectedFields?: Set<ScrapeResultField> | null
  onFieldsChange?: (fields: Set<ScrapeResultField> | null) => void
}

export function ScrapeForm({ onSubmit, disabled, submitting, initialSelectors, selectedFields, onFieldsChange }: ScrapeFormProps) {
  const [url, setUrl] = useState("")
  const [selectors, setSelectors] = useState<Selector[]>(
    initialSelectors ?? [{ name: "title", selector: "h1", selector_type: "css" }]
  )
  const [renderJs, setRenderJs] = useState(false)
  const [internalFields, setInternalFields] = useState<Set<ScrapeResultField> | null>(null)

  const activeFields = selectedFields !== undefined ? selectedFields : internalFields
  const activeOnFieldsChange = onFieldsChange ?? setInternalFields

  function handleSubmit() {
    if (!url || disabled || submitting) return
    if (!url.startsWith("http://") && !url.startsWith("https://")) return
    onSubmit({ url, selectors: selectors.filter((s) => s.name && s.selector), renderJs, fields: activeFields })
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
    <Card>
      <CardHeader>
        <CardTitle>Configure scrape</CardTitle>
        <CardDescription>Define the URL and selectors</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        <Separator />

        <SelectorList
          selectors={selectors}
          onAdd={addSelector}
          onRemove={removeSelector}
          onUpdate={updateSelector}
        />

        <Separator />

        <div className="space-y-3">
          <Label className="text-sm font-medium">Result Fields</Label>
          <ScrapeFieldSelector
            selectedFields={activeFields}
            onFieldsChange={activeOnFieldsChange}
          />
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
          onClick={handleSubmit}
          disabled={disabled || submitting || !url}
          className="w-full gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scrape URL
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
  )
}
