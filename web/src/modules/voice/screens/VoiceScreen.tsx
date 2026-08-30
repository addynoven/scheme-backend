'use client'

import { useState } from 'react'
import { LiveVoiceModal } from '../components/LiveVoiceModal'

export function VoiceScreen() {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <LiveVoiceModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  )
}
