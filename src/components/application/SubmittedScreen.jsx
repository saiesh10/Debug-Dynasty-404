import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCitizen } from '../../context/CitizenContext'
import { useNavigation } from '../../context/NavigationContext'
import { usePrimaryAction } from '../common/OneKeyNavProvider'
import { generateApplicationPDF } from './generateApplicationPDF'

function SubmittedScreen() {
  const { t } = useTranslation(['application', 'common'])
  const { citizenData, selectedScheme, matchedSchemes } = useCitizen()
  const { navigateTo, entryMode } = useNavigation()
  const inVoiceMode = entryMode === 'voice'
  const scheme = selectedScheme || matchedSchemes[0]
  const [downloadStarted, setDownloadStarted] = useState(false)

  const downloadPdf = useCallback(() => {
    if (downloadStarted) return
    setDownloadStarted(true)
    const doc = generateApplicationPDF(citizenData, scheme)
    doc.save('application.pdf')
  }, [citizenData, downloadStarted, scheme])

  usePrimaryAction(downloadPdf)

  return (
    <section className="workspace-panel success-panel">
      <span className="success-mark" aria-hidden="true">✓</span>
      <span className="eyebrow">{t('application:submitted.eyebrow', 'Application ready')}</span>
      <h2>{t('application:submitted.title', 'Your completed application is ready')}</h2>
      <p className="lead">
        {t(
          'application:submitted.lead',
          'This demo creates a downloadable application. A production version would submit it directly to the scheme portal.',
        )}
        {inVoiceMode && t('application:submitted.voiceLead', ' Speak “save pdf” or “download pdf” to save.')}
      </p>
      <div className="action-row">
        <button className="primary-button" type="button" onClick={downloadPdf} disabled={downloadStarted}>
          {downloadStarted
            ? t('application:submitted.downloadStarted', 'PDF download started')
            : t('application:submitted.downloadBtn', 'Download application PDF')}
        </button>
        <button className="secondary-button" type="button" onClick={() => navigateTo('schemes')}>
          {t('application:submitted.backBtn', 'Back to schemes')}
        </button>
      </div>
    </section>
  )
}

export default SubmittedScreen
