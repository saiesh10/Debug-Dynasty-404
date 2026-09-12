import { useCallback } from 'react'
import { useCitizen } from '../../context/CitizenContext'
import { useNavigation } from '../../context/NavigationContext'
import { matchSchemes } from '../schemes/matchEngine'
import { usePrimaryAction } from '../common/OneKeyNavProvider'

const FIELDS = [
  ['name', 'Full name'],
  ['dateOfBirth', 'Date of birth'],
  ['idNumber', 'ID number'],
  ['address', 'Address'],
]

function ConfirmDetailsScreen() {
  const { citizenData, updateCitizenData, setMatchedSchemes, setSelectedScheme } = useCitizen()
  const { navigateTo } = useNavigation()

  const doc = citizenData.documentType
  const idLabel = doc?.idLabel || 'ID number'
  const idPlaceholder = doc?.idPlaceholder || 'Document ID number'

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
      <span className="eyebrow">Step 2 of 3 · Confirm details</span>
      <h2>Check the extracted details</h2>
      <p className="lead">Please correct anything that does not look right before continuing.</p>

      {doc && (
        <div className="doc-type-card" role="status" aria-label={`Document recognized as ${doc.name}`}>
          <span className="doc-type-icon">{doc.icon || '🪪'}</span>
          <div className="doc-type-info">
            <span className="doc-type-tag">Recognized Document</span>
            <strong>{doc.name}</strong>
            <small>{doc.label}</small>
          </div>
        </div>
      )}

      <div className="field-grid">
        <label>
          Full Name
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
          Date of Birth
          <input
            id="field-dob"
            placeholder="DD/MM/YYYY"
            value={citizenData.dateOfBirth || ''}
            onChange={(event) => updateCitizenData({ dateOfBirth: event.target.value })}
          />
        </label>

        <label>
          Address
          {doc?.id === 'pan' && !citizenData.address && (
            <small className="field-hint">Note: Address is not printed on standard PAN cards</small>
          )}
          <input
            id="field-address"
            placeholder="House, Street, City, State, PIN"
            value={citizenData.address || ''}
            onChange={(event) => updateCitizenData({ address: event.target.value })}
          />
        </label>
      </div>
      <div className="action-row">
        <button className="primary-button" type="button" onClick={showSchemes}>Find my schemes</button>
        <button className="secondary-button" type="button" onClick={() => navigateTo('scanner')}>Rescan</button>
      </div>
    </section>
  )
}

export default ConfirmDetailsScreen
