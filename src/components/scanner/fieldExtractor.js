import {
  ADDRESS_PATTERNS,
  DOB_PATTERNS,
  FIELD_LABEL_PATTERNS,
  INDIAN_PIN_PATTERN,
  ID_PATTERNS,
  INDIAN_STATES,
  NAME_PATTERNS,
  NAME_BLOCKLIST,
  RELATIVE_PREFIXES,
} from '../../utils/regexPatterns.js'
import { classifyDocument, DOCUMENT_TYPES } from './documentClassifier.js'

const FIELD_LIMITS = { name: 80, dateOfBirth: 30, idNumber: 30, address: 220 }

const ANY_FIELD_LABEL = new RegExp(
  Object.values(FIELD_LABEL_PATTERNS).map((pattern) => pattern.source).join('|'),
  'iu'
)

const STOP_LABEL_LINE = /^(?:father(?:'s)?|mother(?:'s)?|husband(?:'s)?|guardian|c\/o|s\/o|d\/o|w\/o|s\/w\/d|gender|sex|dob|d\.o\.b|008|date\s*of\s*birth|जन्म|पिता|माता|पति|लिंग|mobile|phone|uid|aadhaar|pan|epic|dl|voter|signature|हस्ताक्षर|issue|expiry)\b/i

function cleanValue(value) {
  return String(value || '')
    .replace(/^\s*[:#=-]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function looksLikeFieldLabel(line) {
  const trimmed = String(line || '').trim()
  return (
    ANY_FIELD_LABEL.test(trimmed) ||
    STOP_LABEL_LINE.test(trimmed) ||
    /^[\p{L}][\p{L} .]{1,30}\s*[:#=-]/u.test(trimmed)
  )
}

function labeledValue(text, labelPattern, multiline = false) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const match = line.match(labelPattern)
    if (!match) continue

    const values = []
    const inlineValue = cleanValue(line.slice(match.index + match[0].length))
    if (inlineValue) values.push(inlineValue)

    for (let nextIndex = index + 1; nextIndex < lines.length && (multiline || values.length === 0); nextIndex += 1) {
      if (looksLikeFieldLabel(lines[nextIndex])) break
      values.push(cleanValue(lines[nextIndex]))
      if (!multiline) break
      if (values.join(' ').length >= 180) break
    }

    if (values.length) return values.join(' ').slice(0, 180).trim()
  }

  return ''
}

function firstPatternMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1].replace(/\s+/g, ' ').trim()
  }
  return ''
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
  'bharat', 'nirvachan', 'aayog',
  'भारत', 'सरकार', 'आधार', 'पहचान', 'पत्र', 'निर्वाचन', 'आयकर', 'प्रमाणपत्र',
  'दिव्यांगता', 'राशन', 'लिंग', 'पुरुष', 'महिला', 'पिता', 'पति', 'माता',
  'name', 'applicant', 'holder', 'of'
])

export function isNameCandidate(value) {
  const cleaned = cleanValue(value)
  if (!cleaned || cleaned.length < 2 || cleaned.length > FIELD_LIMITS.name) return false

  if (RELATIVE_PREFIXES.test(cleaned)) return false
  if (/\d|@|\.com|\.in|\.org|www/i.test(cleaned)) return false

  const words = cleaned.split(/\s+/).filter(Boolean)
  if (words.length < 1 || words.length > 5) return false

  // Reject if any word matches the blocked words
  for (const w of words) {
    const normWord = w.toLowerCase().replace(/[^a-z\u0900-\u097F]/gu, '')
    if (CRITICAL_BLOCKED_WORDS.has(normWord)) return false
  }

  const wordPattern = /^[\p{L}.'-]+$/u
  if (!words.every((w) => wordPattern.test(w))) return false

  return true
}

export function validDate(value) {
  if (!value) return false
  const trimmed = String(value).trim()

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dateMatch = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/)
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

  // DD Month YYYY (e.g. 2 January 1988)
  const textMonthMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3,12})\s+(\d{4})$/i)
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
    .replace(/[Il]/g, '1')
    .replace(/B/g, '8')
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

