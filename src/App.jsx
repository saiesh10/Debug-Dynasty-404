import { NavigationProvider } from './context/NavigationContext'
import { CitizenProvider } from './context/CitizenContext'
import ScreenReaderAnnouncer from './components/common/ScreenReaderAnnouncer'
import { OneKeyNavProvider } from './components/common/OneKeyNavProvider'
function App() {
  return (
    <NavigationProvider>
      <CitizenProvider>
        <OneKeyNavProvider>
          <ScreenReaderAnnouncer message="DivyangSetu is ready" />

          <main className="min-h-screen bg-blue-600 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-5xl font-bold text-white">
                DivyangSetu
              </h1>

              <p className="mt-4 text-xl text-white">
                Accessible Welfare Assistant
              </p>
            </div>
          </main>
        </OneKeyNavProvider>
      </CitizenProvider>
    </NavigationProvider>
  
  )
  
}
  export default App