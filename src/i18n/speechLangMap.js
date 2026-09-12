export const SPEECH_LANG_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  pa: 'pa-IN',
}

export function getSpeechLang(langCode) {
  return SPEECH_LANG_MAP[langCode] || 'en-IN'
}
