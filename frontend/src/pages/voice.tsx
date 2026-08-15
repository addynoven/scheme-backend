import { useState, useEffect, useRef } from 'react'
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ShieldCheck,
  Languages,
  Loader2,
  ArrowRight,
  ExternalLink,
  Radio,
  Sparkles,
  MessageSquare,
  User,
} from 'lucide-react'
import {
  voiceChat,
  citizenGetMe,
  type VoiceChatResponse,
} from '@/lib/api'
import { MarkdownMessage } from '@/components/MarkdownMessage'
import { Link } from '@/router'

interface VoiceTurn {
  id: string
  transcribedText: string
  detectedLanguage: string
  answer: string
  matchedSchemes: VoiceChatResponse['matched_schemes']
  timestamp: string
}

export default function VoicePage() {
  const [isRecording, setIsRecording] = useState(false)
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle')
  const [selectedLang, setSelectedLang] = useState<'hi' | 'en' | 'mr' | 'ta' | 'bn'>('hi')
  const [turns, setTurns] = useState<VoiceTurn[]>([])
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null)
  const [audioLevel, setAudioLevel] = useState<number>(0)
  const [isMuted, setIsMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [citizen, setCitizen] = useState<any | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const scrollEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    citizenGetMe()
      .then(setCitizen)
      .catch(() => {})
    return () => {
      stopSession()
    }
  }, [])

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns, status])

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
    if (window.speechSynthesis) window.speechSynthesis.cancel()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

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
        console.warn('Audio visualizer error:', e)
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
      setError('Microphone access required. Please allow mic permissions.')
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
      const res = await voiceChat(file, activeSessionId || undefined)
      if (res.session_id) setActiveSessionId(res.session_id)

      const newTurn: VoiceTurn = {
        id: Math.random().toString(),
        transcribedText: res.transcribed_text,
        detectedLanguage: res.detected_language,
        answer: res.answer,
        matchedSchemes: res.matched_schemes || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setTurns((prev) => [...prev, newTurn])

      if (!isMuted && res.answer) {
        speakResponse(res.answer, res.synthesized_speech_base64)
      } else {
        setStatus('idle')
      }
    } catch (err: any) {
      setError(err.message || 'Voice recognition failed')
      setStatus('idle')
    }
  }

  function speakResponse(text: string, base64Audio?: string | null) {
    setStatus('speaking')

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

      utterance.onend = () => setStatus('idle')
      utterance.onerror = () => setStatus('idle')

      window.speechSynthesis.speak(utterance)
      return
    }

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

  const userName = citizen?.profile?.full_name || citizen?.email?.split('@')[0] || 'Citizen'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800/80 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden shadow-2xl">
        
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span>Indic Rural Kiosk & Voice Assistant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-serif">
            Grounded Voice Studio
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
            Speak naturally in Hindi, Marathi, Tamil, Bengali, or English. Evaluates 4,148 welfare schemes grounded directly to {userName}'s citizen profile.
          </p>
        </div>

        {/* Controls: Language & Mute */}
        <div className="flex items-center gap-2 relative z-10">
          <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800 rounded-2xl px-3 py-2 text-xs">
            <Languages className="h-4 w-4 text-blue-400" />
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-zinc-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="hi" className="bg-zinc-900">हिंदी (Hindi)</option>
              <option value="en" className="bg-zinc-900">English</option>
              <option value="mr" className="bg-zinc-900">मराठी (Marathi)</option>
              <option value="ta" className="bg-zinc-900">தமிழ் (Tamil)</option>
              <option value="bn" className="bg-zinc-900">বাংলা (Bengali)</option>
            </select>
          </div>

          <button
            onClick={() => {
              setIsMuted(!isMuted)
              if (!isMuted && window.speechSynthesis) window.speechSynthesis.cancel()
            }}
            className={`p-2.5 rounded-2xl border transition-colors ${
              isMuted
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-zinc-950/80 border-zinc-800 text-zinc-300 hover:text-white'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main Interactive Voice Orb Container */}
      <div className="relative rounded-3xl bg-zinc-900/60 border border-zinc-800/80 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-6 shadow-2xl overflow-hidden">
        
        {/* Dynamic Glow */}
        <div
          className={`absolute inset-0 m-auto w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            status === 'listening'
              ? 'bg-blue-600/25 scale-125'
              : status === 'processing'
              ? 'bg-indigo-600/30 animate-pulse'
              : status === 'speaking'
              ? 'bg-violet-600/25 scale-110'
              : 'bg-zinc-700/5'
          }`}
        />

        {/* Central Orb */}
        <div className="relative my-4 flex items-center justify-center">
          {status === 'listening' && (
            <>
              <div
                className="absolute rounded-full bg-blue-500/20 animate-ping"
                style={{ width: `${160 + audioLevel * 80}px`, height: `${160 + audioLevel * 80}px` }}
              />
              <div
                className="absolute rounded-full border border-blue-400/40 transition-all duration-75"
                style={{ width: `${140 + audioLevel * 60}px`, height: `${140 + audioLevel * 60}px` }}
              />
            </>
          )}

          <button
            onClick={isRecording ? stopRecording : startListening}
            disabled={status === 'processing'}
            className={`relative z-10 h-28 w-28 sm:h-32 sm:w-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl active:scale-95 ${
              status === 'listening'
                ? 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-blue-500/50 scale-105'
                : status === 'processing'
                ? 'bg-zinc-800 text-blue-400 border border-blue-500/40 shadow-blue-500/20'
                : status === 'speaking'
                ? 'bg-gradient-to-tr from-violet-600 via-purple-600 to-pink-500 text-white shadow-violet-500/40 animate-pulse'
                : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-blue-500/30'
            }`}
          >
            {status === 'processing' ? (
              <Loader2 className="h-10 w-10 animate-spin" />
            ) : status === 'listening' ? (
              <MicOff className="h-10 w-10 animate-pulse" />
            ) : status === 'speaking' ? (
              <Volume2 className="h-10 w-10" />
            ) : (
              <Mic className="h-10 w-10" />
            )}
          </button>
        </div>

        <div className="space-y-1 relative z-10">
          <h3 className="text-lg font-bold text-white tracking-tight">
            {status === 'listening'
              ? 'Listening... Tap Orb to Complete'
              : status === 'processing'
              ? 'Evaluating 4,148 Schemes with Gemini 3.7 Flash...'
              : status === 'speaking'
              ? 'Speaking AI Guidance...'
              : 'Tap Microphone to Speak'}
          </h3>
          <p className="text-xs text-zinc-500">
            Ask: "Bhaiya meri aamdani 80,000 hai, mere liye koi scheme hai?" or "College scholarship chahiye"
          </p>
        </div>

        {/* Action Link to Full Chat */}
        {activeSessionId && (
          <Link
            to="/chat"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-xs text-zinc-300 hover:text-white transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
            <span>Open in Chat Center</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-950/70 border border-red-800 text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* Spoken Conversation Turns List */}
      {turns.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Spoken Dialog History ({turns.length})
            </h3>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Grounded to Citizen Profile
            </span>
          </div>

          <div className="space-y-4">
            {turns.map((t) => (
              <div
                key={t.id}
                className="rounded-3xl bg-zinc-900/80 border border-zinc-800 p-6 space-y-4 shadow-xl"
              >
                {/* Spoken Question */}
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                      <span className="font-semibold text-blue-400 uppercase tracking-wide">You Spoke</span>
                      <span>{t.timestamp}</span>
                    </div>
                    <p className="text-sm text-zinc-100 font-medium italic">
                      "{t.transcribedText}"
                    </p>
                  </div>
                </div>

                {/* AI Spoken Guidance */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-start gap-3">
                  <div className="h-7 w-7 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wide mb-1">
                      Grounded Guidance
                    </div>
                    <div className="text-sm text-zinc-200 leading-relaxed">
                      <MarkdownMessage content={t.answer} />
                    </div>
                  </div>
                </div>

                {/* Recommended Scheme Cards */}
                {t.matchedSchemes && t.matchedSchemes.length > 0 && (
                  <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                      Recommended Schemes for You:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {t.matchedSchemes.map((s, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2"
                        >
                          <div className="truncate">
                            <h4 className="font-semibold text-zinc-100 text-xs truncate">{s.name}</h4>
                            <p className="text-[11px] text-emerald-400 font-medium truncate">
                              {s.benefit_title || 'Financial Assistance'}
                            </p>
                          </div>
                          <a
                            href={s.application_url || `/schemes/${s.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-medium transition-all shrink-0 flex items-center gap-1"
                          >
                            <span>Apply</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={scrollEndRef} />
          </div>
        </div>
      )}
    </div>
  )
}
