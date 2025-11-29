'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface SpeechToTextProps {
  onTranscript: (text: string) => void
  onListeningChange?: (isListening: boolean) => void
  disabled?: boolean
}

// Extend window for webkitSpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition
    SpeechRecognition: new () => SpeechRecognition
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null
  onend: ((this: SpeechRecognition, ev: Event) => void) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

export default function SpeechToText({
  onTranscript,
  onListeningChange,
  disabled = false
}: SpeechToTextProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [pulseIntensity, setPulseIntensity] = useState(0)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const animationRef = useRef<number | null>(null)

  // Check if speech recognition is supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        setIsSupported(false)
      }
    }
  }, [])

  // Animate pulse when listening
  useEffect(() => {
    if (isListening) {
      let intensity = 0
      let direction = 1
      const animate = () => {
        intensity += direction * 0.05
        if (intensity >= 1) direction = -1
        if (intensity <= 0) direction = 1
        setPulseIntensity(intensity)
        animationRef.current = requestAnimationFrame(animate)
      }
      animationRef.current = requestAnimationFrame(animate)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      setPulseIntensity(0)
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isListening])

  const startListening = useCallback(() => {
    if (!isSupported || disabled) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
      onListeningChange?.(true)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      let interimText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimText += transcript
        }
      }

      setInterimTranscript(interimText)

      if (finalTranscript) {
        onTranscript(finalTranscript)
        setInterimTranscript('')
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      onListeningChange?.(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      onListeningChange?.(false)
      setInterimTranscript('')
    }

    recognition.start()
  }, [isSupported, disabled, onTranscript, onListeningChange])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  if (!isSupported) {
    return (
      <button
        disabled
        className="relative p-3 rounded-full bg-white/5 opacity-50 cursor-not-allowed"
        title="Speech recognition not supported"
      >
        <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>
    )
  }

  return (
    <div className="relative">
      {/* Listening Pulse Effect */}
      {isListening && (
        <>
          <div
            className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25"
            style={{ transform: `scale(${1 + pulseIntensity * 0.5})` }}
          />
          <div
            className="absolute inset-0 rounded-full bg-red-400"
            style={{
              opacity: 0.3 + pulseIntensity * 0.2,
              transform: `scale(${1 + pulseIntensity * 0.3})`
            }}
          />
        </>
      )}

      <button
        onClick={toggleListening}
        disabled={disabled}
        className={`
          relative z-10 p-2 rounded-full transition-all duration-200
          ${isListening
            ? 'bg-red-500 text-white shadow-md shadow-red-500/40'
            : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white'
          }
          disabled:opacity-40 disabled:cursor-not-allowed
        `}
        title={isListening ? 'Stop' : 'Voice'}
      >
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${isListening ? 'scale-105' : ''}`}
          fill={isListening ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={isListening ? 0 : 1.5}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      </button>

      {/* Interim Transcript Display */}
      {interimTranscript && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg text-sm text-white/80 whitespace-nowrap max-w-[200px] truncate">
          <span className="animate-pulse">🎙️</span> {interimTranscript}
        </div>
      )}
    </div>
  )
}
