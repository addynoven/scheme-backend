import { useState, useRef } from 'react'
import {
  Mic,
  MicOff,
  Volume2,
  ShieldCheck,
  Languages,
  Loader2,
  Play,
  FileAudio,
} from 'lucide-react'
import {
  voiceChat,
  synthesizeSpeech,
  type VoiceChatResponse,
} from '@/lib/api'

export default function VoicePage() {
  const [isRecording, setIsRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedLang, setSelectedLang] = useState('hi')
  const [result, setResult] = useState<VoiceChatResponse | null>(null)
  const [synthesizedAudio, setSynthesizedAudio] = useState<string | null>(null)
  const [customText, setCustomText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  async function startRecording() {
    setError(null)
    setResult(null)
    setSynthesizedAudio(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' })
        const audioFile = new File([audioBlob], 'voice_query.mp3', { type: 'audio/mp3' })
        await processVoiceQuery(audioFile)
      }

      recorder.start()
      setIsRecording(true)
    } catch (err: any) {
      setError('Microphone access denied or not available. Using file upload fallback.')
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  async function processVoiceQuery(file: File) {
    setLoading(true)
    try {
      const res = await voiceChat(file)
      setResult(res)
      if (res.synthesized_speech_base64) {
        setSynthesizedAudio(`data:audio/mp3;base64,${res.synthesized_speech_base64}`)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process voice query')
    } finally {
      setLoading(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      await processVoiceQuery(e.target.files[0])
    }
  }

  async function handleTestSynthesize() {
    if (!customText.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await synthesizeSpeech(customText.trim(), selectedLang)
      setSynthesizedAudio(`data:audio/mp3;base64,${res.audio_base64}`)
    } catch (err: any) {
      setError(err.message || 'Speech synthesis failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-950/40 via-indigo-950/30 to-zinc-900 border border-violet-900/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold">
            <Languages className="h-3.5 w-3.5" />
            <span>V2.9 Multilingual Voice Interface</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Voice-First Rural Kiosk & Speech Assistant
          </h1>
          <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
            Empowering citizens who prefer speaking in their regional language. Features Gemini Multimodal Audio transcription, 24kHz Indic speech synthesis, and real-time tool calling.
          </p>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-2">
          <Languages className="h-4 w-4 text-zinc-400 ml-2" />
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="bg-transparent text-xs font-semibold text-zinc-200 focus:outline-none pr-3 py-1 cursor-pointer"
          >
            <option value="hi">Hindi (हिंदी)</option>
            <option value="en">English</option>
            <option value="mr">Marathi (मराठी)</option>
            <option value="ta">Tamil (தமிழ்)</option>
            <option value="bn">Bengali (বাংলা)</option>
          </select>
        </div>
      </div>

      {/* Main Microphone Interaction Card */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          {isRecording && (
            <span className="absolute -inset-4 rounded-full bg-red-500/20 animate-ping" />
          )}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={loading}
            className={`relative h-24 w-24 sm:h-28 sm:w-28 rounded-full flex items-center justify-center transition-all shadow-2xl ${
              isRecording
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/50 scale-105'
                : 'bg-gradient-to-tr from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-indigo-600/30'
            }`}
          >
            {loading ? (
              <Loader2 className="h-10 w-10 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-10 w-10 animate-pulse" />
            ) : (
              <Mic className="h-10 w-10" />
            )}
          </button>
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">
            {isRecording
              ? 'Listening... Tap to Complete'
              : loading
              ? 'Transcribing & Evaluating Schemes...'
              : 'Tap Microphone to Speak'}
          </h3>
          <p className="text-xs text-zinc-500">
            Ask: "Bhaiya meri aamdani 80,000 hai, mere liye koi scheme hai?"
          </p>
        </div>

        {/* Or Upload Audio File */}
        <div className="flex items-center gap-4 text-xs text-zinc-500 pt-2">
          <span>Or upload recorded audio:</span>
          <label className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer flex items-center gap-1.5 transition-colors border border-zinc-700">
            <FileAudio className="h-3.5 w-3.5 text-violet-400" />
            <span>Select .mp3 / .wav</span>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
              <ShieldCheck className="h-5 w-5" />
              <span>Voice Query Resolved</span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-400 text-xs uppercase">
              Language: {result.detected_language}
            </span>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Transcribed Question
              </span>
              <p className="text-zinc-200 mt-1 italic bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800/80">
                "{result.transcribed_text}"
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Synthesized Assistant Response
              </span>
              <p className="text-zinc-100 mt-1 bg-zinc-950/80 p-4 rounded-xl border border-zinc-800/80 leading-relaxed">
                {result.answer}
              </p>
            </div>

            {/* Audio Playback Player */}
            {synthesizedAudio && (
              <div className="p-4 rounded-2xl bg-violet-950/40 border border-violet-800/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-violet-300 text-xs font-medium">
                  <Volume2 className="h-4 w-4" />
                  <span>24kHz Spoken Audio Guidance</span>
                </div>
                <audio controls src={synthesizedAudio} className="h-8 max-w-xs" autoPlay />
              </div>
            )}

            {/* Matched Schemes List */}
            {result.matched_schemes.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Recommended Schemes
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.matched_schemes.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <h4 className="font-semibold text-zinc-100 text-xs truncate">{s.name}</h4>
                        <p className="text-[11px] text-emerald-400 font-medium truncate">{s.benefit_title || 'Financial DBT'}</p>
                      </div>
                      <a
                        href={s.application_url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white text-xs font-medium transition-all shrink-0"
                      >
                        Apply
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TTS Speech Synthesis Playground */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-violet-400" />
          <span>Speech Synthesizer (TTS Playground)</span>
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Type any text in Hindi or English to test speech audio synthesis..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
          />
          <button
            onClick={handleTestSynthesize}
            disabled={loading || !customText.trim()}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shrink-0"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Speak</span>
          </button>
        </div>
      </div>
    </div>
  )
}
