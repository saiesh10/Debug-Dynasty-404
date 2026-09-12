import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getSpeechLang } from '../../i18n/speechLangMap'

function getSpeechRecognition() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function useSpeechRecognition(onSpeechResult, options = {}) {
  const { continuous = true, autoStart = false, lang: explicitLang } = options
  const { i18n } = useTranslation()
  const currentLang = explicitLang || (i18n.language ? i18n.language.split('-')[0] : 'en')
  const speechLang = getSpeechLang(currentLang)

  const Recognition = getSpeechRecognition()
  const recognitionRef = useRef(null)
  const onResultRef = useRef(onSpeechResult)
  const isActiveRef = useRef(false)
  const restartTimerRef = useRef(null)
  const startRef = useRef(null)

  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [speechDetected, setSpeechDetected] = useState(false)
  const [confidence, setConfidence] = useState(0)
  const [error, setError] = useState(null)
  const [hasPermission, setHasPermission] = useState(true)

  useEffect(() => {
    onResultRef.current = onSpeechResult
  }, [onSpeechResult])

  const stop = useCallback(() => {
    isActiveRef.current = false
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
        recognitionRef.current = null
      }
    } catch {
      // ignore
    }
    setIsListening(false)
    setSpeechDetected(false)
  }, [])

  const scheduleRestart = useCallback((delay = 120) => {
    if (!isActiveRef.current || restartTimerRef.current) return
    restartTimerRef.current = setTimeout(() => {
      restartTimerRef.current = null
      if (isActiveRef.current) startRef.current?.()
    }, delay)
  }, [])

  const start = useCallback(() => {
    const Ctor = getSpeechRecognition()
    if (!Ctor) {
      setError('Speech recognition is not supported in this browser. Please open in Google Chrome or Microsoft Edge.')
      return
    }

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
    isActiveRef.current = true
    setError(null)

    try {
      // Abort old instance if running
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // ignore
        }
        recognitionRef.current = null
      }

      const recognition = new Ctor()
      recognition.lang = speechLang
      recognition.continuous = continuous
      recognition.interimResults = true
      recognition.maxAlternatives = 3
      recognitionRef.current = recognition

      recognition.onstart = () => {
        setIsListening(true)
        setError(null)
        setHasPermission(true)
      }

      recognition.onaudiostart = () => {
        setIsListening(true)
      }

      recognition.onsoundstart = () => {
        setSpeechDetected(true)
      }

      recognition.onspeechstart = () => {
        setSpeechDetected(true)
      }

      recognition.onspeechend = () => {
        setSpeechDetected(false)
      }

      recognition.onsoundend = () => {
        setSpeechDetected(false)
      }

      recognition.onresult = (event) => {
        if (!event.results || event.results.length === 0) return

        let currentPhrase = ''
        let isFinal = false
        let maxConfidence = 0

        // Get the latest active utterance from the result list
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i]
          if (res?.[0]) {
            currentPhrase = res[0].transcript
            if (res[0].confidence > maxConfidence) {
              maxConfidence = res[0].confidence
            }
          }
          if (res?.isFinal) {
            isFinal = true
          }
        }

        // If nothing in slice, fallback to the last item in results
        if (!currentPhrase && event.results.length > 0) {
          const last = event.results[event.results.length - 1]
          if (last?.[0]) {
            currentPhrase = last[0].transcript
            isFinal = Boolean(last.isFinal)
            maxConfidence = last[0].confidence || 0
          }
        }

        const cleanTranscript = currentPhrase.trim()
        if (cleanTranscript) {
          setTranscript(cleanTranscript)
          setConfidence(maxConfidence)
          onResultRef.current?.({
            transcript: cleanTranscript,
            isFinal,
            confidence: maxConfidence,
          })
        }
      }

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          isActiveRef.current = false
          setIsListening(false)
          setHasPermission(false)
          setError('Microphone access is blocked. Please click the camera/mic icon in your browser address bar to allow microphone access.')
          return
        }
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return
        }
        if (event.error === 'network') {
          return
        }
        setError(event.error || 'Speech recognition encountered an issue.')
      }

      recognition.onend = () => {
        if (recognitionRef.current !== recognition) return
        setIsListening(false)
        setSpeechDetected(false)
        recognitionRef.current = null

        if (isActiveRef.current) {
          scheduleRestart()
        }
      }

      recognition.start()
      setIsListening(true)
    } catch (err) {
      recognitionRef.current = null
      if (err.name === 'InvalidStateError') {
        scheduleRestart(250)
      } else {
        setError(err.message || 'Could not start microphone voice input.')
      }
    }
  }, [continuous, scheduleRestart, speechLang])

  useEffect(() => {
    startRef.current = start
  }, [start])

  useEffect(() => {
    if (autoStart && Recognition) {
      start()
    }
    return () => {
      isActiveRef.current = false
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current)
        restartTimerRef.current = null
      }
      try {
        if (recognitionRef.current) {
          recognitionRef.current.abort()
          recognitionRef.current = null
        }
      } catch {
        // ignore
      }
    }
  }, [autoStart, Recognition, start])

  const resetTranscript = useCallback(() => {
    setTranscript('')
  }, [])

  return {
    transcript,
    isListening,
    speechDetected,
    confidence,
    start,
    stop,
    resetTranscript,
    isSupported: Boolean(Recognition),
    hasPermission,
    error,
  }
}
