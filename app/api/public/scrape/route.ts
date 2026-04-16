import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const PUBLIC_TOKEN = process.env.NEXT_PUBLIC_SCRAPE_TOKEN || ""

export async function POST(req: NextRequest) {
  const body = await req.json()

  const res = await fetch(`${API_URL}/public/scrape`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Public-Token": PUBLIC_TOKEN,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}