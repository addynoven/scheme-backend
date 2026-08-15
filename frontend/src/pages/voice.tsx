import { useEffect } from 'react'
import { useNavigate } from '@/router'

export default function VoiceRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/')
  }, [navigate])

  return null
}
