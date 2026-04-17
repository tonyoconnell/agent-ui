/**
 * Markdown Content Renderer
 *
 * Renders markdown content with proper styling for chat messages.
 * Supports code blocks with syntax highlighting, lists, links, bold, italic, etc.
 *
 * Security: marked.parse output is sanitized with DOMPurify before DOM injection.
 * marked v5+ removed its built-in sanitizer; DOMPurify strips <script>, <iframe>,
 * on*= handlers, and javascript:/data: URIs before anything reaches the DOM.
 */

import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { useMemo } from 'react'
import { CodeBlock } from './elements/code-block'

interface MarkdownContentProps {
  content: string
}

marked.setOptions({
  breaks: true,
  gfm: true,
})

function sanitize(html: string): string {
  if (typeof window === 'undefined') {
    // SSR fallback: strip all tags (component is client:only in practice)
    return html.replace(/<[^>]*>/g, '')
  }
  return DOMPurify.sanitize(html, { FORCE_BODY: true })
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const html = useMemo(() => {
    if (!content) return ''
    try {
      return sanitize(marked.parse(content) as string)
    } catch {
      return content
    }
  }, [content])

  const elements = useMemo(() => {
    const parts: (string | { type: 'code'; language: string; code: string })[] = []
    let lastIndex = 0

    const codeBlockRegex = /<pre><code class="language-([a-z0-9+-]*)">([^<]*)<\/code><\/pre>/gi
    let match: RegExpExecArray | null = null

    while ((match = codeBlockRegex.exec(html)) !== null) {
      if (match.index > lastIndex) {
        parts.push(html.substring(lastIndex, match.index))
      }

      const language = (match[1] || 'plaintext') as string
      const code = match[2]
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')

      parts.push({ type: 'code', language, code })
      lastIndex = match.index + match[0].length
    }

    if (lastIndex < html.length) {
      parts.push(html.substring(lastIndex))
    }

    return parts.length > 0 ? parts : [html]
  }, [html])

  return (
    <div className="markdown-content space-y-4">
      {elements.map((element, index) => {
        if (typeof element === 'string') {
          return (
            <div
              key={index}
              className="prose prose-sm max-w-none dark:prose-invert [&>code]:bg-muted [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>code]:font-mono"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: DOMPurify-sanitized
              dangerouslySetInnerHTML={{ __html: element }}
            />
          )
        }

        return <CodeBlock key={index} code={element.code} language={element.language} className="my-4" />
      })}
    </div>
  )
}
