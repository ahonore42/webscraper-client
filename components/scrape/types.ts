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
  text_content?: string
  html_content?: string
  links?: string[]
  images?: string[]
  metadata?: Record<string, string>
  selectors?: Array<{ name: string; selector: string; selector_type: string; value: unknown; count?: number }>
  error_message?: string
}

export interface ScrapeSubmitData {
  url: string
  selectors: Selector[]
  renderJs: boolean
}
