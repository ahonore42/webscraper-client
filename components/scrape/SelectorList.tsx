"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import type { Selector } from "./types"
import { SelectorItem } from "./SelectorItem"

interface SelectorListProps {
  selectors: Selector[]
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdate: (index: number, field: keyof Selector, value: string) => void
}

export function SelectorList({ selectors, onAdd, onRemove, onUpdate }: SelectorListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Selectors</Label>
        <Button variant="outline" size="sm" onClick={onAdd} className="gap-1">
          <Plus className="h-3 w-3" />
          Add
        </Button>
      </div>

      {selectors.length === 0 ? (
        <p className="text-sm text-muted-foreground">No selectors added yet.</p>
      ) : (
        selectors.map((sel, i) => (
          <SelectorItem
            key={i}
            selector={sel}
            index={i}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        ))
      )}
    </div>
  )
}
