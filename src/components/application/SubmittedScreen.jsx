import { useCallback } from 'react'
import { useCitizen } from '../../context/CitizenContext'
import { useNavigation } from '../../context/NavigationContext'
import { usePrimaryAction } from '../common/OneKeyNavProvider'
import { generateApplicationPDF } from './generateApplicationPDF'

function SubmittedScreen() {
  const { citizenData, selectedScheme, matchedSchemes } = useCitizen()
  const { navigateTo } = useNavigation()
  const scheme = selectedScheme || matchedSchemes[0]

  const downloadPdf = useCallback(() => {
    const doc = generateApplicationPDF(citizenData, scheme)
    doc.save('application.pdf')
  }, [citizenData, scheme])

  usePrimaryAction(downloadPdf)

  return (
    <section className="workspace-panel success-panel">
      <span className="success-mark" aria-hidden="true">✓</span>
      <span className="eyebrow">Application ready</span>
      <h2>Your completed application is ready</h2>
      <p className="lead">This demo creates a downloadable application. A production version would submit it directly to the scheme portal.</p>
      <div className="action-row">
        <button className="primary-button" type="button" onClick={downloadPdf}>Download application PDF</button>
        <button className="secondary-button" type="button" onClick={() => navigateTo('schemes')}>Back to schemes</button>
      </div>
    </section>
  )
}

export default SubmittedScreen
