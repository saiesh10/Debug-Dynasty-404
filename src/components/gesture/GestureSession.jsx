import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { useNavigation } from '../../context/NavigationContext'
import { useOneKeyNav } from '../common/OneKeyNavProvider'
import GestureCamera from './GestureCamera'
import GestureGuide from './GestureGuide'
import { GESTURE_GUIDE_SEEN_KEY, gestureById } from './gestureCatalog'

const GESTURE_COOLDOWN_MS = 1600
const GestureControlContext = createContext(null)

function guideWasSeen() {
  if (typeof sessionStorage === 'undefined') return false
  return sessionStorage.getItem(GESTURE_GUIDE_SEEN_KEY) === '1'
}

export function GestureSessionProvider({ children }) {
  const { entryMode, currentScreen, navigateTo, goHome, setAnnouncement } = useNavigation()
  const { runPrimaryAction, runBackAction } = useOneKeyNav()
  const lastActionAt = useRef(0)
  const lastFiredRef = useRef(null)
  const [manualGuide, setManualGuide] = useState(false)
  const [seenTick, setSeenTick] = useState(0)
  const [buttonsOnly, setButtonsOnly] = useState(false)
  const [feedback, setFeedback] = useState('')

  const inGestureMode = entryMode === 'gesture'
  const seen = seenTick >= 0 && guideWasSeen()
  const guideOpen = inGestureMode && (manualGuide || !seen)

  const closeGuide = useCallback(() => {
    sessionStorage.setItem(GESTURE_GUIDE_SEEN_KEY, '1')
    setManualGuide(false)
    setSeenTick((tick) => tick + 1)
  }, [])

  const setGuideOpen = useCallback((open) => {
    if (open) {
      setManualGuide(true)
      return
    }
    sessionStorage.setItem(GESTURE_GUIDE_SEEN_KEY, '1')
    setManualGuide(false)
    setSeenTick((tick) => tick + 1)
  }, [])

  const announce = useCallback((gestureId) => {
    const text = gestureById(gestureId)?.feedback || 'Gesture recognized'
    setFeedback(text)
    setAnnouncement(text)
  }, [setAnnouncement])

  const applyGesture = useCallback((gesture) => {
    if (!inGestureMode || guideOpen || buttonsOnly) return
    const now = Date.now()
    if (now - lastActionAt.current < GESTURE_COOLDOWN_MS) return
    if (!gesture) {
      lastFiredRef.current = null
      return
    }
    if (gesture === lastFiredRef.current) return

    lastActionAt.current = now
    lastFiredRef.current = gesture

    if (gesture === 'open_palm') {
      announce(gesture)
      goHome()
      return
    }
    if (gesture === 'thumbs_up') {
      announce(gesture)
      runPrimaryAction()
      return
    }
    if (gesture === 'thumbs_down') {
      announce(gesture)
      runBackAction()
      return
    }
    if (gesture === 'peace_sign') {
      announce(gesture)
      navigateTo('scanner', 'gesture', gestureById(gesture).feedback)
      return
    }
    if (gesture === 'closed_fist') {
      announce(gesture)
      navigateTo('emergency', 'gesture', gestureById(gesture).feedback)
    }
  }, [announce, buttonsOnly, goHome, guideOpen, inGestureMode, navigateTo, runBackAction, runPrimaryAction])

  const value = useMemo(
    () => ({
      inGestureMode,
      guideOpen,
      setGuideOpen,
      closeGuide,
      buttonsOnly: inGestureMode && buttonsOnly,
      setButtonsOnly,
      applyGesture,
      feedback,
    }),
    [applyGesture, buttonsOnly, closeGuide, feedback, guideOpen, inGestureMode, setGuideOpen],
  )

  const showPip = inGestureMode && currentScreen !== 'gesture' && !buttonsOnly

  return (
    <GestureControlContext.Provider value={value}>
      {children}
      {showPip && (
        <GestureCamera compact paused={guideOpen} onGesture={applyGesture} onFallback={() => setButtonsOnly(true)} />
      )}
      {feedback && inGestureMode && <p className="gesture-toast" role="status">{feedback}</p>}
      {guideOpen && <GestureGuide onClose={closeGuide} />}
    </GestureControlContext.Provider>
  )
}

export function useGestureControl() {
  const context = useContext(GestureControlContext)
  if (!context) {
    throw new Error('useGestureControl must be used inside GestureSessionProvider')
  }
  return context
}