function extractIdFromSnippet(raw, docType) {
  const text = String(raw || '')
  const variants = [
    text,
    text.replace(/[Oo]/g, '0').replace(/[Il]/g, '1')
  ]

  for (const candidateText of variants) {
    for (const pattern of ID_PATTERNS) {
      const match = candidateText.match(pattern)
      if (!match?.[1]) continue
      const val = cleanValue(match[1]).toUpperCase()
      const normalizedChars = val.replace(/[\s-]+/g, '')

      // Aadhaar check
      if (/^\d{12}$/.test(normalizedChars)) {
        if (/^(\d)\1{11}$/.test(normalizedChars) || normalizedChars === '111122223333') continue
        const formatted = `${normalizedChars.slice(0, 4)} ${normalizedChars.slice(4, 8)} ${normalizedChars.slice(8, 12)}`
        if (verhoeffIsValid(normalizedChars)) {
          return formatted
        }
        // If document is classified as Aadhaar or contains Aadhaar keywords, accept formatted ID
        if (docType?.id === 'aadhaar' || /aadhaar|aadhar|uidai|आधार/i.test(text)) {
          return formatted
        }
        continue
      }

      // PAN check (with OCR normalization for common substitutions)
      if (/^[A-Z0-9]{10}$/i.test(normalizedChars)) {
        const panCandidate =
          normalizedChars.slice(0, 5).replace(/0/g, 'O').replace(/1/g, 'I') +
          normalizedChars.slice(5, 9).replace(/O/g, '0').replace(/I/g, '1').replace(/B/g, '8').replace(/S/g, '5') +
          normalizedChars.slice(9, 10).replace(/0/g, 'O').replace(/1/g, 'I')
        if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panCandidate)) {
          return panCandidate
        }
      }

      // Driving licence check
      if (/^[A-Z]{2}[-\s]?[0-9]{2}[-\s]?(?:19|20)[0-9]{2}[-\s]?[0-9]{7}$/i.test(val)) return val
      if (/^[A-Z]{2}[0-9]{2}\s*[0-9]{11}$/i.test(val)) return val
      if (/^[A-Z]{2}[0-9]{2}\s*[0-9]{4,14}$/i.test(val)) return val

      // Election ID (Voter ID) check (EPIC: 3 letters + 7 digits)
      if (/^[A-Z]{3}[0-9]{7}$/i.test(val)) return val

      // General format
      if (/^[A-Z]{1,3}[0-9]{6,16}$/i.test(val)) {
        if (/^\d{6}$/.test(val) || /^\d{10}$/.test(val)) continue
        return val
      }
    }
  }
  return ''
}

