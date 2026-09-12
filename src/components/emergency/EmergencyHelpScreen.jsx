import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useCitizen } from '../../context/CitizenContext'
import { useNavigation } from '../../context/NavigationContext'
import { usePrimaryAction } from '../common/OneKeyNavProvider'
import { useTextToSpeech } from '../voice/useTextToSpeech'

function EmergencyHelpScreen() {
  const { t } = useTranslation(['emergency', 'common'])
  const { goHome } = useNavigation()
  const { clearCitizenData } = useCitizen()
  const { speak, stop } = useTextToSpeech()

  useEffect(() => {
    const message = t(
      'emergency:spoken',
      'Support is available. For urgent disability rehabilitation support, call the Kiran national helpline at 1 8 0 0 5 9 9 0 0 1 9 or ALIMCO at 1 8 0 0 1 8 0 5 1 2 9, or dial 1 1 2 for emergency.',
    )
    speak(message)
    return () => stop()
  }, [speak, stop, t])

  usePrimaryAction(goHome)

  return (
    <section className="workspace-panel emergency-panel">
      <span className="eyebrow">{t('emergency:eyebrow', 'Immediate help')}</span>
      <h2>{t('emergency:title', 'Support is available')}</h2>
      <p className="lead">
        {t(
          'emergency:lead',
          'For urgent disability rehabilitation & mental health support, contact the 24×7 national toll-free helpline.',
        )}
      </p>

      <div className="helpline-primary-card">
        <span className="helpline-tag">{t('emergency:kiranTag', '24×7 National Toll-Free (DEPwD)')}</span>
        <a className="helpline" href="tel:18005990019" aria-label="Call Kiran Helpline at 1800-599-0019">
          1800-599-0019
        </a>
        <p className="helpline-desc">
          <strong>KIRAN Helpline</strong> · {t('emergency:kiranDesc', 'National Mental Health & Disability Rehabilitation Helpline (Govt of India)')}
        </p>
      </div>

      <div className="contact-grid">
        <a className="contact-card" href="tel:18001805129">
          <strong>1800-180-5129</strong>
          <span>{t('emergency:contacts.alimco', 'ALIMCO / ADIP Assistive Devices Toll-Free')}</span>
        </a>
        <a className="contact-card" href="tel:112">
          <strong>112</strong>
          <span>{t('emergency:contacts.emergency112', 'National Emergency (Ambulance, Police, Fire)')}</span>
        </a>
        <a className="contact-card" href="tel:1800112001">
          <strong>1800-11-2001</strong>
          <span>{t('emergency:contacts.depwd', 'DEPwD Disability Welfare Helpdesk')}</span>
        </a>
        <a className="contact-card" href="tel:14567">
          <strong>14567</strong>
          <span>{t('emergency:contacts.elderline', 'Elderline (Senior Citizens Disability & Care)')}</span>
        </a>
        <a className="contact-card" href="tel:14416">
          <strong>14416</strong>
          <span>{t('emergency:contacts.telemanas', 'Tele-MANAS (24×7 Tele-Mental Health)')}</span>
        </a>
        <a className="contact-card" href="tel:181">
          <strong>181</strong>
          <span>{t('emergency:contacts.women', 'Women in Distress Helpline')}</span>
        </a>
        <a className="contact-card" href="tel:1098">
          <strong>1098</strong>
          <span>{t('emergency:contacts.childline', 'Childline (Child Disability & Care)')}</span>
        </a>
      </div>

      <div className="action-row">
        <button className="secondary-button" type="button" onClick={goHome}>
          {t('emergency:returnHome', 'Return home')}
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={() => {
            clearCitizenData()
            goHome()
          }}
        >
          {t('emergency:clearData', 'Clear my data')}
        </button>
      </div>
    </section>
  )
}

export default EmergencyHelpScreen
