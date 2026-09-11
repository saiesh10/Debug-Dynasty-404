import { useCallback } from 'react'
import { useCitizen } from '../../context/CitizenContext'
import { useNavigation } from '../../context/NavigationContext'
import { usePrimaryAction } from '../common/OneKeyNavProvider'

function ModePicker() {
  const { navigateTo, entryMode } = useNavigation()
  const { clearCitizenData } = useCitizen()

  const openScanner = useCallback(() => {
    navigateTo('scanner', entryMode || 'scanner')
  }, [entryMode, navigateTo])

  usePrimaryAction(openScanner)

  return (
    <section className="mode-picker">
      <span className="eyebrow">Your access, your choice</span>
      <h1>Public support should feel within reach.</h1>
      <p className="intro">DivyangSetu helps you discover disability welfare schemes through the way that feels most comfortable to you. Your identity details stay on this device.</p>
      <div className="mode-grid">
        <button type="button" onClick={() => navigateTo('gesture', 'gesture')} className="mode-card">
          <span className="mode-icon" aria-hidden="true">✋</span>
          <span>
            <h2>Gesture</h2>
            <p>Five poses. A guide explains each one the first time you enter.</p>
          </span>
        </button>
        <button type="button" onClick={() => navigateTo('voice', 'voice')} className="mode-card">
          <span className="mode-icon" aria-hidden="true">🎙️</span>
          <span>
            <h2>Voice</h2>
            <p>Speak commands to navigate.</p>
          </span>
        </button>
        <button type="button" onClick={openScanner} className="mode-card">
          <span className="mode-icon" aria-hidden="true">📷</span>
          <span>
            <h2>Scanner</h2>
            <p>Scan a document for details.</p>
          </span>
        </button>
      </div>
      <div className="action-row">
        <button className="secondary-button" type="button" onClick={clearCitizenData}>Clear my data</button>
      </div>
    </section>
  )
}

export default ModePicker
