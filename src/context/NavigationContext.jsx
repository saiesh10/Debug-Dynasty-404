import { createContext, useContext, useState } from 'react'

const NavigationContext = createContext(null)

export function NavigationProvider({ children }) {
  const [currentScreen, setCurrentScreen] = useState('home')
  const [entryMode, setEntryMode] = useState(null)
  const [announcement, setAnnouncement] = useState('DivyangSetu is ready')

  const navigateTo = (screen, mode = null, message = null) => {
    setCurrentScreen(screen)

    if (mode !== null) {
      setEntryMode(mode)
    }

    setAnnouncement(message || `Now showing ${screen}`)
  }

  const goHome = () => {
    setCurrentScreen('home')
    setAnnouncement('Choose how you would like to use DivyangSetu')
  }

  const value = {
    currentScreen,
    entryMode,
    announcement,
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