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

  const showSchemes = useCallback(() => {
    if (!citizenData.name && !citizenData.idNumber) {
      navigateTo('scanner', 'scanner', 'Please scan an identity document first.')
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
      <div className="field-grid">
        {FIELDS.map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              value={citizenData[key]}
              onChange={(event) => updateCitizenData({ [key]: event.target.value })}
            />
          </label>
        ))}
      </div>
      <div className="action-row">
        <button className="primary-button" type="button" onClick={showSchemes}>Find my schemes</button>
        <button className="secondary-button" type="button" onClick={() => navigateTo('scanner')}>Rescan</button>
      </div>
    </section>
  )
}

export default ConfirmDetailsScreen
