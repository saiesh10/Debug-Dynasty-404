import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useCitizen } from '../../context/CitizenContext'
import { useNavigation } from '../../context/NavigationContext'
import { usePrimaryAction } from '../common/OneKeyNavProvider'

function ModePicker() {
  const { t } = useTranslation('common')
  const { navigateTo, entryMode } = useNavigation()
  const { clearCitizenData } = useCitizen()

  const openScanner = useCallback(() => {
    navigateTo('scanner', entryMode || 'scanner')
  }, [entryMode, navigateTo])

  usePrimaryAction(openScanner)

  return (
    <section className="mode-picker">
      <span className="eyebrow">{t('eyebrow', 'Your access, your choice')}</span>
      <h1>{t('tagline', 'Public support should feel within reach.')}</h1>
      <p className="intro">
        {t(
          'intro',
          'DivyangSetu helps you discover disability welfare schemes through the way that feels most comfortable to you. Your identity details stay on this device.',
        )}
      </p>
      <div className="mode-grid">
        <button type="button" onClick={() => navigateTo('gesture', 'gesture')} className="mode-card">
          <span className="mode-icon" aria-hidden="true">✋</span>
          <span>
            <h2>{t('modePicker.gestureTitle', 'Gesture')}</h2>
            <p>{t('modePicker.gestureDesc', 'Five poses. A guide explains each one the first time you enter.')}</p>
          </span>
        </button>
        <button type="button" onClick={() => navigateTo('voice', 'voice')} className="mode-card">
          <span className="mode-icon" aria-hidden="true">🎙️</span>
          <span>
            <h2>{t('modePicker.voiceTitle', 'Voice')}</h2>
            <p>{t('modePicker.voiceDesc', 'Speak commands to navigate.')}</p>
          </span>
        </button>
        <button type="button" onClick={openScanner} className="mode-card">
          <span className="mode-icon" aria-hidden="true">📷</span>
          <span>
            <h2>{t('modePicker.scannerTitle', 'Scanner')}</h2>
            <p>{t('modePicker.scannerDesc', 'Scan a document for details.')}</p>
          </span>
        </button>
      </div>
      <div className="action-row">
        <button className="secondary-button" type="button" onClick={clearCitizenData}>
          {t('nav.clearData', 'Clear my data')}
        </button>
      </div>
    </section>
  )
}

export default ModePicker
