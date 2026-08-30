'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  ExternalLink,
  Loader2,
  Languages,
  ArrowRight,
  Radio,
} from 'lucide-react'
import { voiceChat, type VoiceChatResponse } from '@/lib/api'

interface LiveVoiceModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId?: number | null
  userName?: string | null
  onMessageAdded?: () => void
}

export function LiveVoiceModal({
  isOpen,
  onClose,
  sessionId,
  userName = 'Citizen',
  onMessageAdded,
}: LiveVoiceModalProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle')
  const [selectedLang, setSelectedLang] = useState<'hi' | 'en' | 'mr' | 'ta' | 'bn'>('hi')
  const [transcript, setTranscript] = useState<string>('')
  const [assistantAnswer, setAssistantAnswer] = useState<string>('')
  const [matchedSchemes, setMatchedSchemes] = useState<VoiceChatResponse['matched_schemes']>([])
  const [audioLevel, setAudioLevel] = useState<number>(0)
  const [isMuted, setIsMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  // Start voice session when opened
  useEffect(() => {
    if (isOpen) {
      startListening()
    } else {
      stopSession()
    }
    return () => stopSession()
  }, [isOpen])

  function stopSession() {
    stopRecording()
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    setStatus('idle')
  }

  async function startListening() {
    setError(null)
    setTranscript('')
    setAssistantAnswer('')
    setMatchedSchemes([])
    if (window.speechSynthesis) window.speechSynthesis.cancel()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Audio level analyser for fluid sphere animation
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = audioCtx
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 64
        analyserRef.current = analyser
        const source = audioCtx.createMediaStreamSource(stream)
        source.connect(analyser)

        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        const updateLevel = () => {
          if (!analyserRef.current) return
          analyserRef.current.getByteFrequencyData(dataArray)
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i]
          const avg = sum / dataArray.length
          setAudioLevel(Math.min(avg / 128, 1))
          animFrameRef.current = requestAnimationFrame(updateLevel)
        }
        updateLevel()
      } catch (e) {
        console.warn('Audio visualizer init error:', e)
      }

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' })
        const audioFile = new File([audioBlob], 'voice_note.mp3', { type: 'audio/mp3' })
        await processAudio(audioFile)
      }

      recorder.start()
      setIsRecording(true)
      setStatus('listening')
    } catch (err: any) {
      console.error(err)
      setError('Microphone access required. Please grant mic permissions.')
      setStatus('idle')
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }

  async function processAudio(file: File) {
    setStatus('processing')
    try {
      const res = await voiceChat(file, sessionId || undefined)
      setTranscript(res.transcribed_text)
      setAssistantAnswer(res.answer)
      setMatchedSchemes(res.matched_schemes || [])

      if (onMessageAdded) onMessageAdded()

      // Speak response using TTS
      if (!isMuted && res.answer) {
        speakResponse(res.answer, res.synthesized_speech_base64)
      } else {
        setStatus('idle')
      }
    } catch (err: any) {
      setError(err.message || 'Voice recognition error')
      setStatus('idle')
    }
  }

  function speakResponse(text: string, base64Audio?: string | null) {
    setStatus('speaking')

    // 1. Try Browser Speech Synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const cleanText = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*#_`]/g, '')
      const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 450))
      
      const langCodes: Record<string, string> = {
        hi: 'hi-IN',
        en: 'en-IN',
        mr: 'mr-IN',
        ta: 'ta-IN',
        bn: 'bn-IN',
      }
      utterance.lang = langCodes[selectedLang] || 'hi-IN'
      utterance.rate = 1.05
      utterance.pitch = 1.0

      utterance.onend = () => {
        setStatus('idle')
      }
      utterance.onerror = () => {
        setStatus('idle')
      }

      window.speechSynthesis.speak(utterance)
      return
    }

    // 2. Fallback to base64 audio
    if (base64Audio) {
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`)
      currentAudioRef.current = audio
      audio.onended = () => setStatus('idle')
      audio.onerror = () => setStatus('idle')
      audio.play().catch(() => setStatus('idle'))
    } else {
      setStatus('idle')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200">
      {/* Container */}
      <div className="relative w-full max-w-xl bg-gradient-to-b from-zinc-900/95 via-zinc-900/90 to-zinc-950/95 border border-zinc-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center overflow-hidden">
        
        {/* Ambient Radial Glow */}
        <div 
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            status === 'listening'
              ? 'bg-blue-600/25 scale-125'
              : status === 'processing'
              ? 'bg-indigo-600/30 animate-pulse'
              : status === 'speaking'
              ? 'bg-violet-600/25 scale-110'
              : 'bg-zinc-700/10'
          }`}
        />

        {/* Top Header Bar */}
        <div className="w-full flex items-center justify-between gap-2 z-10 mb-4 pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Radio className="h-4 w-4" />
            </div>
            <div className="text-left">
              <h3 className="text-xs font-bold text-white tracking-wide">Live Indic Voice Sphere</h3>
              <p className="text-[10px] text-zinc-400">Gemini Multimodal · Grounded Citizen Voice</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-zinc-800/80 border border-zinc-700/60 rounded-xl px-2 py-1 text-xs text-zinc-300">
              <Languages className="h-3.5 w-3.5 text-blue-400" />
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value as any)}
                className="bg-transparent text-[11px] font-semibold text-zinc-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="hi" className="bg-zinc-900">हिंदी (Hindi)</option>
                <option value="en" className="bg-zinc-900">English</option>
                <option value="mr" className="bg-zinc-900">मराठी (Marathi)</option>
                <option value="ta" className="bg-zinc-900">தமிழ் (Tamil)</option>
                <option value="bn" className="bg-zinc-900">বাংলা (Bengali)</option>
              </select>
            </div>

            {/* Mute Toggle */}
            <button
              onClick={() => {
                setIsMuted(!isMuted)
                if (!isMuted && window.speechSynthesis) window.speechSynthesis.cancel()
              }}
              className={`p-2 rounded-xl border transition-colors ${
                isMuted
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-300 hover:text-white'
              }`}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Central Dynamic Pulsing Orb */}
        <div className="relative my-6 flex items-center justify-center">
          {/* Animated Waveform Outer Rings */}
          {status === 'listening' && (
            <>
              <div 
                className="absolute rounded-full bg-blue-500/15 animate-ping"
                style={{ width: `${140 + audioLevel * 70}px`, height: `${140 + audioLevel * 70}px` }}
              />
              <div 
                className="absolute rounded-full border border-blue-400/30 transition-all duration-75"
                style={{ width: `${120 + audioLevel * 50}px`, height: `${120 + audioLevel * 50}px` }}
              />
            </>
          )}

          {status === 'speaking' && (
            <div className="absolute rounded-full bg-violet-500/20 animate-pulse w-36 h-36" />
          )}

          {/* Center Orb Button */}
          <button
            onClick={() => {
              if (isRecording) {
                stopRecording()
              } else {
                startListening()
              }
            }}
            disabled={status === 'processing'}
            className={`relative z-10 h-28 w-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl active:scale-95 ${
              status === 'listening'
                ? 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-blue-500/50 scale-105'
                : status === 'processing'
                ? 'bg-zinc-800 text-blue-400 border border-blue-500/40 shadow-blue-500/20'
                : status === 'speaking'
                ? 'bg-gradient-to-tr from-violet-600 via-purple-600 to-pink-500 text-white shadow-violet-500/40 animate-pulse'
                : 'bg-gradient-to-tr from-zinc-800 to-zinc-700 hover:from-blue-600 hover:to-indigo-600 text-zinc-200 hover:text-white border border-zinc-600'
            }`}
          >
            {status === 'processing' ? (
              <Loader2 className="h-10 w-10 animate-spin" />
            ) : status === 'listening' ? (
              <Mic className="h-10 w-10 animate-pulse" />
            ) : status === 'speaking' ? (
              <Volume2 className="h-10 w-10" />
            ) : (
              <MicOff className="h-10 w-10 text-zinc-400" />
            )}
          </button>
        </div>

        {/* Status Indicator */}
        <div className="space-y-1 z-10">
          <h4 className="text-sm font-bold text-white tracking-tight">
            {status === 'listening'
              ? 'Listening... Speak in your regional language'
              : status === 'processing'
              ? 'Transcribing & Evaluating 4,148 Schemes...'
              : status === 'speaking'
              ? 'Scheme Navigator is Speaking'
              : 'Tap Orb to Speak'}
          </h4>
          <p className="text-xs text-zinc-400">
            {status === 'listening'
              ? 'Tap orb when done or pause speaking'
              : `Grounded to ${userName}'s registered citizen profile`}
          </p>
        </div>

        {/* Live Transcripts & Response Box */}
        {(transcript || assistantAnswer) && (
          <div className="w-full mt-5 space-y-3 z-10 max-h-56 overflow-y-auto px-1 text-left">
            {transcript && (
              <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                  You Spoke
                </span>
                <p className="text-zinc-200 italic font-medium">"{transcript}"</p>
              </div>
            )}

            {assistantAnswer && (
              <div className="p-3.5 rounded-2xl bg-zinc-950/90 border border-blue-500/30 text-xs leading-relaxed">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                  AI Guidance
                </span>
                <p className="text-zinc-100 line-clamp-4">{assistantAnswer}</p>
              </div>
            )}

            {/* Matched Schemes Chips */}
            {matchedSchemes && matchedSchemes.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Matched Schemes for You:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {matchedSchemes.map((s, idx) => (
                    <a
                      key={idx}
                      href={s.application_url || `/schemes/${s.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-blue-500/40 text-left transition-all flex items-center justify-between gap-2 group"
                    >
                      <div className="truncate">
                        <h5 className="text-xs font-semibold text-white truncate group-hover:text-blue-300">{s.name}</h5>
                        <p className="text-[10px] text-emerald-400 truncate">{s.benefit_title || 'Financial DBT'}</p>
                      </div>
                      <ExternalLink className="h-3 w-3 text-zinc-500 group-hover:text-blue-400 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="w-full mt-4 p-3 rounded-2xl bg-red-950/70 border border-red-800/80 text-red-300 text-xs z-10">
            {error}
          </div>
        )}

        {/* Footer Actions */}
        <div className="w-full mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 z-10">
          <span className="text-[11px]">⚡ Pure In-Memory Bitmask Grounded</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors flex items-center gap-1.5 text-xs"
          >
            <span>Continue in Chat</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
