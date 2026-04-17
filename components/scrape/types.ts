export interface Selector {
  name: string
  selector: string
  selector_type: "css" | "xpath"
  priority?: number
}

export interface ScrapeResult {
  job_id: string
  status: string
  url: string
  title?: string
  html_content?: string
  links?: string[]
  images?: string[]
  metadata?: Record<string, string>
  selectors?: Array<{ name: string; selector: string; selector_type: string; value: unknown; count?: number }>
  error_message?: string
  detected_measure?: string
  scraped_at?: string
}

export type ScrapeResultField = keyof Omit<ScrapeResult, "job_id" | "status" | "url" | "error_message" | "detected_measure" | "scraped_at">

export interface ScrapeSubmitData {
  url: string
  selectors: Selector[]
  renderJs: boolean
  fields?: Set<ScrapeResultField> | null
}
