"use client"

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

interface SyntaxHighlightedJsonProps {
  data: Record<string, unknown>
}

export function SyntaxHighlightedJson({ data }: SyntaxHighlightedJsonProps) {
  const json = JSON.stringify(data, null, 2)

  return (
    <div className="rounded-lg border border-border overflow-hidden text-xs">
      <SyntaxHighlighter
        language="json"
        style={vscDarkPlus}
        customStyle={{
          background: "transparent",
          padding: "1rem",
          margin: 0,
          fontSize: "0.75rem",
          lineHeight: "1.5",
          overflow: "auto",
          maxHeight: "24rem",
        }}
        codeTagProps={{
          style: {
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          },
        }}
      >
        {json}
      </SyntaxHighlighter>
    </div>
  )
}
