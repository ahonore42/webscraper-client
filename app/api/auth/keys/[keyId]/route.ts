import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  const session = await auth()
  if (!session?.user?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { keyId } = await params
  const res = await fetch(`${API_URL}/auth/keys/${keyId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${session.user.accessToken}`,
    },
  })

  return new NextResponse(null, { status: res.status })
}
