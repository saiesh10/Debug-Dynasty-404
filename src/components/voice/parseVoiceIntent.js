const WORD_TO_NUM = {
  one: 1,
  first: 1,
  '1st': 1,
  '1': 1,
  two: 2,
  second: 2,
  '2nd': 2,
  '2': 2,
  to: 2,
  too: 2,
  three: 3,
  third: 3,
  '3rd': 3,
  '3': 3,
  tree: 3,
  four: 4,
  fourth: 4,
  '4th': 4,
  '4': 4,
  for: 4,
  five: 5,
  fifth: 5,
  '5th': 5,
  '5': 5,
}

export function parseVoiceCommand(transcript) {
  if (!transcript || typeof transcript !== 'string') return null
  const text = transcript.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return null

  // Emergency intents
  if (/\b(emergency|sos|help me|need help|emergency help|help)\b/.test(text)) {
    return { intent: 'emergency', index: null, raw: text }
  }

  // Home navigation
  if (/\b(go home|home|start over|main menu|cancel|exit|back to home|close assistant)\b/.test(text)) {
    return { intent: 'home', index: null, raw: text }
  }

  // Back navigation
  if (/\b(go back|back|previous|return|back to schemes|back to list)\b/.test(text)) {
    return { intent: 'back', index: null, raw: text }
  }

  // PDF Save / Download intents
  if (/\b(save pdf|download pdf|create pdf|create application pdf|generate pdf|make pdf|get pdf|save application|download application|save document|download document|download|save file|save|download now|pdf|export pdf|print pdf)\b/.test(text)) {
    return { intent: 'save_pdf', index: null, raw: text }
  }

  // Choose scheme with index (e.g. "choose scheme 1", "select 2", "scheme 1", "option 2", "first scheme", "apply scheme 1", "open 1")
  const schemeMatch = text.match(/\b(?:choose|select|apply|open|pick|option|scheme|number)?\s*(one|first|1st|1|two|second|2nd|2|to|too|three|third|3rd|3|tree|four|fourth|4th|4|for|five|fifth|5th|5)\b/)
  if (schemeMatch && (
    text.includes('scheme') ||
    text.includes('apply') ||
    text.includes('select') ||
    text.includes('choose') ||
    text.includes('option') ||
    text.includes('first') ||
    text.includes('second') ||
    text.includes('third') ||
    text.includes('number') ||
    text.includes('open')
  )) {
    const num = WORD_TO_NUM[schemeMatch[1]] || 1
    return { intent: 'choose_scheme', index: num, raw: text }
  }

  // General choose / apply without explicit number
  if (/\b(choose scheme|select scheme|apply scheme|apply for this scheme|apply for scheme|apply now|apply|choose this|select this|choose|select)\b/.test(text)) {
    return { intent: 'choose_scheme', index: 1, raw: text }
  }

  // Explore / Scanner entry intents
  if (/\b(explore schemes|explore scheme|explore|open scanner|scan(ner)?|scan document|start scanning|start scan|begin scan|let's go|open scan)\b/.test(text)) {
    return { intent: 'explore', index: null, raw: text }
  }

  // Find schemes / Confirm / Proceed intents
  if (/\b(find schemes|find scheme|find my schemes|find my scheme|fine schemes|fine scheme|search schemes|show schemes|show my schemes|eligible schemes|check schemes|check eligible support|eligible support|check support|confirm details|confirm|proceed|continue|next|okay|ok|done|yes|go ahead|proceed with verified details|schemes|scheme)\b/.test(text)) {
    return { intent: 'find_schemes', index: null, raw: text }
  }

  // Rescan intents
  if (/\b(rescan|rescan document|scan again|retake|re scan|retry|try again)\b/.test(text)) {
    return { intent: 'rescan', index: null, raw: text }
  }

  // Scanner actions
  if (/\b(capture document|capture photo|take photo|capture|snap|take picture|click photo)\b/.test(text)) {
    return { intent: 'capture', index: null, raw: text }
  }
  if (/\b(upload photo|upload document|upload image|upload file|upload)\b/.test(text)) {
    return { intent: 'upload', index: null, raw: text }
  }
  if (/\b(enter manually|manual entry|enter details manually|manual|type manually)\b/.test(text)) {
    return { intent: 'manual', index: null, raw: text }
  }

  return null
}

export function parseVoiceIntent(transcript) {
  const parsed = parseVoiceCommand(transcript)
  if (!parsed) return null
  if (parsed.intent === 'choose_scheme' && parsed.index) {
    return `choose_scheme_${parsed.index}`
  }
  return parsed.intent
}
