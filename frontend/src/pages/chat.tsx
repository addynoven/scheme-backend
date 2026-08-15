import { useEffect } from 'react'
import { useNavigate } from '@/router'

export default function ChatRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    const search = window.location.search
    navigate(`/${search}` as any)
  }, [navigate])

  return (
    <div className="flex-1 flex items-center justify-center bg-[#09090b]">
      <div className="h-8 w-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )
}
