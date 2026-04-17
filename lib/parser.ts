/**
 * Server-side HTML parsing utilities for extracting links, images, and metadata.
 * Uses regex-based extraction to avoid external dependencies.
 */

interface ParseHtmlOptions {
  /** Base URL for resolving relative links. */
  baseUrl?: string
}

interface ParseHtmlResult {
  links: string[]
  images: string[]
  metadata: Record<string, string>
}

/**
 * Extract all links, images, and metadata from HTML content.
 * Relative URLs are resolved to absolute URLs using the baseUrl if provided.
 */
export function parseHtml(html: string, options: ParseHtmlOptions = {}): ParseHtmlResult {
  const { baseUrl } = options

  const links = extractLinks(html, baseUrl)
  const images = extractImages(html, baseUrl)
  const metadata = extractMetadata(html)

  return { links, images, metadata }
}

function resolveUrl(href: string, baseUrl?: string): string | null {
  if (!href) return null
  if (href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("#")) {
    return null
  }
  try {
    if (baseUrl) {
      return new URL(href, baseUrl).href
    }
    // If no baseUrl and href is relative, skip it
    if (href.startsWith("/") || href.startsWith("./") || href.startsWith("../")) {
      return null
    }
    return new URL(href).href
  } catch {
    return null
  }
}

function extractLinks(html: string, baseUrl?: string): string[] {
  const links: string[] = []
  // Match <a href="..."> and <a href='...'> tags
  const anchorRegex = /<a[^>]+href=["']([^"']+)["']/gi
  let match: RegExpExecArray | null
  while ((match = anchorRegex.exec(html)) !== null) {
    const resolved = resolveUrl(match[1], baseUrl)
    if (resolved && !links.includes(resolved)) {
      links.push(resolved)
    }
  }
  return links
}

function extractImages(html: string, baseUrl?: string): string[] {
  const images: string[] = []
  // Match <img src="..."> tags (srcset handled separately below)
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
  let match: RegExpExecArray | null
  while ((match = imgRegex.exec(html)) !== null) {
    const resolved = resolveUrl(match[1], baseUrl)
    if (resolved && !images.includes(resolved)) {
      images.push(resolved)
    }
  }

  // Also extract from srcset="url1, url2" (responsive images)
  const srcsetRegex = /<img[^>]+srcset=["']([^"']+)["']/gi
  while ((match = srcsetRegex.exec(html)) !== null) {
    const srcset = match[1]
    // srcset format: "url1 1x, url2 2x" or "url1 100w, url2 200w"
    const urls = srcset.split(",").map((s) => s.trim().split(/\s+/)[0])
    for (const src of urls) {
      const resolved = resolveUrl(src, baseUrl)
      if (resolved && !images.includes(resolved)) {
        images.push(resolved)
      }
    }
  }

  return images
}

function extractMetadata(html: string): Record<string, string> {
  const metadata: Record<string, string> = {}

  // Match <meta name="..." content="..."> and <meta property="..." content="...">
  // Also handle <meta http-equiv="..." content="...">
  const metaRegex = /<meta[^>]+(?:name|property|http-equiv|itemprop)=["']([^"']+)["'][^>]+content=["']([^"']+)["']|><meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property|http-equiv|itemprop)=["']([^"']+)["']/gi

  let match: RegExpExecArray | null
  while ((match = metaRegex.exec(html)) !== null) {
    // Group 1 = name/property/http-equiv/itemprop (first format)
    // Group 2 = content (first format)
    // Group 3 = content (second format)
    // Group 4 = name/property/http-equiv/itemprop (second format)
    const name = match[1] || match[4]
    const content = match[2] || match[3]
    if (name && content && !metadata[name]) {
      metadata[name] = content
    }
  }

  // Also handle meta tags where content comes before name/property (less common)
  const metaReverseRegex = /<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property|http-equiv|itemprop)=["']([^"']+)["']/gi
  while ((match = metaReverseRegex.exec(html)) !== null) {
    const content = match[1]
    const name = match[2]
    if (name && content && !metadata[name]) {
      metadata[name] = content
    }
  }

  // Extract <title>...</title>
  const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(html)
  if (titleMatch && !metadata["title"]) {
    metadata["title"] = titleMatch[1].trim()
  }

  return metadata
}
