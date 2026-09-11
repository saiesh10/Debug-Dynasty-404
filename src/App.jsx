import { lazy, Suspense } from 'react'
import { NavigationProvider, useNavigation } from './context/NavigationContext'
import { CitizenProvider, useCitizen } from './context/CitizenContext'
import ScreenReaderAnnouncer from './components/common/ScreenReaderAnnouncer'
import { OneKeyNavProvider } from './components/common/OneKeyNavProvider'
import ModePicker from './components/mode-picker/ModePicker'
import ConfirmDetailsScreen from './components/confirm/ConfirmDetailsScreen'
import SchemesScreen from './components/schemes/SchemesScreen'
import ApplicationReviewScreen from './components/application/ApplicationReviewScreen'
import EmergencyHelpScreen from './components/emergency/EmergencyHelpScreen'
import './App.css'

const DocumentScanner = lazy(() => import('./components/scanner/DocumentScanner'))
const VoiceAssistant = lazy(() => import('./components/voice/VoiceAssistant'))
const GestureNavigator = lazy(() => import('./components/gesture/GestureNavigator'))
const SubmittedScreen = lazy(() => import('./components/application/SubmittedScreen'))

function AppContent() {
  const { currentScreen, announcement, navigateTo, goHome } = useNavigation()
  const { clearCitizenData } = useCitizen()

  const screens = {
    home: <ModePicker />,
    gesture: <GestureNavigator />,
    voice: <VoiceAssistant />,
    scanner: <DocumentScanner />,
    confirm: <ConfirmDetailsScreen />,
    schemes: <SchemesScreen />,
    application: <ApplicationReviewScreen />,
    submitted: <SubmittedScreen />,
    emergency: <EmergencyHelpScreen />,
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" type="button" onClick={goHome}>
          <span className="brand-mark" aria-hidden="true">DS</span>
          <span>Divyang<span>Setu</span></span>
        </button>
        <button className="emergency-button" type="button" onClick={() => navigateTo('emergency')}>
          Emergency help
        </button>
      </header>
      <main className="app-main">
        <div className="status-line">
          <span>Private by design · runs on your device</span>
          {currentScreen !== 'home' && <button type="button" onClick={goHome}>Home</button>}
        </div>
        <Suspense fallback={<section className="workspace-panel"><p className="lead">Loading…</p></section>}>
          {screens[currentScreen] || <ModePicker />}
        </Suspense>
      </main>
      <footer>
        <span>Designed for dignity, access, and clarity.</span>
        <span className="footer-actions">
          <button type="button" onClick={clearCitizenData}>Clear my data</button>
          <button type="button" onClick={() => navigateTo('emergency')}>Need help?</button>
        </span>
      </footer>
      <ScreenReaderAnnouncer message={announcement} />
    </div>
  )
}

function App() {
  return (
    <NavigationProvider>
      <CitizenProvider>
        <OneKeyNavProvider>
          <AppContent />
        </OneKeyNavProvider>
      </CitizenProvider>
    </NavigationProvider>
  )
}

export default App
