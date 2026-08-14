import React from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Sparkles, BookOpen } from 'lucide-react'

interface MarkdownMessageProps {
  content: string
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content }) => {
  if (!content) return null

  const lines = content.split('\n')

  function renderInline(text: string): React.ReactNode[] {
    // Regex matches [label](url) and **bold**
    const parts: React.ReactNode[] = []
    let lastIndex = 0

    // Combine link and bold regex
    const regex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*)/g
    let match

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }

      if (match[0].startsWith('[')) {
        // Link match: match[2] = label, match[3] = url
        const label = match[2]
        let url = match[3]

        // Transform internal knowledge file paths if any remain to /schemes/:slug
        if (url.startsWith('knowledge/schemes/') && url.endsWith('.md')) {
          const slug = url.replace('knowledge/schemes/', '').replace('.md', '')
          url = `/schemes/${slug}`
        }

        if (url.startsWith('/') || url.startsWith('#')) {
          parts.push(
            <Link
              key={match.index}
              to={url}
              className="text-blue-400 font-semibold hover:text-blue-300 hover:underline inline-flex items-center gap-1 bg-blue-950/40 border border-blue-800/40 px-2 py-0.5 rounded text-xs transition-colors"
            >
              <BookOpen className="h-3 w-3 inline text-blue-400" />
              <span>{label}</span>
            </Link>
          )
        } else {
          parts.push(
            <a
              key={match.index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 hover:underline inline-flex items-center gap-1 font-medium bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded text-xs transition-colors"
            >
              <span>{label}</span>
              <ExternalLink className="h-3 w-3 inline" />
            </a>
          )
        }
      } else if (match[0].startsWith('**')) {
        // Bold match: match[4] = text inside **
        parts.push(
          <strong key={match.index} className="font-semibold text-zinc-100">
            {match[4]}
          </strong>
        )
      }

      lastIndex = regex.lastIndex
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts
  }

  return (
    <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim()

        if (!trimmed) {
          return <div key={idx} className="h-1.5" />
        }

        if (trimmed.startsWith('### ')) {
          const headingText = trimmed.replace('### ', '')
          return (
            <h4
              key={idx}
              className="text-sm sm:text-base font-bold text-zinc-100 mt-3 mb-1.5 flex items-center gap-2 pb-1 border-b border-zinc-800/60"
            >
              <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
              <span>{renderInline(headingText)}</span>
            </h4>
          )
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const itemText = trimmed.substring(2)
          return (
            <div key={idx} className="flex items-start gap-2 ml-2 my-1 text-zinc-300">
              <span className="text-blue-500 font-bold mt-0.5">•</span>
              <div className="flex-1">{renderInline(itemText)}</div>
            </div>
          )
        }

        return (
          <p key={idx} className="text-zinc-200">
            {renderInline(trimmed)}
          </p>
        )
      })}
    </div>
  )
}
