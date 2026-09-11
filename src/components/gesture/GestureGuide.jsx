import { GESTURE_CATALOG } from './gestureCatalog'
import { usePrimaryAction } from '../common/OneKeyNavProvider'

function GestureGuide({ onClose }) {
  usePrimaryAction(onClose)

  return (
    <div className="guide-backdrop" role="presentation">
      <div
        className="workspace-panel guide-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gesture-guide-title"
      >
        <span className="eyebrow">How gestures work</span>
        <h2 id="gesture-guide-title">Five gestures you can use</h2>
        <p className="lead">Hold a pose steadily in front of the camera. Ambiguous movement is ignored on purpose.</p>
        <ul className="scheme-list gesture-guide-list">
          {GESTURE_CATALOG.map((gesture) => (
            <li className="scheme-card" key={gesture.id}>
              <div>
                <span className="scheme-tag">{gesture.meaning}</span>
                <h3>
                  <span aria-hidden="true">{gesture.emoji} </span>
                  {gesture.name}
                </h3>
                <p>{gesture.action}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="action-row">
          <button className="primary-button" type="button" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  )
}

export default GestureGuide
