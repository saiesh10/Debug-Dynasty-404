import { useCallback, useRef, useState } from 'react'

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const isSpeakingRef = useRef(false)
  const activeUtteranceRef = useRef(null)
  const safetyTimeoutRef = useRef(null)

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current)
    try {
      window.speechSynthesis.cancel()
    } catch {
      // ignore
    }
    activeUtteranceRef.current = null
    isSpeakingRef.current = false
    setIsSpeaking(false)
  }, [])

  const speak = useCallback((text, onEnd) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text) return
    stop()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US'
    utterance.rate = 1.0
    activeUtteranceRef.current = utterance

    isSpeakingRef.current = true
    setIsSpeaking(true)

    const finish = () => {
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current)
      activeUtteranceRef.current = null
      isSpeakingRef.current = false
      setIsSpeaking(false)
      if (typeof onEnd === 'function') onEnd()
    }

    utterance.onend = finish
    utterance.onerror = finish

    // Fallback safety timeout in case Chrome fails to fire onend
    const estimatedDuration = Math.max(1000, Math.min(text.length * 90, 8000))
    safetyTimeoutRef.current = setTimeout(finish, estimatedDuration)

    try {
      window.speechSynthesis.speak(utterance)
    } catch {
      finish()
    }
  }, [stop])

  return {
    speak,
    stop,
    isSpeaking,
    isSpeakingRef,
    isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
  }
}
