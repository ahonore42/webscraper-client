import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

type Params = Promise<{ setId: string }>

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const session = await auth()
  if (!session?.user?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { setId } = await params
  const res = await fetch(`${API_URL}/selectors/${setId}`, {
    headers: { Authorization: `Bearer ${session.user.accessToken}` },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const session = await auth()
  if (!session?.user?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { setId } = await params
  const body = await req.json()
  const res = await fetch(`${API_URL}/selectors/${setId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.user.accessToken}`,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  const session = await auth()
  if (!session?.user?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { setId } = await params
  const res = await fetch(`${API_URL}/selectors/${setId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${session.user.accessToken}` },
  })

  return new NextResponse(null, { status: res.status })
}