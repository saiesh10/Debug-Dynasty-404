/**
 * Document Classifier for Indian Identity Documents
 * Accurately detects:
 * - Aadhaar Card
 * - PAN Card (Permanent Account Number)
 * - Election ID (Voter ID / EPIC)
 * - Driving Licence (DL)
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
    expectedFields: ['name', 'idNumber', 'dateOfBirth', 'address'],
  },
  PAN: {
    id: 'pan',
    name: 'PAN Card',
    label: 'Permanent Account Number (PAN Card)',
    idLabel: 'PAN Number',
    idPlaceholder: '10-character alphanumeric (e.g. ABCDE1234F)',
    icon: '💳',
    hasAddress: false,
    expectedFields: ['name', 'idNumber', 'dateOfBirth'],
  },
  VOTER_ID: {
    id: 'voter_id',
    name: 'Election ID (Voter ID)',
    label: 'Election Commission Voter ID (EPIC)',
    idLabel: 'EPIC / Voter ID Number',
    idPlaceholder: 'e.g. ABC1234567',
    icon: '🗳️',
    hasAddress: true,
    expectedFields: ['name', 'idNumber', 'dateOfBirth', 'address'],
  },
  DRIVING_LICENCE: {
    id: 'driving_licence',
    name: 'Driving Licence',
    label: 'Driving Licence (Transport Dept)',
    idLabel: 'Licence Number',
    idPlaceholder: 'e.g. MH04 20230012345',
    icon: '🚗',
    hasAddress: true,
    expectedFields: ['name', 'idNumber', 'dateOfBirth', 'address'],
  },
  UNKNOWN: {
    id: 'unknown',
    name: 'Identity Document',
    label: 'Government Identity Document',
    idLabel: 'ID Number',
    idPlaceholder: 'Document ID Number',
    icon: '📄',
    hasAddress: true,
    expectedFields: ['name', 'idNumber', 'dateOfBirth', 'address'],
  },
}

// Strong anchor keywords that definitively identify the issuing authority / document type
const ANCHORS = {
  PAN: [
    /income\s*tax\s*department/i,
    /permanent\s*account\s*number/i,
    /आयकर\s*विभाग/u,
    /स्थायी\s*लेखा\s*संख्या/u,
    /\bpan\s*card\b/i,
  ],
  VOTER_ID: [
    /election\s*commission\s*of\s*india/i,
    /elector\s*photo\s*identity\s*card/i,
    /bharat\s*nirvachan\s*aayog/i,
    /भारत\s*निर्वाचन\s*आयोग/u,
    /भारत\s*निवडणूक\s*आयोग/u,
    /निवडणूक\s*आयोग/u,
    /मतदाता\s*पहचान\s*पत्र/u,
    /मतदाता\s*फोटो\s*पहचान\s*पत्र/u,
    /मतदार\s*फोटो\s*ओळख\s*पत्र/u,
    /identity\s*card[\s\S]{0,40}election\s*commission/i,
    /elector'?s?\s*name/i,
    /\bepic\s*no\b/i,
    /\bvoter\s*id\b/i,
  ],
  DRIVING_LICENCE: [
    /driving\s*licen[cs]e/i,
    /motor\s*driving\s*licen[cs]e/i,
    /motor\s*vehicles?\s*(?:dept|department)/i,
    /transport\s*department/i,
    /ड्राइविंग\s*लाइसेंस/u,
    /form\s*7\b/i,
    /\bdl\s*no\b/i,
  ],
  AADHAAR: [
    /unique\s*identification\s*authority/i,
    /\b(?:aadhaar|aadhar|uidai)\b/i,
    /मेरा\s*आधार|मेरी\s*पहचान/u,
    /आधार\s*क्रमांक/u,
    /आपका\s*आधार\s*क्रमांक/u,
    /your\s*aadhaar\s*no/i,
  ],
}

// Signature regex patterns for supplementary scoring
const SIGNATURES = {
  PAN: [
    /\b[A-Z]{5}[0-9]{4}[A-Z]\b/,
    /\bpan\s*no\b/i,
  ],
  VOTER_ID: [
    /\b[A-Z]{3}[0-9]{7}\b/,
    /\bvoter\s*id\b/i,
  ],
  DRIVING_LICENCE: [
    /\blicen[cs]e\s*no\b/i,
    /\b[A-Z]{2}[-\s]?[0-9]{2}[-\s]?(?:19|20)[0-9]{2}[-\s]?[0-9]{7}\b/i,
    /\b[A-Z]{2}[0-9]{2}[\s\-]?[0-9]{11}\b/i,
  ],
  AADHAAR: [
    /\b\d{4}\s+\d{4}\s+\d{4}\b/,
    /government\s*of\s*india|भारत\s*सरकार/i,
  ],
}

/**
 * Classifies document text into one of the known document types.
 * Strategy:
 * 1. Scan for strong anchor keywords first.
 * 2. If anchor keywords match with high certainty, pick that document type.
 * 3. Use document-specific ID format validation as a secondary decisive signal.
 * 4. Fall back to weighted scoring if multiple features are present.
 *
 * @param {string} text - Raw OCR text from document
 * @returns {object} Document type details with confidence score
 */