function scoreNameCandidates(text, lines, docType) {
  const candidates = []

  // Layer 1: Strict labeled applicant name or To: addressee
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (RELATIVE_PREFIXES.test(line)) continue

    // Handle To: addressee line (common on Aadhaar)
    const toMatch = line.match(/^to\s*[:#=-]?\s*(.*)$/i)
    if (toMatch) {
      const inlineTo = cleanValue(toMatch[1])
      if (inlineTo && isNameCandidate(inlineTo)) {
        candidates.push({
          value: inlineTo.slice(0, FIELD_LIMITS.name),
          score: 95,
          rule: 'To: addressee line',
          reason: `Found addressee name "${inlineTo}" on To: line`,
        })
      } else if (!inlineTo && i + 1 < lines.length) {
        const nextLine = cleanValue(lines[i + 1])
        if (!looksLikeFieldLabel(nextLine) && isNameCandidate(nextLine)) {
          candidates.push({
            value: nextLine.slice(0, FIELD_LIMITS.name),
            score: 93,
            rule: 'To: next line addressee',
            reason: `Found addressee name "${nextLine}" after To: header`,
          })
        }
      }
    }

    const match = line.match(FIELD_LABEL_PATTERNS.name)
    if (match) {
      const inline = cleanValue(line.slice(match.index + match[0].length))
      if (inline && isNameCandidate(inline)) {
        candidates.push({
          value: inline.slice(0, FIELD_LIMITS.name),
          score: /applicant|elector|holder|धारक|आवेदक|मतदाता/i.test(match[0]) ? 98 : 92,
          rule: `labeledValue (inline: "${match[0]}")`,
          reason: `Strict label match "${match[0]}" with valid name "${inline}"`,
        })
      } else if (!inline && i + 1 < lines.length) {
        const nextLine = cleanValue(lines[i + 1])
        if (!looksLikeFieldLabel(nextLine) && isNameCandidate(nextLine)) {
          candidates.push({
            value: nextLine.slice(0, FIELD_LIMITS.name),
            score: /applicant|elector|holder|धारक|आवेदक|मतदाता/i.test(match[0]) ? 94 : 88,
            rule: `labeledValue (next line after "${match[0]}")`,
            reason: `Strict label on line ${i}, value on line ${i + 1}: "${nextLine}"`,
          })
        }
      }
    }
  }

  // Layer 2: Positional heuristic (top lines of card below headers)
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = cleanValue(lines[i])
    if (RELATIVE_PREFIXES.test(line) || looksLikeFieldLabel(line)) continue
    if (isNameCandidate(line)) {
      let score = 65 - i * 2
      const prevLine = i > 0 ? lines[i - 1].toLowerCase() : ''
      const nextLine = i + 1 < lines.length ? lines[i + 1].toLowerCase() : ''
      if (/government|india|republic|income|tax|भारत|सरकार|permanent\s*account/i.test(prevLine)) score += 20
      if (/dob|birth|year|008|जन्म|female|male|gender|आधार|aadhaar|father|माता|पिता/i.test(nextLine)) score += 15
      candidates.push({
        value: line.slice(0, FIELD_LIMITS.name),
        score,
        rule: `positional heuristic (line ${i + 1})`,
        reason: `Top-of-card line "${line}" in name position`,
      })
    }
  }

  // Layer 3: Regex pattern scan fallback
  for (const pattern of NAME_PATTERNS) {
    const match = text.match(pattern)
    if (match?.[1]) {
      const val = cleanValue(match[1])
      if (!RELATIVE_PREFIXES.test(val) && isNameCandidate(val)) {
        candidates.push({
          value: val.slice(0, FIELD_LIMITS.name),
          score: 60,
          rule: 'NAME_PATTERNS fallback',
          reason: `Matched regex pattern: "${val}"`,
        })
      }
    }
  }

  if (!candidates.length) return null
  candidates.sort((a, b) => b.score - a.score)
  return candidates[0]
}

function scoreDobCandidates(text, lines, docType) {
  const candidates = []

  // Layer 1: Strict labeled DOB
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/(?:issue|expiry|valid\s*(?:from|till|until)|निर्गमन|समाप्ति|जारी)/i.test(line)) continue

    const match = line.match(FIELD_LABEL_PATTERNS.dateOfBirth)
    if (match) {
      let rawVal = cleanValue(line.slice(match.index + match[0].length))
      if (!rawVal && i + 1 < lines.length) {
        const nextLine = cleanValue(lines[i + 1])
        if (!looksLikeFieldLabel(nextLine)) rawVal = nextLine
      }
      if (rawVal) {
        const norm = normalizeDateCandidate(rawVal)
        const dateSub =
          norm.match(/\b(?:\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d{8}|\d{1,2}\s+[A-Za-z]{3,12}\s+\d{4}|(?:19|20)\d{2})\b/)?.[0] ||
          norm
        if (validDate(dateSub)) {
          const formatted = formatStandardDate(dateSub)
          candidates.push({
            value: formatted,
            score: /birth|जन्म/i.test(match[0]) ? 96 : 88,
            rule: `FIELD_LABEL_PATTERNS.dateOfBirth ("${match[0]}")`,
            reason: `Labeled date passed calendar validation: "${formatted}"`,
          })
        }
      }
    }
  }

  // Layer 2: DOB_PATTERNS regex match
  for (const pattern of DOB_PATTERNS) {
    const match = text.match(pattern)
    if (match?.[1]) {
      const norm = normalizeDateCandidate(match[1])
      if (validDate(norm)) {
        const formatted = formatStandardDate(norm)
        candidates.push({
          value: formatted,
          score: 82,
          rule: 'DOB_PATTERNS',
          reason: `Matched DOB_PATTERNS regex: "${formatted}"`,
        })
      }
    }
  }

  // Layer 3: Unlabeled valid calendar date scan
  for (const line of lines) {
    if (/(?:issue|expiry|valid|निर्गमन|समाप्ति|जारी)/i.test(line)) continue
    const normLine = normalizeDateCandidate(line)
    const match = normLine.match(/\b(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})\b/)
    if (match?.[1] && validDate(match[1])) {
      candidates.push({
        value: match[1],
        score: 60,
        rule: 'unlabeled valid calendar date scan',
        reason: `Found unlabelled valid date "${match[1]}" on line "${line}"`,
      })
    }
  }

  if (!candidates.length) return null
  candidates.sort((a, b) => b.score - a.score)
  return candidates[0]
}

