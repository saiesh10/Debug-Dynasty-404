import { useCallback } from 'react'
import { useNavigation } from '../../context/NavigationContext'
import { usePrimaryAction } from '../common/OneKeyNavProvider'
import GestureCamera from './GestureCamera'
import { useGestureControl } from './GestureSession'

function GestureNavigator() {
  const { goHome, navigateTo } = useNavigation()
  const { applyGesture, guideOpen, buttonsOnly, setButtonsOnly } = useGestureControl()

  const openScanner = useCallback(() => {
    navigateTo('scanner', 'gesture', 'Peace sign recognized — opening scanner')
  }, [navigateTo])

  usePrimaryAction(openScanner)

  return (
    <section className="workspace-panel">
      <span className="eyebrow">Gesture navigation</span>
      <h2>Use the five gestures, or open the guide</h2>
      <p className="lead">
        Hold a pose steadily. Peace sign opens the document scanner. Open the “How gestures work” guide anytime if you need a reminder.
      </p>
      {!buttonsOnly && (
        <GestureCamera paused={guideOpen} onGesture={applyGesture} onFallback={() => setButtonsOnly(true)} />
      )}
      {buttonsOnly && (
        <p className="error-banner">
          Button navigation is on. Use Open scanner below, or try the camera again.
        </p>
      )}
      <div className="action-row">
        <button className="primary-button" type="button" onClick={openScanner}>Open scanner</button>
        {buttonsOnly ? (
          <button className="secondary-button" type="button" onClick={() => setButtonsOnly(false)}>
            Try camera again
          </button>
        ) : (
          <button className="secondary-button" type="button" onClick={() => setButtonsOnly(true)}>
            Switch to button navigation
          </button>
        )}
        <button className="secondary-button" type="button" onClick={goHome}>Change mode</button>
      </div>
    </section>
  )
}

export default GestureNavigator
