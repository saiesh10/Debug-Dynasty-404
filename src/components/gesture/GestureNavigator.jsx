import { useCallback, useRef, useState } from 'react'
import { useNavigation } from '../../context/NavigationContext'
import { usePrimaryAction } from '../common/OneKeyNavProvider'
import GestureCamera from './GestureCamera'

const GESTURE_COOLDOWN_MS = 1600

function GestureNavigator() {
  const { navigateTo, goHome } = useNavigation()
  const lastActionAt = useRef(0)
  const [cameraError, setCameraError] = useState(null)
  const [buttonFallback, setButtonFallback] = useState(false)

  const applyGesture = useCallback((gesture) => {
    const now = Date.now()
    if (now - lastActionAt.current < GESTURE_COOLDOWN_MS) return

    if (!gesture) return

    lastActionAt.current = now

    if (gesture === 'open_palm') {
      // Open palm explores schemes by opening the real scanner, not a fake button flow.
      navigateTo('scanner', 'gesture', 'Document scanner opened')
      return
    }
    if (gesture === 'fist') {
      goHome()
      return
    }
    if (gesture === 'point') {
      navigateTo('emergency', 'gesture', 'Emergency help is available')
    }
  }, [goHome, navigateTo])

  const openScanner = useCallback(() => {
    navigateTo('scanner', 'gesture', 'Document scanner opened')
  }, [navigateTo])

  usePrimaryAction(openScanner)

  // TODO: Gesture accuracy drops in low light, motion blur, and partial hands. Prefer button fallback when detection misses repeatedly.
  const showFallback = buttonFallback || Boolean(cameraError)

  return (
    <section className="workspace-panel">
      <span className="eyebrow">Gesture navigation</span>
      <h2>Show a gesture to begin</h2>
      <p className="lead">Open palm opens the document scanner. A fist goes home. Pointing a finger opens emergency help.</p>
      {!showFallback && (
        <GestureCamera onGesture={applyGesture} onCameraError={setCameraError} />
      )}
      {showFallback && (
        <p className="error-banner">
          {cameraError || 'Hand detection is not reliable right now. Use the buttons below.'}
        </p>
      )}
      <div className="action-row">
        <button className="primary-button" type="button" onClick={openScanner}>Open scanner</button>
        <button className="secondary-button" type="button" onClick={() => setButtonFallback(true)}>
          Switch to button navigation
        </button>
        <button className="secondary-button" type="button" onClick={goHome}>Change mode</button>
      </div>
    </section>
  )
}

export default GestureNavigator
