import { createContext, useContext, useState } from 'react'

const CitizenContext = createContext(null)

export function CitizenProvider({ children }) {
  const [citizenData, setCitizenData] = useState({
    name: '',
    dateOfBirth: '',
    idNumber: '',
    address: '',
  })

  const [matchedSchemes, setMatchedSchemes] = useState([])

  const updateCitizenData = (data) => {
    setCitizenData((previous) => ({
      ...previous,
      ...data,
    }))
  }

  const clearCitizenData = () => {
    setCitizenData({
      name: '',
      dateOfBirth: '',
      idNumber: '',
      address: '',
    })

    setMatchedSchemes([])
  }

  const value = {
    citizenData,
    updateCitizenData,
    matchedSchemes,
    setMatchedSchemes,
    clearCitizenData,
  }

  return (
    <CitizenContext.Provider value={value}>
      {children}
    </CitizenContext.Provider>
  )
}

export function useCitizen() {
  const context = useContext(CitizenContext)

  if (!context) {
    throw new Error(
      'useCitizen must be used inside CitizenProvider'
    )
  }

  return context
}