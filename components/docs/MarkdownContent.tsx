import { MarkdownAsync as ReactMarkdown } from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypePrettyCode from "rehype-pretty-code"

interface MarkdownContentProps {
  content: string
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[
        [
          rehypePrettyCode,
          {
            theme: "github-dark",
            keepBackground: false,
          },
        ],
      ]}
      components={{
        h1: ({ children }) => (
          <h1
            className="text-3xl font-bold text-foreground mt-10 mb-4 first:mt-0"
            id={slug(String(children))}
          >
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2
            className="text-2xl font-semibold text-foreground mt-10 mb-4 scroll-mt-24"
            id={slug(String(children))}
          >
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3
            className="text-lg font-semibold text-foreground mt-6 mb-2 scroll-mt-24"
            id={slug(String(children))}
          >
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="text-foreground leading-relaxed mb-4">{children}</p>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            {children}
          </a>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-4 space-y-1 text-foreground">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-4 space-y-1 text-foreground">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-foreground">{children}</li>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="border-border my-8" />,
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        code: ({ children, ...props }) => {
          if (!props.className) {
            return (
              <code
                className="bg-muted text-primary px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            )
          }
          return <code {...props}>{children}</code>
        },
        pre: ({ children }) => (
          <pre className="bg-muted border border-border rounded-lg p-4 overflow-x-auto my-4 text-sm">
            {children}
          </pre>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className="w-full border-collapse border border-border text-sm">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-muted text-foreground">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="border border-border px-3 py-2 text-left font-semibold text-foreground">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-3 py-2 text-foreground">
            {children}
          </td>
        ),
        tr: ({ children }) => <tr className="even:bg-muted/30">{children}</tr>,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+\d+\.\s*/g, "") // remove leading numbers like "1. "
    .replace(/[(#].*?[)]/g, "") // strip parens and their contents, e.g. "(No Auth Required)"
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+$/, "") // trim trailing hyphens
}
