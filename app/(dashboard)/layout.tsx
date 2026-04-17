"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LayoutDashboard, Key, Search, LogOut, ChevronDown, Clock, BookOpen } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top nav */}
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold text-foreground">
              WebScraper
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <NavLink href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
              <NavLink href="/scrape" icon={<Search className="h-4 w-4" />} label="Scrape" />
              <NavLink href="/api-keys" icon={<Key className="h-4 w-4" />} label="API Keys" />
              <NavLink href="/schedules" icon={<Clock className="h-4 w-4" />} label="Schedules" />
              <NavLink href="/docs" icon={<BookOpen className="h-4 w-4" />} label="Docs" />
            </div>
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                {session.user?.email}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-muted-foreground">{session.user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-destructive cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile nav */}
      <div className="md:hidden border-b border-border bg-card px-4 py-2 flex gap-4">
        <NavLink href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
        <NavLink href="/scrape" icon={<Search className="h-4 w-4" />} label="Scrape" />
        <NavLink href="/api-keys" icon={<Key className="h-4 w-4" />} label="API Keys" />
        <NavLink href="/schedules" icon={<Clock className="h-4 w-4" />} label="Schedules" />
        <NavLink href="/docs" icon={<BookOpen className="h-4 w-4" />} label="Docs" />
      </div>

      {/* Content */}
      <main className="flex-1 bg-background">
        <div className="max-w-5xl mx-auto px-4 py-8">{children}</div>
      </main>
    </div>
  )
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      {icon}
      {label}
    </Link>
  )
}
