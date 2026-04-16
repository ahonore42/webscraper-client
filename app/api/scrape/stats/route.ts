import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function GET() {
  const session = await auth()
  if (!session?.user?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const res = await fetch(`${API_URL}/scrape/stats`, {
    headers: { Authorization: `Bearer ${session.user.accessToken}` },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}