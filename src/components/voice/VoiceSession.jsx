import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigation } from '../../context/NavigationContext'
import { useCitizen } from '../../context/CitizenContext'
import { useOneKeyNav } from '../common/OneKeyNavProvider'
import { matchSchemes } from '../schemes/matchEngine'
import { generateApplicationPDF } from '../application/generateApplicationPDF'
import { parseVoiceCommand } from './parseVoiceIntent'
import { useSpeechRecognition } from './useSpeechRecognition'
import { useTextToSpeech } from './useTextToSpeech'
import { VoiceControlContext } from './VoiceContext'

const SCREEN_HINTS = {
  home: 'Say “explore schemes”, “voice mode”, or “emergency”',
  voice: 'Say “explore schemes”, “emergency”, or “go home”',
  scanner: 'Say “capture”, “upload”, “find scheme”, or “go home”',
  confirm: 'Say “find scheme”, “rescan”, or “go home”',
  schemes: 'Say “choose scheme 1”, “choose scheme 2”, or “go back”',
  application: 'Say “save pdf”, “back to schemes”, or “go home”',
  submitted: 'Say “save pdf”, “download pdf”, or “go home”',
  emergency: 'Say “go home” or “go back”',
}

export function VoiceSessionProvider({ children }) {
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
      speak('Voice assistant ready. Say explore schemes to scan your document, or say find schemes.')
    } else if (currentScreen === 'scanner') {
      speak('Document scanner ready. Position your document. Say find scheme when ready.')
    } else if (currentScreen === 'confirm') {
      const name = citizenData.name ? `for ${citizenData.name}` : ''
      speak(`Check your details ${name}. Say find scheme to see your welfare schemes, or rescan.`)
    } else if (currentScreen === 'schemes') {
      const count = matchedSchemes.length
      if (count > 0) {
        const first = matchedSchemes[0]?.name || 'the first scheme'
        speak(`${count} matching schemes found. Say choose scheme 1 for ${first}, or choose scheme 2.`)
      } else {
        speak('No matching schemes found. Say rescan or go back.')
      }
    } else if (currentScreen === 'application') {
      const schemeName = selectedScheme?.name || matchedSchemes[0]?.name || 'scheme'
      speak(`Application review for ${schemeName}. Say save pdf to generate your application.`)
    } else if (currentScreen === 'submitted') {
      speak('Application completed. Say save pdf to download your file.')
    }
  }, [currentScreen, inVoiceMode, citizenData.name, matchedSchemes, selectedScheme, speak, stopTts])

  const executeVoiceCommand = useCallback((cmd) => {
    if (!cmd || !cmd.intent) return
    const { intent, index, raw } = cmd
    showToast(`🎙️ Spoken: "${raw}"`)

    if (intent === 'emergency') {
      speak('Opening emergency help.')
      navigateTo('emergency', 'voice', 'Emergency help is available')
      return
    }

    if (intent === 'home') {
      stopTts()
      goHome()
      return
    }

    if (intent === 'back') {
      speak('Going back.')
      runBackAction()
      return
    }

    // Voice assistant / Home screen
    if (currentScreen === 'voice' || currentScreen === 'home') {
      if (intent === 'explore' || intent === 'find_schemes' || intent === 'capture' || intent === 'upload') {
        speak('Opening document scanner.')
        navigateTo('scanner', 'voice', 'Document scanner opened')
        return
      }
    }

    // Scanner screen
    if (currentScreen === 'scanner') {
      if (intent === 'find_schemes' || intent === 'proceed') {
        speak('Proceeding to confirm details.')
        runPrimaryAction()
        return
      }
      if (intent === 'capture') {
        speak('Capturing document.')
        runPrimaryAction()
        return
      }
      if (intent === 'rescan') {
        speak('Restarting document scanner.')
        runPrimaryAction()
        return
      }
    }

    // Confirm screen
    if (currentScreen === 'confirm') {
      if (intent === 'find_schemes' || intent === 'proceed') {
        const matches = matchSchemes(citizenData)
        setMatchedSchemes(matches)
        setSelectedScheme(matches[0] || null)
        speak('Finding matching schemes for your confirmed details.')
        navigateTo('schemes', 'voice', 'Eligible schemes are ready to explore')
        return
      }
      if (intent === 'rescan') {
        speak('Restarting document scanner.')
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
          speak(`Selected ${chosen.name}. Opening application review.`)
          navigateTo('application', 'voice', `Selected ${chosen.name}`)
          return
        }
      }
      if (intent === 'find_schemes' || intent === 'proceed') {
        if (matchedSchemes[0]) {
          setSelectedScheme(matchedSchemes[0])
          speak(`Selected ${matchedSchemes[0].name}. Opening application review.`)
          navigateTo('application', 'voice', `Selected ${matchedSchemes[0].name}`)
          return
        }
      }
      if (intent === 'rescan') {
        speak('Returning to scanner.')
        navigateTo('scanner', 'voice', 'Scanner reopened')
        return
      }
    }

    // Application review screen
    if (currentScreen === 'application') {
      if (intent === 'save_pdf' || intent === 'proceed' || intent === 'find_schemes') {
        speak('Application generated. Ready to download.')
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
        speak('Application PDF downloaded.')
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

  const currentHint = SCREEN_HINTS[currentScreen] || 'Say “go home” to return'

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
                    {voiceEnabled ? (isListening ? 'Voice Navigator: Listening…' : 'Connecting Mic…') : 'Voice Navigator: Paused'}
                  </strong>
                  <span className="voice-hud-badge">Talk to Navigate</span>
                </div>
                <p className="voice-hud-transcript">
                  {transcript ? `Hearing: "${transcript}"` : currentHint}
                </p>
              </div>
            </div>

            <div className="voice-hud-controls">
              <button
                type="button"
                className={`voice-hud-btn ${voiceEnabled ? 'btn-active' : 'btn-paused'}`}
                onClick={toggleMic}
                title={voiceEnabled ? 'Mute microphone' : 'Unmute microphone'}
                aria-label={voiceEnabled ? 'Mute microphone' : 'Unmute microphone'}
              >
                {voiceEnabled ? 'Mute Mic' : 'Unmute'}
              </button>
              <button
                type="button"
                className="voice-hud-btn secondary"
                onClick={goHome}
                title="Exit Voice Mode"
                aria-label="Exit Voice Mode"
              >
                Exit Voice
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
