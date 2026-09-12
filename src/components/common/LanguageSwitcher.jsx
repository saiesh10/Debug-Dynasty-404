import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, loadLanguageBundle } from '../../i18n/i18n'
import { applyLanguageFont } from '../../i18n/fontMap'

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation('common')
  const currentLang = i18n.language ? i18n.language.split('-')[0] : 'en'

  async function handleChange(e) {
    const lang = e.target.value
    await loadLanguageBundle(lang)
    await i18n.changeLanguage(lang)
    applyLanguageFont(lang)
  }

  return (
    <div className="lang-switcher-wrapper">
      <span className="lang-icon" aria-hidden="true">🌐</span>
      <select
        id="language-switcher"
        aria-label={t('languageSwitcher.ariaLabel', 'Select display language')}
        value={currentLang}
        onChange={handleChange}
        className="lang-select"
      >
        {SUPPORTED_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.nativeLabel} ({l.label})
          </option>
        ))}
      </select>
    </div>
  )
}
