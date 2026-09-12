import { createContext, useContext } from 'react'

export const VoiceControlContext = createContext(null)

export function useVoiceControl() {
  const context = useContext(VoiceControlContext)
  if (!context) {
    throw new Error('useVoiceControl must be used inside VoiceSessionProvider')
  }
  return context
}