export function classifyDocument(text = '') {
  const normalized = String(text || '').trim()
  if (!normalized) {
    return { ...DOCUMENT_TYPES.UNKNOWN, confidence: 0 }
  }

  // 1. Primary Anchor Keyword Detection
  const anchorHits = {
    [DOCUMENT_TYPES.PAN.id]: ANCHORS.PAN.filter((pattern) => pattern.test(normalized)).length,
    [DOCUMENT_TYPES.VOTER_ID.id]: ANCHORS.VOTER_ID.filter((pattern) => pattern.test(normalized)).length,
    [DOCUMENT_TYPES.DRIVING_LICENCE.id]: ANCHORS.DRIVING_LICENCE.filter((pattern) => pattern.test(normalized)).length,
    [DOCUMENT_TYPES.AADHAAR.id]: ANCHORS.AADHAAR.filter((pattern) => pattern.test(normalized)).length,
  }

  // Strong anchor match check
  if (anchorHits[DOCUMENT_TYPES.PAN.id] >= 1 && /income\s*tax|permanent\s*account|pan\s*card/i.test(normalized)) {
    return { ...DOCUMENT_TYPES.PAN, confidence: 98 }
  }
  if (anchorHits[DOCUMENT_TYPES.VOTER_ID.id] >= 1 && /election|elector|nirvachan|epic|voter/i.test(normalized)) {
    return { ...DOCUMENT_TYPES.VOTER_ID, confidence: 98 }
  }
  if (anchorHits[DOCUMENT_TYPES.DRIVING_LICENCE.id] >= 1 && /driving\s*licen[cs]e|transport|motor\s*vehicle/i.test(normalized)) {
    return { ...DOCUMENT_TYPES.DRIVING_LICENCE, confidence: 98 }
  }
  if (anchorHits[DOCUMENT_TYPES.AADHAAR.id] >= 1 && /aadhaar|aadhar|uidai|मेरा\s*आधार|मेरी\s*पहचान/i.test(normalized)) {
    return { ...DOCUMENT_TYPES.AADHAAR, confidence: 98 }
  }

  // 2. Strong ID Pattern Signal Detection
  // PAN ID: 5 letters + 4 digits + 1 letter
  if (/\b[A-Z]{5}[0-9]{4}[A-Z]\b/.test(normalized) && (anchorHits[DOCUMENT_TYPES.PAN.id] > 0 || /income|tax|permanent/i.test(normalized))) {
    return { ...DOCUMENT_TYPES.PAN, confidence: 95 }
  }

  // Voter ID: 3 letters + 7 digits
  if (/\b[A-Z]{3}[0-9]{7}\b/.test(normalized) && (anchorHits[DOCUMENT_TYPES.VOTER_ID.id] > 0 || /election|elector|epic/i.test(normalized))) {
    return { ...DOCUMENT_TYPES.VOTER_ID, confidence: 95 }
  }

  // Driving Licence: DL number pattern
  if (/\b[A-Z]{2}[-\s]?[0-9]{2}[-\s]?(?:19|20)[0-9]{2}[-\s]?[0-9]{7}\b/i.test(normalized) ||
      (/\b[A-Z]{2}[0-9]{2}[\s\-]?[0-9]{11}\b/i.test(normalized) && /licen[cs]e|dl\b|transport|motor/i.test(normalized))) {
    return { ...DOCUMENT_TYPES.DRIVING_LICENCE, confidence: 95 }
  }

  // Aadhaar: 12-digit spaced number with Indian government header
  if (/\b\d{4}\s+\d{4}\s+\d{4}\b/.test(normalized) && (anchorHits[DOCUMENT_TYPES.AADHAAR.id] > 0 || /government\s*of\s*india|भारत\s*सरकार/i.test(normalized))) {
    return { ...DOCUMENT_TYPES.AADHAAR, confidence: 95 }
  }

  // 3. Weighted Scoring Fallback
  let aadhaarScore = anchorHits[DOCUMENT_TYPES.AADHAAR.id] * 35
  let panScore = anchorHits[DOCUMENT_TYPES.PAN.id] * 35
  let dlScore = anchorHits[DOCUMENT_TYPES.DRIVING_LICENCE.id] * 35
  let voterScore = anchorHits[DOCUMENT_TYPES.VOTER_ID.id] * 35

  for (const pattern of SIGNATURES.AADHAAR) {
    if (pattern.test(normalized)) aadhaarScore += 25
  }
  for (const pattern of SIGNATURES.PAN) {
    if (pattern.test(normalized)) panScore += 25
  }
  for (const pattern of SIGNATURES.DRIVING_LICENCE) {
    if (pattern.test(normalized)) dlScore += 25
  }
  for (const pattern of SIGNATURES.VOTER_ID) {
    if (pattern.test(normalized)) voterScore += 25
  }

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

/**
 * Infers document type directly from an entered or extracted ID number.
 * @param {string} idNumber
 * @returns {object|null}
 */
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

  // 3 letters + 7 digits -> Voter ID (EPIC)
  if (/^[A-Z]{3}[0-9]{7}$/.test(clean)) {
    return { ...DOCUMENT_TYPES.VOTER_ID, confidence: 95 }
  }

  // State code + RTO + digits -> DL (15 to 16 alphanumeric characters)
  if (/^[A-Z]{2}[0-9]{2}[0-9]{11}$/.test(clean) || /^[A-Z]{2}[0-9]{2}(?:19|20)[0-9]{9}$/.test(clean)) {
    return { ...DOCUMENT_TYPES.DRIVING_LICENCE, confidence: 95 }
  }

  return null
}
