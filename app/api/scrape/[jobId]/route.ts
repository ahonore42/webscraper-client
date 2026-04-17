import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { parseHtml } from "@/lib/parser"

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

  const data: Record<string, unknown> = await res.json()

  // Parse HTML server-side to extract links, images, and metadata
  const html = data.html_content as string | undefined
  const url = data.url as string | undefined
  if (html) {
    const parsed = parseHtml(html, { baseUrl: url })
    data.links = parsed.links
    data.images = parsed.images
    data.metadata = { ...(data.metadata as Record<string, string> | undefined), ...parsed.metadata }
  }

  return NextResponse.json(data, { status: res.status })
}
