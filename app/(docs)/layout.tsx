import { DocsNav } from "@/components/docs-nav"

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
        <div className="min-w-0 flex-1 max-w-3xl">{children}</div>
      </div>
    </div>
  )
}
