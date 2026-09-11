import { lazy, Suspense } from 'react'
import { NavigationProvider, useNavigation } from './context/NavigationContext'
import { CitizenProvider, useCitizen } from './context/CitizenContext'
import { CameraProvider } from './context/CameraContext'
import ScreenReaderAnnouncer from './components/common/ScreenReaderAnnouncer'
import { OneKeyNavProvider } from './components/common/OneKeyNavProvider'
import ModePicker from './components/mode-picker/ModePicker'
import ConfirmDetailsScreen from './components/confirm/ConfirmDetailsScreen'
import SchemesScreen from './components/schemes/SchemesScreen'
import ApplicationReviewScreen from './components/application/ApplicationReviewScreen'
import EmergencyHelpScreen from './components/emergency/EmergencyHelpScreen'
import { GestureSessionProvider, useGestureControl } from './components/gesture/GestureSession'
import './App.css'

const DocumentScanner = lazy(() => import('./components/scanner/DocumentScanner'))
const VoiceAssistant = lazy(() => import('./components/voice/VoiceAssistant'))
const GestureNavigator = lazy(() => import('./components/gesture/GestureNavigator'))
const SubmittedScreen = lazy(() => import('./components/application/SubmittedScreen'))

function Topbar() {
  const { goHome, navigateTo } = useNavigation()
  const { inGestureMode, setGuideOpen } = useGestureControl()

  return (
    <header className="topbar">
      <button className="brand" type="button" onClick={goHome}>
        <span className="brand-mark" aria-hidden="true">DS</span>
        <span>Divyang<span>Setu</span></span>
      </button>
      <div className="topbar-actions">
        {inGestureMode && (
          <button
            className="emergency-button"
            type="button"
            onClick={() => setGuideOpen(true)}
            aria-label="How gestures work"
          >
            How gestures work
          </button>
        )}
        <button className="emergency-button" type="button" onClick={() => navigateTo('emergency')}>
          Emergency help
        </button>
      </div>
    </header>
  )
}

function AppContent() {
  const { currentScreen, announcement, navigateTo, goHome } = useNavigation()
  const { clearCitizenData } = useCitizen()

  const clearDataAndGoHome = () => {
    clearCitizenData()
    goHome()
  }

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
      <Topbar />
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
          <button type="button" onClick={clearDataAndGoHome}>Clear my data</button>
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
        <CameraProvider>
          <OneKeyNavProvider>
            <GestureSessionProvider>
              <AppContent />
            </GestureSessionProvider>
          </OneKeyNavProvider>
        </CameraProvider>
      </CitizenProvider>
    </NavigationProvider>
  )
}

export default App
