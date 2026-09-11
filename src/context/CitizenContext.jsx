import { createContext, useContext } from 'react'
import { useLocalCitizenData } from '../hooks/useLocalCitizenData'

const CitizenContext = createContext(null)

export function CitizenProvider({ children }) {
  const value = useLocalCitizenData()

  return (
    <CitizenContext.Provider value={value}>
      {children}
    </CitizenContext.Provider>
  )
}

export function useCitizen() {
  const context = useContext(CitizenContext)

  if (!context) {
    throw new Error('useCitizen must be used inside CitizenProvider')
  }

  return context
}
