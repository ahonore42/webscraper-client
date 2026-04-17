"use client"

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

interface MarkdownContentClientProps {
  content: string
}

export function MarkdownContentClient({ content }: MarkdownContentClientProps) {
  return (
    <div className="text-foreground">
      {content.split(/\n{2,}/).map((block, i) => {
        // Headings
        if (block.startsWith("# ")) {
          const text = block.slice(2)
          return (
            <h1
              key={i}
              id={slug(text)}
              className="text-3xl font-bold text-foreground mt-10 mb-4 first:mt-0"
            >
              {text}
            </h1>
          )
        }
        if (block.startsWith("## ")) {
          const text = block.slice(3)
          return (
            <h2
              key={i}
              id={slug(text)}
              className="text-2xl font-semibold text-foreground mt-10 mb-4 scroll-mt-24"
            >
              {text}
            </h2>
          )
        }
        if (block.startsWith("### ")) {
          const text = block.slice(4)
          return (
            <h3
              key={i}
              id={slug(text)}
              className="text-lg font-semibold text-foreground mt-6 mb-2 scroll-mt-24"
            >
              {text}
            </h3>
          )
        }

        // Code blocks (```language ... ```)
        if (block.startsWith("```")) {
          const match = block.match(/^```(\w*)\n([\s\S]*?)```$/)
          if (match) {
            const lang = match[1] || "text"
            const code = match[2]
            return (
              <div key={i} className="bg-muted border border-border rounded-lg p-4 overflow-x-auto my-4 text-sm">
                <pre className="m-0">
                  <SyntaxHighlighter
                    language={lang}
                    style={vscDarkPlus}
                    customStyle={{
                      background: "transparent",
                      padding: 0,
                      margin: 0,
                      fontSize: "0.875rem",
                      lineHeight: "1.5",
                    }}
                    codeTagProps={{
                      style: {
                        fontFamily: "inherit",
                      },
                    }}
                  >
                    {code}
                  </SyntaxHighlighter>
                </pre>
              </div>
            )
          }
        }

        // Inline code (`...`)
        const parts = block.split(/(`[^`]+`)/g)
        const hasCode = parts.length > 1

        if (hasCode) {
          return (
            <p key={i} className="text-foreground leading-relaxed mb-4">
              {parts.map((part, j) =>
                part.startsWith("`") && part.endsWith("`") ? (
                  <code
                    key={j}
                    className="bg-muted text-primary px-1.5 py-0.5 rounded text-sm font-mono"
                  >
                    {part.slice(1, -1)}
                  </code>
                ) : (
                  <span key={j}>{part}</span>
                )
              )}
            </p>
          )
        }

        // Default paragraph
        return (
          <p key={i} className="text-foreground leading-relaxed mb-4">
            {block}
          </p>
        )
      })}
    </div>
  )
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+\d+\.\s*/g, "")
    .replace(/[(#].*?[)]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+$/, "")
}
