"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Key, Plus, Copy, Check, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface ApiKey {
  id: string
  name: string
  prefix: string
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

interface NewKeyResponse {
  id: string
  name: string
  prefix: string
  plaintext_key: string
  created_at: string
}

export default function ApiKeysPage() {
  const { data: session } = useSession()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [newKeyName, setNewKeyName] = useState("")
  const [creating, setCreating] = useState(false)
  const [showNewKey, setShowNewKey] = useState(false)
  const [newKeyData, setNewKeyData] = useState<NewKeyResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null)
  const [revoking, setRevoking] = useState(false)

  const fetchKeys = useCallback(async () => {
    if (!session?.user?.accessToken) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/keys`, {
        headers: { Authorization: `Bearer ${session.user.accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setKeys(data.keys)
      }
    } catch {
      toast.error("Failed to load API keys")
    } finally {
      setLoading(false)
    }
  }, [session?.user?.accessToken])

  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchKeys()
    }
  }, [session, fetchKeys])

  async function createKey() {
    if (!session?.user?.accessToken || !newKeyName.trim()) return
    setCreating(true)
    try {
      const res = await fetch(`${API_URL}/auth/keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.accessToken}`,
        },
        body: JSON.stringify({ name: newKeyName }),
      })

      if (!res.ok) throw new Error("Failed to create key")

      const data: NewKeyResponse = await res.json()
      setNewKeyData(data)
      setShowNewKey(true)
      setNewKeyName("")
      toast.success("API key created")
      fetchKeys()
    } catch {
      toast.error("Failed to create API key")
    } finally {
      setCreating(false)
    }
  }

  async function revokeKey(keyId: string) {
    if (!session?.user?.accessToken) return
    setRevoking(true)
    try {
      const res = await fetch(`${API_URL}/auth/keys/${keyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.user.accessToken}` },
      })
      if (res.ok) {
        toast.success("API key revoked")
        fetchKeys()
      } else {
        toast.error("Failed to revoke key")
      }
    } catch {
      toast.error("Failed to revoke key")
    } finally {
      setRevoking(false)
      setRevokeTarget(null)
    }
  }

  function copyKey() {
    if (!newKeyData?.plaintext_key) return
    navigator.clipboard.writeText(newKeyData.plaintext_key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Copied to clipboard")
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">API Keys</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage API keys for programmatic access
          </p>
        </div>

        <Dialog open={showNewKey} onOpenChange={setShowNewKey}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />New key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API key</DialogTitle>
              <DialogDescription>
                Enter a name to identify this key
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="keyName">Key name</Label>
                <Input
                  id="keyName"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Production, Development, etc."
                  onKeyDown={(e) => e.key === "Enter" && createKey()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewKey(false)}>
                Cancel
              </Button>
              <Button onClick={createKey} disabled={creating || !newKeyName.trim()}>
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* New key shown once */}
      {newKeyData && showNewKey && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2">
              <Check className="h-5 w-5" />
              API key created
            </CardTitle>
            <CardDescription className="text-green-600 dark:text-green-500">
              Copy your key now. You won&apos;t be able to see it again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted border rounded-md px-3 py-2 font-mono text-sm break-all">
                {newKeyData.plaintext_key}
              </code>
              <Button size="sm" variant="outline" onClick={copyKey} className="gap-1 shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Prefix: <code className="bg-muted px-1 rounded">{newKeyData.prefix}</code>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Keys list */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : keys.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Key className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p>No API keys yet</p>
            <p className="text-sm mt-1">Create your first key to start making API calls</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Prefix</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last used</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted dark:bg-card px-1.5 py-0.5 rounded">
                      {key.prefix}...
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={key.is_active ? "default" : "secondary"}>
                      {key.is_active ? "Active" : "Revoked"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {key.last_used_at
                      ? new Date(key.last_used_at).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {key.created_at
                      ? new Date(key.created_at).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {key.is_active && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setRevokeTarget(key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Revoke confirmation */}
      <Dialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API key</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke <strong>{revokeTarget?.name}</strong>?
              This action cannot be undone and any applications using this key will
              lose access immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => revokeTarget && revokeKey(revokeTarget.id)}
              disabled={revoking}
            >
              {revoking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Revoke
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
