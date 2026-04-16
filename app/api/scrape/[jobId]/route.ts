import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await auth()
  if (!session?.user?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { jobId } = await params
  const res = await fetch(`${API_URL}/scrape/${jobId}`, {
    headers: {
      Authorization: `Bearer ${session.user.accessToken}`,
    },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
