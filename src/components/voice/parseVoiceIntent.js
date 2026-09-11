export function parseVoiceIntent(transcript) {
  if (!transcript || typeof transcript !== 'string') return null
  const text = transcript.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return null

  if (/\b(emergency|sos|help me|need help)\b/.test(text)) return 'emergency'
  if (/\b(go home|home|start over|main menu)\b/.test(text)) return 'home'
  if (/\b(explore schemes|explore scheme|find schemes|open scanner|scan(ner)?|scan document)\b/.test(text)) {
    return 'explore'
  }
  return null
}
