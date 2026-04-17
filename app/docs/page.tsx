import type { Metadata } from "next"
import fs from "fs/promises"
import path from "path"
import { DocsNav, MarkdownContent } from "@/components/docs"

export const metadata: Metadata = {
  title: "API Documentation — WebScraper",
  description: "Complete API reference for the WebScraper API",
}

async function getDocContent() {
  const filePath = path.join(process.cwd(), "docs", "api.md")
  return await fs.readFile(filePath, "utf8")
}

export default async function DocsPage() {
  const content = await getDocContent()

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 flex-1">
      <div className="flex gap-16">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-8">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              On this page
            </p>
            <DocsNav />
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1 max-w-3xl">
          <MarkdownContent content={content} />
        </div>
      </div>
    </div>
  )
}
