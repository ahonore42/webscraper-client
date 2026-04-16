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
import { LayoutDashboard, Key, Search, LogOut, ChevronDown } from "lucide-react"

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading...</div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="border-b bg-white dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold text-zinc-900 dark:text-zinc-50">
              WebScraper
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <NavLink href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
              <NavLink href="/scrape" icon={<Search className="h-4 w-4" />} label="Scrape" />
              <NavLink href="/api-keys" icon={<Key className="h-4 w-4" />} label="API Keys" />
            </div>
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="sm" className="gap-2">
                  {session.user?.email}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{session.user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-red-600 cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile nav */}
      <div className="md:hidden border-b bg-white dark:bg-zinc-950 px-4 py-2 flex gap-4">
        <NavLink href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
        <NavLink href="/scrape" icon={<Search className="h-4 w-4" />} label="Scrape" />
        <NavLink href="/api-keys" icon={<Key className="h-4 w-4" />} label="API Keys" />
      </div>

      {/* Content */}
      <main className="flex-1 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto px-4 py-8">{children}</div>
      </main>
    </div>
  )
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
    >
      {icon}
      {label}
    </Link>
  )
}
