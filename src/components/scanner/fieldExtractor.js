import {
  ADDRESS_PATTERNS,
  DL_ID_REGEX,
  DL_VALIDITY_EXCLUSIONS,
  DOB_PATTERNS,
  EPIC_ID_REGEX,
  FIELD_LABEL_PATTERNS,
  INDIAN_PIN_PATTERN,
  INDIAN_STATES,
  NAME_BLOCKLIST,
  NAME_PATTERNS,
  PAN_ID_REGEX,
  RELATIVE_PREFIXES,
  VOTER_AGE_PATTERNS,
} from '../../utils/regexPatterns.js'
import { classifyDocument, DOCUMENT_TYPES } from './documentClassifier.js'

const FIELD_LIMITS = { name: 80, dateOfBirth: 40, idNumber: 30, address: 220 }

const ANY_FIELD_LABEL = new RegExp(
  Object.values(FIELD_LABEL_PATTERNS).map((pattern) => pattern.source).join('|'),
  'iu'
)

const STOP_LABEL_LINE = /^(?:father(?:'s)?|mother(?:'s)?|husband(?:'s)?|wife(?:'s)?|guardian(?:'s)?|s\/d\/w|s\/w\/d|c\/o|s\/o|d\/o|w\/o|mather|moter|fathr|fater|gender|sex|dob|d\.o\.b|008|date\s*of\s*birth|जन्म|पिता|माता|आई|वडिल|पति|पती|पत्नी|लिंग|mobile|phone|uid|aadhaar|pan|epic|dl|voter|signature|हस्ताक्षर|issue|expiry|valid)\b/iu

const COMPREHENSIVE_NAME_LABEL = /^(?:\d+[.)\s]*)?(?:applicant\s*name|applicant'?s?\s*name|full\s*name|name\s*of\s*(?:holder|applicant|cardholder|elector)|elector(?:'s)?\s*name|मतदाता\s*का\s*नाम|मतदार\s*नाव|मतदाराचे\s*नाव|निर्वाचक\s*का\s*नाम|धारक\s*का\s*नाम|धारकाचे\s*नाव|कार्डधारकाचे\s*नाव|आवेदक\s*का\s*नाम|लाभार्थीचे\s*नाव|\bname\b|\bnaam\b|नाम|नांव|नाव|पूरा\s*नाम)(?:\s*[/|\\]\s*[\u0900-\u097F\w\s]+)?\s*[:#=-]?\s*(.*)$/iu

export function cleanValue(value) {
  return String(value || '')
    .replace(/^[:#=-]+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function sanitizeName(name) {
  let cleaned = String(name || '').trim()

  // If bilingual with slash or brackets e.g. "नाव: साईश बाबु उपर्डेकर / Name: Saiesh Babu Upardekar"
  if (/[/|\\]|\(/.test(cleaned)) {
    // If it starts with S/O, D/O, W/O, C/O, don't chop off the prefix to turn it into a false name
    if (/^(?:s\/o|d\/o|w\/o|c\/o|s\/w|s\/d|s\/d\/w|s\/w\/d|so\/|do\/|wo\/|co\/)/i.test(cleaned)) {
      return ''
    }
    const parts = cleaned.split(/[/|\\]|\(|\)/).map((p) => p.trim()).filter(Boolean)
    const latinPart = parts.find((p) => /^[a-zA-Z\s.'-]+$/.test(p) && p.length >= 2)
    if (latinPart) {
      cleaned = latinPart
    } else if (parts.length > 0) {
      cleaned = parts[0]
    }
  }

  // Strip relative prefixes if present
  cleaned = cleaned.replace(/^(?:mother(?:'s)?|father(?:'s)?|husband(?:'s)?|wife(?:'s)?|guardian(?:'s)?|mata|pita|aai|vadil|आई|आईचे\s*नाव|वडिल|वडिलांचे\s*नाव|माता|पिता|पति|पती|पत्नी)[\s:#=-]+/iu, '')

  // Strip common honorifics/titles (do not strip Kumar as it is a common Indian first name)
  cleaned = cleaned.replace(/^(?:shri|smt|mr|mrs|ms|dr|master|miss|श्री|श्रीमती|कु\.)[\s.]+/i, '')

  return cleaned
    .replace(/^[^a-zA-Z\u0900-\u097F]+|[^a-zA-Z\u0900-\u097F.]+$/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function looksLikeFieldLabel(line) {
  const trimmed = String(line || '').trim()
  if (!trimmed) return false
  if (INDIAN_PIN_PATTERN.test(trimmed)) return false
  if (INDIAN_STATES.some((state) => trimmed.toLowerCase().includes(state.toLowerCase()))) return false
  if (ANY_FIELD_LABEL.test(trimmed)) return true
  if (STOP_LABEL_LINE.test(trimmed)) return true
  return /^[\p{L}][\p{L} .]{1,30}\s*[:#=]/u.test(trimmed)
}

export function isRelativeLine(line) {
  if (!line) return false
  const cleaned = cleanValue(line).toLowerCase()
  if (RELATIVE_PREFIXES.test(cleaned)) return true
  return /(?:father(?:'s)?(?:\s*name)?|mother(?:'s)?(?:\s*name)?|husband(?:'s)?(?:\s*name)?|wife(?:'s)?(?:\s*name)?|guardian(?:'s)?(?:\s*name)?|son\s*of|daughter\s*of|wife\s*of|care\s*of|\bs\/o\b|\bd\/o\b|\bw\/o\b|\bc\/o\b|\bs\/d\/w\b|\bs\/w\/d\b|\bso\b\/|\bdo\b\/|\bwo\b\/|\bco\b\/|mather|moter|fathr|fater|gaurdian|\bmata\b|\bpita\b|\bvadil\b|\baai\b|\bpati\b|\bpatni\b|पिता|पिताजी|पित्याचे\s*नाव|पति|पती|पतीचे\s*नाव|पत्नी|पत्नीचे\s*नाव|माता|आई|आईचे\s*नाव|मातेचे\s*नाव|वडिल|वडिलांचे\s*नाव|पालक|पालकाचे\s*नाव|अभिभावक|संबंधी)/iu.test(cleaned)
}

const CRITICAL_BLOCKED_WORDS = new Set([
  'government', 'govt', 'india', 'republic', 'state', 'union', 'national',
  'authority', 'commission', 'department', 'ministry', 'directorate', 'director',
  'uidai', 'aadhaar', 'aadhar', 'pan', 'income', 'tax', 'card', 'certificate',
  'disability', 'election', 'elector', 'voter', 'epic', 'driving', 'licence',
  'license', 'ration', 'male', 'female', 'transgender', 'gender', 'sex',
  'father', 'mother', 'husband', 'wife', 'guardian', 'relative', 'doctor',
  'signature', 'valid', 'validity', 'issue', 'expiry', 'expired', 'date',
  'address', 'resident', 'enrolment', 'helpdesk', 'tollfree', 'www', 'gov',
  'bharat', 'nirvachan', 'aayog', 'transport', 'vehicles', 'permanent', 'account',
  'number', 'holder', 'cardholder', 'applicant', 'motor', 'photo', 'eaadhaar',
  'epan', 'epancard', 'signatory', 'licensing', 'surgeon', 'officer', 'deputy',
  'commissioner', 'medical', 'issued', 'form', 'slip', 'download', 'sign',
  'hastakshar', 'meripehchan', 'identity',
  'भारत', 'सरकार', 'आधार', 'पहचान', 'पत्र', 'निर्वाचन', 'आयकर', 'प्रमाणपत्र',
  'दिव्यांगता', 'राशन', 'लिंग', 'पुरुष', 'महिला', 'पिता', 'पति', 'माता', 'आई', 'वडिल',
  'name', 'of'
])

export function isNameCandidate(value) {
  const sanitized = sanitizeName(value)
  if (!sanitized || sanitized.length < 3 || sanitized.length > FIELD_LIMITS.name) return false

  if (isRelativeLine(sanitized)) return false
  if (/\d|@|\.com|\.in|\.org|www/i.test(sanitized)) return false

  const words = sanitized.split(/\s+/).filter(Boolean)
  if (words.length < 1 || words.length > 5) return false

  // Reject if any word matches blocked words
  for (const w of words) {
    const normWord = w.toLowerCase().replace(/[^a-z\u0900-\u097F]/gu, '')
    if (CRITICAL_BLOCKED_WORDS.has(normWord)) return false
  }

  // Must have at least one substantial word (length >= 3 with vowels)
  const hasSubstantialWord = words.some((w) => {
    const cleanWord = w.replace(/[^a-zA-Z\u0900-\u097F]/gu, '')
    return cleanWord.length >= 3 && /[aeiouy\u0900-\u097F]/i.test(cleanWord)
  })
  if (!hasSubstantialWord) return false

  // Reject single-letter words unless they are capitalized initials (e.g. "J." in multi-word name)
  for (const w of words) {
    const cleanWord = w.replace(/[^a-zA-Z\u0900-\u097F]/gu, '')
    // Standalone single lowercase letter (e.g. "z") is OCR noise
    if (cleanWord.length === 1 && /^[a-z]$/.test(cleanWord)) return false
    // Single letter allowed only if capitalized and part of multi-word name
    if (cleanWord.length === 1 && words.length === 1) return false
    // 2-letter word without vowels (e.g. "JI", "ZX") rejected
    if (cleanWord.length === 2 && /^[a-z]{2}$/i.test(cleanWord) && !/[aeiouy]/i.test(cleanWord)) {
      return false
    }
  }

  const wordPattern = /^[\p{L}.'-]+$/u
  if (!words.every((w) => wordPattern.test(w))) return false

  return true
}

export function scoreNameCandidate(candidate, allLines = []) {
  if (!candidate || !isNameCandidate(candidate)) return -100

  let score = 50
  const words = candidate.split(/\s+/).filter(Boolean)

  // Multi-word name boost (2-3 words is standard)
  if (words.length >= 2 && words.length <= 4) score += 25
  if (words.length === 3) score += 10

  // Latin letters boost (e.g. "Saiesh Babu Upardekar")
  if (/^[A-Za-z\s.'-]+$/.test(candidate)) score += 20

  // Capitalization check: each word capitalized or ALL CAPS
  const isTitleCased = words.every((w) => /^[A-Z][a-z.'-]*$/.test(w))
  const isAllCaps = words.every((w) => /^[A-Z.'-]+$/.test(w))
  if (isTitleCased || isAllCaps) score += 15

  // Word length quality: all words >= 3 chars
  const allSubstantial = words.every((w) => w.replace(/[^a-zA-Z\u0900-\u097F]/gu, '').length >= 3)
  if (allSubstantial) score += 15

  // Multi-occurrence check in document (appears multiple times -> massive confidence boost)
  const normCand = candidate.toLowerCase()
  const occurrences = allLines.filter((l) => cleanValue(l).toLowerCase().includes(normCand)).length
  if (occurrences > 1) {
    score += occurrences * 30
  }

  return score
}

const AADHAAR_NAME_NOISE = new Set([
  'my', 'your', 'aadhar', 'aadhaar', 'number', 'no', 'identity', 'card',
  'enrolment', 'enrollment', 'government', 'india', 'unique', 'identification',
  'authority', 'helpdesk', 'male', 'female', 'dob', 'date', 'birth', 'mera',
  'meri', 'pehchan', 'year', 'yob', 'father', 'mother', 'husband', 'wife',
  'address', 'resident', 's/o', 'd/o', 'w/o', 'c/o',
])

function isAadhaarNameCandidate(value) {
  if (!isNameCandidate(value)) return false
  if (isRelativeLine(value)) return false
  const words = cleanValue(value).toLowerCase().split(/\s+/).filter(Boolean)
  return words.length >= 1 && !words.some((word) => AADHAAR_NAME_NOISE.has(word))
}

export function validDate(value) {
  if (!value) return false
  const trimmed = String(value).trim()

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY with optional spaces around separators
  const dateMatch = trimmed.match(/^(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{2,4})$/)
  if (dateMatch) {
    const [, dayStr, monthStr, yearStr] = dateMatch
    const fullYear = Number(yearStr.length === 2 ? `20${yearStr}` : yearStr)
    const day = Number(dayStr)
    const month = Number(monthStr)
    if (day < 1 || day > 31 || month < 1 || month > 12) return false
    if (fullYear < 1900 || fullYear > 2026) return false
    const date = new Date(fullYear, month - 1, day)
    return (
      date.getFullYear() === fullYear &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    )
  }

  // Compact 8-digit DDMMYYYY (e.g. 10102006)
  const compactMatch = trimmed.match(/^(\d{2})(\d{2})(\d{4})$/)
  if (compactMatch) {
    const [, dayStr, monthStr, yearStr] = compactMatch
    const day = Number(dayStr)
    const month = Number(monthStr)
    const fullYear = Number(yearStr)
    if (day < 1 || day > 31 || month < 1 || month > 12) return false
    if (fullYear < 1900 || fullYear > 2026) return false
    const date = new Date(fullYear, month - 1, day)
    return (
      date.getFullYear() === fullYear &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    )
  }

  // DD Month YYYY (e.g. 2 January 1988 or 10-Oct-2006 or 10 Oct 2006)
  const textMonthMatch = trimmed.match(/^(\d{1,2})[\s-]+([A-Za-z]{3,12})[\s-]+(\d{4})$/i)
  if (textMonthMatch) {
    const [, dayStr, , yearStr] = textMonthMatch
    const day = Number(dayStr)
    const year = Number(yearStr)
    if (day < 1 || day > 31 || year < 1900 || year > 2026) return false
    const parsed = new Date(`${dayStr} ${textMonthMatch[2]} ${yearStr}`)
    return !Number.isNaN(parsed.getTime()) && parsed.getFullYear() === year
  }

  // YYYY (Year of birth only)
  const yearMatch = trimmed.match(/^(?:19|20)\d{2}$/)
  if (yearMatch) {
    const year = Number(yearMatch[0])
    return year >= 1900 && year <= 2026
  }

  return false
}

export function formatStandardDate(value) {
  if (!value) return ''
  const trimmed = String(value).trim()

  // If compact 8-digit DDMMYYYY, format as DD/MM/YYYY
  const compactMatch = trimmed.match(/^(\d{2})(\d{2})(\d{4})$/)
  if (compactMatch) {
    return `${compactMatch[1]}/${compactMatch[2]}/${compactMatch[3]}`
  }

  return trimmed
}

export function normalizeDateCandidate(value) {
  return String(value || '')
    .replace(/[Oo]/g, '0')
    .replace(/[Il|]/g, '1')
    .replace(/B/g, '8')
    .replace(/S/g, '5')
    .replace(/\s+/g, ' ')
    .trim()
}

export function verhoeffIsValid(value) {
  const multiplication = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 4, 3, 2, 1, 0],
    [7, 4, 5, 9, 8, 3, 2, 1, 0, 6],
    [8, 7, 6, 5, 9, 2, 1, 0, 6, 4],
    [9, 8, 7, 6, 5, 1, 0, 4, 3, 2],
  ]
  const permutation = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [0, 5, 7, 6, 2, 8, 3, 9, 1, 4],
    [0, 8, 1, 5, 7, 2, 9, 4, 6, 3],
    [0, 9, 5, 8, 6, 1, 4, 3, 2, 7],
    [0, 4, 8, 6, 5, 7, 2, 3, 1, 9],
    [0, 2, 9, 7, 8, 0, 6, 4, 3, 5],
    [0, 7, 4, 3, 1, 5, 9, 8, 6, 2],
    [0, 1, 3, 2, 4, 8, 6, 9, 7, 5],
  ]
  let checksum = 0
  value.split('').reverse().forEach((digit, index) => {
    checksum = multiplication[checksum][permutation[index % 8][Number(digit)]]
  })
  return checksum === 0
}

/**
 * Extracts a multiline address block starting from an address label,
 * stopping at 6-digit PIN code, blank line, or next section header.
 */
function extractAddressBlock(lines) {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const match = line.match(/(?:residential\s*address|residence\s*address|permanent\s*address|\baddress\b|\baddr\b|पता|निवास)(?:\s*[/|\\]\s*[\u0900-\u097F\w\s]+)?\s*[:#=-]?\s*(.*)/i)
    if (!match) continue

    const addrLines = []
    const inline = cleanValue(match[1])
    if (inline && !looksLikeFieldLabel(inline) && !isRelativeLine(inline)) {
      addrLines.push(inline)
      if (INDIAN_PIN_PATTERN.test(inline)) {
        return inline.slice(0, FIELD_LIMITS.address)
      }
    }

    for (let j = i + 1; j < lines.length; j++) {
      const nextLine = lines[j].trim()
      if (!nextLine) break // blank line terminates block

      // Stop if a completely different section header is found
      if (
        /^(?:valid|issue|expiry|blood\s*group|class|cov|authoris|dl\s*no|epic\s*no|pan|aadhaar|signature|elector|father|mother|husband|sex|gender|dob|date\s*of\s*birth|जन्म|पिता|माता|लिंग|हस्ताक्षर)\b/i.test(
          nextLine
        )
      ) {
        break
      }

      addrLines.push(cleanValue(nextLine))

      // Complete when line reaches Indian PIN code
      if (INDIAN_PIN_PATTERN.test(nextLine)) {
        break
      }

      if (addrLines.join(' ').length >= 180) break
    }

    const fullAddr = addrLines.join(' ').replace(/\s+,/g, ',').replace(/\s+/g, ' ').trim()
    if (fullAddr.length >= 10) {
      return fullAddr.slice(0, FIELD_LIMITS.address)
    }
  }

  return ''
}

// ==========================================
// 1. PAN CARD EXTRACTION PIPELINE
// ==========================================
function extractPanFields(text, lines) {
  let idNumber = ''
  let idReason = ''
  let idScore = 0

  // Check labeled PAN line first
  for (const line of lines) {
    const labeledPan = line.match(/(?:pan\s*no|permanent\s*account\s*number|pan\b)\s*[:\-]?\s*([A-Z0-9\s-]{10,14})/i)
    if (labeledPan?.[1]) {
      const clean = labeledPan[1].replace(/[\s-]+/g, '').toUpperCase()
      if (clean.length === 10) {
        const fixed =
          clean.slice(0, 5).replace(/0/g, 'O').replace(/1/g, 'I') +
          clean.slice(5, 9).replace(/O/g, '0').replace(/I/g, '1').replace(/B/g, '8').replace(/S/g, '5') +
          clean.slice(9, 10).replace(/0/g, 'O').replace(/I/g, '1')
        if (PAN_ID_REGEX.test(fixed)) {
          idNumber = fixed
          idReason = `Matched labeled PAN format: "${fixed}"`
          idScore = 99
          break
        }
      }
    }
  }

  // PAN ID: 5 letters + 4 digits + 1 letter (with OCR repairs and optional spaces/hyphens)
  if (!idNumber) {
    const panMatches = text.match(/\b([A-Z0-9]{5}[\s\-]?[0-9A-Z]{4}[\s\-]?[A-Z0-9])\b/gi) || text.match(/\b([A-Z0-9]{10})\b/gi) || []
    for (const candidate of panMatches) {
      const rawClean = candidate.replace(/[\s-]+/g, '').toUpperCase()
      if (rawClean.length !== 10) continue
      const fixed =
        rawClean.slice(0, 5).replace(/0/g, 'O').replace(/1/g, 'I') +
        rawClean.slice(5, 9).replace(/O/g, '0').replace(/I/g, '1').replace(/B/g, '8').replace(/S/g, '5') +
        rawClean.slice(9, 10).replace(/0/g, 'O').replace(/I/g, '1')

      if (PAN_ID_REGEX.test(fixed)) {
        idNumber = fixed
        idReason = `Matched PAN format (5 letters + 4 digits + 1 letter): "${fixed}"`
        idScore = 98
        break
      }
    }
  }

  // 2. PAN Name:
  // Must strictly exclude Father's Name ("Father's Name: ...")
  let name = ''
  let nameReason = ''
  let nameScore = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (isRelativeLine(line)) continue
    if (i > 0 && isRelativeLine(lines[i - 1])) continue // Never take value directly under Father's Name: label

    const labelMatch = line.match(COMPREHENSIVE_NAME_LABEL)
    if (labelMatch) {
      const inline = cleanValue(labelMatch[1])
      if (inline && isNameCandidate(inline) && !isRelativeLine(inline)) {
        name = sanitizeName(inline).slice(0, FIELD_LIMITS.name)
        nameReason = `Matched explicit "${labelMatch[0]}" label: "${name}"`
        nameScore = 98
        break
      } else if (!inline && i + 1 < lines.length) {
        const nextLine = cleanValue(lines[i + 1])
        if (!looksLikeFieldLabel(nextLine) && isNameCandidate(nextLine) && !isRelativeLine(nextLine)) {
          name = sanitizeName(nextLine).slice(0, FIELD_LIMITS.name)
          nameReason = `Line following "${labelMatch[0]}" label: "${name}"`
          nameScore = 95
          break
        }
      }
    }
  }

  // PAN Name Fallback:
  // First candidate line excluding header blocklist, before Father's Name / DOB
  if (!name) {
    for (let i = 0; i < lines.length; i++) {
      const line = cleanValue(lines[i])
      if (isRelativeLine(line) || looksLikeFieldLabel(line)) continue
      if (i > 0 && isRelativeLine(lines[i - 1])) continue
      if (PAN_ID_REGEX.test(line.replace(/[\s-]+/g, ''))) continue

      if (isNameCandidate(line)) {
        name = sanitizeName(line).slice(0, FIELD_LIMITS.name)
        nameReason = `First candidate line on PAN card: "${name}"`
        nameScore = 80
        break
      }
    }
  }

  // 3. PAN Date of Birth:
  let dateOfBirth = ''
  let dobReason = ''
  let dobScore = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const match = line.match(/(?:date\s*of\s*birth|dob|जन्म\s*तिथि|जन्म\s*तारीख|जन्म\s*की\s*तारीख)(?:\s*[/|\\]\s*[\u0900-\u097F\w\s]+)?\s*[:-]?\s*(.*)/i)
    if (match) {
      let rawVal = cleanValue(match[1])
      if (!rawVal && i + 1 < lines.length && !looksLikeFieldLabel(lines[i + 1])) {
        rawVal = cleanValue(lines[i + 1])
      }
      if (rawVal) {
        const norm = normalizeDateCandidate(rawVal)
        const dateSub = norm.match(/\b(?:\d{1,2}\s*[/.-]\s*\d{1,2}\s*[/.-]\s*\d{2,4}|\d{1,2}\s+[A-Za-z]{3,12}\s+\d{4})\b/)?.[0] || norm
        if (validDate(dateSub)) {
          dateOfBirth = formatStandardDate(dateSub)
          dobReason = `Labeled DOB on PAN card: "${dateOfBirth}"`
          dobScore = 98
          break
        }
      }
    }
  }

  // DOB fallback scan
  if (!dateOfBirth) {
    for (const pattern of DOB_PATTERNS) {
      const match = text.match(pattern)
      if (match?.[1]) {
        const norm = normalizeDateCandidate(match[1])
        if (validDate(norm)) {
          dateOfBirth = formatStandardDate(norm)
          dobReason = `Matched DOB pattern on PAN card: "${dateOfBirth}"`
          dobScore = 85
          break
        }
      }
    }
  }

  // 4. PAN Address:
  // Explicitly NOT present on standard PAN card
  const addressResult = {
    value: '',
    score: 100,
    confidence: 100,
    rule: 'PAN_NO_ADDRESS',
    reason: 'Address is not available on PAN card',
    notApplicable: true,
  }

  return {
    name: { value: name, score: nameScore, rule: 'PAN_NAME', reason: nameReason },
    dateOfBirth: { value: dateOfBirth, score: dobScore, rule: 'PAN_DOB', reason: dobReason },
    idNumber: { value: idNumber, score: idScore, rule: 'PAN_ID', reason: idReason },
    address: addressResult,
  }
}

// ==========================================
// 2. VOTER ID (EPIC) EXTRACTION PIPELINE
// ==========================================
function extractVoterFields(text, lines) {
  let idNumber = ''
  let idReason = ''
  let idScore = 0

  // 1. Voter ID / EPIC:
  // Check labeled lines first (e.g. EPIC No: ABC1234567 or Voter ID: WB12 45678901)
  for (const line of lines) {
    if (/elector\s*photo\s*identity\s*card|election\s*commission/i.test(line)) continue
    const labeledId = line.match(/(?:\bvoter\s*id\b|\bepic\s*no\.?\b|\bepic\s*number\b)\s*[:\-]?\s*([A-Z0-9\s/-]{6,20})/i)
    if (labeledId?.[1]) {
      const raw = cleanValue(labeledId[1])
      const clean = raw.replace(/[\s/]/g, '').toUpperCase()
      if (clean.length === 10) {
        const fixed =
          clean.slice(0, 3).replace(/0/g, 'O').replace(/1/g, 'I') +
          clean.slice(3, 10).replace(/O/g, '0').replace(/I/g, '1').replace(/B/g, '8').replace(/S/g, '5')
        if (EPIC_ID_REGEX.test(fixed)) {
          idNumber = fixed
          idReason = `Matched labeled EPIC format: "${fixed}"`
          idScore = 99
          break
        }
      }
      if (raw.length >= 6) {
        idNumber = raw
        idReason = `Matched labeled Voter ID: "${raw}"`
        idScore = 98
        break
      }
    }
  }

  if (!idNumber) {
    const epicMatch = text.match(/\b([A-Z]{3}[0-9]{7})\b/i) ||
                      text.match(/\b([A-Z0-9]{3}[0-9A-Z]{7})\b/i) ||
                      text.match(/\b([A-Z]{1,3}[0-9]{1,4}\s+[0-9]{6,10})\b/i) ||
                      text.match(/\b([A-Z]{2,3}[\s/]?[0-9]{7,8})\b/i)
    if (epicMatch?.[1]) {
      const raw = epicMatch[1].trim()
      const cleanId = raw.replace(/[\s/]/g, '').toUpperCase()
      if (cleanId.length === 10) {
        const fixed =
          cleanId.slice(0, 3).replace(/0/g, 'O').replace(/1/g, 'I') +
          cleanId.slice(3, 10).replace(/O/g, '0').replace(/I/g, '1').replace(/B/g, '8').replace(/S/g, '5')
        if (EPIC_ID_REGEX.test(fixed)) {
          idNumber = fixed
          idReason = `Matched EPIC format (3 letters + 7 digits): "${fixed}"`
          idScore = 98
        } else {
          idNumber = raw
          idReason = `Matched Voter ID pattern: "${raw}"`
          idScore = 90
        }
      } else {
        idNumber = raw
        idReason = `Matched Voter ID pattern: "${raw}"`
        idScore = 90
      }
    }
  }

  // 2. Voter Name:
  // Prefer Elector's Name or Name, strictly excluding Father's / Husband's Name
  let name = ''
  let nameReason = ''
  let nameScore = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (isRelativeLine(line)) continue
    if (i > 0 && isRelativeLine(lines[i - 1])) continue // Skip lines below Father's / Husband's Name label

    const match = line.match(COMPREHENSIVE_NAME_LABEL)
    if (match) {
      const inline = cleanValue(match[1])
      if (inline && isNameCandidate(inline) && !isRelativeLine(inline)) {
        name = sanitizeName(inline).slice(0, FIELD_LIMITS.name)
        nameReason = `Matched labeled elector name: "${name}"`
        nameScore = 98
        break
      } else if (!inline && i + 1 < lines.length) {
        const nextLine = cleanValue(lines[i + 1])
        if (!looksLikeFieldLabel(nextLine) && isNameCandidate(nextLine) && !isRelativeLine(nextLine)) {
          name = sanitizeName(nextLine).slice(0, FIELD_LIMITS.name)
          nameReason = `Line following elector name label: "${name}"`
          nameScore = 95
          break
        }
      }
    }
  }

  if (!name) {
    for (let i = 0; i < Math.min(8, lines.length); i++) {
      const line = cleanValue(lines[i])
      if (isRelativeLine(line) || looksLikeFieldLabel(line)) continue
      if (i > 0 && isRelativeLine(lines[i - 1])) continue
      if (EPIC_ID_REGEX.test(line.replace(/[\s/]/g, ''))) continue
      if (isNameCandidate(line)) {
        name = sanitizeName(line).slice(0, FIELD_LIMITS.name)
        nameReason = `Positional name candidate on Voter card: "${name}"`
        nameScore = 75
        break
      }
    }
  }

  // 3. Voter DOB / Age:
  let dateOfBirth = ''
  let dobReason = ''
  let dobScore = 0
  let isApproximate = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Ignore qualifying age dates like "Age as on 01.01.2024" or issue/revision dates
    if (/(?:as\s*on|qualifying|issue|revision|revised)/i.test(line)) continue

    const dobMatch = line.match(/(?:date\s*of\s*birth|dob|birth\s*date|year\s*of\s*birth|जन्म\s*तिथि|जन्म\s*वर्ष|जन्म\s*तारीख)(?:\s*[/|\\]\s*[\u0900-\u097F\w\s]+)?\s*[:-]?\s*(.*)/i)
    if (dobMatch) {
      let rawVal = cleanValue(dobMatch[1])
      if (!rawVal && i + 1 < lines.length && !looksLikeFieldLabel(lines[i + 1])) {
        rawVal = cleanValue(lines[i + 1])
      }
      if (rawVal) {
        const norm = normalizeDateCandidate(rawVal)
        const dateSub = norm.match(/\b(?:\d{1,2}\s*[/.-]\s*\d{1,2}\s*[/.-]\s*\d{2,4}|(?:19|20)\d{2})\b/)?.[0] || norm
        if (validDate(dateSub)) {
          dateOfBirth = formatStandardDate(dateSub)
          dobReason = `Labeled DOB on Voter card: "${dateOfBirth}"`
          dobScore = 98
          break
        }
      }
    }
  }

  // Fallback: Older Voter cards only have "Age" not DOB
  if (!dateOfBirth) {
    for (const pattern of VOTER_AGE_PATTERNS) {
      const match = text.match(pattern)
      if (match?.[1]) {
        const age = Number(match[1])
        if (age >= 18 && age <= 120) {
          const currentYear = new Date().getFullYear()
          const approxYear = currentYear - age
          dateOfBirth = `Approx. ${approxYear} (Age: ${age})`
          dobReason = `Extracted Age ${age} from Voter ID, calculated approximate birth year ${approxYear}`
          dobScore = 88
          isApproximate = true
          break
        }
      }
    }
  }

  // Fallback pattern match for Year of Birth or DOB
  if (!dateOfBirth) {
    for (const pattern of DOB_PATTERNS) {
      const match = text.match(pattern)
      if (match?.[1]) {
        const norm = normalizeDateCandidate(match[1])
        if (validDate(norm)) {
          dateOfBirth = formatStandardDate(norm)
          dobReason = `Matched DOB/YOB pattern on Voter card: "${dateOfBirth}"`
          dobScore = 84
          break
        }
      }
    }
  }

  // 4. Voter Address (often on reverse side):
  let address = extractAddressBlock(lines)
  let addressReason = ''
  let addressScore = 0

  if (address) {
    addressReason = `Extracted address block ending in PIN: "${address}"`
    addressScore = 96
  } else {
    const addrMatch = text.match(/(?:address|पता|निवास)\s*[:\-]?\s*([\s\S]{10,180}?\d{6})/i)
    if (addrMatch?.[1]) {
      const cleanedAddr = cleanValue(addrMatch[1].replace(/\r?\n/g, ' '))
      if (cleanedAddr.length >= 10) {
        address = cleanedAddr.slice(0, FIELD_LIMITS.address)
        addressReason = `Extracted address regex match: "${address}"`
        addressScore = 92
      }
    }
  }

  return {
    name: { value: name, score: nameScore, rule: 'VOTER_NAME', reason: nameReason },
    dateOfBirth: { value: dateOfBirth, score: dobScore, rule: 'VOTER_DOB', reason: dobReason, isApproximate },
    idNumber: { value: idNumber, score: idScore, rule: 'VOTER_ID', reason: idReason },
    address: { value: address, score: addressScore, rule: 'VOTER_ADDRESS', reason: addressReason },
  }
}

// ==========================================
// 3. DRIVING LICENCE (DL) EXTRACTION PIPELINE
// ==========================================
function extractDlFields(text, lines) {
  let idNumber = ''
  let idReason = ''
  let idScore = 0

  // 1. DL ID: State code (2 letters) + RTO + digits (normalize spaces/hyphens, length 15-16 chars)
  for (const line of lines) {
    const dlMatch = line.match(/(?:dl\s*no|licen[cs]e\s*no|dl\b|no)\s*[:\-]?\s*([A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9A-Z\s-]{8,15})/i) ||
                    line.match(/\b([A-Z]{2}[-\s]?[0-9]{2}[-\s]?(?:19|20)[0-9]{2}[-\s]?[0-9]{7})\b/i) ||
                    line.match(/\b([A-Z]{2}[0-9]{2}[\s\-]?[0-9]{11})\b/i)

    if (dlMatch?.[1]) {
      const raw = dlMatch[1].trim()
      const normalized = raw.replace(/[\s-]+/g, '').toUpperCase()
      // Valid DL length is typically 15-16 alphanumeric chars starting with 2 letters + 2 digits
      if (/^[A-Z]{2}[0-9]{2}[0-9]{11}$/.test(normalized) || /^[A-Z]{2}[0-9]{2}(?:19|20)[0-9]{9}$/.test(normalized) || /^[A-Z]{2}[0-9]{12,14}$/.test(normalized)) {
        idNumber = raw
        idReason = `Matched DL format with state/RTO code: "${idNumber}"`
        idScore = 98
        break
      }
    }
  }

  if (!idNumber) {
    const generalMatch = text.match(/\b([A-Z]{2}[0-9]{2}\s*[0-9]{11})\b/i) || text.match(/\b([A-Z]{2}[-\s]?[0-9]{2}[-\s]?(?:19|20)[0-9]{2}[-\s]?[0-9]{7})\b/i)
    if (generalMatch?.[1]) {
      idNumber = generalMatch[1].trim()
      idReason = `Found DL number pattern in text: "${idNumber}"`
      idScore = 92
    }
  }

  // 2. DL Name:
  // Must exclude parent's name "S/D/W of" or relative lines
  let name = ''
  let nameReason = ''
  let nameScore = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (isRelativeLine(line)) continue
    if (i > 0 && isRelativeLine(lines[i - 1])) continue

    const nameMatch = line.match(COMPREHENSIVE_NAME_LABEL)
    if (nameMatch) {
      let inline = cleanValue(nameMatch[1])
      const relativeSplit = inline.split(/\b(?:s\/d\/w(?:\s*of)?|s\/w\/d(?:\s*of)?|s\/o|d\/o|w\/o|c\/o|son\s*of|daughter\s*of|wife\s*of|father(?:'s)?|husband(?:'s)?)\b/i)
      inline = cleanValue(relativeSplit[0])

      if (inline && !isRelativeLine(inline) && isNameCandidate(inline)) {
        name = sanitizeName(inline).slice(0, FIELD_LIMITS.name)
        nameReason = `Matched "${nameMatch[0]}" label on DL: "${name}"`
        nameScore = 98
        break
      } else if (!inline && i + 1 < lines.length) {
        const nextLine = cleanValue(lines[i + 1])
        if (!looksLikeFieldLabel(nextLine) && !isRelativeLine(nextLine) && isNameCandidate(nextLine)) {
          name = sanitizeName(nextLine).slice(0, FIELD_LIMITS.name)
          nameReason = `Line following "${nameMatch[0]}" on DL: "${name}"`
          nameScore = 95
          break
        }
      }
    }
  }

  // DL Name Positional Fallback
  if (!name) {
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = cleanValue(lines[i])
      if (isRelativeLine(line) || looksLikeFieldLabel(line)) continue
      if (i > 0 && isRelativeLine(lines[i - 1])) continue
      if (DL_VALIDITY_EXCLUSIONS.test(line)) continue
      if (/^[A-Z]{2}[0-9\s-]{10,20}$/i.test(line)) continue

      if (isNameCandidate(line)) {
        name = sanitizeName(line).slice(0, FIELD_LIMITS.name)
        nameReason = `Positional name candidate on DL: "${name}"`
        nameScore = 80
        break
      }
    }
  }

  // 3. DL Date of Birth:
  // Disambiguate from "Valid From / Till" / "Issue Date" / "Expiry Date"
  let dateOfBirth = ''
  let dobReason = ''
  let dobScore = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Directly capture the date immediately following DOB / Date of birth keyword
    const match = line.match(/(?:d\.?\s*o\.?\s*b\.?|date\s*of\s*birth|birth\s*date|जन्म\s*तिथि|जन्म\s*तारीख)(?:\s*[/|\\]\s*[\u0900-\u097F\w\s]+)?\s*[:-]?\s*([0-9]{1,2}\s*[/.-]\s*[0-9]{1,2}\s*[/.-]\s*[0-9]{2,4}|[0-9]{1,2}\s+[A-Za-z]{3,12}\s+[0-9]{4})/i)
    if (match?.[1]) {
      const dateStr = cleanValue(match[1])
      const norm = normalizeDateCandidate(dateStr)
      if (validDate(norm)) {
        dateOfBirth = formatStandardDate(norm)
        dobReason = `Disambiguated DOB from validity on DL: "${dateOfBirth}"`
        dobScore = 98
        break
      }
    } else {
      // If label on this line without date, check next line
      const labelOnly = line.match(/(?:d\.?\s*o\.?\s*b\.?|date\s*of\s*birth|birth\s*date|जन्म\s*तिथि)\s*[:-]?\s*$/i)
      if (labelOnly && i + 1 < lines.length && !DL_VALIDITY_EXCLUSIONS.test(lines[i + 1])) {
        const nextLineVal = cleanValue(lines[i + 1])
        const norm = normalizeDateCandidate(nextLineVal)
        const dateSub = norm.match(/\b(?:\d{1,2}\s*[/.-]\s*\d{1,2}\s*[/.-]\s*\d{2,4}|\d{1,2}\s+[A-Za-z]{3,12}\s+\d{4})\b/)?.[0]
        if (dateSub && validDate(dateSub)) {
          dateOfBirth = formatStandardDate(dateSub)
          dobReason = `DOB on next line after label on DL: "${dateOfBirth}"`
          dobScore = 95
          break
        }
      }
    }
  }

  // 4. DL Address:
  let address = extractAddressBlock(lines)
  let addressReason = ''
  let addressScore = 0

  if (address) {
    addressReason = `Extracted address block ending in PIN: "${address}"`
    addressScore = 96
  } else {
    const addrMatch = text.match(/(?:address|पता|निवास)\s*[:\-]?\s*([\s\S]{10,180}?\d{6})/i)
    if (addrMatch?.[1]) {
      const cleanedAddr = cleanValue(addrMatch[1].replace(/\r?\n/g, ' '))
      if (cleanedAddr.length >= 10) {
        address = cleanedAddr.slice(0, FIELD_LIMITS.address)
        addressReason = `Extracted address regex match: "${address}"`
        addressScore = 92
      }
    }
  }

  return {
    name: { value: name, score: nameScore, rule: 'DL_NAME', reason: nameReason },
    dateOfBirth: { value: dateOfBirth, score: dobScore, rule: 'DL_DOB', reason: dobReason },
    idNumber: { value: idNumber, score: idScore, rule: 'DL_ID', reason: idReason },
    address: { value: address, score: addressScore, rule: 'DL_ADDRESS', reason: addressReason },
  }
}

// ==========================================
// 4. AADHAAR CARD EXTRACTION PIPELINE
// ==========================================
function extractAadhaarFields(text, lines) {
  let idNumber = ''
  let idReason = ''
  let idScore = 0

  // 12-digit Aadhaar UID with Verhoeff validation and OCR character substitution
  for (const line of lines) {
    if (/helpdesk|tollfree|enrolment|enrollment|phone|mobile|1947/i.test(line)) continue

    const lineMatch = line.match(/\b([0-9OIlBSZ]{4}[ \t\-\.]+[0-9OIlBSZ]{4}[ \t\-\.]+[0-9OIlBSZ]{4})\b/i) || line.match(/\b([0-9]{12})\b/)
    if (lineMatch?.[1]) {
      const rawDigits = lineMatch[1]
        .replace(/[\s\-\.]+/g, '')
        .replace(/[Oo]/g, '0')
        .replace(/[Il|]/g, '1')
        .replace(/B/g, '8')
        .replace(/S/g, '5')
        .replace(/Z/g, '2')

      if (/^\d{12}$/.test(rawDigits)) {
        if (/^(\d)\1{11}$/.test(rawDigits) || rawDigits === '111122223333') continue
        const formatted = `${rawDigits.slice(0, 4)} ${rawDigits.slice(4, 8)} ${rawDigits.slice(8, 12)}`
        if (verhoeffIsValid(rawDigits)) {
          idNumber = formatted
          idReason = `12-digit Aadhaar number passed Verhoeff checksum: "${formatted}"`
          idScore = 99
          break
        } else if (!idNumber) {
          idNumber = formatted
          idReason = `12-digit Aadhaar number matched format: "${formatted}"`
          idScore = 90
        }
      }
    }
  }

  // Aadhaar Name: Collect all candidates from To: block, labeled names, and card cutout sections
  let name = ''
  let nameReason = ''
  let nameScore = 0
  const nameCandidates = []
  const relativeNames = new Set()

  // Pre-collect any explicit relative names to strictly avoid selecting them as cardholder name
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (isRelativeLine(line)) {
      const cleanedRel = cleanValue(
        line.replace(/^(?:.*?(?:mother(?:'s)?(?:\s*name)?|father(?:'s)?(?:\s*name)?|husband(?:'s)?(?:\s*name)?|wife(?:'s)?(?:\s*name)?|guardian(?:'s)?(?:\s*name)?|s\/o|d\/o|w\/o|c\/o|s\/d\/w|s\/w\/d|mata|pita|vadil|aai|pati|patni|माता|आई|आईचे\s*नाव|मातेचे\s*नाव|पिता|पिताजी|पित्याचे\s*नाव|वडिल|वडिलांचे\s*नाव|पती|पतीचे\s*नाव|पत्नी|पत्नीचे\s*नाव|पालक|पालकाचे\s*नाव|अभिभावक)[\s:#=-]*)/iu, '')
      )
      if (cleanedRel) {
        relativeNames.add(cleanedRel.toLowerCase())
        const sanRel = sanitizeName(cleanedRel)
        if (sanRel) relativeNames.add(sanRel.toLowerCase())
      }
      if (i + 1 < lines.length && !looksLikeFieldLabel(lines[i + 1])) {
        const nextRel = cleanValue(lines[i + 1])
        if (nextRel && !looksLikeFieldLabel(nextRel) && !isRelativeLine(nextRel)) {
          relativeNames.add(nextRel.toLowerCase())
          const sanNextRel = sanitizeName(nextRel)
          if (sanNextRel) relativeNames.add(sanNextRel.toLowerCase())
        }
      }
    }
  }

  // 1. Scan To: envelope block
  const toIdx = lines.findIndex((l) => /^to\s*[:#=-]?\s*$/i.test(l) || /^to\b/i.test(l))
  if (toIdx !== -1) {
    for (let i = toIdx + 1; i < Math.min(toIdx + 6, lines.length); i++) {
      const line = cleanValue(lines[i])
      if (isRelativeLine(line) || looksLikeFieldLabel(line) || INDIAN_PIN_PATTERN.test(line)) break
      if (isAadhaarNameCandidate(line)) {
        const san = sanitizeName(line).slice(0, FIELD_LIMITS.name)
        if (san && !relativeNames.has(san.toLowerCase()) && !isRelativeLine(san)) {
          nameCandidates.push({
            value: san,
            source: 'To: envelope block',
            priority: 95,
          })
        }
      }
    }
  }

  // 2. Scan card body / cutout section (between Government of India and relative/DOB/gender lines)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/government\s*of\s*india|भारत\s*सरकार|unique\s*identification/i.test(line)) {
      for (let j = i + 1; j < Math.min(i + 7, lines.length); j++) {
        const next = cleanValue(lines[j])
        // Stop cardholder name scanning immediately at relative line, DOB, Gender, or UID
        if (isRelativeLine(next) || /^(?:gender|sex|dob|birth|जन्म|male|female|पुरुष|महिला|\d{4}\s+\d{4})/i.test(next)) {
          break
        }
        if (isAadhaarNameCandidate(next)) {
          const san = sanitizeName(next).slice(0, FIELD_LIMITS.name)
          if (san && !relativeNames.has(san.toLowerCase()) && !isRelativeLine(san)) {
            nameCandidates.push({
              value: san,
              source: 'Card body below header',
              priority: 95,
            })
          }
        }
      }
    }
  }

  // 3. Scan explicit Name labels
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (isRelativeLine(line)) continue
    if (i > 0 && isRelativeLine(lines[i - 1])) continue

    const nameMatch = line.match(COMPREHENSIVE_NAME_LABEL)
    if (nameMatch) {
      const inline = cleanValue(nameMatch[1])
      if (inline && isAadhaarNameCandidate(inline) && !isRelativeLine(inline)) {
        const san = sanitizeName(inline).slice(0, FIELD_LIMITS.name)
        if (san && !relativeNames.has(san.toLowerCase())) {
          nameCandidates.push({
            value: san,
            source: 'Labeled name',
            priority: 90,
          })
        }
      } else if (!inline && i + 1 < lines.length) {
        const nextLine = cleanValue(lines[i + 1])
        if (!looksLikeFieldLabel(nextLine) && isAadhaarNameCandidate(nextLine) && !isRelativeLine(nextLine)) {
          const san = sanitizeName(nextLine).slice(0, FIELD_LIMITS.name)
          if (san && !relativeNames.has(san.toLowerCase())) {
            nameCandidates.push({
              value: san,
              source: 'Line following name label',
              priority: 85,
            })
          }
        }
      }
    }
  }

  // 4. Positional scan fallback
  if (nameCandidates.length === 0) {
    for (let i = 0; i < Math.min(15, lines.length); i++) {
      const line = cleanValue(lines[i])
      if (isRelativeLine(line) || /^(?:gender|sex|dob|birth|जन्म|male|female|पुरुष|महिला|\d{4}\s+\d{4})/i.test(line)) {
        break
      }
      if (looksLikeFieldLabel(line)) continue
      if (i > 0 && isRelativeLine(lines[i - 1])) continue
      if (/^\d{4}[\s\-\.]+\d{4}[\s\-\.]+\d{4}$/.test(line)) continue

      if (isAadhaarNameCandidate(line)) {
        const san = sanitizeName(line).slice(0, FIELD_LIMITS.name)
        if (san && !relativeNames.has(san.toLowerCase()) && !isRelativeLine(san)) {
          nameCandidates.push({
            value: san,
            source: 'Top candidate line',
            priority: 75,
          })
        }
      }
    }
  }

  // Score all valid name candidates and choose the highest-ranking candidate
  const validCandidates = nameCandidates.filter(
    (cand) => !relativeNames.has(cand.value.toLowerCase()) && !isRelativeLine(cand.value)
  )

  if (validCandidates.length > 0) {
    const scored = validCandidates.map((cand) => {
      let score = scoreNameCandidate(cand.value, lines)
      if (cand.priority) score += cand.priority
      // If candidate is Latin script (e.g. English name), give it extra boost on Aadhaar
      if (/^[A-Za-z\s.'-]+$/.test(cand.value) && cand.value.trim().includes(' ')) {
        score += 25
      }
      return {
        ...cand,
        score,
      }
    })
    scored.sort((a, b) => b.score - a.score)
    const best = scored[0]
    if (best && best.score > 0) {
      name = best.value
      nameReason = `Aadhaar name extracted (${best.source}): "${name}"`
      nameScore = Math.min(99, Math.max(80, best.score))
    }
  }

  // Aadhaar DOB:
  let dateOfBirth = ''
  let dobReason = ''
  let dobScore = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/(?:issue|expiry|valid|निर्गमन|समाप्ति)/i.test(line)) continue

    const match = line.match(FIELD_LABEL_PATTERNS.dateOfBirth)
    if (match) {
      let rawVal = cleanValue(line.slice(match.index + match[0].length))
      if (!rawVal && i + 1 < lines.length && !looksLikeFieldLabel(lines[i + 1])) {
        rawVal = cleanValue(lines[i + 1])
      }
      if (rawVal) {
        const norm = normalizeDateCandidate(rawVal)
        const dateSub = norm.match(/\b(?:\d{1,2}\s*[/.-]\s*\d{1,2}\s*[/.-]\s*\d{2,4}|\d{8}|(?:19|20)\d{2})\b/)?.[0] || norm
        if (validDate(dateSub)) {
          dateOfBirth = formatStandardDate(dateSub)
          dobReason = `Labeled DOB on Aadhaar: "${dateOfBirth}"`
          dobScore = 96
          break
        }
      }
    }
  }

  if (!dateOfBirth) {
    for (const pattern of DOB_PATTERNS) {
      const match = text.match(pattern)
      if (match?.[1]) {
        const norm = normalizeDateCandidate(match[1])
        if (validDate(norm)) {
          dateOfBirth = formatStandardDate(norm)
          dobReason = `Matched DOB pattern on Aadhaar: "${dateOfBirth}"`
          dobScore = 84
          break
        }
      }
    }
  }

  // Aadhaar Address: To: block, or labeled address, or PIN line scan
  let address = extractAddressBlock(lines)
  let addressReason = ''
  let addressScore = 0

  if (address) {
    addressReason = `Extracted address block ending in PIN: "${address}"`
    addressScore = 96
  } else {
    const toIndex = lines.findIndex((l) => /^to\b/i.test(l))
    const pinIndex = lines.findIndex((l) => INDIAN_PIN_PATTERN.test(l))
    if (toIndex !== -1 && pinIndex > toIndex) {
      const addrLines = []
      let startAddr = toIndex + 1
      for (let i = toIndex + 1; i < pinIndex; i++) {
        if (isRelativeLine(lines[i])) {
          startAddr = i + 1
          break
        }
      }
      if (startAddr === toIndex + 1 && toIndex + 2 < pinIndex) {
        startAddr = toIndex + 2
      }

      for (let i = startAddr; i <= pinIndex; i++) {
        const line = cleanValue(lines[i])
        if (!line) continue
        if (/^(?:aadhaar|uidai|pan|election|voter|driving|dob|birth|जन्म|helpdesk|tollfree|\d{4}\s+\d{4})/i.test(line)) break
        addrLines.push(line)
      }
      const fullAddr = addrLines.join(', ')
      if (fullAddr.length >= 10 && INDIAN_PIN_PATTERN.test(fullAddr)) {
        address = fullAddr.slice(0, FIELD_LIMITS.address)
        addressReason = `Extracted Aadhaar address from To: envelope block: "${address}"`
        addressScore = 95
      }
    }
  }

  if (!address) {
    const pinMatch = text.match(INDIAN_PIN_PATTERN)
    if (pinMatch) {
      const targetIdx = lines.findIndex((l) => l.includes(pinMatch[0]))
      if (targetIdx !== -1) {
        const addrLines = []
        for (let prev = Math.max(0, targetIdx - 3); prev < targetIdx; prev++) {
          const l = lines[prev]
          if (!looksLikeFieldLabel(l) && !isRelativeLine(l) && l.length > 4) {
            addrLines.push(l)
          }
        }
        addrLines.push(lines[targetIdx])
        const joined = cleanValue(addrLines.join(' '))
        if (joined.length >= 10) {
          address = joined.slice(0, FIELD_LIMITS.address)
          addressReason = `PIN code contextual line scan on Aadhaar: "${address}"`
          addressScore = 75
        }
      }
    }
  }

  return {
    name: { value: name, score: nameScore, rule: 'AADHAAR_NAME', reason: nameReason },
    dateOfBirth: { value: dateOfBirth, score: dobScore, rule: 'AADHAAR_DOB', reason: dobReason },
    idNumber: { value: idNumber, score: idScore, rule: 'AADHAAR_ID', reason: idReason },
    address: { value: address, score: addressScore, rule: 'AADHAAR_ADDRESS', reason: addressReason },
  }
}

// ==========================================
// 5. GENERIC DOCUMENT FALLBACK PIPELINE
// ==========================================
function extractGenericFields(text, lines) {
  // 1. ID scan
  let idNumber = ''
  let idReason = ''
  let idScore = 0

  // Labeled ID line
  for (const line of lines) {
    if (/certificate\s*\/|identity\s*card/i.test(line)) continue
    const labeledMatch = line.match(/(?:\budid(?:\s*number|\s*no\.?)?\b|\bdisability\s*certificate\s*no\.?\b|\bcertificate\s*no\.?\b|\bid\s*(?:number|no\.?|#)\b)\s*[:#=-]\s*([A-Z0-9\s/-]{6,24})/i)
    if (labeledMatch?.[1]) {
      const val = cleanValue(labeledMatch[1])
      if (val.length >= 6) {
        idNumber = val
        idReason = `Matched labeled ID pattern: "${val}"`
        idScore = 95
        break
      }
    }
  }

  if (!idNumber) {
    for (const pattern of [
      /\b([0-9]{4}[ \t]+[0-9]{4}[ \t]+[0-9]{4})\b/,
      /\b([A-Z]{5}[0-9]{4}[A-Z])\b/i,
      /\b([A-Z]{3}[0-9]{7})\b/i,
      /\b([A-Z]{2}[-\s]?[0-9]{2}[-\s]?(?:19|20)[0-9]{2}[-\s]?[0-9]{7})\b/i,
      /\b([A-Z]{2}[0-9]{2}\s*[0-9]{11})\b/i,
      /\b([A-Z]{2}[0-9]{2,16})\b/i,
      /\b([A-Z]{1,3}[0-9]{6,16})\b/i,
    ]) {
      const match = text.match(pattern)
      if (match?.[1]) {
        const val = cleanValue(match[1])
        if (/^\d{6}$/.test(val) || /^\d{10}$/.test(val)) continue
        idNumber = val
        idReason = `Matched generic ID pattern: "${val}"`
        idScore = 80
        break
      }
    }
  }

  // 2. Name scan
  let name = ''
  let nameReason = ''
  let nameScore = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (isRelativeLine(line)) continue
    if (i > 0 && isRelativeLine(lines[i - 1])) continue

    const match = line.match(COMPREHENSIVE_NAME_LABEL)
    if (match) {
      const inline = cleanValue(match[1])
      if (inline && isNameCandidate(inline)) {
        name = sanitizeName(inline).slice(0, FIELD_LIMITS.name)
        nameReason = `Matched label: "${name}"`
        nameScore = 90
        break
      } else if (!inline && i + 1 < lines.length) {
        const nextLine = cleanValue(lines[i + 1])
        if (!looksLikeFieldLabel(nextLine) && isNameCandidate(nextLine)) {
          name = sanitizeName(nextLine).slice(0, FIELD_LIMITS.name)
          nameReason = `Matched line after label: "${name}"`
          nameScore = 85
          break
        }
      }
    }
  }

  if (!name) {
    for (let i = 0; i < lines.length; i++) {
      const line = cleanValue(lines[i])
      if (isRelativeLine(line) || looksLikeFieldLabel(line)) continue
      if (i > 0 && isRelativeLine(lines[i - 1])) continue
      if (isNameCandidate(line)) {
        name = sanitizeName(line).slice(0, FIELD_LIMITS.name)
        nameReason = `First eligible name candidate line: "${name}"`
        nameScore = 65
        break
      }
    }
  }

  // 3. DOB scan
  let dateOfBirth = ''
  let dobReason = ''
  let dobScore = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/(?:issue|expiry|valid|निर्गमन|समाप्ति)/i.test(line)) continue
    const match = line.match(FIELD_LABEL_PATTERNS.dateOfBirth)
    if (match) {
      let rawVal = cleanValue(line.slice(match.index + match[0].length))
      if (!rawVal && i + 1 < lines.length && !looksLikeFieldLabel(lines[i + 1])) {
        rawVal = cleanValue(lines[i + 1])
      }
      if (rawVal) {
        const norm = normalizeDateCandidate(rawVal)
        const dateSub = norm.match(/\b(?:\d{1,2}\s*[/.-]\s*\d{1,2}\s*[/.-]\s*\d{2,4}|\d{8}|(?:19|20)\d{2})\b/)?.[0] || norm
        if (validDate(dateSub)) {
          dateOfBirth = formatStandardDate(dateSub)
          dobReason = `Labeled DOB: "${dateOfBirth}"`
          dobScore = 90
          break
        }
      }
    }
  }

  if (!dateOfBirth) {
    for (const pattern of DOB_PATTERNS) {
      const match = text.match(pattern)
      if (match?.[1]) {
        const norm = normalizeDateCandidate(match[1])
        if (validDate(norm)) {
          dateOfBirth = formatStandardDate(norm)
          dobReason = `DOB regex match: "${dateOfBirth}"`
          dobScore = 80
          break
        }
      }
    }
  }

  // 4. Address scan
  let address = extractAddressBlock(lines)
  let addressReason = ''
  let addressScore = 0

  if (address) {
    addressReason = `Extracted address block ending in PIN: "${address}"`
    addressScore = 96
  } else {
    const addrMatch = text.match(/(?:address|पता|निवास)\s*[:\-]?\s*([\s\S]{10,180}?\d{6})/i)
    if (addrMatch?.[1]) {
      const cleanedAddr = cleanValue(addrMatch[1].replace(/\r?\n/g, ' '))
      if (cleanedAddr.length >= 10) {
        address = cleanedAddr.slice(0, FIELD_LIMITS.address)
        addressReason = `Extracted address regex match: "${address}"`
        addressScore = 92
      }
    }
  }

  return {
    name: { value: name, score: nameScore, rule: 'GENERIC_NAME', reason: nameReason },
    dateOfBirth: { value: dateOfBirth, score: dobScore, rule: 'GENERIC_DOB', reason: dobReason },
    idNumber: { value: idNumber, score: idScore, rule: 'GENERIC_ID', reason: idReason },
    address: { value: address, score: addressScore, rule: 'GENERIC_ADDRESS', reason: addressReason },
  }
}

function computeConfidence(candidate, words = []) {
  if (!candidate || !candidate.value) return 0
  let conf = candidate.score || 75
  if (words && words.length > 0) {
    const tokens = candidate.value.toLowerCase().split(/\s+/).filter(Boolean)
    const matchedWords = words.filter((w) =>
      tokens.some((t) => (w.text || '').toLowerCase().includes(t))
    )
    if (matchedWords.length > 0) {
      const avgWordConf =
        matchedWords.reduce((sum, w) => sum + Number(w.confidence || 0), 0) /
        matchedWords.length
      conf = Math.round(conf * 0.6 + avgWordConf * 0.4)
    }
  }
  return Math.min(100, Math.max(0, conf))
}

/**
 * Main cross-document field extraction function.
 * 1. Detects document type first using anchor keywords and strong ID patterns.
 * 2. Applies the document-specific specialized rule set.
 * 3. Enforces document-specific field checklists (e.g. PAN has no address).
 * 4. Ensures zero cross-contamination and zero mixing of holder details with relative/validity noise.
 * 5. Produces transparent diagnosis report.
 */
export function extractFields(rawText = '', words = []) {
  const text = String(rawText || '')
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  // Step 1: Detect document type first
  const docType = classifyDocument(text)

  // Step 2: Route to document-specific pipeline
  let extracted
  if (docType.id === DOCUMENT_TYPES.PAN.id) {
    extracted = extractPanFields(text, lines)
  } else if (docType.id === DOCUMENT_TYPES.VOTER_ID.id) {
    extracted = extractVoterFields(text, lines)
  } else if (docType.id === DOCUMENT_TYPES.DRIVING_LICENCE.id) {
    extracted = extractDlFields(text, lines)
  } else if (docType.id === DOCUMENT_TYPES.AADHAAR.id) {
    extracted = extractAadhaarFields(text, lines)
  } else {
    extracted = extractGenericFields(text, lines)
  }

  const nameCandidate = extracted.name
  const dobCandidate = extracted.dateOfBirth
  const idCandidate = extracted.idNumber
  const addressCandidate = extracted.address

  const name = nameCandidate.value || ''
  const dateOfBirth = dobCandidate.value || ''
  const idNumber = idCandidate.value || ''
  const address = addressCandidate.value || ''

  const trace = {
    documentType: docType,
    name: nameCandidate,
    dateOfBirth: dobCandidate,
    idNumber: idCandidate,
    address: addressCandidate,
  }

  const blankFields = Object.entries({ name, dateOfBirth, idNumber, address })
    .filter(([key, val]) => !val && !(key === 'address' && docType.id === 'pan'))
    .map(([key]) => ({ field: key, reason: trace[key]?.reason || 'Not found' }))

  const diagnosis = {
    documentType: docType,
    rawText: text,
    lines,
    rulesMatched: trace,
    blankFields,
  }

  return {
    documentType: docType,
    name: {
      value: name,
      confidence: computeConfidence(nameCandidate, words),
      rule: nameCandidate.rule,
    },
    dateOfBirth: {
      value: dateOfBirth,
      confidence: computeConfidence(dobCandidate, words),
      rule: dobCandidate.rule,
      isApproximate: Boolean(dobCandidate.isApproximate),
    },
    idNumber: {
      value: idNumber,
      confidence: computeConfidence(idCandidate, words),
      rule: idCandidate.rule,
    },
    address: {
      value: address,
      confidence: docType.id === 'pan' ? 100 : computeConfidence(addressCandidate, words),
      rule: addressCandidate.rule,
      notApplicable: Boolean(addressCandidate.notApplicable),
    },
    _diagnosis: diagnosis,
  }
}

/**
 * Merges two extracted field sets (e.g. Front Side + Reverse Side of card).
 * Preserves high confidence fields and merges missing address / fields.
 */
export function mergeExtractedFields(frontFields = {}, backFields = {}) {
  const mergedDocType = frontFields.documentType || backFields.documentType || DOCUMENT_TYPES.UNKNOWN

  const pickBestField = (key) => {
    const frontVal = frontFields[key]
    const backVal = backFields[key]

    if (key === 'address' && mergedDocType.id === 'pan') {
      return {
        value: '',
        confidence: 100,
        notApplicable: true,
      }
    }

    if (!frontVal?.value && backVal?.value) return backVal
    if (frontVal?.value && !backVal?.value) return frontVal
    if (!frontVal?.value && !backVal?.value) return frontVal || backVal

    // If both have values, choose higher confidence
    return (frontVal.confidence || 0) >= (backVal.confidence || 0) ? frontVal : backVal
  }

  return {
    documentType: mergedDocType,
    name: pickBestField('name'),
    dateOfBirth: pickBestField('dateOfBirth'),
    idNumber: pickBestField('idNumber'),
    address: pickBestField('address'),
    _merged: true,
  }
}
