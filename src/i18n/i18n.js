import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { applyLanguageFont } from './fontMap'

import enCommon from '../locales/en/common.json'
import enGesture from '../locales/en/gesture.json'
import enVoice from '../locales/en/voice.json'
import enScanner from '../locales/en/scanner.json'
import enSchemes from '../locales/en/schemes.json'
import enApplication from '../locales/en/application.json'
import enEmergency from '../locales/en/emergency.json'

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
]

export const NAMESPACES = [
  'common',
  'gesture',
  'voice',
  'scanner',
  'schemes',
  'application',
  'emergency',
]

const EN_RESOURCES = {
  common: enCommon,
  gesture: enGesture,
  voice: enVoice,
  scanner: enScanner,
  schemes: enSchemes,
  application: enApplication,
  emergency: enEmergency,
}

// Dynamically import non-English language bundles on demand
const nonEnLocaleModules = import.meta.glob(['../locales/*/*.json', '!../locales/en/*.json'])

async function loadNamespace(lang, ns) {
  if (lang === 'en') {
    return EN_RESOURCES[ns] || {}
  }

  const path = `../locales/${lang}/${ns}.json`
  if (nonEnLocaleModules[path]) {
    try {
      const mod = await nonEnLocaleModules[path]()
      return mod.default || mod
    } catch {
      // Fall through to fallback
    }
  }

  return EN_RESOURCES[ns] || {}
}

export async function loadLanguageBundle(lang, namespaces = NAMESPACES) {
  if (!lang) return
  await Promise.all(
    namespaces.map(async (ns) => {
      const resources = await loadNamespace(lang, ns)
      if (resources && Object.keys(resources).length > 0) {
        i18n.addResourceBundle(lang, ns, resources, true, true)
      }
    }),
  )
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    ns: NAMESPACES,
    defaultNS: 'common',
    resources: {
      en: EN_RESOURCES,
    },
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'divyangsetu_lang',
    },
    returnEmptyString: false,
  })

const initialLang = i18n.language ? i18n.language.split('-')[0] : 'en'
applyLanguageFont(initialLang)
if (initialLang && initialLang !== 'en') {
  loadLanguageBundle(initialLang).catch(() => {})
}

i18n.on('languageChanged', (lng) => {
  const code = lng ? lng.split('-')[0] : 'en'
  applyLanguageFont(code)
})

export default i18n
