import { createContext, useContext, useState } from 'react'

const NavigationContext = createContext(null)

export function NavigationProvider({ children }) {
  const [currentScreen, setCurrentScreen] = useState('home')
  const [entryMode, setEntryMode] = useState(null)
  const [announcement, setAnnouncementState] = useState('DivyangSetu is ready')

  const setAnnouncement = (message) => {
    setAnnouncementState(message)
  }

  const navigateTo = (screen, mode = null, message = null) => {
    setCurrentScreen(screen)

    if (mode !== null) {
      setEntryMode(mode)
    }

    setAnnouncementState(message || `Now showing ${screen}`)
  }

  const goHome = () => {
    setCurrentScreen('home')
    setAnnouncementState('Choose how you would like to use DivyangSetu')
  }

  const value = {
    currentScreen,
    entryMode,
    announcement,
    setAnnouncement,
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