function scoreIdCandidates(text, lines, docType) {
  const candidates = []

  // Layer 1: Strict labeled ID
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const match = line.match(FIELD_LABEL_PATTERNS.idNumber)
    if (match) {
      let snippet = cleanValue(line.slice(match.index + match[0].length))
      if (!snippet && i + 1 < lines.length && !looksLikeFieldLabel(lines[i + 1])) {
        snippet = cleanValue(lines[i + 1])
      }
      if (snippet) {
        const idVal = extractIdFromSnippet(snippet, docType)
        if (idVal) {
          candidates.push({
            value: idVal,
            score: 96,
            rule: `FIELD_LABEL_PATTERNS.idNumber ("${match[0]}")`,
            reason: `Extracted valid ID "${idVal}" from labeled snippet "${snippet}"`,
          })
        }
      }
    }
  }

  // Layer 2: Format-validated scan across document
  const idFromDoc = extractIdFromSnippet(text, docType)
  if (idFromDoc) {
    candidates.push({
      value: idFromDoc,
      score: 88,
      rule: 'ID_PATTERNS document scan',
      reason: `Found format-validated ID "${idFromDoc}" in document text`,
    })
  }

  if (!candidates.length) return null
  candidates.sort((a, b) => b.score - a.score)
  return candidates[0]
}

