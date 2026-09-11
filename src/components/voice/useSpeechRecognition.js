import { useCallback, useEffect, useRef, useState } from 'react'

function getSpeechRecognition() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function useSpeechRecognition(onFinalResult) {
  const Recognition = getSpeechRecognition()
  const recognitionRef = useRef(null)
  const onFinalRef = useRef(onFinalResult)
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [confidence, setConfidence] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    onFinalRef.current = onFinalResult
  }, [onFinalResult])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const start = useCallback(() => {
    const Ctor = getSpeechRecognition()
    if (!Ctor) {
      setError('Speech recognition is not supported in this browser.')
      return
    }

    setError(null)
    const recognition = new Ctor()
    recognition.lang = 'en-IN'
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1]
      const spoken = result?.[0]?.transcript || ''
      const nextConfidence = Number(result?.[0]?.confidence || 0)
      setTranscript(spoken)
      setConfidence(nextConfidence)
      if (result?.isFinal) {
        onFinalRef.current?.({ transcript: spoken, confidence: nextConfidence })
      }
    }

    recognition.onerror = (event) => {
      setIsListening(false)
      if (event.error === 'not-allowed') {
        setError('Microphone permission was denied.')
        return
      }
      setError(event.error || 'Speech recognition failed.')
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    setIsListening(true)
    recognition.start()
  }, [])

  return {
    transcript,
    isListening,
    confidence,
    start,
    stop,
    isSupported: Boolean(Recognition),
    error,
  }
}
