"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { ScrapeResult } from "./types"

type FieldKey = keyof Omit<ScrapeResult, "job_id" | "status" | "url" | "error_message" | "detected_measure" | "scraped_at">

interface FieldOption {
  key: FieldKey
  label: string
}

const FIELD_OPTIONS: FieldOption[] = [
  { key: "title", label: "Title" },
  { key: "html_content", label: "HTML Content" },
  { key: "links", label: "Links" },
  { key: "images", label: "Images" },
  { key: "metadata", label: "Metadata" },
  { key: "selectors", label: "Selector Results" },
]

const ERROR_FIELDS = ["job_id", "status", "url", "scraped_at", "error_message", "detected_measure"] as const

interface ScrapeFieldSelectorProps {
  selectedFields: Set<FieldKey> | null
  onFieldsChange: (fields: Set<FieldKey> | null) => void
  allLabel?: string
}

export function ScrapeFieldSelector({
  selectedFields,
  onFieldsChange,
  allLabel = "All",
}: ScrapeFieldSelectorProps) {
  const isAllSelected = selectedFields === null

  function handleCheckedChange(key: FieldKey, checked: boolean) {
    if (isAllSelected) {
      // Switching from "all" to individual fields — start with all except this one
      const allKeys = new Set(FIELD_OPTIONS.map((f) => f.key))
      allKeys.delete(key)
      onFieldsChange(allKeys)
    } else {
      const next = new Set(selectedFields)
      if (checked) {
        next.add(key)
      } else {
        next.delete(key)
      }
      if (next.size === FIELD_OPTIONS.length) {
        onFieldsChange(null)
      } else {
        onFieldsChange(next)
      }
    }
  }

  function selectAll() {
    onFieldsChange(null)
  }

  function deselectAll() {
    onFieldsChange(new Set())
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={selectAll}
          className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded border transition-colors cursor-pointer ${
            isAllSelected
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border hover:border-primary"
          }`}
        >
          {allLabel}
        </button>
        <button
          type="button"
          onClick={deselectAll}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          None
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {FIELD_OPTIONS.map(({ key, label }) => {
          const checked = isAllSelected || (selectedFields?.has(key) ?? false)
          return (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={`field-${key}`}
                checked={checked}
                onCheckedChange={(val) => handleCheckedChange(key, Boolean(val))}
                className="shrink-0"
              />
              <Label
                htmlFor={`field-${key}`}
                className="text-sm font-normal cursor-pointer leading-tight"
              >
                {label}
              </Label>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const SUCCESS_FIELDS = ["job_id", "status", "url", "scraped_at", "title", "html_content", "links", "images", "metadata", "selectors"] as const

export function filterResultByFields(
  result: ScrapeResult,
  selectedFields: Set<FieldKey> | null
): Partial<ScrapeResult> {
  const isError = result.status === "failed"

  // Strip retry_after from all results (may not exist on type but can be in runtime data)
  const { retry_after: _, ...rest } = result as ScrapeResult & { retry_after?: unknown }

  if (isError) {
    return Object.fromEntries(
      Object.entries(rest).filter(([key]) => (ERROR_FIELDS as readonly string[]).includes(key))
    ) as Partial<ScrapeResult>
  }

  // Success: include only success fields, then filter by selectedFields if set
  const filtered = Object.fromEntries(
    Object.entries(rest).filter(([key]) => (SUCCESS_FIELDS as readonly string[]).includes(key))
  )

  if (selectedFields === null) return filtered as Partial<ScrapeResult>
  return Object.fromEntries(
    Object.entries(filtered).filter(([key]) => selectedFields.has(key as FieldKey))
  ) as Partial<ScrapeResult>
}
