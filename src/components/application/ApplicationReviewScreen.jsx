import { useCallback } from 'react'
import { useCitizen } from '../../context/CitizenContext'
import { useNavigation } from '../../context/NavigationContext'
import { usePrimaryAction } from '../common/OneKeyNavProvider'

function ApplicationReviewScreen() {
  const { citizenData, selectedScheme, matchedSchemes } = useCitizen()
  const { navigateTo } = useNavigation()
  const scheme = selectedScheme || matchedSchemes[0]

  const createPdf = useCallback(() => {
    navigateTo('submitted', null, 'Your application is ready to download')
  }, [navigateTo])

  usePrimaryAction(createPdf)

  return (
    <section className="workspace-panel">
      <span className="eyebrow">Application review</span>
      <h2>Ready to create your application?</h2>
      <p className="lead">We will generate a completed PDF for your records. Nothing is submitted to a government portal in this demo.</p>
      <div className="summary-box">
        <strong>{scheme?.name || 'Disability support'}</strong>
        <span>{citizenData.name}</span>
        <span>{citizenData.address}</span>
      </div>
      <div className="action-row">
        <button className="primary-button" type="button" onClick={createPdf}>Create application PDF</button>
        <button className="secondary-button" type="button" onClick={() => navigateTo('schemes')}>Back to schemes</button>
      </div>
    </section>
  )
}

export default ApplicationReviewScreen
