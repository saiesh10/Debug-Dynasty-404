import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '../../context/NavigationContext'
import { usePrimaryAction } from '../common/OneKeyNavProvider'
import GestureCamera from './GestureCamera'
import { useGestureControl } from './GestureSession'

function GestureNavigator() {
  const { t } = useTranslation(['gesture', 'common'])
  const { goHome, navigateTo } = useNavigation()
  const { applyGesture, guideOpen, buttonsOnly, setButtonsOnly } = useGestureControl()

  const openScanner = useCallback(() => {
    navigateTo(
      'scanner',
      'gesture',
      t('poses.peace_sign.feedback', 'Peace sign recognized — opening scanner'),
    )
  }, [navigateTo, t])

  usePrimaryAction(openScanner)

  return (
    <section className="workspace-panel">
      <span className="eyebrow">{t('gesture:eyebrow', 'Gesture navigation')}</span>
      <h2>{t('gesture:title', 'Use the five gestures, or open the guide')}</h2>
      <p className="lead">
        {t(
          'gesture:lead',
          'Hold a pose steadily. Peace sign opens the document scanner. Open the “How gestures work” guide anytime if you need a reminder.',
        )}
      </p>
      {!buttonsOnly && (
        <GestureCamera paused={guideOpen} onGesture={applyGesture} onFallback={() => setButtonsOnly(true)} />
      )}
      {buttonsOnly && (
        <p className="error-banner">
          {t('gesture:buttonsOnlyNotice', 'Button navigation is on. Use Open scanner below, or try the camera again.')}
        </p>
      )}
      <div className="action-row">
        <button className="primary-button" type="button" onClick={openScanner}>
          {t('gesture:openScanner', 'Open scanner')}
        </button>
        {buttonsOnly ? (
          <button className="secondary-button" type="button" onClick={() => setButtonsOnly(false)}>
            {t('gesture:tryCameraAgain', 'Try camera again')}
          </button>
        ) : (
          <button className="secondary-button" type="button" onClick={() => setButtonsOnly(true)}>
            {t('gesture:switchToButtons', 'Switch to button navigation')}
          </button>
        )}
        <button className="secondary-button" type="button" onClick={goHome}>
          {t('common:nav.changeMode', 'Change mode')}
        </button>
      </div>
    </section>
  )
}

export default GestureNavigator
