import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '../../context/NavigationContext'
import { useCitizen } from '../../context/CitizenContext'
import { useOneKeyNav } from '../common/OneKeyNavProvider'
import { matchSchemes } from '../schemes/matchEngine'
import { generateApplicationPDF } from '../application/generateApplicationPDF'
import { getLocalizedField } from '../schemes/SchemesScreen'
import { parseVoiceCommand } from './parseVoiceIntent'
import { useSpeechRecognition } from './useSpeechRecognition'
import { useTextToSpeech } from './useTextToSpeech'
import { VoiceControlContext } from './VoiceContext'

export function VoiceSessionProvider({ children }) {
  const { t, i18n } = useTranslation(['voice', 'common'])
  const { currentScreen, entryMode, navigateTo, goHome, setAnnouncement } = useNavigation()
  const { citizenData, matchedSchemes, setMatchedSchemes, selectedScheme, setSelectedScheme } = useCitizen()
  const { runPrimaryAction, runBackAction } = useOneKeyNav()
  const { speak, stop: stopTts } = useTextToSpeech()

  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [feedbackTimer, setFeedbackTimer] = useState(null)
  const lastActionAt = useRef(0)
  const lastHandledIntentRef = useRef('')
  const lastSpokenScreenRef = useRef('')
  const inVoiceMode = entryMode === 'voice' && currentScreen !== 'home'
  const currentLang = i18n.language || 'en'

  const showToast = useCallback((msg) => {
    setFeedback(msg)
    if (feedbackTimer) clearTimeout(feedbackTimer)
    const t = setTimeout(() => setFeedback(''), 4000)
    setFeedbackTimer(t)
  }, [feedbackTimer])

  // Contextual voice prompt when screen changes in Voice mode
  useEffect(() => {
    if (!inVoiceMode || currentScreen === 'home') {
      stopTts()
      return
    }
    if (lastSpokenScreenRef.current === currentScreen) return
    lastSpokenScreenRef.current = currentScreen

    if (currentScreen === 'voice') {
      speak(
        t(
          'voice:spoken.voiceReady',
          'Voice assistant ready. Say explore schemes to scan your document, or say find schemes.',
        ),
      )
    } else if (currentScreen === 'scanner') {
      speak(
        t(
          'voice:spoken.scannerReady',
          'Document scanner ready. Position your document. Say find scheme when ready.',
        ),
      )
    } else if (currentScreen === 'confirm') {
      const name = citizenData.name ? `for ${citizenData.name}` : ''
      speak(
        t(
          'voice:spoken.confirmDetails',
          'Check your details {{name}}. Say find scheme to see your welfare schemes, or rescan.',
          { name },
        ),
      )
    } else if (currentScreen === 'schemes') {
      const count = matchedSchemes.length
      if (count > 0) {
        const first = matchedSchemes[0]
          ? getLocalizedField(matchedSchemes[0].name, currentLang)
          : 'the first scheme'
        speak(
          t(
            'voice:spoken.schemesFound',
            '{{count}} matching schemes found. Say choose scheme 1 for {{first}}, or choose scheme 2.',
            { count, first },
          ),
        )
      } else {
        speak(t('voice:spoken.noSchemes', 'No matching schemes found. Say rescan or go back.'))
      }
    } else if (currentScreen === 'application') {
      const active = selectedScheme || matchedSchemes[0]
      const schemeName = active ? getLocalizedField(active.name, currentLang) : 'scheme'
      speak(
        t(
          'voice:spoken.appReview',
          'Application review for {{scheme}}. Say save pdf to generate your application.',
          { scheme: schemeName },
        ),
      )
    } else if (currentScreen === 'submitted') {
      speak(t('voice:spoken.appSubmitted', 'Application completed. Say save pdf to download your file.'))
    }
  }, [currentScreen, inVoiceMode, citizenData.name, matchedSchemes, selectedScheme, speak, stopTts, t, currentLang])

  const executeVoiceCommand = useCallback((cmd) => {
    if (!cmd || !cmd.intent) return
    const { intent, index, raw } = cmd
    showToast(`🎙️ Spoken: "${raw}"`)

    if (intent === 'emergency') {
      speak(t('voice:spoken.openingEmergency', 'Opening emergency help.'))
      navigateTo('emergency', 'voice', 'Emergency help is available')
      return
    }

    if (intent === 'home') {
      stopTts()
      goHome()
      return
    }

    if (intent === 'back') {
      speak(t('voice:spoken.goingBack', 'Going back.'))
      runBackAction()
      return
    }

    // Voice assistant / Home screen
    if (currentScreen === 'voice' || currentScreen === 'home') {
      if (intent === 'explore' || intent === 'find_schemes' || intent === 'capture' || intent === 'upload') {
        speak(t('voice:spoken.openingScanner', 'Opening document scanner.'))
        navigateTo('scanner', 'voice', 'Document scanner opened')
        return
      }
    }

    // Scanner screen
    if (currentScreen === 'scanner') {
      if (intent === 'find_schemes' || intent === 'proceed') {
        speak(t('voice:spoken.confirmDetails', 'Proceeding to confirm details.'))
        runPrimaryAction()
        return
      }
      if (intent === 'capture') {
        speak(t('voice:spoken.capturingDoc', 'Capturing document.'))
        runPrimaryAction()
        return
      }
      if (intent === 'rescan') {
        speak(t('voice:spoken.restartingScanner', 'Restarting document scanner.'))
        runPrimaryAction()
        return
      }
    }

    // Confirm screen
    if (currentScreen === 'confirm') {
      if (intent === 'find_schemes' || intent === 'proceed' || intent === 'choose_scheme') {
        const matches = matchSchemes(citizenData)
        setMatchedSchemes(matches)
        const targetIdx = (index || 1) - 1
        setSelectedScheme(matches[targetIdx] || matches[0] || null)
        speak(t('voice:spoken.findingSchemes', 'Finding matching schemes for your confirmed details.'))
        navigateTo('schemes', 'voice', 'Eligible schemes are ready to explore')
        return
      }
      if (intent === 'rescan') {
        speak(t('voice:spoken.restartingScanner', 'Restarting document scanner.'))
        navigateTo('scanner', 'voice', 'Document scanner restarted')
        return
      }
    }

    // Schemes screen
    if (currentScreen === 'schemes') {
      if (intent === 'choose_scheme') {
        const targetIdx = (index || 1) - 1
        const chosen = matchedSchemes[targetIdx] || matchedSchemes[0]
        if (chosen) {
          setSelectedScheme(chosen)
          const chosenName = getLocalizedField(chosen.name, currentLang)
          speak(
            t('voice:spoken.selectedScheme', 'Selected {{name}}. Opening application review.', {
              name: chosenName,
            }),
          )
          navigateTo('application', 'voice', `Selected ${chosenName}`)
          return
        }
        speak(t('voice:spoken.noSchemes', 'No matching schemes found. Say rescan or go back.'))
        showToast(t('voice:spoken.noSchemes', 'No matching schemes found. Say rescan or go back.'))
        return
      }
      if (intent === 'find_schemes' || intent === 'proceed') {
        if (matchedSchemes[0]) {
          setSelectedScheme(matchedSchemes[0])
          const chosenName = getLocalizedField(matchedSchemes[0].name, currentLang)
          speak(
            t('voice:spoken.selectedScheme', 'Selected {{name}}. Opening application review.', {
              name: chosenName,
            }),
          )
          navigateTo('application', 'voice', `Selected ${chosenName}`)
          return
        }
      }
      if (intent === 'rescan') {
        speak(t('voice:spoken.restartingScanner', 'Returning to scanner.'))
        navigateTo('scanner', 'voice', 'Scanner reopened')
        return
      }
    }

    // Application review screen
    if (currentScreen === 'application') {
      if (intent === 'save_pdf' || intent === 'proceed' || intent === 'find_schemes') {
        speak(t('voice:spoken.appGenerated', 'Application generated. Ready to download.'))
        navigateTo('submitted', 'voice', 'Your application is ready to download')
        return
      }
      if (intent === 'back') {
        navigateTo('schemes', 'voice', 'Return to schemes')
        return
      }
    }

    // Submitted screen
    if (currentScreen === 'submitted') {
      if (intent === 'save_pdf') {
        const targetScheme = selectedScheme || matchedSchemes[0]
        const doc = generateApplicationPDF(citizenData, targetScheme)
        doc.save('application.pdf')
        speak(t('voice:spoken.pdfDownloaded', 'Application PDF downloaded.'))
        showToast('✅ Application PDF saved!')
        return
      }
      if (intent === 'back') {
        navigateTo('schemes', 'voice', 'Return to schemes')
        return
      }
    }

    // Default primary action fallback
    if (intent === 'find_schemes' || intent === 'proceed') {
      runPrimaryAction()
      return
    }
  }, [
    citizenData,
    currentLang,
    currentScreen,
    goHome,
    matchedSchemes,
    navigateTo,
    runBackAction,
    runPrimaryAction,
    selectedScheme,
    setMatchedSchemes,
    setSelectedScheme,
    showToast,
    speak,
    stopTts,
    t,
  ])

  const handleSpeechResult = useCallback(({ transcript, isFinal, confidence }) => {
    if (!voiceEnabled || !inVoiceMode) return
    if (!transcript) return
    if (!isFinal) return

    const cmd = parseVoiceCommand(transcript)
    if (!cmd) return

    const now = Date.now()
    if (now - lastActionAt.current < 600) return
    if (cmd.intent === lastHandledIntentRef.current && now - lastActionAt.current < 1600) return

    lastActionAt.current = now
    lastHandledIntentRef.current = cmd.intent
    executeVoiceCommand(cmd)
  }, [executeVoiceCommand, inVoiceMode, voiceEnabled])

  const {
    transcript,
    isListening,
    speechDetected,
    start,
    stop,
    resetTranscript,
    isSupported,
    hasPermission,
    error,
  } = useSpeechRecognition(handleSpeechResult, {
    continuous: true,
  })

  // Start / stop speech recognition when voice mode toggles
  useEffect(() => {
    if (inVoiceMode && voiceEnabled && isSupported) {
      start()
    } else {
      stop()
    }
  }, [inVoiceMode, voiceEnabled, isSupported, start, stop])

  const toggleMic = useCallback(() => {
    if (voiceEnabled) {
      setVoiceEnabled(false)
      stop()
      stopTts()
      showToast('Microphone paused')
    } else {
      setVoiceEnabled(true)
      start()
      showToast('Microphone active')
    }
  }, [showToast, start, stop, stopTts, voiceEnabled])

  const value = useMemo(
    () => ({
      inVoiceMode,
      voiceEnabled,
      isListening,
      speechDetected,
      transcript,
      isSupported,
      hasPermission,
      error,
      start,
      stop,
      toggleMic,
      executeVoiceCommand,
      speak,
      feedback,
    }),
    [
      inVoiceMode,
      voiceEnabled,
      isListening,
      speechDetected,
      transcript,
      isSupported,
      hasPermission,
      error,
      start,
      stop,
      toggleMic,
      executeVoiceCommand,
      speak,
      feedback,
    ],
  )

  const currentHint = t(`voice:hints.${currentScreen}`, 'Say “go home” to return')

  return (
    <VoiceControlContext.Provider value={value}>
      {children}

      {inVoiceMode && currentScreen !== 'voice' && currentScreen !== 'home' && (
        <aside className="voice-floating-hud" aria-label="Voice Navigation Assistant">
          <div className="voice-hud-main">
            <div className="voice-hud-indicator">
              <span className={`voice-mic-badge ${isListening && voiceEnabled ? 'active-pulse' : 'inactive'}`}>
                🎙️
              </span>
              <div className="voice-hud-text">
                <div className="voice-hud-title-row">
                  <strong className="voice-hud-title">
                    {voiceEnabled
                      ? isListening
                        ? t('voice:voiceNavigatorListening', 'Voice Navigator: Listening…')
                        : t('voice:voiceNavigatorConnecting', 'Connecting Mic…')
                      : t('voice:voiceNavigatorPaused', 'Voice Navigator: Paused')}
                  </strong>
                  <span className="voice-hud-badge">{t('voice:talkToNavigate', 'Talk to Navigate')}</span>
                </div>
                <p className="voice-hud-transcript">
                  {transcript
                    ? t('voice:hearing', 'Hearing: “{{transcript}}”', { transcript })
                    : currentHint}
                </p>
              </div>
            </div>

            <div className="voice-hud-controls">
              <button
                type="button"
                className={`voice-hud-btn ${voiceEnabled ? 'btn-active' : 'btn-paused'}`}
                onClick={toggleMic}
                title={voiceEnabled ? t('voice:muteMic', 'Mute microphone') : t('voice:unmuteMic', 'Unmute microphone')}
                aria-label={voiceEnabled ? t('voice:muteMic', 'Mute microphone') : t('voice:unmuteMic', 'Unmute microphone')}
              >
                {voiceEnabled ? t('voice:muteShort', 'Mute Mic') : t('voice:unmuteShort', 'Unmute')}
              </button>
              <button
                type="button"
                className="voice-hud-btn secondary"
                onClick={goHome}
                title={t('voice:exitVoice', 'Exit Voice')}
                aria-label={t('voice:exitVoice', 'Exit Voice')}
              >
                {t('voice:exitVoice', 'Exit Voice')}
              </button>
            </div>
          </div>

          {feedback && <div className="voice-hud-toast" role="status">{feedback}</div>}
          {error && <div className="voice-hud-error" role="alert">{error}</div>}
        </aside>
      )}
    </VoiceControlContext.Provider>
  )
}
