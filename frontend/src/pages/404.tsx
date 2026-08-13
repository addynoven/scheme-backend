import { ArrowLeft, FileQuestion } from 'lucide-react'
import { Link } from '@/router'

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-6 shadow-xl">
        <FileQuestion className="h-8 w-8 text-blue-400" />
      </div>
      <h1 className="text-3xl font-bold text-zinc-100 mb-2">Page Not Found</h1>
      <p className="text-zinc-400 text-sm max-w-sm mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to Home
      </Link>
    </div>
  )
}