function scoreAddressCandidates(text, lines, docType) {
  // If document is PAN card, address is not present
  if (docType?.id === 'pan') {
    return null
  }

  const candidates = []

  // Layer 1: Strict labeled address block
  const labeled = labeledValue(text, FIELD_LABEL_PATTERNS.address, true)
  if (labeled && labeled.length >= 10) {
    let score = 88
    if (INDIAN_PIN_PATTERN.test(labeled)) score += 10
    if (INDIAN_STATES.some((s) => labeled.toLowerCase().includes(s.toLowerCase()))) score += 5
    candidates.push({
      value: labeled.slice(0, FIELD_LIMITS.address),
      score,
      rule: 'FIELD_LABEL_PATTERNS.address multiline block',
      reason: `Extracted address block from label: "${labeled}"`,
    })
  }

  // Layer 2: Aadhaar 'To:' envelope address block
  const toIndex = lines.findIndex((l) => /^to\b/i.test(l))
  const pinIndex = lines.findIndex((l) => INDIAN_PIN_PATTERN.test(l))
  if (toIndex !== -1 && pinIndex > toIndex) {
    const addrLines = []
    for (let i = toIndex + 1; i <= pinIndex; i++) {
      const line = cleanValue(lines[i])
      if (!line) continue
      // Skip the recipient name if it appears right below To:
      if (i <= toIndex + 2 && isNameCandidate(line)) continue
      // If we encounter a completely different section header (like Aadhaar no or DOB), stop
      if (/^(?:aadhaar|uidai|pan|income|tax|election|voter|driving|dob|birth|जन्म)\b/i.test(line)) break
      addrLines.push(line)
    }
    const fullAddr = cleanValue(addrLines.join(', '))
    if (fullAddr.length >= 10 && INDIAN_PIN_PATTERN.test(fullAddr)) {
      candidates.push({
        value: fullAddr.slice(0, FIELD_LIMITS.address),
        score: 94,
        rule: 'Aadhaar To: block multiline address',
        reason: `Found comprehensive address block under To: header: "${fullAddr}"`,
      })
    }
  }

  // Layer 3: ADDRESS_PATTERNS regex match
  const patternAddr = firstPatternMatch(text, ADDRESS_PATTERNS)
  if (patternAddr && patternAddr.length >= 10) {
    candidates.push({
      value: patternAddr.slice(0, FIELD_LIMITS.address),
      score: 75,
      rule: 'ADDRESS_PATTERNS regex match',
      reason: `Matched ADDRESS_PATTERNS regex: "${patternAddr}"`,
    })
  }

  // Layer 4: Contextual line scan around PIN code or State
  const pinMatch = text.match(INDIAN_PIN_PATTERN)
  const stateHit = INDIAN_STATES.find((state) => text.toLowerCase().includes(state.toLowerCase()))
  if (pinMatch || stateHit) {
    const targetIdx = lines.findIndex(
      (l) =>
        (pinMatch && l.includes(pinMatch[0])) ||
        (stateHit && l.toLowerCase().includes(stateHit.toLowerCase()))
    )
    if (targetIdx !== -1) {
      const addrLines = []
      // Check previous 1-3 lines for address components like H.No, Street, Road, etc.
      for (let prev = Math.max(0, targetIdx - 3); prev < targetIdx; prev++) {
        const l = lines[prev]
        if (!looksLikeFieldLabel(l) && !RELATIVE_PREFIXES.test(l) && l.length > 4) {
          addrLines.push(l)
        }
      }
      addrLines.push(lines[targetIdx])
      const joined = cleanValue(addrLines.join(' '))
      if (joined.length >= 10) {
        candidates.push({
          value: joined.slice(0, FIELD_LIMITS.address),
          score: 72,
          rule: 'PIN / State contextual line scan',
          reason: `Found address lines around PIN/State "${stateHit || pinMatch[0]}": "${joined}"`,
        })
      }
    }
  }

  if (!candidates.length) return null
  candidates.sort((a, b) => b.score - a.score)
  return candidates[0]
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

export function extractFields(rawText = '', words = []) {
  const text = String(rawText || '')
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  // Document classification
  const docType = classifyDocument(text)

  const nameCandidate = scoreNameCandidates(text, lines, docType)
  const dobCandidate = scoreDobCandidates(text, lines, docType)
  const idCandidate = scoreIdCandidates(text, lines, docType)
  const addressCandidate = scoreAddressCandidates(text, lines, docType)

  const name = nameCandidate?.value || ''
  const dateOfBirth = dobCandidate?.value || ''
  const idNumber = idCandidate?.value || ''
  const address = addressCandidate?.value || ''

  const trace = {
    documentType: docType,
    name: nameCandidate || { rule: null, reason: 'No valid name candidate found', value: '' },
    dateOfBirth: dobCandidate || { rule: null, reason: 'No valid calendar DOB found', value: '' },
    idNumber: idCandidate || { rule: null, reason: 'No valid ID number passed checksum/format', value: '' },
    address: addressCandidate || {
      rule: null,
      reason: docType?.id === 'pan' ? 'Address not present on standard PAN card' : 'No address block or PIN/State matched',
      value: ''
    },
  }

  const blankFields = Object.entries({ name, dateOfBirth, idNumber, address })
    .filter(([key, val]) => !val && !(key === 'address' && docType?.id === 'pan'))
    .map(([key]) => ({ field: key, reason: trace[key]?.reason || 'Not found' }))

  const diagnosis = {
    documentType: docType,
    rawText: text,
    lines,
    rulesMatched: trace,
    blankFields,
  }

  console.group?.('[OCR DIAGNOSIS REPORT]') || console.log('=== [OCR DIAGNOSIS REPORT] ===')
  console.log(`(a) DOCUMENT CLASSIFICATION: ${docType.name} (${docType.confidence}% confidence)`)
  console.log('(b) RAW OCR TEXT OUTPUT:\n' + (text || '<EMPTY>'))
  console.log('(c) LINE-BY-LINE ARRAY AFTER PREPROCESSING:\n', lines)
  console.log('(d) WHICH REGEX/RULE MATCHED EACH FIELD AND WHY:\n', trace)
  console.log('(e) FIELDS FALLEN THROUGH TO NULL/BLANK:\n', blankFields)
  console.groupEnd?.()

  return {
    documentType: docType,
    name: { value: name, confidence: computeConfidence(nameCandidate, words) },
    dateOfBirth: { value: dateOfBirth, confidence: computeConfidence(dobCandidate, words) },
    idNumber: { value: idNumber, confidence: computeConfidence(idCandidate, words) },
    address: {
      value: address,
      confidence: addressCandidate
        ? computeConfidence(addressCandidate, words)
        : (docType?.id === 'pan' ? 100 : 0)
    },
    _diagnosis: diagnosis,
  }
}
