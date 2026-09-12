export const SCRIPT_FONT_MAP = {
  en: "'DM Sans', 'Space Grotesk', system-ui, sans-serif",
  hi: "'Noto Sans Devanagari', 'DM Sans', sans-serif",
  mr: "'Noto Sans Devanagari', 'DM Sans', sans-serif",
  bn: "'Noto Sans Bengali', 'DM Sans', sans-serif",
  te: "'Noto Sans Telugu', 'DM Sans', sans-serif",
  ta: "'Noto Sans Tamil', 'DM Sans', sans-serif",
  gu: "'Noto Sans Gujarati', 'DM Sans', sans-serif",
  kn: "'Noto Sans Kannada', 'DM Sans', sans-serif",
  pa: "'Noto Sans Gurmukhi', 'DM Sans', sans-serif",
}

export function applyLanguageFont(langCode) {
  if (typeof document === 'undefined') return
  const font = SCRIPT_FONT_MAP[langCode] || SCRIPT_FONT_MAP.en
  document.documentElement.style.setProperty('--app-font', font)
  document.documentElement.lang = langCode || 'en'
  // RTL check (future-proofing for languages like Urdu or Sindhi)
  document.documentElement.dir = ['ur', 'sd', 'ks'].includes(langCode) ? 'rtl' : 'ltr'
}
