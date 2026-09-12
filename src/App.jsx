import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { NavigationProvider, useNavigation } from './context/NavigationContext'
import { CitizenProvider, useCitizen } from './context/CitizenContext'
import { CameraProvider } from './context/CameraContext'
import ScreenReaderAnnouncer from './components/common/ScreenReaderAnnouncer'
import { OneKeyNavProvider } from './components/common/OneKeyNavProvider'
import LanguageSwitcher from './components/common/LanguageSwitcher'
import ModePicker from './components/mode-picker/ModePicker'
import ConfirmDetailsScreen from './components/confirm/ConfirmDetailsScreen'
import SchemesScreen from './components/schemes/SchemesScreen'
import ApplicationReviewScreen from './components/application/ApplicationReviewScreen'
import EmergencyHelpScreen from './components/emergency/EmergencyHelpScreen'
import { GestureSessionProvider, useGestureControl } from './components/gesture/GestureSession'
import { VoiceSessionProvider } from './components/voice/VoiceSession'
import './App.css'

const DocumentScanner = lazy(() => import('./components/scanner/DocumentScanner'))
const VoiceAssistant = lazy(() => import('./components/voice/VoiceAssistant'))
const GestureNavigator = lazy(() => import('./components/gesture/GestureNavigator'))
const SubmittedScreen = lazy(() => import('./components/application/SubmittedScreen'))

function Topbar() {
  const { t } = useTranslation('common')
  const { goHome, navigateTo } = useNavigation()
  const { inGestureMode, setGuideOpen } = useGestureControl()

  return (
    <header className="topbar">
      <button className="brand" type="button" onClick={goHome} aria-label={`${t('appName', 'DivyangSetu')} ${t('nav.home', 'Home')}`}>
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 48 48" role="presentation">
            <path className="brand-mark-arc" d="M8 28c4-10 10-15 16-15s12 5 16 15" />
            <path className="brand-mark-road" d="M8 28h32M13 28v7M35 28v7" />
            <circle cx="8" cy="28" r="2.5" />
            <circle cx="40" cy="28" r="2.5" />
          </svg>
        </span>
        <span>Divyang<span>Setu</span></span>
      </button>
      <div className="topbar-actions">
        <LanguageSwitcher />
        {inGestureMode && (
          <button
            className="emergency-button"
            type="button"
            onClick={() => setGuideOpen(true)}
            aria-label={t('nav.howGesturesWork', 'How gestures work')}
          >
            {t('nav.howGesturesWork', 'How gestures work')}
          </button>
        )}
        <button className="emergency-button" type="button" onClick={() => navigateTo('emergency')}>
          {t('nav.emergencyHelp', 'Emergency help')}
        </button>
      </div>
    </header>
  )
}

function AppContent() {
  const { t } = useTranslation('common')
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
          <span>{t('status.private', 'Private by design · runs on your device')}</span>
          {currentScreen !== 'home' && (
            <button type="button" onClick={goHome}>
              {t('nav.home', 'Home')}
            </button>
          )}
        </div>
        <Suspense fallback={<section className="workspace-panel"><p className="lead">{t('nav.loading', 'Loading…')}</p></section>}>
          {screens[currentScreen] || <ModePicker />}
        </Suspense>
      </main>
      <footer>
        <span>{t('footer.quote', 'Designed for dignity, access, and clarity.')}</span>
        <span className="footer-actions">
          <button type="button" onClick={clearDataAndGoHome}>{t('nav.clearData', 'Clear my data')}</button>
          <button type="button" onClick={() => navigateTo('emergency')}>{t('nav.needHelp', 'Need help?')}</button>
        </span>
      </footer>
      <ScreenReaderAnnouncer message={announcement} />
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<div className="loading-splash">Loading DivyangSetu…</div>}>
      <NavigationProvider>
        <CitizenProvider>
          <CameraProvider>
            <OneKeyNavProvider>
              <GestureSessionProvider>
                <VoiceSessionProvider>
                  <AppContent />
                </VoiceSessionProvider>
              </GestureSessionProvider>
            </OneKeyNavProvider>
          </CameraProvider>
        </CitizenProvider>
      </NavigationProvider>
    </Suspense>
  )
}

export default App
