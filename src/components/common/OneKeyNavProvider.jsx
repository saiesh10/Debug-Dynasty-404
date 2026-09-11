import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import { useNavigation } from '../../context/NavigationContext'

const OneKeyNavContext = createContext(null)

const TYPING_TARGETS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

function defaultBackForScreen(screen, navigateTo, goHome) {
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
  const primaryActionRef = useRef(null)
  const backActionRef = useRef(null)
  const screenRef = useRef(currentScreen)

  useEffect(() => {
    screenRef.current = currentScreen
  }, [currentScreen])

  const registerPrimaryAction = useCallback((action) => {
    primaryActionRef.current = typeof action === 'function' ? action : null
    return () => {
      primaryActionRef.current = null
    }
  }, [])

  const registerBackAction = useCallback((action) => {
    backActionRef.current = typeof action === 'function' ? action : null
    return () => {
      backActionRef.current = null
    }
  }, [])

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
        if (typeof primaryActionRef.current === 'function') {
          primaryActionRef.current()
        }
        return
      }

      event.preventDefault()
      if (typeof backActionRef.current === 'function') {
        backActionRef.current()
        return
      }
      defaultBackForScreen(screenRef.current, navigateTo, goHome)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigateTo, goHome])

  const value = useMemo(
    () => ({
      currentScreen,
      navigateTo,
      goHome,
      registerPrimaryAction,
      registerBackAction,
    }),
    [currentScreen, navigateTo, goHome, registerPrimaryAction, registerBackAction],
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
