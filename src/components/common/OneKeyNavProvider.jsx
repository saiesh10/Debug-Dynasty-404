import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import { useNavigation } from '../../context/NavigationContext'

const OneKeyNavContext = createContext(null)

const TYPING_TARGETS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

export function defaultBackForScreen(screen, navigateTo, goHome) {
  if (screen === 'home') return
  if (screen === 'confirm') {
    navigateTo('scanner', null, 'Return to the scanner')
    return
  }
  if (screen === 'schemes') {
    navigateTo('confirm', null, 'Return to confirmation')
    return
  }
  if (screen === 'application') {
    navigateTo('schemes', null, 'Return to matched schemes')
    return
  }
  if (screen === 'submitted') {
    navigateTo('application', null, 'Return to application review')
    return
  }
  goHome()
}

export function OneKeyNavProvider({ children }) {
  const { currentScreen, navigateTo, goHome } = useNavigation()
  const primaryStackRef = useRef([])
  const backStackRef = useRef([])
  const screenRef = useRef(currentScreen)

  useEffect(() => {
    screenRef.current = currentScreen
  }, [currentScreen])

  const registerPrimaryAction = useCallback((action) => {
    if (typeof action !== 'function') return () => {}
    const entry = { action }
    primaryStackRef.current.push(entry)
    return () => {
      primaryStackRef.current = primaryStackRef.current.filter((item) => item !== entry)
    }
  }, [])

  const registerBackAction = useCallback((action) => {
    if (typeof action !== 'function') return () => {}
    const entry = { action }
    backStackRef.current.push(entry)
    return () => {
      backStackRef.current = backStackRef.current.filter((item) => item !== entry)
    }
  }, [])

  const runPrimaryAction = useCallback(() => {
    const entry = primaryStackRef.current.at(-1)
    if (typeof entry?.action === 'function') entry.action()
  }, [])

  const runBackAction = useCallback(() => {
    const entry = backStackRef.current.at(-1)
    if (typeof entry?.action === 'function') {
      entry.action()
      return
    }
    defaultBackForScreen(screenRef.current, navigateTo, goHome)
  }, [goHome, navigateTo])

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target
      if (target?.isContentEditable || TYPING_TARGETS.has(target?.tagName)) {
        return
      }

      if (['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(event.key)) {
        return
      }

      if (event.code === 'Space') {
        event.preventDefault()
        runPrimaryAction()
        return
      }

      event.preventDefault()
      runBackAction()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [runBackAction, runPrimaryAction])

  const value = useMemo(
    () => ({
      currentScreen,
      navigateTo,
      goHome,
      registerPrimaryAction,
      registerBackAction,
      runPrimaryAction,
      runBackAction,
    }),
    [currentScreen, navigateTo, goHome, registerPrimaryAction, registerBackAction, runPrimaryAction, runBackAction],
  )

  return (
    <OneKeyNavContext.Provider value={value}>
      {children}
    </OneKeyNavContext.Provider>
  )
}

export function useOneKeyNav() {
  const context = useContext(OneKeyNavContext)

  if (!context) {
    throw new Error('useOneKeyNav must be used inside OneKeyNavProvider')
  }

  return context
}

export function usePrimaryAction(action) {
  const { registerPrimaryAction } = useOneKeyNav()
  useEffect(() => registerPrimaryAction(action), [action, registerPrimaryAction])
}

export function useBackAction(action) {
  const { registerBackAction } = useOneKeyNav()
  useEffect(() => registerBackAction(action), [action, registerBackAction])
}
