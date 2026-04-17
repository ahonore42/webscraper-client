# WebScraper API Reference

A programmatic web scraping API. Submit scrape jobs, retrieve structured data, schedule recurring scrapes, and manage reusable selector sets — all via REST.

**Base URL:** `http://localhost:8000` (local development)

---

## Authentication

### Register

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "min-8-characters"
}
```

Returns a `201`. Auto-login immediately after via `/auth/login`.

---

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response `200`:**
```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2026-04-01T00:00:00Z",
    "is_active": true
  }
}
```

Use the `access_token` as a Bearer token in the `Authorization` header for all authenticated endpoints.

---

### API Keys

API keys provide programmatic access without needing your login password. Each key has a name and a one-time displayed `plaintext_key`. Keys are referenced by their `id` in subsequent requests.

#### Create a key

```http
POST /auth/keys
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Production"
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "name": "Production",
  "prefix": "wsk_live_",
  "plaintext_key": "wsk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "created_at": "2026-04-01T00:00:00Z"
}
```

> **Save `plaintext_key` immediately.** It is shown only once.

#### List keys

```http
GET /auth/keys
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "keys": [
    {
      "id": "uuid",
      "name": "Production",
      "prefix": "wsk_live_",
      "is_active": true,
      "last_used_at": "2026-04-01T12:00:00Z",
      "created_at": "2026-04-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

#### Revoke a key

```http
DELETE /auth/keys/{key_id}
Authorization: Bearer <token>
```

Returns `204 No Content`. Revocation is immediate and irreversible.

---

## Scraping

### Submit a scrape job

```http
POST /scrape
Authorization: Bearer <token>
X-API-Key: <api_key>
Content-Type: application/json

{
  "url": "https://news.ycombinator.com",
  "selectors": [
    { "name": "title", "selector": "title", "selector_type": "css" },
    { "name": "headlines", "selector": ".titleline > a", "selector_type": "css" }
  ],
  "render_js": false,
  "use_stored_selectors": false,
  "callback_url": null
}
```

| Field | Type | Description |
|---|---|---|
| `url` | string | Target URL (required) |
| `selectors` | array | Named selectors for targeted extraction |
| `selectors[].name` | string | Human-readable field name |
| `selectors[].selector` | string | CSS or XPath selector string |
| `selectors[].selector_type` | `"css"` \| `"xpath"` | Selector language |
| `render_js` | boolean | Use headless browser to render JavaScript |
| `use_stored_selectors` | boolean | Auto-apply selector sets matching this URL |
| `save_to_db` | boolean | Persist result to database (default false) |
| `callback_url` | string \| null | Webhook URL to POST results to on completion |

**Response `202`:**
```json
{
  "job_id": "uuid",
  "status": "pending",
  "created_at": "2026-04-01T00:00:00Z"
}
```

Poll `GET /scrape/{job_id}` until `status` is `"success"` or `"failed"`.

---

### Poll a job result

```http
GET /scrape/{job_id}
Authorization: Bearer <token>
X-API-Key: <api_key>
```

**Pending/running response `200`:**
```json
{
  "job_id": "uuid",
  "status": "pending",
  "url": "https://news.ycombinator.com"
}
```

**Completed response `200`:**
```json
{
  "job_id": "uuid",
  "status": "success",
  "url": "https://news.ycombinator.com",
  "title": "Hacker News",
  "text_content": "...",
  "links": ["https://news.ycombinator.com/news", ...],
  "images": [...],
  "metadata": { "method": "text/html" },
  "selectors": [
    {
      "name": "title",
      "selector": "title",
      "selector_type": "css",
      "value": "Hacker News"
    },
    {
      "name": "headlines",
      "selector": ".titleline > a",
      "selector_type": "css",
      "value": ["Title 1", "Title 2", ...]
    }
  ],
  "scraped_at": "2026-04-01T00:00:05Z"
}
```

**Failed response `200`:**
```json
{
  "job_id": "uuid",
  "status": "failed",
  "url": "https://news.ycombinator.com",
  "error_message": "Access denied: robots.txt blocks this path",
  "detected_measure": "robots_txt",
  "retry_after": 3600
}
```

---

### Download result as CSV

```http
GET /scrape/{job_id}/csv
Authorization: Bearer <token>
X-API-Key: <api_key>
```

Returns a `text/csv` file. Job must be completed first.

---

### Test selectors without creating a job

```http
POST /scrape/test
Authorization: Bearer <token>
X-API-Key: <api_key>
Content-Type: application/json

{
  "url": "https://example.com",
  "selectors": [
    { "name": "price", "selector": ".product-price", "selector_type": "css" }
  ],
  "render_js": false
}
```

Returns results immediately without persisting a job. Useful for validating selectors before committing them to a stored selector set.

---

### Scrape statistics

```http
GET /scrape/stats
Authorization: Bearer <token>
X-API-Key: <api_key>
```

**Response `200`:**
```json
{
  "total": 142,
  "success": 138
}
```

---

## Public Scrape (No Auth Required)

A free, rate-limited endpoint for quick ad-hoc scraping without an account.

```http
POST /public/scrape
X-Public-Token: <public_token>
Content-Type: application/json

{
  "url": "https://news.ycombinator.com",
  "selectors": [
    { "name": "title", "selector": "title", "selector_type": "css" }
  ],
  "render_js": false
}
```

**Limits:** 3 requests per minute per IP. Jobs are queued in a low-priority queue and may take longer during high traffic. No `save_to_db` or `callback_url`.

Poll the result at `GET /public/scrape/{job_id}` (no auth required).

---

## Selector Sets

Store reusable selector collections and URL patterns. When `use_stored_selectors: true` is set on a scrape request, the API automatically resolves matching selector sets for the target URL and merges them with inline selectors.

### Create a selector set

```http
POST /selectors
Authorization: Bearer <token>
X-API-Key: <api_key>
Content-Type: application/json

{
  "name": "Hacker News",
  "description": "Selectors for Hacker News pages",
  "selectors": [
    { "name": "title", "selector": "title", "selector_type": "css" },
    { "name": "headlines", "selector": ".titleline > a", "selector_type": "css", "priority": 1 }
  ],
  "url_patterns": [
    { "pattern": "news.ycombinator.com", "pattern_type": "domain" }
  ]
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "name": "Hacker News",
  "description": "Selectors for Hacker News pages",
  "selectors": [...],
  "url_patterns": [...],
  "created_at": "...",
  "updated_at": "..."
}
```

**Pattern types:** `exact` (full URL match), `domain` (any URL on that domain), `glob` (fnmatch), `regex` (full regex)

### List selector sets

```http
GET /selectors
Authorization: Bearer <token>
X-API-Key: <api_key>
```

Paginated. Returns summaries without full selectors.

### Get selector sets for a URL

```http
GET /selectors/by-url?url=https://news.ycombinator.com
Authorization: Bearer <token>
X-API-Key: <api_key>
```

Returns all selector sets with URL patterns that match the given URL, sorted by specificity.

### Update a selector set

```http
PATCH /selectors/{set_id}
Authorization: Bearer <token>
X-API-Key: <api_key>
Content-Type: application/json

{
  "name": "Hacker News Updated",
  "selectors": [...],
  "url_patterns": [...]
}
```

> Full replacement — provide the complete updated `selectors` and `url_patterns` arrays.

### Delete a selector set

```http
DELETE /selectors/{set_id}
Authorization: Bearer <token>
X-API-Key: <api_key>
```

Returns `204 No Content`.

---

## Scheduled Scraping

Create recurring scrape jobs that run automatically on a cron-like interval. Results are sent to a webhook URL if provided.

### Create a schedule

```http
POST /schedules
Authorization: Bearer <token>
X-API-Key: <api_key>
Content-Type: application/json

{
  "name": "Daily price check",
  "url": "https://example.com/products",
  "selectors_json": "[{\"name\":\"price\",\"selector\":\".price\",\"selector_type\":\"css\"}]",
  "use_stored_selectors": false,
  "interval_seconds": 86400,
  "callback_url": "https://your-server.com/webhook"
}
```

| Field | Type | Description |
|---|---|---|
| `name` | string | Human-readable name |
| `url` | string | Target URL |
| `selectors_json` | string | JSON string of selectors array |
| `use_stored_selectors` | boolean | Apply auto-matched selector sets |
| `interval_seconds` | integer | Seconds between runs (minimum 1) |
| `callback_url` | string \| null | Webhook to POST results to |

**Response `201`:**
```json
{
  "id": "uuid",
  "name": "Daily price check",
  "url": "https://example.com/products",
  "selectors_json": "[...]",
  "use_stored_selectors": false,
  "interval_seconds": 86400,
  "callback_url": "https://your-server.com/webhook",
  "enabled": true,
  "next_run_at": "2026-04-02T00:00:00Z",
  "last_run_at": null,
  "created_at": "2026-04-01T00:00:00Z",
  "updated_at": "2026-04-01T00:00:00Z"
}
```

### List schedules

```http
GET /schedules
Authorization: Bearer <token>
X-API-Key: <api_key>
```

Query params: `skip` (default 0), `limit` (default 50, max 200), `enabled_only` (boolean).

### Pause / resume a schedule

```http
PATCH /schedules/{schedule_id}
Authorization: Bearer <token>
X-API-Key: <api_key>
Content-Type: application/json

{ "enabled": false }
```

### Delete a schedule

```http
DELETE /schedules/{schedule_id}
Authorization: Bearer <token>
X-API-Key: <api_key>
```

Returns `204 No Content`.

---

## Rate Limits

| Tier | Limit |
|---|---|
| Authenticated (default) | 10 requests per domain per minute, 100 global per minute |
| Public scrape | 3 requests per IP per minute |
| Selector test (`/scrape/test`) | Subject to domain rate limit |

Rate limit headers returned on authenticated scrape responses:

```
X-RateLimit-Domain-Remaining: 9
X-RateLimit-Domain-Reset: 45
X-RateLimit-Global-Remaining: 97
X-RateLimit-Global-Reset: 60
```

---

## Error Responses

All errors return a JSON body with a `detail` string:

```json
{ "detail": "Invalid API key" }
```

| Status | Meaning |
|---|---|
| `400` | Malformed request |
| `401` | Missing or invalid authentication |
| `403` | Valid auth but insufficient permissions |
| `404` | Resource not found |
| `409` | Conflict (e.g., duplicate selector set name) |
| `422` | Validation error (invalid URL, missing fields) |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

---

## Webhooks

When `callback_url` is set on a scrape job or schedule, the API POSTs results to that URL upon completion.

**Success payload:**
```json
{
  "job_id": "uuid",
  "status": "success",
  "result": { ... ScrapeResult ... },
  "scraped_at": "2026-04-01T00:00:05Z"
}
```

**Failure payload:**
```json
{
  "job_id": "uuid",
  "status": "failed",
  "error": {
    "message": "Access denied: robots.txt blocks this path",
    "detected_measure": "robots_txt",
    "retry_after": 3600
  },
  "scraped_at": null
}
```

The API retries up to 3 times with exponential backoff (1s, 2s) on non-2xx responses.

---

## SDK / Client Example

```bash
# Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  | jq -r '.access_token')

# Submit scrape
curl -X POST http://localhost:8000/scrape \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://news.ycombinator.com","selectors":[{"name":"title","selector":"title","selector_type":"css"}]}'

# Poll result (replace JOB_ID)
curl http://localhost:8000/scrape/{job_id} \
  -H "Authorization: Bearer $TOKEN"
```
