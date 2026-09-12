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
                <div className="scheme-header-row">
                  <span className="scheme-tag">Official Govt Scheme</span>
                  {scheme.ministry && <small className="scheme-ministry">{scheme.ministry}</small>}
                </div>
                <h3>{scheme.name}</h3>
                {scheme.officialName && scheme.officialName !== scheme.name && (
                  <p className="scheme-official-name"><em>{scheme.officialName}</em></p>
                )}
                <p>{scheme.detail}</p>
              </div>
              <div className="scheme-meta">
                <strong className="scheme-amount">{scheme.amount}</strong>
                {scheme.portalUrl && (
                  <a
                    className="portal-link"
                    href={scheme.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open official government portal"
                  >
                    Official Portal ↗
                  </a>
                )}
              </div>
              <button
                className="text-button"
                type="button"
                onClick={() => {
                  setSelectedScheme(scheme)
                  navigateTo('application')
                }}
              >
                Apply for this scheme <span aria-hidden="true">→</span>
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default SchemesScreen
