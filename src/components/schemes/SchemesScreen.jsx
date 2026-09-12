import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useCitizen } from '../../context/CitizenContext'
import { useNavigation } from '../../context/NavigationContext'
import { usePrimaryAction } from '../common/OneKeyNavProvider'

export function getLocalizedField(field, lang) {
  if (!field) return ''
  if (typeof field === 'string') return field
  const langKey = lang ? lang.split('-')[0] : 'en'
  return field[langKey] || field.en || Object.values(field)[0] || ''
}

function SchemesScreen() {
  const { t, i18n } = useTranslation(['schemes', 'common'])
  const { matchedSchemes, setSelectedScheme } = useCitizen()
  const { navigateTo, entryMode } = useNavigation()
  const inVoiceMode = entryMode === 'voice'
  const currentLang = i18n.language || 'en'

  const startFirst = useCallback(() => {
    if (!matchedSchemes[0]) return
    setSelectedScheme(matchedSchemes[0])
    navigateTo('application')
  }, [matchedSchemes, navigateTo, setSelectedScheme])

  usePrimaryAction(startFirst)

  const handleSelectScheme = (scheme) => {
    setSelectedScheme(scheme)
    navigateTo('application')
  }

  return (
    <section className="workspace-panel wide-panel">
      <span className="eyebrow">{t('schemes:eyebrow', 'Step 3 of 3 · Matched support')}</span>
      <h2>{t('schemes:title', 'Support that may be right for you')}</h2>
      <p className="lead">
        {t('schemes:lead', 'Based on the details you confirmed, {{count}} schemes are ready to review.', {
          count: matchedSchemes.length,
        })}
        {inVoiceMode && t('schemes:voiceLead', ' Speak “choose scheme 1” or “choose scheme 2” to select a scheme.')}
      </p>
      {matchedSchemes.length === 0 ? (
        <p className="lead">
          {t('schemes:noneMatched', 'No schemes matched these details. You can rescan or edit the confirmed fields.')}
        </p>
      ) : (
        <div className="scheme-list">
          {matchedSchemes.map((scheme, index) => {
            const schemeNumber = index + 1
            const name = getLocalizedField(scheme.name, currentLang)
            const officialName = getLocalizedField(scheme.officialName, currentLang)
            const detail = getLocalizedField(scheme.detail, currentLang)

            return (
              <article className="scheme-card" key={scheme.id || (typeof scheme.name === 'string' ? scheme.name : scheme.id)}>
                <div>
                  <div className="scheme-header-row">
                    <span className="scheme-tag">
                      {t('schemes:card.schemeTag', 'Scheme #{{number}} · Official Govt Scheme', {
                        number: schemeNumber,
                      })}
                    </span>
                    {inVoiceMode && (
                      <span className="voice-badge-pill">
                        {t('schemes:card.voicePill', '🗣️ Say “Choose scheme {{number}}”', {
                          number: schemeNumber,
                        })}
                      </span>
                    )}
                    {scheme.ministry && <small className="scheme-ministry">{scheme.ministry}</small>}
                  </div>
                  <h3>{name}</h3>
                  {officialName && officialName !== name && (
                    <p className="scheme-official-name">
                      <em>{officialName}</em>
                    </p>
                  )}
                  <p>{detail}</p>
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
                      {t('schemes:card.officialPortal', 'Official Portal ↗')}
                    </a>
                  )}
                </div>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => handleSelectScheme(scheme)}
                >
                  {t('schemes:card.applyBtn', 'Apply for Scheme #{{number}} ({{name}}) →', {
                    number: schemeNumber,
                    name,
                  })}
                </button>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default SchemesScreen
