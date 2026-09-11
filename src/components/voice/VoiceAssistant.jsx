import { useCallback, useState } from 'react'
import { useNavigation } from '../../context/NavigationContext'
import { VOICE_CONFIDENCE_THRESHOLD, VOICE_LOW_CONFIDENCE_ATTEMPTS } from '../../constants'
import { usePrimaryAction } from '../common/OneKeyNavProvider'
import VoiceTextFallback from './VoiceTextFallback'
import { parseVoiceIntent } from './parseVoiceIntent'
import { useSpeechRecognition } from './useSpeechRecognition'
import { useTextToSpeech } from './useTextToSpeech'

function VoiceAssistant() {
  const { navigateTo, goHome } = useNavigation()
  const { speak } = useTextToSpeech()
  const [lowAttempts, setLowAttempts] = useState(0)
  const [lastHandled, setLastHandled] = useState('')

  const runIntent = useCallback((intent, spoken) => {
    if (!intent) {
      speak('I did not catch a command. Try saying explore schemes, emergency, or go home.')
      return
    }
    setLastHandled(spoken)
    if (intent === 'explore') {
      navigateTo('scanner', 'voice', 'Document scanner opened')
      speak('Opening the document scanner.')
      return
    }
    if (intent === 'emergency') {
      navigateTo('emergency', 'voice', 'Emergency help is available')
      return
    }
    if (intent === 'home') {
      goHome()
      speak('Returning home.')
    }
  }, [goHome, navigateTo, speak])

  const handleFinalResult = useCallback(({ transcript, confidence }) => {
    if (transcript === lastHandled) return
    if (confidence > 0 && confidence < VOICE_CONFIDENCE_THRESHOLD) {
      setLowAttempts((count) => count + 1)
      return
    }
    const intent = parseVoiceIntent(transcript)
    if (intent) runIntent(intent, transcript)
  }, [lastHandled, runIntent])

  const { transcript, isListening, start, stop, isSupported, error } = useSpeechRecognition(handleFinalResult)
  const micDenied = Boolean(error?.toLowerCase().includes('denied') || error?.toLowerCase().includes('not-allowed'))
  const showFallback = !isSupported || micDenied || lowAttempts >= VOICE_LOW_CONFIDENCE_ATTEMPTS

  const toggleListening = useCallback(() => {
    if (isListening) {
      stop()
      return
    }
    start()
  }, [isListening, start, stop])

  usePrimaryAction(toggleListening)

  return (
    <section className="workspace-panel">
      <span className="eyebrow">Voice assistant</span>
      <h2>Tell us what you need</h2>
      <p className="lead">Say “explore schemes”, “emergency”, or “go home”. Explore schemes opens the secure document scanner.</p>
      <p className="scan-status" aria-live="polite">{transcript || 'Waiting for a command…'}</p>
      {error && <p className="error-banner">{error}</p>}
      <div className="action-row">
        <button className="primary-button" type="button" onClick={toggleListening} disabled={!isSupported || micDenied}>
          {isListening ? 'Stop listening' : 'Start listening'}
        </button>
        <button className="secondary-button" type="button" onClick={goHome}>Change mode</button>
      </div>
      <VoiceTextFallback
        message={showFallback
          ? (micDenied || !isSupported
            ? 'Voice input is unavailable. Type a command instead.'
            : 'Speech was unclear. Type a command instead.')
          : 'You can also type a command'}
        onIntent={(intent, typed) => runIntent(intent, typed)}
      />
    </section>
  )
}

export default VoiceAssistant
