"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()

  return (
    <header className="border-b border-border">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg tracking-tight text-foreground">WebScraper</Link>
        <nav className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/docs">Docs</Link>
          </Button>
          {session ? (
            <Button onClick={() => router.push("/dashboard")} size="sm" className="gap-1">
              Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
