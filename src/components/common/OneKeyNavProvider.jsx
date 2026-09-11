import { createContext, useContext, useEffect } from 'react'
import { useNavigation } from '../../context/NavigationContext'

const OneKeyNavContext = createContext(null)

export function OneKeyNavProvider({ children }) {
  const { currentScreen, navigateTo, goHome } = useNavigation()

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        event.preventDefault()

        console.log(
          'One-Key Navigation: next / confirm',
          'Current screen:',
          currentScreen
        )
      } else {
        console.log(
          'One-Key Navigation: back / cancel',
          'Current screen:',
          currentScreen
        )
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentScreen, navigateTo, goHome])

  const value = {
    currentScreen,
    navigateTo,
    goHome,
  }

  return (
    <OneKeyNavContext.Provider value={value}>
      {children}
    </OneKeyNavContext.Provider>
  )
}

export function useOneKeyNav() {
  const context = useContext(OneKeyNavContext)

  if (!context) {
    throw new Error(
      'useOneKeyNav must be used inside OneKeyNavProvider'
    )
  }

  return context
}