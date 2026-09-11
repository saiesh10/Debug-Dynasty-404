import {
  ADDRESS_PATTERNS,
  DOB_PATTERNS,
  ID_PATTERNS,
  INDIAN_STATES,
  NAME_PATTERNS,
} from '../../utils/regexPatterns.js'

function confidenceForMatch(rawText, matchText, words = []) {
  if (!matchText) return 0
  const matchTokens = matchText
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/[^a-z0-9]/g, ''))
    .filter(Boolean)

  const related = (words || []).filter((word) => {
    const token = String(word.text || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
    return token && matchTokens.includes(token)
  })

  if (related.length) {
    const sum = related.reduce((total, word) => total + Number(word.confidence || 0), 0)
    return Math.round(sum / related.length)
  }

  return rawText ? 62 : 0
}

function firstPatternMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1].replace(/\s+/g, ' ').trim()
  }
  return ''
}

function guessName(text) {
  const labeled = firstPatternMatch(text, NAME_PATTERNS)
  if (labeled) return labeled
  const lines = text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const candidate = lines.find((line) => /^[A-Za-z][A-Za-z]+(?:\s+[A-Za-z]+)+$/.test(line) && line.length < 50)
  return candidate || ''
}

function guessAddress(text) {
  const labeled = firstPatternMatch(text, ADDRESS_PATTERNS)
  if (labeled) return labeled
  const stateHit = INDIAN_STATES.find((state) => text.toLowerCase().includes(state.toLowerCase()))
  if (!stateHit) return ''
  const line = text
    .split(/\n/)
    .map((item) => item.trim())
    .find((item) => item.toLowerCase().includes(stateHit.toLowerCase()))
  return line || stateHit
}

export function extractFields(rawText = '', words = []) {
  const text = String(rawText)
  const name = guessName(text)
  const dateOfBirth = firstPatternMatch(text, DOB_PATTERNS)
  const idNumber = firstPatternMatch(text, ID_PATTERNS)
  const address = guessAddress(text)

  return {
    name: { value: name, confidence: confidenceForMatch(text, name, words) },
    dateOfBirth: { value: dateOfBirth, confidence: confidenceForMatch(text, dateOfBirth, words) },
    idNumber: { value: idNumber, confidence: confidenceForMatch(text, idNumber, words) },
    address: { value: address, confidence: confidenceForMatch(text, address, words) },
  }
}
