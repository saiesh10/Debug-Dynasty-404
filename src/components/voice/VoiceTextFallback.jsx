import { useTranslation } from 'react-i18next'
import { parseVoiceIntent } from './parseVoiceIntent'

function VoiceTextFallback({ onIntent, message }) {
  const { t } = useTranslation('voice')

  return (
    <label className="voice-fallback">
      {message || t('fallback.general', 'You can also type a command')}
      <input
        placeholder={t('fallback.placeholder', 'Type a command, for example: explore schemes')}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return
          const intent = parseVoiceIntent(event.currentTarget.value)
          onIntent(intent, event.currentTarget.value)
        }}
      />
    </label>
  )
}

export default VoiceTextFallback
