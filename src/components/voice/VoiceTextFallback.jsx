import { parseVoiceIntent } from './parseVoiceIntent'

function VoiceTextFallback({ onIntent, message }) {
  return (
    <label className="voice-fallback">
      {message || 'Type a command if the microphone is unavailable'}
      <input
        placeholder="Type a command, for example: explore schemes"
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
