"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2 } from "lucide-react"
import type { Selector } from "./types"

interface SelectorItemProps {
  selector: Selector
  index: number
  onUpdate: (index: number, field: keyof Selector, value: string) => void
  onRemove: (index: number) => void
}

export function SelectorItem({ selector, index, onUpdate, onRemove }: SelectorItemProps) {
  return (
    <div className="flex gap-2 items-start">
      <div className="flex-1 space-y-1">
        <Input
          value={selector.name}
          onChange={(e) => onUpdate(index, "name", e.target.value)}
          placeholder="Field name"
          className="h-8 text-sm"
        />
        <div className="flex gap-1">
          <select
            value={selector.selector_type}
            onChange={(e) => onUpdate(index, "selector_type", e.target.value)}
            className="h-8 text-xs border rounded px-2 bg-background"
          >
            <option value="css">CSS</option>
            <option value="xpath">XPath</option>
          </select>
          <Input
            value={selector.selector}
            onChange={(e) => onUpdate(index, "selector", e.target.value)}
            placeholder={selector.selector_type === "css" ? "div.class" : "//div[@class='...']"}
            className="flex-1 h-8 text-sm font-mono"
          />
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(index)}
        className="mt-1 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
