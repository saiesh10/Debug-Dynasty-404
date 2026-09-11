import { useEffect } from 'react'
import { useCitizen } from '../../context/CitizenContext'
import { useNavigation } from '../../context/NavigationContext'
import { usePrimaryAction } from '../common/OneKeyNavProvider'
import { useTextToSpeech } from '../voice/useTextToSpeech'

const EMERGENCY_MESSAGE = 'Support is available. For urgent disability support, contact the national helpline at 1 8 0 0 2 3 3 5 9 5 6.'

function EmergencyHelpScreen() {
  const { goHome } = useNavigation()
  const { clearCitizenData } = useCitizen()
  const { speak, stop } = useTextToSpeech()

  useEffect(() => {
    speak(EMERGENCY_MESSAGE)
    return () => stop()
  }, [speak, stop])

  usePrimaryAction(goHome)

  return (
    <section className="workspace-panel emergency-panel">
      <span className="eyebrow">Immediate help</span>
      <h2>Support is available</h2>
      <p className="lead">For urgent disability support, contact the national helpline.</p>
      <a className="helpline" href="tel:18002335956">1800-233-5956</a>
      <p>Available disability welfare helpline</p>
      <div className="contact-list">
        <span>112 · National emergency number</span>
        <span>181 · Women’s helpline</span>
        <span>1098 · Child helpline</span>
      </div>
      <div className="action-row">
        <button className="secondary-button" type="button" onClick={goHome}>Return home</button>
        <button className="secondary-button" type="button" onClick={() => {
          clearCitizenData()
          goHome()
        }}>Clear my data</button>
      </div>
    </section>
  )
}

export default EmergencyHelpScreen
