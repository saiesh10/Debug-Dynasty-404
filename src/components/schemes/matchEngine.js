import schemesCatalog from '../../data/schemes.json' with { type: 'json' }
import { INDIAN_STATES } from '../../utils/regexPatterns.js'

export function parseAgeFromDob(dateOfBirth) {
  if (!dateOfBirth || typeof dateOfBirth !== 'string') return null
  const trimmed = dateOfBirth.trim()
  if (!trimmed) return null

  const parsed = Date.parse(trimmed)
  let birth = Number.isNaN(parsed) ? null : new Date(parsed)

  if (!birth) {
    const match = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/)
    if (match) {
      const day = Number(match[1])
      const month = Number(match[2]) - 1
      let year = Number(match[3])
      if (year < 100) year += year > 30 ? 1900 : 2000
      birth = new Date(year, month, day)
    }
  }

  if (!birth || Number.isNaN(birth.getTime())) return null

  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const monthDelta = now.getMonth() - birth.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) {
    age -= 1
  }
  if (age < 0 || age > 120) return null
  return age
}

export function parseStateFromAddress(address) {
  if (!address || typeof address !== 'string') return null
  const lower = address.toLowerCase()
  return INDIAN_STATES.find((state) => lower.includes(state.toLowerCase())) || null
}

function matchesScheme(scheme, citizenData, age, state) {
  if (typeof scheme.minAge === 'number' || typeof scheme.maxAge === 'number') {
    if (age === null) return false
    if (typeof scheme.minAge === 'number' && age < scheme.minAge) return false
    if (typeof scheme.maxAge === 'number' && age > scheme.maxAge) return false
  }

  const allowedStates = scheme.states || ['All']
  const isNational = allowedStates.includes('All')
  if (!isNational) {
    if (!state) return false
    if (!allowedStates.includes(state)) return false
  }

  if (typeof scheme.incomeCeiling === 'number' && citizenData.annualIncome != null && citizenData.annualIncome !== '') {
    const income = Number(citizenData.annualIncome)
    if (!Number.isNaN(income) && income > scheme.incomeCeiling) return false
  }

  const types = scheme.disabilityTypes || ['any']
  if (!types.includes('any') && citizenData.disabilityType) {
    if (!types.map((item) => item.toLowerCase()).includes(String(citizenData.disabilityType).toLowerCase())) {
      return false
    }
  }

  return true
}

export function matchSchemes(citizenData = {}, catalog = schemesCatalog) {
  const age = parseAgeFromDob(citizenData.dateOfBirth)
  const state = parseStateFromAddress(citizenData.address)
  return catalog.filter((scheme) => matchesScheme(scheme, citizenData, age, state))
}
