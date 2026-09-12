import { useTranslation } from 'react-i18next'
import { GESTURE_CATALOG } from './gestureCatalog'
import { usePrimaryAction } from '../common/OneKeyNavProvider'

function GestureGuide({ onClose }) {
  const { t } = useTranslation('gesture')
  usePrimaryAction(onClose)

  return (
    <div className="guide-backdrop" role="presentation">
      <div
        className="workspace-panel guide-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gesture-guide-title"
      >
        <span className="eyebrow">{t('guide.eyebrow', 'How gestures work')}</span>
        <h2 id="gesture-guide-title">{t('guide.title', 'Five gestures you can use')}</h2>
        <p className="lead">
          {t(
            'guide.lead',
            'Hold a pose steadily in front of the camera. Ambiguous movement is ignored on purpose.',
          )}
        </p>
        <ul className="scheme-list gesture-guide-list">
          {GESTURE_CATALOG.map((gesture) => {
            const name = t(`poses.${gesture.id}.name`, gesture.name)
            const meaning = t(`poses.${gesture.id}.meaning`, gesture.meaning)
            const action = t(`poses.${gesture.id}.action`, gesture.action)

            return (
              <li className="scheme-card" key={gesture.id}>
                <div>
                  <span className="scheme-tag">{meaning}</span>
                  <h3>
                    <span aria-hidden="true">{gesture.emoji} </span>
                    {name}
                  </h3>
                  <p>{action}</p>
                </div>
              </li>
            )
          })}
        </ul>
        <div className="action-row">
          <button className="primary-button" type="button" onClick={onClose}>
            {t('guide.gotIt', 'Got it')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default GestureGuide
