import { createContext, useContext, useState } from 'react'

const NavigationContext = createContext(null)

export function NavigationProvider({ children }) {
  const [currentScreen, setCurrentScreen] = useState('home')
  const [entryMode, setEntryMode] = useState(null)

  const navigateTo = (screen, mode = null) => {
    setCurrentScreen(screen)

    if (mode !== null) {
      setEntryMode(mode)
    }
  }

  const goHome = () => {
    setCurrentScreen('home')
  }

  const value = {
    currentScreen,
    entryMode,
    navigateTo,
    goHome,
  }

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)

  if (!context) {
    throw new Error(
      'useNavigation must be used inside NavigationProvider'
    )
  }

  return context
}