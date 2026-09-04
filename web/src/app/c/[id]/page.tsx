import { Suspense } from 'react'
import { HomeScreen } from '@/modules/home'

export const metadata = {
  title: 'Citizen Welfare Consultation | AI Assistant',
  description: 'Personalized government scheme discovery and citizen assistance.',
}

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const sessionKey = resolvedParams.id

  return (
    <Suspense
      fallback={
        <div className="flex h-screen bg-slate-950 text-slate-400 items-center justify-center">
          Loading consultation...
        </div>
      }
    >
      <HomeScreen initialSessionId={sessionKey} />
    </Suspense>
  )
}
