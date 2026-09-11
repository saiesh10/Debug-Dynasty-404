import { useEffect, useState } from 'react'
import { CITIZEN_STORAGE_KEY } from '../constants'

const EMPTY_CITIZEN = {
  name: '',
  dateOfBirth: '',
  idNumber: '',
  address: '',
}

function readStoredState() {
  if (typeof window === 'undefined') {
    return { citizenData: { ...EMPTY_CITIZEN }, matchedSchemes: [], selectedScheme: null }
  }

  try {
    const raw = window.localStorage.getItem(CITIZEN_STORAGE_KEY)
    if (!raw) return { citizenData: { ...EMPTY_CITIZEN }, matchedSchemes: [], selectedScheme: null }
    const parsed = JSON.parse(raw)
    return {
      citizenData: { ...EMPTY_CITIZEN, ...(parsed.citizenData || {}) },
      matchedSchemes: Array.isArray(parsed.matchedSchemes) ? parsed.matchedSchemes : [],
      selectedScheme: parsed.selectedScheme || null,
    }
  } catch {
    return { citizenData: { ...EMPTY_CITIZEN }, matchedSchemes: [], selectedScheme: null }
  }
}

export function clearCitizenSnapshot() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(CITIZEN_STORAGE_KEY)
}

export function useLocalCitizenData() {
  const [citizenData, setCitizenData] = useState(() => readStoredState().citizenData)
  const [matchedSchemes, setMatchedSchemes] = useState(() => readStoredState().matchedSchemes)
  const [selectedScheme, setSelectedScheme] = useState(() => readStoredState().selectedScheme)

  const [cleared, setCleared] = useState(false)

  useEffect(() => {
    if (cleared) return
    window.localStorage.setItem(
      CITIZEN_STORAGE_KEY,
      JSON.stringify({ citizenData, matchedSchemes, selectedScheme }),
    )
  }, [citizenData, matchedSchemes, selectedScheme, cleared])

  const updateCitizenData = (data) => {
    setCleared(false)
    setCitizenData((previous) => ({
      ...previous,
      ...data,
    }))
  }

  const clearCitizenData = () => {
    setCitizenData({ ...EMPTY_CITIZEN })
    setMatchedSchemes([])
    setSelectedScheme(null)
    setCleared(true)
    clearCitizenSnapshot()
  }

  return {
    citizenData,
    updateCitizenData,
    matchedSchemes,
    setMatchedSchemes,
    selectedScheme,
    setSelectedScheme,
    clearCitizenData,
  }
}

export { EMPTY_CITIZEN }
