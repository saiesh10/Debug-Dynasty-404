/**
 * Document Classifier for Indian Identity Documents
 * Accurately detects:
 * - Aadhaar Card
 * - PAN Card
 * - Driving Licence
 * - Election ID (Voter ID / EPIC)
 */

export const DOCUMENT_TYPES = {
  AADHAAR: {
    id: 'aadhaar',
    name: 'Aadhaar Card',
    label: 'Aadhaar Card (UIDAI)',
    idLabel: 'Aadhaar Number',
    idPlaceholder: '12-digit number (e.g. 1234 5678 9012)',
    icon: '🪪',
    hasAddress: true,
  },
  PAN: {
    id: 'pan',
    name: 'PAN Card',
    label: 'Permanent Account Number (PAN Card)',
    idLabel: 'PAN Number',
    idPlaceholder: '10-character alphanumeric (e.g. ABCDE1234F)',
    icon: '💳',
    hasAddress: false,
  },
  DRIVING_LICENCE: {
    id: 'driving_licence',
    name: 'Driving Licence',
    label: 'Driving Licence (Transport Dept)',
    idLabel: 'Licence Number',
    idPlaceholder: 'e.g. MH-14 20180012345',
    icon: '🚗',
    hasAddress: true,
  },
  VOTER_ID: {
    id: 'voter_id',
    name: 'Election ID (Voter ID)',
    label: 'Election Commission Voter ID (EPIC)',
    idLabel: 'EPIC / Voter ID Number',
    idPlaceholder: 'e.g. WBF1234567',
    icon: '🗳️',
    hasAddress: true,
  },
  UNKNOWN: {
    id: 'unknown',
    name: 'Identity Document',
    label: 'Government Identity Document',
    idLabel: 'ID Number',
    idPlaceholder: 'Document ID Number',
    icon: '📄',
    hasAddress: true,
  },
}

const AADHAAR_SIGNATURES = [
  /\b(?:aadhaar|aadhar|uidai)\b/i,
  /मेरा\s*आधार|मेरी\s*पहचान/u,
  /आधार\s*क्रमांक/u,
  /unique\s*identification\s*authority/i,
  /\b\d{4}\s+\d{4}\s+\d{4}\b/,
  /your\s*aadhaar\s*no/i,
]

const PAN_SIGNATURES = [
  /income\s*tax\s*department/i,
  /permanent\s*account\s*number/i,
  /आयकर\s*विभाग/u,
  /\bpan\s*card\b/i,
  /\bpan\s*no\b/i,
  /\b[A-Z]{5}[0-9]{4}[A-Z]\b/,
]

const DL_SIGNATURES = [
  /driving\s*licen[cs]e/i,
  /motor\s*vehicles?\s*dept/i,
  /transport\s*department/i,
  /ड्राइविंग\s*लाइसेंस/u,
  /\bdl\s*no\b/i,
  /\blicen[cs]e\s*no\b/i,
  /\b[A-Z]{2}[-\s]?[0-9]{2}[-\s]?(?:19|20)[0-9]{2}[-\s]?[0-9]{7}\b/i,
]

const VOTER_SIGNATURES = [
  /election\s*commission\s*of\s*india/i,
  /elector\s*photo\s*identity\s*card/i,
  /bharat\s*nirvachan\s*aayog/i,
  /भारत\s*निर्वाचन\s*आयोग/u,
  /मतदाता\s*पहचान\s*पत्र/u,
  /मतदाता\s*फोटो\s*पहचान\s*पत्र/u,
  /\bepic\s*no\b/i,
  /\bvoter\s*id\b/i,
  /\b[A-Z]{3}[0-9]{7}\b/,
]

/**
 * Classifies document text into one of the known document types
 * @param {string} text - Raw OCR text from document
 * @returns {object} Document type details with confidence score
 */
export function classifyDocument(text = '') {
  const normalized = String(text || '').trim()
  if (!normalized) {
    return { ...DOCUMENT_TYPES.UNKNOWN, confidence: 0 }
  }

  let aadhaarScore = 0
  let panScore = 0
  let dlScore = 0
  let voterScore = 0

  // Aadhaar scoring
  for (const pattern of AADHAAR_SIGNATURES) {
    if (pattern.test(normalized)) {
      aadhaarScore += 25
    }
  }
  // Check for 12-digit UID pattern
  if (/\b\d{4}\s+\d{4}\s+\d{4}\b/.test(normalized)) aadhaarScore += 30
  if (/government\s*of\s*india|भारत\s*सरकार/i.test(normalized) && /\b\d{4}\s+\d{4}\s+\d{4}\b/.test(normalized)) {
    aadhaarScore += 25
  }

  // PAN scoring
  for (const pattern of PAN_SIGNATURES) {
    if (pattern.test(normalized)) {
      panScore += 25
    }
  }
  if (/income\s*tax/i.test(normalized)) panScore += 30
  if (/\b[A-Z]{5}[0-9]{4}[A-Z]\b/.test(normalized) && /income|tax|permanent|account/i.test(normalized)) {
    panScore += 35
  }

  // Driving Licence scoring
  for (const pattern of DL_SIGNATURES) {
    if (pattern.test(normalized)) {
      dlScore += 25
    }
  }
  if (/driving\s*licen[cs]e/i.test(normalized)) dlScore += 35
  if (/\b(?:form\s*7|non-transport|transport)\b/i.test(normalized)) dlScore += 15

  // Voter ID scoring
  for (const pattern of VOTER_SIGNATURES) {
    if (pattern.test(normalized)) {
      voterScore += 25
    }
  }
  if (/election\s*commission|nirvachan/i.test(normalized)) voterScore += 35
  if (/elector(?:'s)?\s*name/i.test(normalized)) voterScore += 20

  const scores = [
    { type: DOCUMENT_TYPES.AADHAAR, score: aadhaarScore },
    { type: DOCUMENT_TYPES.PAN, score: panScore },
    { type: DOCUMENT_TYPES.DRIVING_LICENCE, score: dlScore },
    { type: DOCUMENT_TYPES.VOTER_ID, score: voterScore },
  ]

  scores.sort((a, b) => b.score - a.score)
  const top = scores[0]

  if (top.score >= 30) {
    return {
      ...top.type,
      confidence: Math.min(100, Math.round(top.score)),
    }
  }

  return { ...DOCUMENT_TYPES.UNKNOWN, confidence: 0 }
}
export function inferDocTypeFromId(idNumber = '') {
  const clean = String(idNumber || '').replace(/[\s-]+/g, '').toUpperCase()
  if (!clean) return null

  // 12 digits -> Aadhaar
  if (/^\d{12}$/.test(clean)) {
    return { ...DOCUMENT_TYPES.AADHAAR, confidence: 95 }
  }

  // 5 letters + 4 digits + 1 letter -> PAN
  if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(clean)) {
    return { ...DOCUMENT_TYPES.PAN, confidence: 95 }
  }

  // 3 letters + 7 digits -> Voter ID
  if (/^[A-Z]{3}[0-9]{7}$/.test(clean)) {
    return { ...DOCUMENT_TYPES.VOTER_ID, confidence: 95 }
  }

  // State code + RTO + digits -> DL
  if (/^[A-Z]{2}[0-9]{2}[0-9]{11}$/.test(clean) || /^[A-Z]{2}[0-9]{2}(?:19|20)[0-9]{9}$/.test(clean)) {
    return { ...DOCUMENT_TYPES.DRIVING_LICENCE, confidence: 95 }
  }

  return null
}
