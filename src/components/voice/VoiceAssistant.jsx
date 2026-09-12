import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '../../context/NavigationContext'
import { usePrimaryAction } from '../common/OneKeyNavProvider'
import VoiceTextFallback from './VoiceTextFallback'
import { useVoiceControl } from './VoiceContext'

function VoiceAssistant() {
  const { t } = useTranslation(['voice', 'common'])
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
    navigateTo('scanner', 'voice', t('spoken.openingScanner', 'Document scanner opened'))
  }, [navigateTo, t])

  usePrimaryAction(openScanner)

  const micDenied = Boolean(
    !hasPermission ||
    error?.toLowerCase().includes('denied') ||
    error?.toLowerCase().includes('not-allowed')
  )
  const showFallback = !isSupported || micDenied

  return (
    <section className="workspace-panel voice-welcome-panel">
      <span className="eyebrow">{t('voice:eyebrow', 'Voice Navigation Assistant')}</span>
      <h2>{t('voice:title', 'Tell us what you need')}</h2>
      <p className="lead">
        {t(
          'voice:lead',
          'Voice recognition is active and listening automatically. Speak your command to navigate without touching any buttons.',
        )}
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
                ? isListening
                  ? speechDetected
                    ? t('voice:status.listeningSpeech', 'Listening to speech…')
                    : t('voice:status.listeningMic', 'Microphone is listening…')
                  : t('voice:status.connecting', 'Connecting microphone…')
                : t('voice:status.paused', 'Microphone paused')}
            </h3>
            <p className="voice-card-sub">
              {transcript ? (
                <strong className="voice-spoken-text">
                  {t('voice:hearing', 'Hearing: “{{transcript}}”', { transcript })}
                </strong>
              ) : (
                t(
                  'voice:speakPrompt',
                  'Speak into your microphone — say “explore schemes” or “find schemes”',
                )
              )}
            </p>
          </div>
        </div>

        <div className="voice-command-chips">
          <span className="voice-chip">{t('voice:chips.explore', '🗣️ “explore schemes” → Opens scanner')}</span>
          <span className="voice-chip">{t('voice:chips.find', '🗣️ “find schemes” → Check eligible support')}</span>
          <span className="voice-chip">{t('voice:chips.emergency', '🗣️ “emergency” → Emergency help')}</span>
          <span className="voice-chip">{t('voice:chips.home', '🗣️ “go home” → Main menu')}</span>
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
              {t('voice:micRetry', 'Retry Microphone Access')}
            </button>
          )}
        </div>
      )}

      <div className="action-row">
        <button className="primary-button" type="button" onClick={openScanner}>
          {t('voice:openScanner', 'Open scanner →')}
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={toggleMic}
          disabled={!isSupported || micDenied}
        >
          {voiceEnabled
            ? t('voice:muteMic', 'Mute microphone')
            : t('voice:unmuteMic', 'Unmute microphone')}
        </button>
        <button className="secondary-button" type="button" onClick={goHome}>
          {t('common:nav.changeMode', 'Change mode')}
        </button>
      </div>

      <VoiceTextFallback
        message={
          showFallback
            ? micDenied || !isSupported
              ? t('voice:fallback.unavailable', 'Voice input is unavailable. Type a command instead.')
              : t('voice:fallback.unclear', 'Speech was unclear. Type a command instead.')
            : t('voice:fallback.general', 'You can also type a command')
        }
        onIntent={(intent, typed) => {
          if (intent === 'explore') openScanner()
          else if (intent === 'emergency') navigateTo('emergency', 'voice', t('spoken.openingEmergency', 'Emergency help'))
          else if (intent === 'home') goHome()
          else executeVoiceCommand({ intent, raw: typed })
        }}
      />
    </section>
  )
}

export default VoiceAssistant
