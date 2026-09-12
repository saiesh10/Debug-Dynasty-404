import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useCitizen } from '../../context/CitizenContext'
import { useNavigation } from '../../context/NavigationContext'
import { usePrimaryAction } from '../common/OneKeyNavProvider'
import { getLocalizedField } from '../schemes/SchemesScreen'

function ApplicationReviewScreen() {
  const { t, i18n } = useTranslation(['application', 'common'])
  const { citizenData, selectedScheme, matchedSchemes } = useCitizen()
  const { navigateTo, entryMode } = useNavigation()
  const inVoiceMode = entryMode === 'voice'
  const currentLang = i18n.language || 'en'
  const scheme = selectedScheme || matchedSchemes[0]
  const schemeName = scheme ? getLocalizedField(scheme.name, currentLang) : t('application:review.defaultSupport', 'Disability support')

  const createPdf = useCallback(() => {
    navigateTo('submitted', null, 'Your application is ready to download')
  }, [navigateTo])

  usePrimaryAction(createPdf)

  return (
    <section className="workspace-panel">
      <span className="eyebrow">{t('application:review.eyebrow', 'Application review')}</span>
      <h2>{t('application:review.title', 'Ready to create your application?')}</h2>
      <p className="lead">
        {t(
          'application:review.lead',
          'We will generate a completed PDF for your records. Nothing is submitted to a government portal in this demo.',
        )}
        {inVoiceMode && t('application:review.voiceLead', ' Speak “save pdf” or “create pdf” to continue.')}
      </p>
      <div className="summary-box">
        <strong>{schemeName}</strong>
        <span>{citizenData.name}</span>
        <span>{citizenData.address}</span>
      </div>
      <div className="action-row">
        <button className="primary-button" type="button" onClick={createPdf}>
          {t('application:review.createBtn', 'Create application PDF')}
        </button>
        <button className="secondary-button" type="button" onClick={() => navigateTo('schemes')}>
          {t('application:review.backBtn', 'Back to schemes')}
        </button>
      </div>
    </section>
  )
}

export default ApplicationReviewScreen
