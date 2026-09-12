import { useCallback } from 'react'
import { useNavigation } from '../../context/NavigationContext'
import { usePrimaryAction } from '../common/OneKeyNavProvider'
import VoiceTextFallback from './VoiceTextFallback'
import { useVoiceControl } from './VoiceContext'

function VoiceAssistant() {
  const { navigateTo, goHome } = useNavigation()
  const {
    isListening,
    speechDetected,
    transcript,
    error,
    isSupported,
    hasPermission,
    voiceEnabled,
    toggleMic,
    start,
    executeVoiceCommand,
  } = useVoiceControl()

  const openScanner = useCallback(() => {
    navigateTo('scanner', 'voice', 'Document scanner opened')
  }, [navigateTo])

  usePrimaryAction(openScanner)

  const micDenied = Boolean(!hasPermission || error?.toLowerCase().includes('denied') || error?.toLowerCase().includes('not-allowed'))
  const showFallback = !isSupported || micDenied

  return (
    <section className="workspace-panel voice-welcome-panel">
      <span className="eyebrow">Voice Navigation Assistant</span>
      <h2>Tell us what you need</h2>
      <p className="lead">
        Voice recognition is active and listening automatically. Speak your command to navigate without touching any buttons.
      </p>

      <div className={`voice-active-card ${speechDetected ? 'speech-detected' : ''}`}>
        <div className="voice-card-header">
          <div className="voice-card-pulse">
            <span className={`voice-pulse-ring ${isListening && voiceEnabled ? 'pulsing' : ''}`} />
            <span className="voice-card-icon">🎙️</span>
          </div>
          <div>
            <h3>
              {voiceEnabled
                ? (isListening
                    ? (speechDetected ? 'Listening to speech…' : 'Microphone is listening…')
                    : 'Connecting microphone…')
                : 'Microphone paused'}
            </h3>
            <p className="voice-card-sub">
              {transcript ? (
                <strong className="voice-spoken-text">Hearing: “{transcript}”</strong>
              ) : (
                'Speak into your microphone — say “explore schemes” or “find schemes”'
              )}
            </p>
          </div>
        </div>

        <div className="voice-command-chips">
          <span className="voice-chip">🗣️ “explore schemes” → Opens scanner</span>
          <span className="voice-chip">🗣️ “find schemes” → Check eligible support</span>
          <span className="voice-chip">🗣️ “emergency” → Emergency help</span>
          <span className="voice-chip">🗣️ “go home” → Main menu</span>
        </div>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <p>{error}</p>
          {micDenied && (
            <button
              type="button"
              className="primary-button"
              style={{ marginTop: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              onClick={() => start()}
            >
              Retry Microphone Access
            </button>
          )}
        </div>
      )}

      <div className="action-row">
        <button
          className="primary-button"
          type="button"
          onClick={openScanner}
        >
          Open scanner →
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={toggleMic}
          disabled={!isSupported || micDenied}
        >
          {voiceEnabled ? 'Mute microphone' : 'Unmute microphone'}
        </button>
        <button className="secondary-button" type="button" onClick={goHome}>
          Change mode
        </button>
      </div>

      <VoiceTextFallback
        message={showFallback
          ? (micDenied || !isSupported
            ? 'Voice input is unavailable. Type a command instead.'
            : 'Speech was unclear. Type a command instead.')
          : 'You can also type a command'}
        onIntent={(intent, typed) => {
          if (intent === 'explore') openScanner()
          else if (intent === 'emergency') navigateTo('emergency', 'voice', 'Emergency help')
          else if (intent === 'home') goHome()
          else executeVoiceCommand({ intent, raw: typed })
        }}
      />
    </section>
  )
}

export default VoiceAssistant
