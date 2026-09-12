import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useCitizen } from '../../context/CitizenContext'
import { useNavigation } from '../../context/NavigationContext'
import { matchSchemes } from '../schemes/matchEngine'
import { usePrimaryAction } from '../common/OneKeyNavProvider'

function ConfirmDetailsScreen() {
  const { t } = useTranslation(['scanner', 'common'])
  const { citizenData, updateCitizenData, setMatchedSchemes, setSelectedScheme } = useCitizen()
  const { navigateTo, entryMode } = useNavigation()
  const inVoiceMode = entryMode === 'voice'

  const doc = citizenData.documentType
  const idLabel = doc?.idLabel || t('scanner:confirmScreen.idNumber', 'ID number')
  const idPlaceholder = doc?.idPlaceholder || t('scanner:confirmScreen.idNumber', 'Document ID number')

  const showSchemes = useCallback(() => {
    if (!citizenData.name && !citizenData.idNumber) {
      navigateTo('scanner', null, 'Please scan an identity document first.')
      return
    }
    const matches = matchSchemes(citizenData)
    setMatchedSchemes(matches)
    setSelectedScheme(matches[0] || null)
    navigateTo('schemes', null, 'Eligible schemes are ready to explore')
  }, [citizenData, navigateTo, setMatchedSchemes, setSelectedScheme])

  usePrimaryAction(showSchemes)

  return (
    <section className="workspace-panel">
      <span className="eyebrow">{t('scanner:confirmScreen.eyebrow', 'Step 2 of 3 · Confirm details')}</span>
      <h2>{t('scanner:confirmScreen.title', 'Check the extracted details')}</h2>
      <p className="lead">
        {t('scanner:confirmScreen.lead', 'Please correct anything that does not look right before continuing.')}
        {inVoiceMode && t('scanner:confirmScreen.voiceLead', ' Speak “find schemes” to continue or “rescan” to retake.')}
      </p>

      {doc && (
        <div className="doc-type-card" role="status" aria-label={`Document recognized as ${doc.name}`}>
          <span className="doc-type-icon">{doc.icon || '🪪'}</span>
          <div className="doc-type-info">
            <span className="doc-type-tag">{t('scanner:confirmScreen.recognizedDoc', 'Recognized Document')}</span>
            <strong>{doc.name}</strong>
            <small>{doc.label}</small>
          </div>
        </div>
      )}

      <div className="field-grid">
        <label>
          {t('scanner:confirmScreen.fullName', 'Full Name')}
          <input
            id="field-name"
            placeholder="e.g. Ramesh Kumar"
            value={citizenData.name || ''}
            onChange={(event) => updateCitizenData({ name: event.target.value })}
          />
        </label>

        <label>
          {idLabel}
          <input
            id="field-id"
            placeholder={idPlaceholder}
            value={citizenData.idNumber || ''}
            onChange={(event) => updateCitizenData({ idNumber: event.target.value })}
          />
        </label>

        <label>
          {t('scanner:confirmScreen.dob', 'Date of Birth')}
          {citizenData.dateOfBirth?.includes('Approx') && (
            <small className="field-hint" style={{ color: '#087f77' }}>
              {t('scanner:confirmScreen.approxAgeHint', 'Approximate age from Voter ID')}
            </small>
          )}
          <input
            id="field-dob"
            placeholder="DD/MM/YYYY"
            value={citizenData.dateOfBirth || ''}
            onChange={(event) => updateCitizenData({ dateOfBirth: event.target.value })}
          />
        </label>

        <label>
          {t('scanner:confirmScreen.address', 'Address')}
          {doc?.id === 'pan' ? (
            <small className="field-hint" style={{ color: '#607482' }}>
              {t('scanner:confirmScreen.panAddressHint', 'Not printed on standard PAN cards (not required)')}
            </small>
          ) : null}
          <input
            id="field-address"
            placeholder={doc?.id === 'pan' ? 'Not applicable on PAN card (optional)' : 'House, Street, City, State, PIN'}
            value={citizenData.address || ''}
            onChange={(event) => updateCitizenData({ address: event.target.value })}
          />
        </label>
      </div>
      <div className="action-row">
        <button className="primary-button" type="button" onClick={showSchemes}>
          {t('scanner:confirmScreen.findSchemes', 'Find my schemes')}
        </button>
        <button className="secondary-button" type="button" onClick={() => navigateTo('scanner')}>
          {t('scanner:confirmScreen.rescan', 'Rescan')}
        </button>
      </div>
    </section>
  )
}

export default ConfirmDetailsScreen
