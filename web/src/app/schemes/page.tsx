import { Suspense } from 'react'
import { SchemesBrowseScreen } from '@/modules/schemes'

export const metadata = {
  title: 'Browse Government Schemes | Scheme Navigator',
  description: 'Search, filter, and discover over 4,100+ Central and State welfare initiatives and citizen subsidies.',
}

export default function SchemesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Loading schemes catalog...</div>}>
      <SchemesBrowseScreen />
    </Suspense>
  )
}
