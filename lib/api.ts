const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function apiFetch<T = unknown>(
  path: string,
  options: {
    method?: string
    body?: unknown
    accessToken?: string
    apiKey?: string
  } = {}
): Promise<T> {
  const { method = "GET", body, accessToken, apiKey } = options

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
  }
  if (apiKey) {
    headers["X-API-Key"] = apiKey
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }))
    throw new Error(error.detail || `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}
