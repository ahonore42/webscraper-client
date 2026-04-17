"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const sections = [
  { id: "introduction", label: "Introduction" },
  { id: "getting-started", label: "Getting Started" },
  { id: "authentication", label: "Authentication" },
  { id: "scraping", label: "Scraping" },
  { id: "public-scrape", label: "Public Scrape" },
  { id: "selector-sets", label: "Selector Sets" },
  { id: "scheduled-scraping", label: "Scheduled Scraping" },
  { id: "rate-limits", label: "Rate Limits" },
  { id: "error-responses", label: "Error Responses" },
  { id: "webhooks", label: "Webhooks" },
  { id: "sdk-client-example", label: "SDK / Client Example" },
]

export function DocsNav() {
  const [active, setActive] = useState<string>("introduction")

  useEffect(() => {
    const observers = new Map<string, IntersectionObserver>()

    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActive(id)
          }
        },
        { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
      )

      observer.observe(el)
      observers.set(id, observer)
    })

    return () => {
      observers.forEach((obs) => obs.disconnect())
    }
  }, [])

  return (
    <nav className="space-y-1">
      {sections.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          className={`block text-sm py-1 transition-colors ${
            active === id
              ? "text-primary font-medium"
              : "text-muted-foreground hover:text-foreground"
          }`}
          style={{ scrollMarginTop: "1rem" }}
        >
          {label}
        </a>
      ))}
    </nav>
  )
}
