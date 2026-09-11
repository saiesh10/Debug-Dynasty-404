import { useCallback } from 'react'
import { useCitizen } from '../../context/CitizenContext'
import { useNavigation } from '../../context/NavigationContext'
import { usePrimaryAction } from '../common/OneKeyNavProvider'

function SchemesScreen() {
  const { matchedSchemes, setSelectedScheme } = useCitizen()
  const { navigateTo } = useNavigation()

  const startFirst = useCallback(() => {
    if (!matchedSchemes[0]) return
    setSelectedScheme(matchedSchemes[0])
    navigateTo('application')
  }, [matchedSchemes, navigateTo, setSelectedScheme])

  usePrimaryAction(startFirst)

  return (
    <section className="workspace-panel wide-panel">
      <span className="eyebrow">Step 3 of 3 · Matched support</span>
      <h2>Support that may be right for you</h2>
      <p className="lead">
        Based on the details you confirmed, {matchedSchemes.length} schemes are ready to review.
      </p>
      {matchedSchemes.length === 0 ? (
        <p className="lead">No schemes matched these details. You can rescan or edit the confirmed fields.</p>
      ) : (
        <div className="scheme-list">
          {matchedSchemes.map((scheme) => (
            <article className="scheme-card" key={scheme.id || scheme.name}>
              <div>
                <span className="scheme-tag">Likely eligible</span>
                <h3>{scheme.name}</h3>
                <p>{scheme.detail}</p>
              </div>
              <strong>{scheme.amount}</strong>
              <button
                className="text-button"
                type="button"
                onClick={() => {
                  setSelectedScheme(scheme)
                  navigateTo('application')
                }}
              >
                Start application <span aria-hidden="true">→</span>
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default SchemesScreen
