'use client'

import React from 'react'
import { Link } from '@/router'
import { ExternalLink, Sparkles, BookOpen, ChevronRight } from 'lucide-react'

interface MarkdownMessageProps {
  content: string
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content }) => {
  if (!content) return null

  const lines = content.split('\n')

  function renderInline(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = []
    let lastIndex = 0

    // Match Markdown Links: [label](url), Bold: **text**, Code: `text`, Italic: *text*
    // Handles links with parentheses inside the label: [Name (Acronym)](/url)
    const regex = /(\[((?:\[[^\]]*\]|[^\]])+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*)/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }

      if (match[0].startsWith('[')) {
        const label = match[2]
        let url = match[3].trim()

        if (url.startsWith('knowledge/schemes/') && url.endsWith('.md')) {
          const slug = url.replace('knowledge/schemes/', '').replace('.md', '')
          url = `/schemes/${slug}`
        }

        const isInternal = url.startsWith('/') || url.startsWith('#') || url.includes('/schemes/')

        if (isInternal) {
          const cleanUrl = url.startsWith('http') ? url : url.startsWith('/') ? url : `/${url}`
          parts.push(
            <Link
              key={match.index}
              to={cleanUrl as any}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 my-0.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:text-blue-200 font-semibold text-xs transition-all shadow-sm group"
            >
              <BookOpen className="h-3 w-3 text-blue-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span>{label}</span>
              <ChevronRight className="h-2.5 w-2.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )
        } else {
          parts.push(
            <a
              key={match.index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-0.5 my-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 font-medium text-xs transition-all shadow-sm group"
            >
              <span>{label}</span>
              <ExternalLink className="h-2.5 w-2.5 text-emerald-400 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          )
        }
      } else if (match[0].startsWith('**')) {
        parts.push(
          <strong key={match.index} className="font-semibold text-zinc-100">
            {match[4]}
          </strong>
        )
      } else if (match[0].startsWith('`')) {
        parts.push(
          <code
            key={match.index}
            className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono text-xs"
          >
            {match[5]}
          </code>
        )
      } else if (match[0].startsWith('*')) {
        parts.push(
          <em key={match.index} className="italic text-zinc-300">
            {match[6]}
          </em>
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
    <div className="space-y-2.5 text-sm leading-relaxed text-zinc-200">
      {lines.map((line, idx) => {
        const trimmed = line.trim()

        if (!trimmed) {
          return <div key={idx} className="h-2" />
        }

        // Horizontal Divider
        if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
          return <hr key={idx} className="border-zinc-800 my-3" />
        }

        // Headings: H1, H2, H3, H4
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="text-base sm:text-lg font-bold text-white mt-4 mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
              <span>{renderInline(trimmed.replace('# ', ''))}</span>
            </h2>
          )
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-sm sm:text-base font-bold text-white mt-3.5 mb-1.5 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span>{renderInline(trimmed.replace('## ', ''))}</span>
            </h3>
          )
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h4
              key={idx}
              className="text-xs sm:text-sm font-semibold text-zinc-100 mt-3 mb-1.5 flex items-center gap-2 pb-1 border-b border-zinc-800/60"
            >
              <span>{renderInline(trimmed.replace('### ', ''))}</span>
            </h4>
          )
        }

        // Blockquotes
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={idx}
              className="border-l-2 border-blue-500/80 bg-blue-950/20 pl-3 py-1.5 my-2 rounded-r-lg text-xs sm:text-sm text-zinc-300 italic"
            >
              {renderInline(trimmed.replace('> ', ''))}
            </blockquote>
          )
        }

        // Numbered Lists: 1. , 2. , 3.
        const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/)
        if (numMatch) {
          const indent = numMatch[1].length
          const num = numMatch[2]
          const rest = numMatch[3]
          return (
            <div
              key={idx}
              className="flex items-start gap-2.5 my-1"
              style={{ marginLeft: `${Math.max(0, indent * 12)}px` }}
            >
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[11px] font-bold shrink-0 mt-0.5">
                {num}
              </span>
              <div className="flex-1 leading-relaxed text-zinc-200">{renderInline(rest)}</div>
            </div>
          )
        }

        // Bullet Lists: * or -
        const bulletMatch = line.match(/^(\s*)([-*•])\s+(.*)$/)
        if (bulletMatch) {
          const indent = bulletMatch[1].length
          const rest = bulletMatch[3]
          return (
            <div
              key={idx}
              className="flex items-start gap-2.5 my-1"
              style={{ marginLeft: `${Math.max(4, indent * 12)}px` }}
            >
              <span className="text-blue-400 font-bold shrink-0 text-sm mt-0.5">•</span>
              <div className="flex-1 leading-relaxed text-zinc-200">{renderInline(rest)}</div>
            </div>
          )
        }

        // Regular Paragraph
        return (
          <p key={idx} className="leading-relaxed text-zinc-200">
            {renderInline(trimmed)}
          </p>
        )
      })}
    </div>
  )
}
