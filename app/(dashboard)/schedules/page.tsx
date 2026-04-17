"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Clock, Globe, Trash2, Loader2, MoreHorizontal, Pause, Play } from "lucide-react"
import { toast } from "sonner"

interface Schedule {
  id: string
  name: string
  url: string
  selectors_json: string
  use_stored_selectors: boolean
  interval_seconds: number
  callback_url: string | null
  enabled: boolean
  next_run_at: string
  last_run_at: string | null
  created_at: string
  updated_at: string
}

interface CreateScheduleBody {
  name: string
  url: string
  selectors_json?: string
  use_stored_selectors?: boolean
  interval_seconds: number
  callback_url?: string | null
}

export default function SchedulesPage() {
  const { data: session } = useSession()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<CreateScheduleBody>({
    name: "",
    url: "",
    selectors_json: "[]",
    use_stored_selectors: false,
    interval_seconds: 3600,
    callback_url: null,
  })

  const fetchSchedules = useCallback(async () => {
    if (!session?.user?.accessToken) return
    setLoading(true)
    try {
      const res = await fetch("/api/schedules")
      if (res.ok) {
        const data = await res.json()
        setSchedules(data.items || [])
      }
    } catch {
      toast.error("Failed to load schedules")
    } finally {
      setLoading(false)
    }
  }, [session?.user?.accessToken])

  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchSchedules()
    }
  }, [session, fetchSchedules])

  async function createSchedule() {
    if (!session?.user?.accessToken || !form.name.trim() || !form.url.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed to create schedule")
      toast.success("Schedule created")
      setShowCreate(false)
      setForm({
        name: "",
        url: "",
        selectors_json: "[]",
        use_stored_selectors: false,
        interval_seconds: 3600,
        callback_url: null,
      })
      fetchSchedules()
    } catch {
      toast.error("Failed to create schedule")
    } finally {
      setCreating(false)
    }
  }

  async function toggleSchedule(schedule: Schedule) {
    if (!session?.user?.accessToken) return
    try {
      const res = await fetch(`/api/schedules/${schedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !schedule.enabled }),
      })
      if (!res.ok) throw new Error("Failed to update schedule")
      toast.success(schedule.enabled ? "Schedule paused" : "Schedule resumed")
      fetchSchedules()
    } catch {
      toast.error("Failed to update schedule")
    }
  }

  async function deleteSchedule(scheduleId: string) {
    if (!session?.user?.accessToken) return
    try {
      const res = await fetch(`/api/schedules/${scheduleId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete schedule")
      toast.success("Schedule deleted")
      fetchSchedules()
    } catch {
      toast.error("Failed to delete schedule")
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Schedules</h1>
          <p className="text-muted-foreground text-sm mt-1">Automate recurring scrape jobs</p>
        </div>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create schedule</DialogTitle>
              <DialogDescription>
                Set up a recurring scrape that runs automatically
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="sched-name">Name</Label>
                <Input
                  id="sched-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Daily price check"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sched-url">URL</Label>
                <Input
                  id="sched-url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://example.com/products"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sched-interval">Interval (seconds)</Label>
                <Input
                  id="sched-interval"
                  type="number"
                  min={1}
                  value={form.interval_seconds}
                  onChange={(e) =>
                    setForm({ ...form, interval_seconds: parseInt(e.target.value) || 3600 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {formatInterval(form.interval_seconds)}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sched-callback">Callback URL (optional)</Label>
                <Input
                  id="sched-callback"
                  value={form.callback_url ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, callback_url: e.target.value || null })
                  }
                  placeholder="https://your-server.com/webhook"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                onClick={createSchedule}
                disabled={creating || !form.name.trim() || !form.url.trim()}
              >
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : schedules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p>No schedules yet</p>
            <p className="text-sm mt-1">Create a schedule to automate your scraping</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Interval</TableHead>
                <TableHead>Next run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((sched) => (
                <TableRow key={sched.id}>
                  <TableCell className="font-medium">{sched.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                    {sched.url}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatInterval(sched.interval_seconds)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {sched.next_run_at
                      ? new Date(sched.next_run_at).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={sched.enabled ? "default" : "secondary"}>
                      {sched.enabled ? "Active" : "Paused"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => toggleSchedule(sched)}
                          className="gap-2"
                        >
                          {sched.enabled ? (
                            <>
                              <Pause className="h-4 w-4" /> Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4" /> Resume
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteSchedule(sched.id)}
                          className="gap-2 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}

function formatInterval(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}min`
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`
  return `${Math.round(seconds / 86400)}d`
}
